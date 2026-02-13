import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function Forms() {
  const { workspaceId } = useAuth();
  const [forms, setForms] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    const fetch = async () => {
      const [formsRes, responsesRes] = await Promise.all([
        supabase.from("forms").select("*").eq("workspace_id", workspaceId),
        supabase.from("form_responses").select("*, forms(name), contacts(name)").order("created_at", { ascending: false }),
      ]);
      setForms(formsRes.data || []);
      setResponses(responsesRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [workspaceId]);

  const statusIcon: Record<string, any> = {
    pending: <Clock className="h-4 w-4 text-warning" />,
    completed: <CheckCircle className="h-4 w-4 text-success" />,
    overdue: <AlertCircle className="h-4 w-4 text-destructive" />,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Forms</h1>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-12 bg-muted rounded" /></CardContent></Card>)}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Pending", count: responses.filter((r) => r.status === "pending").length, icon: Clock, color: "text-warning" },
              { label: "Completed", count: responses.filter((r) => r.status === "completed").length, icon: CheckCircle, color: "text-success" },
              { label: "Overdue", count: responses.filter((r) => r.status === "overdue").length, icon: AlertCircle, color: "text-destructive" },
            ].map((stat) => (
              <Card key={stat.label} className="shadow-card border-border/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-display font-bold">{stat.count}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {responses.length === 0 ? (
            <Card className="shadow-card border-border/50">
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground">No form responses yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {responses.map((resp) => (
                <Card key={resp.id} className="shadow-card border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {statusIcon[resp.status]}
                      <div>
                        <p className="text-sm font-medium">{resp.forms?.name || "Form"}</p>
                        <p className="text-xs text-muted-foreground">{resp.contacts?.name}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{resp.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
