import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Mail, FileText, CalendarDays, ClipboardList,
  Package, Users, Rocket, Check, Lock, ChevronRight, ChevronLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  { id: 1, title: "Workspace", icon: Building2, description: "Set up your business details" },
  { id: 2, title: "Email", icon: Mail, description: "Connect email integration" },
  { id: 3, title: "Contact Form", icon: FileText, description: "Create a public contact form" },
  { id: 4, title: "Bookings", icon: CalendarDays, description: "Set up services & availability" },
  { id: 5, title: "Forms", icon: ClipboardList, description: "Create post-booking forms" },
  { id: 6, title: "Inventory", icon: Package, description: "Track resources & stock" },
  { id: 7, title: "Staff", icon: Users, description: "Invite team members" },
  { id: 8, title: "Activate", icon: Rocket, description: "Go live!" },
];

export default function Onboarding() {
  const { workspaceId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Workspace form state
  const [wsName, setWsName] = useState("");
  const [wsAddress, setWsAddress] = useState("");
  const [wsTimezone, setWsTimezone] = useState("UTC");
  const [wsEmail, setWsEmail] = useState("");

  // Service form state
  const [serviceName, setServiceName] = useState("");
  const [serviceDuration, setServiceDuration] = useState("60");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceLocation, setServiceLocation] = useState("");

  // Inventory form state
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("10");
  const [itemThreshold, setItemThreshold] = useState("5");

  useEffect(() => {
    if (!workspaceId) return;
    supabase
      .from("workspaces")
      .select("onboarding_step, name, address, timezone, contact_email")
      .eq("id", workspaceId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCurrentStep(data.onboarding_step || 1);
          setWsName(data.name || "");
          setWsAddress(data.address || "");
          setWsTimezone(data.timezone || "UTC");
          setWsEmail(data.contact_email || "");
        }
      });
  }, [workspaceId]);

  const saveStep = async (step: number) => {
    if (!workspaceId) return;
    await supabase.from("workspaces").update({ onboarding_step: step }).eq("id", workspaceId);
  };

  const handleWorkspaceSave = async () => {
    if (!workspaceId) return;
    setLoading(true);
    const slug = wsName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await supabase.from("workspaces").update({
      name: wsName, address: wsAddress, timezone: wsTimezone, contact_email: wsEmail, slug,
    }).eq("id", workspaceId);
    toast({ title: "Workspace saved!" });
    const next = currentStep + 1;
    setCurrentStep(next);
    await saveStep(next);
    setLoading(false);
  };

  const handleServiceSave = async () => {
    if (!workspaceId) return;
    setLoading(true);
    const slug = serviceName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await supabase.from("services").insert({
      workspace_id: workspaceId, name: serviceName, duration: parseInt(serviceDuration),
      price: servicePrice ? parseFloat(servicePrice) : null, location: serviceLocation, slug,
    });
    toast({ title: "Service created!" });
    setServiceName(""); setServicePrice(""); setServiceLocation("");
    const next = currentStep + 1;
    setCurrentStep(next);
    await saveStep(next);
    setLoading(false);
  };

  const handleInventorySave = async () => {
    if (!workspaceId) return;
    setLoading(true);
    await supabase.from("inventory").insert({
      workspace_id: workspaceId, name: itemName,
      quantity: parseInt(itemQty), low_stock_threshold: parseInt(itemThreshold),
    });
    toast({ title: "Inventory item added!" });
    setItemName(""); setItemQty("10"); setItemThreshold("5");
    const next = currentStep + 1;
    setCurrentStep(next);
    await saveStep(next);
    setLoading(false);
  };

  const handleSkip = async () => {
    const next = currentStep + 1;
    setCurrentStep(next);
    await saveStep(next);
  };

  const handleActivate = async () => {
    if (!workspaceId) return;
    setLoading(true);
    await supabase.from("workspaces").update({ status: "active" as any }).eq("id", workspaceId);
    toast({ title: "🚀 Workspace activated!", description: "Your business is now live!" });
    setLoading(false);
    navigate("/dashboard");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Business Name</Label><Input value={wsName} onChange={(e) => setWsName(e.target.value)} placeholder="Acme Cleaning Services" /></div>
            <div className="space-y-2"><Label>Address</Label><Input value={wsAddress} onChange={(e) => setWsAddress(e.target.value)} placeholder="123 Main St, City" /></div>
            <div className="space-y-2"><Label>Timezone</Label><Input value={wsTimezone} onChange={(e) => setWsTimezone(e.target.value)} placeholder="America/New_York" /></div>
            <div className="space-y-2"><Label>Contact Email</Label><Input type="email" value={wsEmail} onChange={(e) => setWsEmail(e.target.value)} placeholder="contact@business.com" /></div>
            <Button onClick={handleWorkspaceSave} disabled={loading || !wsName} className="w-full gradient-primary text-primary-foreground">
              Save & Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Email integration allows CareOps to send confirmations, reminders, and alerts automatically.</p>
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm font-medium mb-1">📧 Email Integration</p>
              <p className="text-xs text-muted-foreground">We'll configure email sending for your workspace. You can set up your API key in Settings later.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkip} className="flex-1">Skip for now</Button>
              <Button onClick={() => { setCurrentStep(3); saveStep(3); }} className="flex-1 gradient-primary text-primary-foreground">Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">A contact form lets customers reach out to your business. We'll create a default form with Name, Email, Phone, and Message fields.</p>
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm font-medium mb-2">Default Contact Form Fields:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Full Name (required)</li><li>• Email (required)</li><li>• Phone (optional)</li><li>• Message (optional)</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkip} className="flex-1">Skip</Button>
              <Button onClick={() => { setCurrentStep(4); saveStep(4); }} className="flex-1 gradient-primary text-primary-foreground">Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Service Name</Label><Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} placeholder="Deep Cleaning" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Duration (min)</Label><Input type="number" value={serviceDuration} onChange={(e) => setServiceDuration(e.target.value)} /></div>
              <div className="space-y-2"><Label>Price ($)</Label><Input type="number" value={servicePrice} onChange={(e) => setServicePrice(e.target.value)} placeholder="50.00" /></div>
            </div>
            <div className="space-y-2"><Label>Location</Label><Input value={serviceLocation} onChange={(e) => setServiceLocation(e.target.value)} placeholder="On-site / Office" /></div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkip} className="flex-1">Skip</Button>
              <Button onClick={handleServiceSave} disabled={loading || !serviceName} className="flex-1 gradient-primary text-primary-foreground">
                Create Service <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Post-booking forms are sent to customers automatically after they book. Create intake forms, agreements, or questionnaires.</p>
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm font-medium">You can create custom forms in the Forms section after setup.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkip} className="flex-1">Skip</Button>
              <Button onClick={() => { setCurrentStep(6); saveStep(6); }} className="flex-1 gradient-primary text-primary-foreground">Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="space-y-2"><Label>Item Name</Label><Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Cleaning Gloves" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={itemQty} onChange={(e) => setItemQty(e.target.value)} /></div>
              <div className="space-y-2"><Label>Low Stock Alert At</Label><Input type="number" value={itemThreshold} onChange={(e) => setItemThreshold(e.target.value)} /></div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkip} className="flex-1">Skip</Button>
              <Button onClick={handleInventorySave} disabled={loading || !itemName} className="flex-1 gradient-primary text-primary-foreground">
                Add Item <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Invite staff members to help manage bookings, inbox, and forms. You can do this later from the Staff page.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSkip} className="flex-1">Skip</Button>
              <Button onClick={() => { setCurrentStep(8); saveStep(8); }} className="flex-1 gradient-primary text-primary-foreground">Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full gradient-primary flex items-center justify-center">
                <Rocket className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h3 className="font-display font-bold text-lg">Ready to Go Live!</h3>
            <p className="text-sm text-muted-foreground">Your workspace is configured. Activate it to make your contact form and booking pages live.</p>
            <Button onClick={handleActivate} disabled={loading} className="w-full gradient-primary text-primary-foreground" size="lg">
              {loading ? "Activating..." : "🚀 Activate Workspace"}
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold">Setup Wizard</h1>
        <p className="text-muted-foreground text-sm mt-1">Complete these steps to get your business running.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isLocked = currentStep < step.id;
          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => !isLocked && setCurrentStep(step.id)}
                disabled={isLocked}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isCurrent ? "bg-primary text-primary-foreground shadow-sm" :
                  isComplete ? "bg-accent/10 text-accent hover:bg-accent/20" :
                  "bg-muted text-muted-foreground"
                }`}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : isLocked ? <Lock className="h-3.5 w-3.5" /> : <step.icon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 mx-0.5 shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                {(() => { const StepIcon = steps[currentStep - 1]?.icon; return StepIcon ? <StepIcon className="h-5 w-5 text-primary" /> : null; })()}
                {steps[currentStep - 1]?.title}
              </CardTitle>
              <CardDescription>{steps[currentStep - 1]?.description}</CardDescription>
            </CardHeader>
            <CardContent>{renderStepContent()}</CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Back button */}
      {currentStep > 1 && (
        <Button variant="ghost" size="sm" onClick={() => setCurrentStep((s) => s - 1)}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>
      )}
    </div>
  );
}
