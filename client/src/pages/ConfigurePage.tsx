import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RuleBuilder } from "@/components/RuleBuilder";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Mail,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";
import type { Rule, RulesByAssignee, Condition } from "@/types/rules";
import {
  formatFieldName,
  formatOperator,
  formatConditionValue,
} from "@/lib/formatters";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8999";

export default function ConfigurePage() {
  const location = useLocation();
  const [rulesByAssignee, setRulesByAssignee] = useState<RulesByAssignee>({});
  const [expandedAssignees, setExpandedAssignees] = useState<Set<string>>(
    new Set()
  );
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [creatingRuleFor, setCreatingRuleFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Attorney management
  const [newAttorneyEmail, setNewAttorneyEmail] = useState("");
  const [showAddAttorney, setShowAddAttorney] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedItem, setHighlightedItem] = useState<{
    type: "attorney" | "rule";
    id: string;
  } | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Form state for editing/creating
  const [formData, setFormData] = useState<Partial<Rule>>({
    name: "",
    description: "",
    enabled: true,
    priority: 1,
    conditions: [],
    action: { assignTo: "" },
  });

  useEffect(() => {
    fetchRules();
  }, []);

  // Handle navigation state (highlight from ActionButtons)
  useEffect(() => {
    const state = location.state as {
      highlight?: { type: "attorney" | "rule"; id: string };
    } | null;
    if (state?.highlight) {
      const { type, id } = state.highlight;

      // Wait for data to load before highlighting
      if (Object.keys(rulesByAssignee).length > 0) {
        // Expand the assignee if highlighting an attorney or a rule
        if (type === "rule") {
          const assignee = Object.entries(rulesByAssignee).find(([_, rules]) =>
            rules.some((r) => r.id === id)
          )?.[0];
          if (assignee) {
            setExpandedAssignees((prev) => new Set([...prev, assignee]));
          }
        } else if (type === "attorney") {
          setExpandedAssignees((prev) => new Set([...prev, id]));
        }

        // Set highlight
        setHighlightedItem({ type, id });

        // Scroll to item after brief delay
        setTimeout(() => {
          const element = cardRefs.current.get(id);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }

          // Remove highlight after 2 seconds
          setTimeout(() => {
            setHighlightedItem(null);
          }, 2000);
        }, 100);

        // Clear the state to prevent re-triggering on future renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, rulesByAssignee]);

  // Keyboard shortcut for search (Ctrl/Cmd + K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rules/by-assignee`);
      const data = await response.json();
      setRulesByAssignee(data);
      // Expand all assignees by default
      setExpandedAssignees(new Set(Object.keys(data)));
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignee = (assignee: string) => {
    const newExpanded = new Set(expandedAssignees);
    if (newExpanded.has(assignee)) {
      newExpanded.delete(assignee);
    } else {
      newExpanded.add(assignee);
    }
    setExpandedAssignees(newExpanded);
  };

  const startCreating = (assignee: string) => {
    setCreatingRuleFor(assignee);
    setFormData({
      name: "",
      description: "",
      enabled: true,
      priority: 1,
      conditions: [{ field: "requestType", operator: "equals", value: "" }],
      action: { assignTo: assignee },
    });
  };

  const startEditing = (rule: Rule) => {
    setEditingRule(rule.id);
    setFormData(rule);
  };

  const cancelEditing = () => {
    setEditingRule(null);
    setCreatingRuleFor(null);
    setFormData({
      name: "",
      description: "",
      enabled: true,
      priority: 1,
      conditions: [],
      action: { assignTo: "" },
    });
  };

  const saveRule = async () => {
    try {
      if (editingRule) {
        // Update existing rule
        await fetch(`${API_BASE_URL}/api/rules/${editingRule}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else if (creatingRuleFor) {
        // Create new rule
        await fetch(`${API_BASE_URL}/api/rules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      await fetchRules();
      cancelEditing();
    } catch (error) {
      console.error("Failed to save rule:", error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      await fetch(`${API_BASE_URL}/api/rules/${ruleId}`, {
        method: "DELETE",
      });
      await fetchRules();
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  const toggleRuleEnabled = async (rule: Rule) => {
    try {
      await fetch(`${API_BASE_URL}/api/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rule, enabled: !rule.enabled }),
      });
      await fetchRules();
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const addAttorney = () => {
    const email = newAttorneyEmail.trim();
    if (!email) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address");
      return;
    }

    // Check if attorney already exists
    if (rulesByAssignee[email]) {
      alert("This attorney already exists");
      return;
    }

    // Add attorney to the list (with empty rules array)
    setRulesByAssignee((prev) => ({
      ...prev,
      [email]: [],
    }));

    // Expand the new attorney's section
    setExpandedAssignees((prev) => new Set([...prev, email]));

    // Reset form
    setNewAttorneyEmail("");
    setShowAddAttorney(false);
  };

  const handleSearchSelect = (
    type: "attorney" | "rule",
    id: string,
    assignee?: string
  ) => {
    setSearchOpen(false);

    // Expand the assignee if selecting a rule
    if (type === "rule" && assignee) {
      setExpandedAssignees((prev) => new Set([...prev, assignee]));
    } else if (type === "attorney") {
      setExpandedAssignees((prev) => new Set([...prev, id]));
    }

    // Highlight the item
    setHighlightedItem({ type, id });

    // Scroll to the item after a brief delay to allow for expansion
    setTimeout(() => {
      const element = cardRefs.current.get(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // Remove highlight after 2 seconds
      setTimeout(() => {
        setHighlightedItem(null);
      }, 2000);
    }, 100);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-center text-muted-foreground">Loading rules...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Search Command Menu */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="p-0">
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search attorneys and rules..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>

              {/* Attorneys */}
              {Object.keys(rulesByAssignee).length > 0 && (
                <CommandGroup heading="Attorneys">
                  {Object.entries(rulesByAssignee).map(([assignee, rules]) => (
                    <CommandItem
                      key={`attorney-${assignee}`}
                      onSelect={() => handleSearchSelect("attorney", assignee)}
                      className="cursor-pointer"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      <span>{assignee}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {rules.length} {rules.length === 1 ? "rule" : "rules"}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Rules */}
              {Object.entries(rulesByAssignee).map(([assignee, rules]) =>
                rules.length > 0 ? (
                  <CommandGroup
                    key={assignee}
                    heading={`Rules for ${assignee}`}
                  >
                    {rules.map((rule) => (
                      <CommandItem
                        key={`rule-${rule.id}`}
                        onSelect={() =>
                          handleSearchSelect("rule", rule.id, assignee)
                        }
                        className="cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rule.name}</span>
                            <Badge variant="outline" className="text-xs">
                              Priority {rule.priority}
                            </Badge>
                            {!rule.enabled && (
                              <Badge variant="secondary" className="text-xs">
                                Disabled
                              </Badge>
                            )}
                          </div>
                          {rule.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {rule.description}
                            </p>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : null
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Rule Configuration</h1>
            <p className="text-muted-foreground">
              Manage routing rules for each attorney. Rules are evaluated by
              priority (higher first).
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setSearchOpen(true)} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Search
              <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <Button
              onClick={() => setShowAddAttorney(!showAddAttorney)}
              variant="secondary"
            >
              <Plus className="h-4 w-4 mr-2" />
              {showAddAttorney ? "Cancel" : "Add Attorney"}
            </Button>
          </div>
        </div>

        {/* Add Attorney Form */}
        {showAddAttorney && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="attorney-email" className="mb-2">
                    Attorney Email
                  </Label>
                  <Input
                    id="attorney-email"
                    type="email"
                    placeholder="attorney@example.com"
                    value={newAttorneyEmail}
                    onChange={(e) => setNewAttorneyEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addAttorney();
                      }
                    }}
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Add a new attorney to create routing rules for them
                  </p>
                </div>
                <Button onClick={addAttorney}>
                  <Mail className="h-4 w-4 mr-2" />
                  Add Attorney
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(rulesByAssignee).map(([assignee, rules]) => {
          const isExpanded = expandedAssignees.has(assignee);
          const sortedRules = [...rules].sort(
            (a, b) => b.priority - a.priority
          );

          return (
            <Card
              key={assignee}
              ref={(el) => {
                if (el) cardRefs.current.set(assignee, el);
              }}
              className={
                highlightedItem?.type === "attorney" &&
                highlightedItem?.id === assignee
                  ? "ring-2 ring-primary transition-all"
                  : ""
              }
            >
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleAssignee(assignee)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-xl">{assignee}</CardTitle>
                      <CardDescription>
                        {rules.length} {rules.length === 1 ? "rule" : "rules"} •{" "}
                        {rules.filter((r) => r.enabled).length} enabled
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCreating(assignee);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4">
                  {/* Creating new rule */}
                  {creatingRuleFor === assignee && (
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Label
                              htmlFor={`create-rule-name-${assignee}`}
                              className="mb-2"
                            >
                              Rule Name
                            </Label>
                            <Input
                              id={`create-rule-name-${assignee}`}
                              placeholder="e.g., M&A Transactions, Employment Disputes"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="w-24">
                            <Label
                              htmlFor={`create-rule-priority-${assignee}`}
                              className="mb-2"
                            >
                              Priority
                            </Label>
                            <Input
                              id={`create-rule-priority-${assignee}`}
                              type="number"
                              placeholder="10"
                              value={formData.priority}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  priority: Number(e.target.value),
                                })
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <Label
                            htmlFor={`create-rule-description-${assignee}`}
                            className="mb-2"
                          >
                            Description (optional)
                          </Label>
                          <Input
                            id={`create-rule-description-${assignee}`}
                            placeholder="e.g., Route all merger and acquisition requests to this attorney"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>

                        <RuleBuilder
                          conditions={formData.conditions as Condition[]}
                          onChange={(conditions) =>
                            setFormData({ ...formData, conditions })
                          }
                        />

                        <div className="flex gap-2 justify-end">
                          <Button
                            onClick={cancelEditing}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                          <Button onClick={saveRule} size="sm">
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Existing rules */}
                  {sortedRules.map((rule) => (
                    <div
                      key={rule.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(rule.id, el);
                      }}
                      className={`border rounded-lg p-4 ${
                        !rule.enabled ? "opacity-50" : ""
                      } ${
                        highlightedItem?.type === "rule" &&
                        highlightedItem?.id === rule.id
                          ? "ring-2 ring-primary transition-all"
                          : ""
                      }`}
                    >
                      {editingRule === rule.id ? (
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <Label
                                htmlFor={`edit-rule-name-${rule.id}`}
                                className="mb-2"
                              >
                                Rule Name
                              </Label>
                              <Input
                                id={`edit-rule-name-${rule.id}`}
                                placeholder="e.g., M&A Transactions, Employment Disputes"
                                value={formData.name}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    name: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="w-24">
                              <Label
                                htmlFor={`edit-rule-priority-${rule.id}`}
                                className="mb-2"
                              >
                                Priority
                              </Label>
                              <Input
                                id={`edit-rule-priority-${rule.id}`}
                                type="number"
                                placeholder="10"
                                value={formData.priority}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    priority: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <Label
                              htmlFor={`edit-rule-description-${rule.id}`}
                              className="mb-2"
                            >
                              Description (optional)
                            </Label>
                            <Input
                              id={`edit-rule-description-${rule.id}`}
                              placeholder="e.g., Route all merger and acquisition requests to this attorney"
                              value={formData.description}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>

                          <RuleBuilder
                            conditions={formData.conditions as Condition[]}
                            onChange={(conditions) =>
                              setFormData({ ...formData, conditions })
                            }
                          />

                          <div className="flex gap-2 justify-end">
                            <Button
                              onClick={cancelEditing}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                            <Button onClick={saveRule} size="sm">
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">
                                  {rule.name}
                                </h3>

                                <Badge variant="outline">
                                  Priority {rule.priority}
                                </Badge>
                              </div>
                              {rule.description && (
                                <p className="text-sm text-muted-foreground">
                                  {rule.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge
                                className="cursor-pointer flex gap-2"
                                variant={"secondary"}
                                onClick={() => toggleRuleEnabled(rule)}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    rule.enabled ? "bg-green-500" : "bg-red-500"
                                  }`}
                                />

                                {rule.enabled ? "Enabled" : "Disabled"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => startEditing(rule)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteRule(rule.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {rule.conditions.map((condition, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded"
                              >
                                <span className="font-medium text-muted-foreground">
                                  {idx === 0 ? "Where" : "And"}
                                </span>
                                <Badge variant="outline">
                                  {formatFieldName(condition.field)}
                                </Badge>
                                <span className="text-muted-foreground">
                                  {formatOperator(condition.operator)}
                                </span>
                                <Badge variant={"secondary"}>
                                  {formatConditionValue(
                                    condition.field,
                                    condition.value
                                  )}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {sortedRules.length === 0 && creatingRuleFor !== assignee && (
                    <p className="text-center text-muted-foreground py-8">
                      No rules yet. Click "Add Rule" to create one.
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {Object.keys(rulesByAssignee).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No rules configured yet. Rules will appear here once created.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
