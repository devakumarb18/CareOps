import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, Clock, MapPin, User } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-info/10 text-info border-info/20",
  completed: "bg-success/10 text-success border-success/20",
  no_show: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function Bookings() {
  const { workspaceId } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchBookings = async () => {
    if (!workspaceId) return;
    let query = supabase
      .from("bookings")
      .select("*, contacts(name, email), services(name, duration, location)")
      .eq("workspace_id", workspaceId)
      .order("booking_date", { ascending: true });
    if (filter !== "all") query = query.eq("status", filter as any);
    const { data } = await query;
    setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, [workspaceId, filter]);

  const updateStatus = async (bookingId: string, status: string) => {
    await supabase.from("bookings").update({ status: status as any }).eq("id", bookingId);
    toast({ title: `Booking marked as ${status}` });
    fetchBookings();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Bookings</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bookings</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="no_show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-20 bg-muted rounded" /></CardContent></Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <Card className="shadow-card border-border/50">
          <CardContent className="py-16 text-center">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No bookings yet</p>
            <p className="text-xs text-muted-foreground mt-1">Bookings will appear here when customers book through your public page.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {bookings.map((booking, i) => (
            <motion.div key={booking.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="shadow-card border-border/50 hover:shadow-elevated transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CalendarDays className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{booking.services?.name}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{booking.contacts?.name}</span>
                          <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{booking.booking_date}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{booking.booking_time}</span>
                          {booking.services?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{booking.services.location}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColors[booking.status]}>{booking.status}</Badge>
                      {booking.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, "confirmed")}>Confirm</Button>
                      )}
                      {booking.status === "confirmed" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => updateStatus(booking.id, "completed")}>Complete</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(booking.id, "no_show")}>No Show</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
