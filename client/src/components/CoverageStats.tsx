import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface CoverageStatsProps {
  score: number;
  totalCombinations: number;
  coveredCombinations: number;
  gaps: number;
  conflicts: number;
  warnings: number;
}

export function CoverageStats({
  score,
  totalCombinations,
  coveredCombinations,
  gaps,
  warnings,
}: CoverageStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">
            Overall Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-3xl font-bold">{score}%</div>
            <Progress value={score} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {coveredCombinations} of {totalCombinations} combinations covered
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Count */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Covered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{coveredCombinations}</div>
          <p className="text-xs text-muted-foreground">
            Request type + location combinations with rules
          </p>
        </CardContent>
      </Card>

      {/* Gaps Count */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            Gaps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{gaps}</div>
          <p className="text-xs text-muted-foreground">
            Combinations without matching rules
          </p>
        </CardContent>
      </Card>

      {/* Warnings Count */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Warnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{warnings}</div>
          <p className="text-xs text-muted-foreground">
            Issues requiring attention
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
