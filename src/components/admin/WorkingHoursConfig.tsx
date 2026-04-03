import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Save, Coffee, Sun, Sunset } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkingHoursConfig, useUpdateWorkingHours, getDayName, getBreakLabel } from '@/hooks/useWorkingHours';
import type { WorkingHoursConfig as WHConfig } from '@/hooks/useWorkingHours';

const BREAK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  morning: Sun,
  lunch: Coffee,
  evening: Sunset,
};

export function WorkingHoursConfig() {
  const { data: configs, isLoading } = useWorkingHoursConfig();
  const updateMutation = useUpdateWorkingHours();
  const [editedConfigs, setEditedConfigs] = useState<Record<string, Partial<WHConfig>>>({});

  const handleChange = (id: string, field: keyof WHConfig, value: string | boolean) => {
    setEditedConfigs(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const handleSave = async (config: WHConfig) => {
    const updates = editedConfigs[config.id];
    if (!updates) return;

    try {
      await updateMutation.mutateAsync({ id: config.id, ...updates });
      setEditedConfigs(prev => {
        const next = { ...prev };
        delete next[config.id];
        return next;
      });
      toast.success(`${getDayName(config.day_of_week)} ${getBreakLabel(config.break_type)} updated`);
    } catch (error: any) {
      toast.error('Failed to update', { description: error.message });
    }
  };

  const handleSaveAll = async () => {
    const ids = Object.keys(editedConfigs);
    if (ids.length === 0) {
      toast.info('No changes to save');
      return;
    }
    try {
      for (const id of ids) {
        await updateMutation.mutateAsync({ id, ...editedConfigs[id] });
      }
      setEditedConfigs({});
      toast.success('All working hours updated');
    } catch (error: any) {
      toast.error('Failed to save', { description: error.message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group configs by day
  const groupedByDay = configs?.reduce((acc, config) => {
    const day = config.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(config);
    return acc;
  }, {} as Record<number, WHConfig[]>) || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Working Hours & Break Times
              </CardTitle>
              <CardDescription>
                Define official working hours and 3 break periods (morning tea, lunch, evening tea). The system locks during breaks.
              </CardDescription>
            </div>
            <Button onClick={handleSaveAll} disabled={Object.keys(editedConfigs).length === 0}>
              <Save className="h-4 w-4 mr-2" /> Save All Changes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(groupedByDay)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([day, dayConfigs]) => {
                const dayNum = Number(day);
                const lunchConfig = dayConfigs.find(c => c.break_type === 'lunch') || dayConfigs[0];
                const isWorkingDay = (editedConfigs[lunchConfig.id]?.is_working_day ?? lunchConfig.is_working_day);

                return (
                  <div key={day} className={`rounded-lg border p-4 space-y-3 ${isWorkingDay ? 'bg-card' : 'bg-muted/50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-sm w-28">{getDayName(dayNum)}</h3>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isWorkingDay}
                            onCheckedChange={(val) => {
                              // Update all configs for this day
                              dayConfigs.forEach(c => handleChange(c.id, 'is_working_day', val));
                            }}
                          />
                          <Label className="text-sm">{isWorkingDay ? 'Working' : 'Off'}</Label>
                        </div>
                      </div>
                      {isWorkingDay && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground">Work Hours</Label>
                          <Input
                            type="time"
                            className="w-28 h-8 text-sm"
                            defaultValue={lunchConfig.work_start_time?.slice(0, 5)}
                            onChange={(e) => dayConfigs.forEach(c => handleChange(c.id, 'work_start_time', e.target.value))}
                          />
                          <span className="text-muted-foreground">–</span>
                          <Input
                            type="time"
                            className="w-28 h-8 text-sm"
                            defaultValue={lunchConfig.work_end_time?.slice(0, 5)}
                            onChange={(e) => dayConfigs.forEach(c => handleChange(c.id, 'work_end_time', e.target.value))}
                          />
                        </div>
                      )}
                    </div>

                    {isWorkingDay && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-border">
                        {['morning', 'lunch', 'evening'].map(breakType => {
                          const breakConfig = dayConfigs.find(c => c.break_type === breakType);
                          if (!breakConfig) return null;
                          const BreakIcon = BREAK_ICONS[breakType] || Coffee;
                          const hasChanges = !!editedConfigs[breakConfig.id];

                          return (
                            <div key={breakType} className={`flex items-center gap-2 p-2 rounded-md ${hasChanges ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'}`}>
                              <BreakIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{getBreakLabel(breakType).replace(' Break', '').replace(' Tea', '')}</span>
                              <Input
                                type="time"
                                className="w-24 h-7 text-xs"
                                defaultValue={breakConfig.break_start_time?.slice(0, 5)}
                                onChange={(e) => handleChange(breakConfig.id, 'break_start_time', e.target.value)}
                              />
                              <span className="text-muted-foreground text-xs">–</span>
                              <Input
                                type="time"
                                className="w-24 h-7 text-xs"
                                defaultValue={breakConfig.break_end_time?.slice(0, 5)}
                                onChange={(e) => handleChange(breakConfig.id, 'break_end_time', e.target.value)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
