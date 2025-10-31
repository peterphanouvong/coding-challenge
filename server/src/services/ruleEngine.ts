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
   */
  route(extractedInfo: ExtractedInfo, rules: Rule[]): RoutingDecision {
    // Sort rules by priority (higher first)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

    // Find first matching rule
    const matchedRule = sortedRules.find((rule) =>
      this.evaluateRule(rule, extractedInfo)
    );

    if (matchedRule) {
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

    // No match - check what's missing
    const missingFields = this.findMissingFields(extractedInfo, sortedRules);

    if (missingFields.length > 0) {
      return {
        matched: false,
        confidence: 30,
        extractedInfo,
        reasoning: "Need more information to route this request.",
        needsClarification: {
          missingFields: missingFields as any,
          questions: missingFields.map((field) =>
            this.generateClarificationQuestion(field)
          ),
        },
      };
    }

    // Have all info but still no match - no applicable rule
    return {
      matched: false,
      confidence: 20,
      extractedInfo,
      reasoning:
        "No routing rule matches this request. Consider routing to legal-general@acme.corp or creating a new rule.",
    };
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
