import { useBreakTimeStatus } from '@/hooks/useWorkingHours';
import { useCheckUserBlock, useUnblockUser } from '@/hooks/useUserBlock';
import { Coffee, Moon, ShieldAlert, Unlock, PlayCircle, LogOut, Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleCategory } from '@/hooks/useRoleBasedData';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function BreakTimeLock() {
  const { isBreakTime, isNonWorkingDay, breakEndTime, breakLabel, nextWorkStart } = useBreakTimeStatus();
  const { data: activeBlock } = useCheckUserBlock();
  const { role, user, signOut, profile } = useAuth();
  const roleCategory = getRoleCategory(role);
  const unblockUser = useUnblockUser();

  const [requestReason, setRequestReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleRequestAccess = async () => {
    if (!requestReason.trim() || !user) {
      toast.error("Please provide a reason for the request");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Find all administrators to notify
      const { data: admins, error: adminErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminErr) throw adminErr;

      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          sender_id: user.id,
          title: 'System Access Request',
          message: `${profile?.full_name || user.email} is requesting immediate system access. Reason: "${requestReason}"`,
          type: 'warning',
          link: '/notifications'
        }));

        const { error: notifyErr } = await supabase
          .from('notifications')
          .insert(notifications);

        if (notifyErr) throw notifyErr;

        setRequestSent(true);
        toast.success("Request sent successfully. An administrator will review it.");
        setRequestReason("");
      } else {
        toast.error("No administrators found to receive the request.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // The system will only show the overlay and wait for the break to end naturally

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

  if (!isBreakTime && !isNonWorkingDay) {
    return null;
  }

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
            <p className="text-sm text-muted-foreground mt-4">
              Your session will automatically unlock when the break time is over.
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

        {/* Access Request Form */}
        {!requestSent ? (
          <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MessageSquare className="h-4 w-4 text-primary" />
              Need to work now? Request access
            </div>
            <Textarea
              placeholder="Provide a valid reason for early access..."
              value={requestReason}
              onChange={(e) => setRequestReason(e.target.value)}
              className="min-h-[80px] bg-background resize-none text-sm"
              disabled={isSubmitting}
            />
            <Button 
              className="w-full" 
              onClick={handleRequestAccess}
              disabled={isSubmitting || !requestReason.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request to Admin
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 text-center">
            <p className="text-green-600 font-medium text-sm">
              Your request was sent. Please wait for an admin to unlock your session.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-border mt-4">
          <Button variant="ghost" className="text-muted-foreground" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
