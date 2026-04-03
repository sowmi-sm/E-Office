import { useBreakTimeStatus } from '@/hooks/useWorkingHours';
import { useCheckUserBlock, useUnblockUser } from '@/hooks/useUserBlock';
import { Coffee, Moon, ShieldAlert, Unlock, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleCategory } from '@/hooks/useRoleBasedData';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function BreakTimeLock() {
  const { isBreakTime, isNonWorkingDay, breakEndTime, breakLabel, nextWorkStart } = useBreakTimeStatus();
  const { data: activeBlock } = useCheckUserBlock();
  const { role, user, signOut } = useAuth();
  const roleCategory = getRoleCategory(role);
  const unblockUser = useUnblockUser();

  // Log out user automatically when break time starts
  useEffect(() => {
    if (isBreakTime) {
      if (localStorage.getItem('test_break_lock') !== 'true') {
        const timeout = setTimeout(() => {
          signOut();
        }, 3000); // 3-second delay to show the warning before logging out

        return () => clearTimeout(timeout);
      }
    }
  }, [isBreakTime, signOut]);

  // Show block screen if user is blocked
  if (activeBlock) {
    return (
      <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Account Blocked</h1>
          <p className="text-lg text-muted-foreground">
            Your account has been blocked due to late login after break time.
            Please contact your administrator to unblock your account.
          </p>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Reason</p>
            <p className="text-base font-medium text-destructive mt-1">{activeBlock.blocked_reason}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Blocked at</p>
            <p className="text-base font-medium text-foreground mt-1">
              {new Date(activeBlock.blocked_at).toLocaleString('en-IN')}
            </p>
          </div>

          {roleCategory === 'admin' && (
            <div className="pt-4">
              <p className="text-xs text-muted-foreground mb-3">Admin Override (Demo Mode)</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (activeBlock?.user_id) unblockUser.mutate(activeBlock.user_id);
                }}
                disabled={unblockUser.isPending}
              >
                <Unlock className="h-4 w-4 mr-2" />
                Unblock My Account
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isBreakTime && !isNonWorkingDay) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8 space-y-6">
        {isBreakTime ? (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center">
              <Coffee className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{breakLabel || 'Break Time'}</h1>
            <p className="text-lg text-muted-foreground">
              It's break time! Task logging and activity recording are paused to ensure accurate productivity measurement.
            </p>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">System will unlock at</p>
              <p className="text-2xl font-bold text-primary mt-1">{breakEndTime}</p>
            </div>
            <p className="text-sm text-destructive font-medium">
              ⚠️ You are being logged out so productivity tracking can pause. Please log in again within 10 minutes of the break ending!
            </p>
            <p className="text-sm text-muted-foreground">
              Logging back in later than the 10-minute automated grace period will result in an account block.
            </p>

            {localStorage.getItem('test_break_lock') === 'true' && (
              <div className="pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem('test_break_lock');
                    window.location.reload();
                  }}
                >
                  <PlayCircle className="h-4 w-4 mr-2" />
                  End Demo Break
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Moon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Non-Working Day</h1>
            <p className="text-lg text-muted-foreground">
              Today is a non-working day. The system is locked to prevent activity recording outside official working hours.
            </p>
            {nextWorkStart && (
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Next working session</p>
                <p className="text-xl font-bold text-primary mt-1">{nextWorkStart}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
