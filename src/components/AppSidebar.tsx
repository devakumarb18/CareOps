import {
  LayoutDashboard, MessageSquare, CalendarDays, FileText,
  Package, Users, Settings, Rocket, LogOut, Shield,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Inbox", url: "/inbox", icon: MessageSquare },
  { title: "Bookings", url: "/bookings", icon: CalendarDays },
  { title: "Forms", url: "/forms", icon: FileText },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Staff", url: "/staff", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

const staffItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Inbox", url: "/inbox", icon: MessageSquare },
  { title: "Bookings", url: "/bookings", icon: CalendarDays },
  { title: "Forms", url: "/forms", icon: FileText },
];

export function AppSidebar() {
  const { role, profile, signOut } = useAuth();
  const location = useLocation();
  const items = role === "admin" ? adminItems : staffItems;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm leading-tight">CareOps</span>
            <span className="text-[11px] text-muted-foreground leading-tight truncate max-w-[140px]">
              {profile?.display_name || "Loading..."}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location.pathname === "/onboarding"}>
                    <NavLink to="/onboarding" className="text-primary font-medium">
                      <Rocket className="h-4 w-4" />
                      <span>Setup Wizard</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
