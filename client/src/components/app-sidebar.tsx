import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Ticket, LayoutDashboard, Calendar, ShoppingCart, LogOut, ChevronRight } from "lucide-react";

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
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-chart-3 shrink-0 shadow-md sidebar-logo-glow">
            <Ticket className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm tracking-tight truncate">Tikko</p>
            <p className="text-[11px] text-muted-foreground truncate">Panel de Administración</p>
          </div>
        </div>
      </SidebarHeader>

      <Separator className="mx-4 w-auto opacity-50" />

      <SidebarContent className="pt-4">
        <SidebarGroup>
          <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">Menú principal</p>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-0.5">
              {navItems.map((item) => {
                const isActive = location === item.url || location.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      data-active={isActive}
                      className={`rounded-xl h-10 transition-all duration-150 ${isActive ? "bg-primary text-primary-foreground font-medium shadow-sm" : ""}`}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1">{item.title}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="mb-4 opacity-50" />
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-accent/50">
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-chart-3/15 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{admin?.name || "Admin"}</p>
            <p className="text-[11px] text-muted-foreground truncate">{admin?.email}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={handleLogout} className="shrink-0" data-testid="button-logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
