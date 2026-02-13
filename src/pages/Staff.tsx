import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function Staff() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Staff Management</h1>
      <Card className="shadow-card border-border/50">
        <CardContent className="py-16 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">Staff invitation coming soon</p>
          <p className="text-xs text-muted-foreground mt-1">You'll be able to invite team members and assign permissions here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
