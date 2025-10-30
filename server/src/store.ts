import { Rule, Conversation } from "./types";
import { seedRules } from "./seed-data";

export interface Store {
  rules: Rule[];
  conversations: Map<string, Conversation>;
}

// Simple in-memory store
export const store: Store = {
  rules: [...seedRules], // Spread to create a copy
  conversations: new Map(),
};

// Helper functions for store operations
export const storeHelpers = {
  // Rules
  getAllRules: () => store.rules,

  getRuleById: (id: string) => store.rules.find((r) => r.id === id),

  addRule: (rule: Rule) => {
    store.rules.push(rule);
    return rule;
  },

  updateRule: (id: string, updates: Partial<Rule>) => {
    const index = store.rules.findIndex((r) => r.id === id);
    if (index === -1) return null;
    store.rules[index] = { ...store.rules[index], ...updates };
    return store.rules[index];
  },

  deleteRule: (id: string) => {
    const index = store.rules.findIndex((r) => r.id === id);
    if (index === -1) return false;
    store.rules.splice(index, 1);
    return true;
  },

  incrementRuleMatchCount: (id: string) => {
    const rule = store.rules.find((r) => r.id === id);
    if (rule) {
      rule.matchCount = (rule.matchCount || 0) + 1;
    }
  },

  // Conversations
  getConversation: (id: string) => store.conversations.get(id),

  setConversation: (id: string, conversation: Conversation) => {
    store.conversations.set(id, conversation);
  },

  deleteConversation: (id: string) => {
    store.conversations.delete(id);
  },
};
