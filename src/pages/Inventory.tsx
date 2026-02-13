import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Inventory() {
  const { workspaceId, role } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("10");
  const [newThreshold, setNewThreshold] = useState("5");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchItems = async () => {
    if (!workspaceId) return;
    const { data } = await supabase.from("inventory").select("*").eq("workspace_id", workspaceId).order("name");
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [workspaceId]);

  const addItem = async () => {
    if (!workspaceId || !newName) return;
    await supabase.from("inventory").insert({
      workspace_id: workspaceId, name: newName,
      quantity: parseInt(newQty), low_stock_threshold: parseInt(newThreshold),
    });
    toast({ title: "Item added!" });
    setNewName(""); setNewQty("10"); setNewThreshold("5");
    setDialogOpen(false);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Inventory</h1>
        {role === "admin" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Add Inventory Item</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Item Name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Cleaning Gloves" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Low Stock At</Label><Input type="number" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} /></div>
                </div>
                <Button onClick={addItem} className="w-full gradient-primary text-primary-foreground">Add Item</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent></Card>)}</div>
      ) : items.length === 0 ? (
        <Card className="shadow-card border-border/50">
          <CardContent className="py-16 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No inventory items yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => {
            const pct = Math.min(100, (item.quantity / Math.max(item.low_stock_threshold * 3, 1)) * 100);
            const isLow = item.quantity <= item.low_stock_threshold;
            return (
              <Card key={item.id} className="shadow-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Package className={`h-5 w-5 ${isLow ? "text-destructive" : "text-primary"}`} />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isLow && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      <Badge variant={isLow ? "destructive" : "secondary"}>{item.quantity} {item.unit || "units"}</Badge>
                    </div>
                  </div>
                  <Progress value={pct} className={`h-2 ${isLow ? "[&>div]:bg-destructive" : ""}`} />
                  <p className="text-xs text-muted-foreground mt-1">Alert threshold: {item.low_stock_threshold}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
