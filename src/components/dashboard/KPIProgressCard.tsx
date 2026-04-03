import { cn } from '@/lib/utils';
import { KPI } from '@/lib/sample-data';

interface KPIProgressCardProps {
  kpi: KPI;
  index: number;
}

export function KPIProgressCard({ kpi, index }: KPIProgressCardProps) {
  const progress = Math.min((kpi.current / kpi.target) * 100, 100);
  const isOnTrack = progress >= 80;
  const isWarning = progress >= 60 && progress < 80;

  return (
    <div
      className="bg-card rounded-xl p-4 shadow-md border border-border hover:shadow-lg transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-card-foreground text-sm">{kpi.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Weight: {kpi.weightage}%</p>
        </div>
        <span
          className={cn(
            'text-xs px-2 py-1 rounded-full font-medium',
            kpi.measurementType === 'automatic'
              ? 'bg-info/10 text-info'
              : 'bg-warning/10 text-warning'
          )}
        >
          {kpi.measurementType === 'automatic' ? 'Auto' : 'Manual'}
        </span>
      </div>

      <div className="flex items-end justify-between mb-2">
        <span className="text-2xl font-bold text-card-foreground">
          {kpi.current}
          <span className="text-sm font-normal text-muted-foreground ml-1">{kpi.unit}</span>
        </span>
        <span className="text-sm text-muted-foreground">
          Target: {kpi.target}
          {kpi.unit}
        </span>
      </div>

      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute h-full rounded-full transition-all duration-500 ease-out',
            isOnTrack ? 'bg-success' : isWarning ? 'bg-warning' : 'bg-destructive'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span
          className={cn(
            'text-xs font-medium',
            isOnTrack ? 'text-success' : isWarning ? 'text-warning' : 'text-destructive'
          )}
        >
          {progress.toFixed(0)}% achieved
        </span>
        {isOnTrack && (
          <span className="text-xs text-success">✓ On Track</span>
        )}
      </div>
    </div>
  );
}
