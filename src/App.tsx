import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "@/pages/Auth";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Onboarding from "@/pages/Onboarding";
import Inbox from "@/pages/Inbox";
import Bookings from "@/pages/Bookings";
import Forms from "@/pages/Forms";
import Inventory from "@/pages/Inventory";
import Staff from "@/pages/Staff";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/forms" element={<Forms />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
