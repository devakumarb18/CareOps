import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Activity, ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function Auth() {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState("login");

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Activity className="h-8 w-8 animate-spin text-primary" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <Shield className="h-12 w-12 text-primary-foreground" />
            <h1 className="text-4xl font-display font-bold text-primary-foreground">CareOps</h1>
          </div>
          <p className="text-primary-foreground/80 text-lg leading-relaxed">
            The unified operations platform for service businesses. Replace scattered tools with one intelligent system.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-sm text-primary-foreground/70">
            {["Smart Inbox", "Bookings", "Automation", "Inventory"].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground/60" />
                {f}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-display font-bold">CareOps</h1>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login"><LoginForm /></TabsContent>
            <TabsContent value="signup"><SignupForm onSuccess={() => setTab("login")} /></TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    setLoading(false);
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="font-display">Welcome back</CardTitle>
        <CardDescription>Sign in to your CareOps workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@business.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, businessName, displayName);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Account created!", description: "Check your email to verify your account." });
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader>
        <CardTitle className="font-display">Create your workspace</CardTitle>
        <CardDescription>Get your business running in minutes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-business">Business Name</Label>
            <Input id="signup-business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required placeholder="Acme Services" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-name">Your Name</Label>
            <Input id="signup-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="Jane Smith" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@business.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
            {loading ? "Creating..." : "Create Workspace"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
