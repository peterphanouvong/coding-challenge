/**
 * Rule Coverage Analyzer
 * Analyzes rule set to identify gaps, conflicts, and coverage statistics
 */

import { Rule, ExtractedInfo, RequestType, Location } from "../types";
import { RuleEngine } from "./ruleEngine";
import { REQUEST_TYPES, LOCATIONS } from "../constants/legal.constants";

export interface CoverageGap {
  requestType: RequestType;
  location: Location;
  reason: string;
}

export interface CoverageConflict {
  combination: { requestType: RequestType; location: Location };
  rules: Array<{ id: string; name: string; priority: number }>;
  reason: string;
}

export interface CoverageWarning {
  type: "gap" | "conflict" | "orphan" | "redundant";
  severity: "high" | "medium" | "low";
  message: string;
  affectedRules?: string[];
}

export interface CoverageMatrix {
  [requestType: string]: {
    [location: string]: {
      covered: boolean;
      rules: Array<{ id: string; name: string; priority: number }>;
    };
  };
}

export interface CoverageReport {
  score: number; // Percentage of covered combinations (0-100)
  totalCombinations: number;
  coveredCombinations: number;
  gaps: CoverageGap[];
  conflicts: CoverageConflict[];
  warnings: CoverageWarning[];
  matrix: CoverageMatrix;
  summary: {
    byRequestType: {
      [key: string]: { covered: number; total: number; percentage: number };
    };
    byLocation: {
      [key: string]: { covered: number; total: number; percentage: number };
    };
  };
}

export class RuleCoverageAnalyzer {
  private ruleEngine: RuleEngine;

  constructor(ruleEngine: RuleEngine) {
    this.ruleEngine = ruleEngine;
  }

  /**
   * Generate comprehensive coverage report
   */
  analyzeCoverage(rules: Rule[]): CoverageReport {
    const enabledRules = rules.filter((r) => r.enabled);

    // Build coverage matrix
    const matrix = this.buildCoverageMatrix(enabledRules);

    // Find gaps and conflicts
    const gaps = this.findGaps(matrix);
    const conflicts = this.findConflicts(matrix);

    // Calculate coverage score
    const { score, totalCombinations, coveredCombinations } =
      this.calculateCoverageScore(matrix);

    // Generate warnings
    const warnings = this.generateWarnings(
      gaps,
      conflicts,
      enabledRules,
      matrix
    );

    // Generate summary statistics
    const summary = this.generateSummary(matrix);

    return {
      score,
      totalCombinations,
      coveredCombinations,
      gaps,
      conflicts,
      warnings,
      matrix,
      summary,
    };
  }

  /**
   * Build a matrix of all requestType × location combinations
   */
  private buildCoverageMatrix(rules: Rule[]): CoverageMatrix {
    const matrix: CoverageMatrix = {};

    // Initialize matrix with all combinations
    for (const requestType of REQUEST_TYPES) {
      matrix[requestType] = {};
      for (const location of LOCATIONS) {
        matrix[requestType][location] = {
          covered: false,
          rules: [],
        };
      }
    }

    // Test each combination against all rules
    for (const requestType of REQUEST_TYPES) {
      for (const location of LOCATIONS) {
        const testInfo: ExtractedInfo = {
          requestType: requestType as RequestType,
          location: location as Location,
          rawText: "test",
        };

        // Find all matching rules
        // A rule matches if its requestType and location conditions are met
        // We include rules with additional conditions (value, department, urgency)
        // to show potential overlaps
        const matchingRules = rules
          .filter((rule) => {
            const conditions = rule.conditions;

            // Check if requestType and location match (if these conditions exist)
            let requestTypeMatches = true;
            let locationMatches = true;

            for (const condition of conditions) {
              if (condition.field === "requestType") {
                requestTypeMatches = (
                  String(testInfo.requestType).toLowerCase() ===
                  String(condition.value).toLowerCase()
                );
              }
              if (condition.field === "location") {
                locationMatches = (
                  String(testInfo.location).toLowerCase() ===
                  String(condition.value).toLowerCase()
                );
              }
            }

            // A rule is considered to "cover" this combination if:
            // 1. It has a requestType condition that matches OR no requestType condition
            // 2. It has a location condition that matches OR no location condition
            const hasRequestTypeCondition = conditions.some(c => c.field === "requestType");
            const hasLocationCondition = conditions.some(c => c.field === "location");

            return (
              (!hasRequestTypeCondition || requestTypeMatches) &&
              (!hasLocationCondition || locationMatches)
            );
          })
          .map((rule) => ({
            id: rule.id,
            name: rule.name,
            priority: rule.priority,
            action: { assignTo: rule.action.assignTo },
          }))
          .sort((a, b) => b.priority - a.priority);

        if (matchingRules.length > 0) {
          matrix[requestType][location].covered = true;
          matrix[requestType][location].rules = matchingRules;
        }
      }
    }

    return matrix;
  }

  /**
   * Find combinations that have no matching rules
   */
  private findGaps(matrix: CoverageMatrix): CoverageGap[] {
    const gaps: CoverageGap[] = [];

    for (const [requestType, locations] of Object.entries(matrix)) {
      for (const [location, coverage] of Object.entries(locations)) {
        if (!coverage.covered) {
          gaps.push({
            requestType: requestType as RequestType,
            location: location as Location,
            reason: `No rule covers ${requestType} requests from ${location}`,
          });
        }
      }
    }

    return gaps;
  }

  /**
   * Find combinations that have multiple rules with the same priority
   */
  private findConflicts(matrix: CoverageMatrix): CoverageConflict[] {
    const conflicts: CoverageConflict[] = [];

    for (const [requestType, locations] of Object.entries(matrix)) {
      for (const [location, coverage] of Object.entries(locations)) {
        if (coverage.rules.length > 1) {
          // Check for same-priority conflicts
          const priorityGroups = coverage.rules.reduce(
            (acc, rule) => {
              if (!acc[rule.priority]) {
                acc[rule.priority] = [];
              }
              acc[rule.priority].push(rule);
              return acc;
            },
            {} as { [priority: number]: typeof coverage.rules }
          );

          for (const [priority, rulesInGroup] of Object.entries(
            priorityGroups
          )) {
            if (rulesInGroup.length > 1) {
              conflicts.push({
                combination: {
                  requestType: requestType as RequestType,
                  location: location as Location,
                },
                rules: rulesInGroup,
                reason: `Multiple rules with priority ${priority} match this combination. First rule will be used, but this may be unintentional.`,
              });
            }
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Calculate overall coverage percentage
   */
  private calculateCoverageScore(matrix: CoverageMatrix): {
    score: number;
    totalCombinations: number;
    coveredCombinations: number;
  } {
    let total = 0;
    let covered = 0;

    for (const locations of Object.values(matrix)) {
      for (const coverage of Object.values(locations)) {
        total++;
        if (coverage.covered) {
          covered++;
        }
      }
    }

    const score = total > 0 ? Math.round((covered / total) * 100) : 0;

    return {
      score,
      totalCombinations: total,
      coveredCombinations: covered,
    };
  }

  /**
   * Generate warnings based on gaps, conflicts, and rule issues
   */
  private generateWarnings(
    gaps: CoverageGap[],
    conflicts: CoverageConflict[],
    rules: Rule[],
    matrix: CoverageMatrix
  ): CoverageWarning[] {
    const warnings: CoverageWarning[] = [];

    // High-severity: Request types with ZERO coverage
    const requestTypeCoverage: { [key: string]: number } = {};
    for (const requestType of REQUEST_TYPES) {
      requestTypeCoverage[requestType] = 0;
      for (const location of LOCATIONS) {
        if (matrix[requestType]?.[location]?.covered) {
          requestTypeCoverage[requestType]++;
        }
      }
    }

    for (const [requestType, coverageCount] of Object.entries(
      requestTypeCoverage
    )) {
      if (coverageCount === 0) {
        warnings.push({
          type: "gap",
          severity: "high",
          message: `Critical: "${requestType}" has NO coverage in any location. All requests will fall back to general team.`,
        });
      } else if (coverageCount < LOCATIONS.length) {
        const coveragePercent = Math.round(
          (coverageCount / LOCATIONS.length) * 100
        );
        warnings.push({
          type: "gap",
          severity: coveragePercent < 30 ? "high" : "medium",
          message: `"${requestType}" only has ${coveragePercent}% location coverage (${coverageCount}/${LOCATIONS.length} locations).`,
        });
      }
    }

    // Medium-severity: Priority conflicts
    for (const conflict of conflicts) {
      warnings.push({
        type: "conflict",
        severity: "medium",
        message: conflict.reason,
        affectedRules: conflict.rules.map((r) => r.id),
      });
    }

    // Low-severity: Rules that might be redundant
    const ruleUsageCount: { [ruleId: string]: number } = {};
    for (const rule of rules) {
      ruleUsageCount[rule.id] = 0;
    }

    for (const locations of Object.values(matrix)) {
      for (const coverage of Object.values(locations)) {
        for (const rule of coverage.rules) {
          ruleUsageCount[rule.id]++;
        }
      }
    }

    for (const rule of rules) {
      if (ruleUsageCount[rule.id] === 0) {
        warnings.push({
          type: "orphan",
          severity: "low",
          message: `Rule "${rule.name}" never matches any requestType/location combination. It may have impossible conditions or be shadowed by higher-priority rules.`,
          affectedRules: [rule.id],
        });
      }
    }

    return warnings.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Generate summary statistics by request type and location
   */
  private generateSummary(matrix: CoverageMatrix): CoverageReport["summary"] {
    const byRequestType: CoverageReport["summary"]["byRequestType"] = {};
    const byLocation: CoverageReport["summary"]["byLocation"] = {};

    // By request type
    for (const requestType of REQUEST_TYPES) {
      let covered = 0;
      const total = LOCATIONS.length;
      for (const location of LOCATIONS) {
        if (matrix[requestType]?.[location]?.covered) {
          covered++;
        }
      }
      byRequestType[requestType] = {
        covered,
        total,
        percentage: Math.round((covered / total) * 100),
      };
    }

    // By location
    for (const location of LOCATIONS) {
      let covered = 0;
      const total = REQUEST_TYPES.length;
      for (const requestType of REQUEST_TYPES) {
        if (matrix[requestType]?.[location]?.covered) {
          covered++;
        }
      }
      byLocation[location] = {
        covered,
        total,
        percentage: Math.round((covered / total) * 100),
      };
    }

    return { byRequestType, byLocation };
  }
}
