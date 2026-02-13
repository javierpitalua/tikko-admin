import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Ticket, LayoutDashboard, Calendar, ShoppingCart, LogOut } from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Eventos", url: "/events", icon: Calendar },
  { title: "Apartar Boletos", url: "/reserve", icon: ShoppingCart },
];

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { admin, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = admin?.name
    ? admin.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary shrink-0">
            <Ticket className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">EventTicket</p>
            <p className="text-xs text-muted-foreground truncate">Panel Admin</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.url || location.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      data-active={isActive}
                      className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarFallback className="text-xs bg-accent">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{admin?.name || "Admin"}</p>
            <p className="text-xs text-muted-foreground truncate">{admin?.email}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
