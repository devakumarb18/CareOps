import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Globe } from "lucide-react";

export default function SettingsPage() {
  const { workspaceId } = useAuth();
  const { toast } = useToast();
  const [ws, setWs] = useState<any>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    supabase.from("workspaces").select("*").eq("id", workspaceId).maybeSingle().then(({ data }) => {
      if (data) { setWs(data); setName(data.name); setAddress(data.address || ""); setEmail(data.contact_email || ""); }
    });
  }, [workspaceId]);

  const save = async () => {
    if (!workspaceId) return;
    setSaving(true);
    await supabase.from("workspaces").update({ name, address, contact_email: email }).eq("id", workspaceId);
    toast({ title: "Settings saved!" });
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-display font-bold">Settings</h1>
      <Card className="shadow-card border-border/50">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />Workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ws && <div className="flex items-center gap-2 mb-2"><Badge variant={ws.status === "active" ? "default" : "secondary"}>{ws.status}</Badge>
            {ws.slug && <span className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" />{ws.slug}</span>}
          </div>}
          <div className="space-y-2"><Label>Business Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          <div className="space-y-2"><Label>Contact Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <Button onClick={save} disabled={saving} className="gradient-primary text-primary-foreground">{saving ? "Saving..." : "Save Changes"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
