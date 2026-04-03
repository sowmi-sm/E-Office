import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertTriangle, Info, Clock, Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useApproveAccessRequest } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const getIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-destructive" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

export default function Notifications() {
  const navigate = useNavigate();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
    if (notification.link && !notification.sender_id) {
      navigate(notification.link);
    }
  };

  const approveAccess = useApproveAccessRequest();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with your tasks and performance alerts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1 text-sm">{unreadCount} unread</Badge>
            <Button
              variant="outline"
              onClick={() => markAllRead.mutate()}
              disabled={unreadCount === 0 || markAllRead.isPending}
            >
              Mark all as read
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse text-sm">Syncing your updates...</p>
          </div>
        ) : !notifications || notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-muted-foreground text-sm mt-1">You have no notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <Card
                key={notification.id}
                className={`animate-slide-up transition-all cursor-pointer hover:shadow-md ${!notification.is_read ? 'border-l-4 border-l-primary bg-primary/5' : 'opacity-80'}`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type || 'info')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          
                          {/* Admin Approval Button for Access Requests */}
                          {notification.title === 'System Access Request' && notification.sender_id && !notification.is_read && (
                            <div className="mt-4 flex gap-3">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveAccess.mutate({ 
                                    senderId: notification.sender_id!, 
                                    notificationId: notification.id 
                                  });
                                }}
                                disabled={approveAccess.isPending}
                              >
                                {approveAccess.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                                Approve & Grant Access
                              </Button>
                            </div>
                          )}
                        </div>
                        {!notification.is_read && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}</span>
                        {notification.link && !notification.sender_id && (
                          <>
                            <span className="bullet text-muted-foreground/30">•</span>
                            <span className="text-primary font-medium">Click to view</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

