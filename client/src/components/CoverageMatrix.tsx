import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Layers, GripVertical, ArrowRight } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LOCATION_OPTIONS,
  REQUEST_TYPE_OPTIONS,
} from "../../../server/src/constants/legal.constants";
import { Location, RequestType } from "../../../server/src/types";
import { formatRequestType } from "@/lib/formatters";

interface Rule {
  id: string;
  name: string;
  priority: number;
  action?: { assignTo: string };
}

interface CoverageMatrixProps {
  matrix: {
    [requestType: string]: {
      [location: string]: {
        covered: boolean;
        rules: Rule[];
      };
    };
  };
  summary: {
    byRequestType: {
      [key: string]: { covered: number; total: number; percentage: number };
    };
    byLocation: {
      [key: string]: { covered: number; total: number; percentage: number };
    };
  };
  onAttorneyClick?: (attorneyEmail: string) => void;
}

const REQUEST_TYPE_LABELS: Record<RequestType, string> =
  REQUEST_TYPE_OPTIONS.reduce((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {} as Record<RequestType, string>);

const LOCATION_LABELS: Record<Location, string> = LOCATION_OPTIONS.reduce(
  (acc, item) => {
    acc[item.value] = item.label;
    return acc;
  },
  {} as Record<Location, string>
);

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8999";

interface SortableRuleItemProps {
  rule: Rule;
  index: number;
}

function SortableRuleItem({ rule, index }: SortableRuleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const attorney = rule.action?.assignTo || "Unknown";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
    >
      <div {...attributes} {...listeners} className="cursor-move">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{rule.name}</span>
          <Badge variant="outline">Priority {index + 1}</Badge>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Attorney: {attorney}
        </div>
      </div>
    </div>
  );
}

export function CoverageMatrix({
  matrix,
  summary,
  onAttorneyClick,
}: CoverageMatrixProps) {
  const requestTypes = Object.keys(matrix);
  const locations = Object.keys(matrix[requestTypes[0]] || {});
  const [showOverlapsOnly, setShowOverlapsOnly] = useState(false);
  const [priorityModalOpen, setPriorityModalOpen] = useState(false);
  const [selectedOverlap, setSelectedOverlap] = useState<{
    requestType: string;
    location: string;
    rules: Rule[];
  } | null>(null);
  const [sortedRules, setSortedRules] = useState<Rule[]>([]);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Count total overlaps
  const overlapCount = requestTypes.reduce((count, requestType) => {
    return (
      count +
      locations.filter(
        (location) => matrix[requestType][location].rules.length > 1
      ).length
    );
  }, 0);

  const openPriorityModal = (
    requestType: string,
    location: string,
    rules: Rule[]
  ) => {
    setSelectedOverlap({ requestType, location, rules });
    setSortedRules(rules);
    setPriorityModalOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSortedRules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const getCellColor = (
    coverage: { covered: boolean; rules: Rule[] },
    isFiltered: boolean
  ) => {
    if (isFiltered) return "bg-muted/50 opacity-40";
    if (!coverage.covered)
      return "bg-red-500/20 hover:bg-red-500/30 border-red-500/30";
    if (coverage.rules.length > 1)
      return "bg-orange-500/30 hover:bg-orange-500/40 border-orange-500/50 cursor-pointer";
    return "bg-green-500/20 hover:bg-green-500/30 border-green-500/30 cursor-pointer";
  };

  const getCellTooltip = (
    requestType: RequestType,
    location: Location,
    coverage: { covered: boolean; rules: Rule[] }
  ) => {
    if (!coverage.covered) {
      return (
        <div className="text-xs">
          No rule covers {formatRequestType(requestType)} +{" "}
          {LOCATION_LABELS[location]}
        </div>
      );
    }
    if (coverage.rules.length > 1) {
      return (
        <div className="text-xs space-y-2">
          <div className="font-semibold">Multiple rules overlap:</div>
          {coverage.rules.map((r) => {
            const attorney = r.action?.assignTo || "Unknown";
            return (
              <div key={r.id} className="ml-2">
                • {r.name} (P{r.priority}) → {attorney}
              </div>
            );
          })}
          <div className="pt-2 border-t">
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                openPriorityModal(requestType, location, coverage.rules);
              }}
            >
              <Layers className="h-3 w-3 mr-2" />
              Manage Priorities
            </Button>
          </div>
        </div>
      );
    }
    const attorney = coverage.rules[0].action?.assignTo || "Unknown";
    return (
      <div className="text-xs space-y-2">
        <div>
          <div className="font-semibold">{coverage.rules[0].name}</div>
          <div className="text-muted-foreground">
            Priority {coverage.rules[0].priority}
          </div>
          <div className="mt-1">Attorney: {attorney}</div>
        </div>
      </div>
    );
  };

  const handleCellClick = (coverage: { covered: boolean; rules: Rule[] }) => {
    if (!coverage.covered || !onAttorneyClick) return;

    // If only one rule, navigate to that attorney
    if (coverage.rules.length === 1) {
      const attorney = coverage.rules[0].action?.assignTo;
      if (attorney) {
        onAttorneyClick(attorney);
      }
    }
    // If multiple rules, navigate to the highest priority one
    else if (coverage.rules.length > 1) {
      const highestPriorityRule = coverage.rules[0]; // Already sorted by priority
      const attorney = highestPriorityRule.action?.assignTo;
      if (attorney) {
        onAttorneyClick(attorney);
      }
    }
  };

  const handleSave = async () => {
    sortedRules.forEach(async (rule, index) => {
      await fetch(`${API_BASE_URL}/api/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rule,
          priority: index + 1,
        }),
      });
    });

    setPriorityModalOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Coverage Heatmap</CardTitle>
            <CardDescription>
              Shows which requestType + location combinations are covered by
              rules
            </CardDescription>
          </div>
          {overlapCount > 0 && (
            <Button
              variant={showOverlapsOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOverlapsOnly(!showOverlapsOnly)}
            >
              <Layers className="h-4 w-4 mr-2" />
              {showOverlapsOnly
                ? "Show All"
                : `Show Overlaps (${overlapCount})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500/20 border border-green-500/30 rounded" />
              <span>Covered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500/30 border border-orange-500/50 rounded" />
              <span>Overlaps ({overlapCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/20 border border-red-500/30 rounded" />
              <span>Uncovered</span>
            </div>
          </div>

          {/* Matrix */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 text-sm font-medium sticky left-0 bg-background z-10">
                    Request Type
                  </th>
                  {locations.map((location) => (
                    <th
                      key={location}
                      className="p-2 text-sm font-medium text-center"
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {LOCATION_LABELS[location as Location] || location}
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div className="font-semibold">{location}</div>
                              <div className="text-muted-foreground">
                                {summary.byLocation[location]?.percentage}%
                                covered ({summary.byLocation[location]?.covered}
                                /{summary.byLocation[location]?.total})
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </th>
                  ))}
                  <th className="p-2 text-sm font-medium text-center">
                    Coverage
                  </th>
                </tr>
              </thead>
              <tbody>
                {requestTypes.map((requestType) => (
                  <tr key={requestType} className="border-t">
                    <td className="p-2 text-sm font-medium sticky left-0 bg-background z-10">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="text-left">
                            {formatRequestType(requestType)}
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div className="font-semibold">{requestType}</div>
                              <div className="text-muted-foreground">
                                {summary.byRequestType[requestType]?.percentage}
                                % covered (
                                {summary.byRequestType[requestType]?.covered}/
                                {summary.byRequestType[requestType]?.total})
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    {locations.map((location) => {
                      const coverage = matrix[requestType][location];
                      const isOverlap = coverage.rules.length > 1;
                      const isFiltered = showOverlapsOnly && !isOverlap;

                      return (
                        <td key={location} className="p-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`w-full h-12 rounded border transition-all ${getCellColor(
                                    coverage,
                                    isFiltered
                                  )} ${
                                    isOverlap && showOverlapsOnly
                                      ? "ring-2 ring-orange-400"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    !isFiltered && handleCellClick(coverage)
                                  }
                                  role={
                                    coverage.covered && !isFiltered
                                      ? "button"
                                      : undefined
                                  }
                                  tabIndex={
                                    coverage.covered && !isFiltered
                                      ? 0
                                      : undefined
                                  }
                                />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-sm">
                                <div>
                                  {getCellTooltip(
                                    requestType as RequestType,
                                    location as Location,
                                    coverage
                                  )}
                                  {coverage.covered &&
                                    !isFiltered &&
                                    coverage.rules.length === 1 && (
                                      <div className="mt-2 pt-2 border-t">
                                        <button
                                          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const attorney =
                                              coverage.rules[0].action
                                                ?.assignTo;
                                            if (attorney && onAttorneyClick) {
                                              onAttorneyClick(attorney);
                                            }
                                          }}
                                        >
                                          View attorney profile{" "}
                                          <ArrowRight className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      );
                    })}
                    <td className="p-2 text-center">
                      <Badge
                        variant={
                          summary.byRequestType[requestType]?.percentage === 100
                            ? "default"
                            : summary.byRequestType[requestType]?.percentage ===
                              0
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {summary.byRequestType[requestType]?.percentage}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>

      {/* Priority Management Modal */}
      <Dialog open={priorityModalOpen} onOpenChange={setPriorityModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Rule Priorities</DialogTitle>
            <DialogDescription>
              {selectedOverlap && (
                <>
                  For {formatRequestType(selectedOverlap.requestType)} requests
                  from {LOCATION_LABELS[selectedOverlap.location as Location]}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedOverlap && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Rules are evaluated in priority order (highest first). Drag to
                reorder priorities.
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedRules.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {sortedRules.map((rule, index) => (
                      <SortableRuleItem
                        key={rule.id}
                        rule={rule}
                        index={index}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Drag rules to reorder. The top rule will be evaluated first.
                </div>
                <Button onClick={() => handleSave()}>Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
