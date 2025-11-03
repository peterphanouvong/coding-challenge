import { useEffect, useState } from "react";
import { CoverageStats } from "./CoverageStats";
import { CoverageMatrix } from "./CoverageMatrix";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8999";

interface CoverageReport {
  score: number;
  totalCombinations: number;
  coveredCombinations: number;
  gaps: Array<{
    requestType: string;
    location: string;
    reason: string;
  }>;
  conflicts: Array<{
    combination: { requestType: string; location: string };
    rules: Array<{ id: string; name: string; priority: number }>;
    reason: string;
  }>;
  warnings: Array<{
    type: "gap" | "conflict" | "orphan" | "redundant";
    severity: "high" | "medium" | "low";
    message: string;
    affectedRules?: string[];
  }>;
  matrix: {
    [requestType: string]: {
      [location: string]: {
        covered: boolean;
        rules: Array<{ id: string; name: string; priority: number }>;
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
}

interface CoverageAnalysisProps {
  onAttorneyClick?: (attorneyEmail: string) => void;
}

export function CoverageAnalysis({ onAttorneyClick }: CoverageAnalysisProps) {
  const [coverage, setCoverage] = useState<CoverageReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoverage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/coverage`);
      if (!response.ok) {
        throw new Error("Failed to fetch coverage analysis");
      }
      const data = await response.json();
      setCoverage(data);
    } catch (err) {
      console.error("Error fetching coverage:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoverage();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Analyzing rule coverage...
      </div>
    );
  }

  if (error || !coverage) {
    return (
      <div className="p-8 text-center">
        <p className="text-destructive mb-4">Failed to load coverage analysis: {error}</p>
        <Button onClick={fetchCoverage}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Coverage Analysis</h2>
          <p className="text-muted-foreground">
            Analyze rule coverage to identify gaps and conflicts
          </p>
        </div>
        <Button onClick={fetchCoverage} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <CoverageStats
        score={coverage.score}
        totalCombinations={coverage.totalCombinations}
        coveredCombinations={coverage.coveredCombinations}
        gaps={coverage.gaps.length}
        conflicts={coverage.conflicts.length}
        warnings={coverage.warnings.length}
      />

      <CoverageMatrix
        matrix={coverage.matrix}
        summary={coverage.summary}
        onAttorneyClick={onAttorneyClick}
      />
    </div>
  );
}
