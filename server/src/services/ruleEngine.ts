import { Rule, Condition, ExtractedInfo, RoutingDecision } from "../types";

export class RuleEngine {
  /**
   * Check if a single condition matches the extracted info
   */
  private evaluateCondition(
    condition: Condition,
    info: ExtractedInfo
  ): boolean {
    const fieldValue = info[condition.field];

    // Field not extracted yet
    if (fieldValue === undefined || fieldValue === null) {
      return false;
    }

    switch (condition.operator) {
      case "equals":
        return (
          String(fieldValue).toLowerCase() ===
          String(condition.value).toLowerCase()
        );

      case "contains":
        return String(fieldValue)
          .toLowerCase()
          .includes(String(condition.value).toLowerCase());

      case "greater_than":
        return Number(fieldValue) > Number(condition.value);

      case "less_than":
        return Number(fieldValue) < Number(condition.value);

      case "not_equals":
        return (
          String(fieldValue).toLowerCase() !==
          String(condition.value).toLowerCase()
        );

      default:
        return false;
    }
  }

  /**
   * Check if all conditions in a rule match
   */
  private evaluateRule(rule: Rule, info: ExtractedInfo): boolean {
    if (!rule.enabled) return false;

    // All conditions must be true (AND logic)
    return rule.conditions.every((condition) =>
      this.evaluateCondition(condition, info)
    );
  }

  /**
   * Check if a rule could potentially match with more information
   * (i.e., all provided fields match, but some required fields are missing)
   */
  private couldMatch(rule: Rule, info: ExtractedInfo): boolean {
    if (!rule.enabled) return false;

    // Check if all conditions that CAN be evaluated match
    return rule.conditions.every((condition) => {
      const fieldValue = info[condition.field];

      // If field is not provided, consider it as potentially matching
      if (fieldValue === undefined || fieldValue === null) {
        return true;
      }

      // If field is provided, it must match
      return this.evaluateCondition(condition, info);
    });
  }

  /**
   * Calculate confidence score based on how much info we have
   */
  private calculateConfidence(info: ExtractedInfo, matchedRule?: Rule): number {
    let confidence = 50; // Base confidence

    // Boost for each field we extracted
    if (info.requestType) confidence += 20;
    if (info.location) confidence += 20;
    if (info.value) confidence += 5;
    if (info.department) confidence += 5;

    // If we matched a rule, high confidence
    if (matchedRule) {
      confidence = Math.min(confidence + 20, 98); // Cap at 98
    } else {
      confidence = Math.max(confidence - 30, 15); // Lower if no match
    }

    return Math.round(confidence);
  }

  /**
   * Find missing fields required by any rule
   */
  private findMissingFields(info: ExtractedInfo, rules: Rule[]): string[] {
    const requiredFields = new Set<string>();

    rules.forEach((rule) => {
      rule.conditions.forEach((condition) => {
        if (!info[condition.field]) {
          requiredFields.add(condition.field);
        }
      });
    });

    return Array.from(requiredFields);
  }

  /**
   * Main routing method - finds the best matching rule
   *
   * Logic:
   * 1. Find ALL rules that could potentially match (all provided fields match)
   * 2. If only 1 potential match → route to it confidently
   * 3. If multiple potential matches → ask clarifying questions about differentiating fields
   * 4. After clarification, if multiple exact matches → use priority to pick highest
   * 5. If no matches → route to fallback
   */
  route(extractedInfo: ExtractedInfo, rules: Rule[]): RoutingDecision {
    // Sort rules by priority (higher first)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    // Step 1: Find ALL rules that could potentially match
    // (all provided fields match, but some required fields might be missing)
    const potentialMatches = sortedRules.filter((rule) =>
      this.couldMatch(rule, extractedInfo)
    );

    if (potentialMatches.length === 0) {
      // No potential matches - route to fallback
      return {
        matched: false,
        confidence: 20,
        extractedInfo,
        reasoning:
          "No routing rule matches this request. Routing to general legal team.",
      };
    }

    // Step 2: If only ONE potential match, route to it confidently
    // (even if not all its conditions are satisfied yet - it's the only option)
    if (potentialMatches.length === 1) {
      const matchedRule = potentialMatches[0];
      const confidence = this.calculateConfidence(extractedInfo, matchedRule);

      return {
        matched: true,
        assignTo: matchedRule.action.assignTo,
        confidence,
        matchedRule,
        extractedInfo,
        reasoning: `Matched rule "${matchedRule.name}" (Priority ${
          matchedRule.priority
        }). ${matchedRule.description || ""}`,
      };
    }

    // Step 3: multiple potential matches
    // Find fields that could help disambiguate
    const differentiatingFields = this.findDifferentiatingFields(
      potentialMatches,
      extractedInfo
    );

    if (differentiatingFields.length > 0) {
      return {
        matched: false,
        confidence: 30,
        extractedInfo,
        reasoning: `Multiple potential matches found. Need more information to determine the best route.`,
        needsClarification: {
          missingFields: differentiatingFields as any,
          questions: differentiatingFields.map((field) =>
            this.generateClarificationQuestion(field)
          ),
        },
      };
    }

    // Edge case: multiple potential matches but no differentiating fields
    // Use priority to pick the best one
    const topMatch = potentialMatches.sort(
      (a, b) => a.priority - b.priority
    )[0];

    return {
      matched: true,
      assignTo: topMatch.action.assignTo,
      confidence: 35,
      extractedInfo,
      reasoning: `Multiple similar rules could match. Selected "${topMatch.name}" (Priority ${topMatch.priority}) - highest priority.`,
      matchedRule: topMatch,
    };
  }

  /**
   * Find fields where rules differ and that aren't yet filled in extractedInfo
   * These are the fields we should ask about to disambiguate between rules
   */
  private findDifferentiatingFields(
    rules: Rule[],
    info: ExtractedInfo
  ): string[] {
    const fieldValuesByRule = new Map<string, Set<string>>();

    // Collect all field values across all rules
    rules.forEach((rule) => {
      rule.conditions.forEach((condition) => {
        const fieldValue = info[condition.field];

        // Only consider fields that aren't filled yet
        if (fieldValue === undefined || fieldValue === null) {
          if (!fieldValuesByRule.has(condition.field)) {
            fieldValuesByRule.set(condition.field, new Set());
          }
          fieldValuesByRule
            .get(condition.field)!
            .add(String(condition.value).toLowerCase());
        }
      });
    });

    // Find fields where rules have different values (these differentiate the rules)
    const differentiatingFields: string[] = [];
    fieldValuesByRule.forEach((values, field) => {
      console.log(values);
      if (values.size >= 1) {
        differentiatingFields.push(field);
      }
    });

    return differentiatingFields;
  }

  /**
   * Generate a natural language question for missing field
   */
  private generateClarificationQuestion(field: string): string {
    const questions: Record<string, string> = {
      requestType:
        "What type of request is this? (e.g., Employment contract, Sales contract, NDA)",
      location: "Where are you located?",
      value: "What is the contract value?",
      department: "Which department is this for?",
      urgency: "How urgent is this request?",
    };

    return questions[field] || "Could you provide more details?";
  }

  /**
   * Test a rule against sample text (for admin testing)
   */
  testRule(
    rule: Rule,
    extractedInfo: ExtractedInfo
  ): { matches: boolean; reason: string } {
    const matches = this.evaluateRule(rule, extractedInfo);

    if (matches) {
      return {
        matches: true,
        reason: `All conditions satisfied. Would route to ${rule.action.assignTo}`,
      };
    }

    // Find which conditions failed
    const failedConditions = rule.conditions.filter(
      (condition) => !this.evaluateCondition(condition, extractedInfo)
    );

    return {
      matches: false,
      reason: `Failed conditions: ${failedConditions
        .map((c) => `${c.field} ${c.operator} ${c.value}`)
        .join(", ")}`,
    };
  }
}
