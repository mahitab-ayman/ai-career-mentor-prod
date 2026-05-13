import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Bell, BellOff, CheckCheck, Sparkles, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Streamdown } from "streamdown";

export default function Notifications() {
  const utils = trpc.useUtils();

  const { data: notifications, isLoading } = trpc.notifications.getAll.useQuery();
  const { data: settings } = trpc.notifications.getSettings.useQuery();

  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => utils.notifications.getAll.invalidate(),
  });

  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { utils.notifications.getAll.invalidate(); toast.success("All notifications marked as read"); },
  });

  const enableWeekly = trpc.notifications.enableWeekly.useMutation({
    onSuccess: () => { utils.notifications.getSettings.invalidate(); toast.success("Weekly notifications enabled! You'll receive tips every Monday."); },
    onError: (err: any) => toast.error(err.message),
  });

  const disableWeekly = trpc.notifications.disableWeekly.useMutation({
    onSuccess: () => { utils.notifications.getSettings.invalidate(); toast.success("Weekly notifications disabled."); },
    onError: (err: any) => toast.error(err.message),
  });

  const unread = notifications?.filter(n => !n.isRead) ?? [];

  return (
    <AppLayout title="Notifications">
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              Weekly career tips and updates
              {unread.length > 0 && <span className="ml-2 text-primary font-medium">· {unread.length} unread</span>}
            </p>
          </div>
          {unread.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="self-start"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>

        {/* Settings card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Weekly Career Tips</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Receive personalized career advice every Monday</p>
              </div>
              <Switch
                checked={settings?.isEnabled ?? false}
                disabled={enableWeekly.isPending || disableWeekly.isPending}
                onCheckedChange={(checked) => checked ? enableWeekly.mutate() : disableWeekly.mutate()}
              />
              {(enableWeekly.isPending || disableWeekly.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!notifications || notifications.length === 0) && (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl gradient-soft border border-primary/20 flex items-center justify-center mx-auto">
                <BellOff className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground">No Notifications Yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Your weekly career tips will appear here. Make sure notifications are enabled above.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Notifications list */}
        {!isLoading && notifications && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map(notif => (
              <Card
                key={notif.id}
                className={`cursor-pointer transition-colors ${!notif.isRead ? "border-primary/30 bg-primary/2" : "border-border"}`}
                onClick={() => !notif.isRead && markRead.mutate({ id: notif.id })}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!notif.isRead ? "gradient-primary" : "bg-muted"}`}>
                      <Sparkles className={`w-4 h-4 ${!notif.isRead ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm font-semibold ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && <Badge className="bg-primary/10 text-primary text-xs py-0 h-4">New</Badge>}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                      <div className={`mt-1 text-sm ${!notif.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                        <Streamdown>{notif.content}</Streamdown>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
