import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  CalendarDays, MessageSquare, FileText, Package,
  AlertTriangle, ArrowRight, TrendingUp, Users, Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  todayBookings: number;
  upcomingBookings: number;
  noShows: number;
  unansweredMessages: number;
  pendingForms: number;
  lowStockItems: number;
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.35 },
  }),
};

export default function Dashboard() {
  const { workspaceId } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    todayBookings: 0, upcomingBookings: 0, noShows: 0,
    unansweredMessages: 0, pendingForms: 0, lowStockItems: 0,
  });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;

    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [bookingsRes, noShowRes, upcomingRes, convoRes, formsRes, inventoryRes, alertsRes] = await Promise.all([
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("booking_date", today),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "no_show"),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).gte("booking_date", today).in("status", ["pending", "confirmed"]),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("status", "open"),
        supabase.from("form_responses").select("id, form_id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("inventory").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).lte("quantity", 5),
        supabase.from("alerts").select("*").eq("workspace_id", workspaceId).eq("is_read", false).order("created_at", { ascending: false }).limit(5),
      ]);

      setStats({
        todayBookings: bookingsRes.count ?? 0,
        upcomingBookings: upcomingRes.count ?? 0,
        noShows: noShowRes.count ?? 0,
        unansweredMessages: convoRes.count ?? 0,
        pendingForms: formsRes.count ?? 0,
        lowStockItems: inventoryRes.count ?? 0,
      });
      setAlerts(alertsRes.data ?? []);
      setLoading(false);
    };

    fetchData();
  }, [workspaceId]);

  const kpis = [
    { label: "Today's Bookings", value: stats.todayBookings, icon: CalendarDays, color: "text-primary" },
    { label: "Upcoming", value: stats.upcomingBookings, icon: TrendingUp, color: "text-info" },
    { label: "No-Shows", value: stats.noShows, icon: Clock, color: "text-destructive" },
    { label: "Unanswered", value: stats.unansweredMessages, icon: MessageSquare, color: "text-warning" },
    { label: "Pending Forms", value: stats.pendingForms, icon: FileText, color: "text-accent" },
    { label: "Low Stock", value: stats.lowStockItems, icon: Package, color: "text-destructive" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <Badge variant="outline" className="text-xs">Live</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} custom={i} variants={fadeIn} initial="hidden" animate="visible">
            <Card className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div className="text-2xl font-display font-bold">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      <motion.div custom={6} variants={fadeIn} initial="hidden" animate="visible">
        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No active alerts — everything looks great!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => alert.link && navigate(alert.link)}
                  >
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-sm">{alert.message}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
