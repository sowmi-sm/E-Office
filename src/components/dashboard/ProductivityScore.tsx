import { cn } from '@/lib/utils';
import { useDashboardStats } from '@/hooks/useRoleBasedData';
import { Loader2 } from 'lucide-react';

export function ProductivityScore() {
  const { data: stats, isLoading } = useDashboardStats();

  // Calculate productivity score from real data
  // 70% from measurable KPIs + 30% from qualitative (supervisor feedback)
  const kpiPercentage = stats?.kpis.percentage ?? 0;
  const perfScore = stats?.performance.avgScore ?? 0;
  const measurableScore = kpiPercentage;
  const qualitativeScore = perfScore;
  const score = Math.round(measurableScore * 0.7 + qualitativeScore * 0.3);

  const circumference = 2 * Math.PI * 45;
  const progress = ((100 - score) / 100) * circumference;

  const getScoreColor = () => {
    if (score >= 90) return { stroke: 'stroke-success', text: 'text-success', bg: 'bg-success/10' };
    if (score >= 75) return { stroke: 'stroke-accent', text: 'text-accent', bg: 'bg-accent/10' };
    if (score >= 60) return { stroke: 'stroke-warning', text: 'text-warning', bg: 'bg-warning/10' };
    return { stroke: 'stroke-destructive', text: 'text-destructive', bg: 'bg-destructive/10' };
  };

  const colors = getScoreColor();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl p-5 shadow-md border border-border flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-5 shadow-md border border-border">
      <div className="text-center">
        <h3 className="font-semibold text-card-foreground mb-1">My Productivity Score</h3>
        <p className="text-sm text-muted-foreground">Weighted: 70% KPI + 30% Qualitative</p>
      </div>

      <div className="relative flex items-center justify-center my-6">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="10"
          />
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            className={cn('transition-all duration-1000 ease-out', colors.stroke)}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-4xl font-bold', colors.text)}>{score}</span>
          <span className="text-sm text-muted-foreground">out of 100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={cn('rounded-lg p-3 text-center', colors.bg)}>
          <p className="text-sm font-medium text-card-foreground">Measurable</p>
          <p className={cn('text-xl font-bold mt-1', colors.text)}>{measurableScore}%</p>
          <p className="text-xs text-muted-foreground">70% weight</p>
        </div>
        <div className="rounded-lg p-3 text-center bg-secondary">
          <p className="text-sm font-medium text-card-foreground">Qualitative</p>
          <p className="text-xl font-bold mt-1 text-primary">{qualitativeScore}%</p>
          <p className="text-xs text-muted-foreground">30% weight</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Active KPIs</span>
          <span className="font-semibold text-card-foreground">{stats?.kpis.total || 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-muted-foreground">KPIs On Track</span>
          <span className="font-semibold text-accent">{stats?.kpis.onTrack || 0}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-muted-foreground">Performance Records</span>
          <span className="font-semibold text-card-foreground">{stats?.performance.recordsCount || 0}</span>
        </div>
      </div>
    </div>
  );
}
