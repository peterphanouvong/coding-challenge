import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface Warning {
  type: "gap" | "conflict" | "orphan" | "redundant";
  severity: "high" | "medium" | "low";
  message: string;
  affectedRules?: string[];
}

interface CoverageWarningsProps {
  warnings: Warning[];
}

export function CoverageWarnings({ warnings }: CoverageWarningsProps) {
  if (warnings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Warnings</CardTitle>
          <CardDescription>No issues detected with current rule configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>All clear!</AlertTitle>
            <AlertDescription>
              Your rule set has no conflicts or major coverage gaps.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const highSeverity = warnings.filter((w) => w.severity === "high");
  const mediumSeverity = warnings.filter((w) => w.severity === "medium");
  const lowSeverity = warnings.filter((w) => w.severity === "low");

  const getIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warnings ({warnings.length})</CardTitle>
        <CardDescription>
          Issues detected with current rule configuration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* High severity */}
          {highSeverity.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-destructive">
                Critical Issues ({highSeverity.length})
              </h3>
              {highSeverity.map((warning, index) => (
                <Alert key={index} variant={getVariant(warning.severity)}>
                  {getIcon(warning.severity)}
                  <AlertDescription className="ml-2">{warning.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Medium severity */}
          {mediumSeverity.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                Warnings ({mediumSeverity.length})
              </h3>
              {mediumSeverity.map((warning, index) => (
                <Alert key={index} variant="default">
                  {getIcon(warning.severity)}
                  <AlertDescription className="ml-2">{warning.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Low severity */}
          {lowSeverity.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Info ({lowSeverity.length})
              </h3>
              {lowSeverity.map((warning, index) => (
                <Alert key={index} variant="default">
                  {getIcon(warning.severity)}
                  <AlertDescription className="ml-2 text-muted-foreground">
                    {warning.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
