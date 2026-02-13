import { useMemo } from "react";
import { getEvents, getReservations } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, DollarSign, Calendar, TrendingUp, Users, BarChart3, ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const { admin } = useAuth();
  const [, navigate] = useLocation();
  const events = getEvents();
  const reservations = getReservations();

  const metrics = useMemo(() => {
    const totalTicketsSold = reservations.reduce((sum, r) => sum + r.quantity, 0);
    const apartados = reservations.filter((r) => r.status === "apartado").reduce((sum, r) => sum + r.quantity, 0);
    const vendidos = reservations.filter((r) => r.status === "vendido").reduce((sum, r) => sum + r.quantity, 0);

    let totalRevenue = 0;
    reservations.forEach((r) => {
      const event = events.find((e) => e.id === r.eventId);
      if (event) {
        const zone = event.zones.find((z) => z.id === r.zoneId);
        if (zone) {
          totalRevenue += zone.price * r.quantity;
        }
      }
    });

    const totalCapacity = events.reduce((sum, e) => sum + e.zones.reduce((zs, z) => zs + z.capacity, 0), 0);
    const totalSold = events.reduce((sum, e) => sum + e.zones.reduce((zs, z) => zs + z.sold, 0), 0);
    const remaining = totalCapacity - totalSold;

    return {
      totalTicketsSold,
      apartados,
      vendidos,
      totalRevenue,
      remaining,
      totalEvents: events.length,
      totalCapacity,
      totalSold,
    };
  }, [events, reservations]);

  const recentReservations = [...reservations].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const topEvents = events.map((e) => {
    const sold = e.zones.reduce((s, z) => s + z.sold, 0);
    const cap = e.zones.reduce((s, z) => s + z.capacity, 0);
    return { ...e, sold, cap, pct: cap > 0 ? Math.round((sold / cap) * 100) : 0 };
  }).sort((a, b) => b.pct - a.pct);

  const metricCards = [
    {
      id: "tickets",
      title: "Boletos Vendidos",
      icon: Ticket,
      value: metrics.totalTicketsSold,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      extra: (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <Badge variant="secondary" className="text-[11px] font-normal">{metrics.apartados} apartados</Badge>
          <Badge variant="secondary" className="text-[11px] font-normal">{metrics.vendidos} vendidos</Badge>
        </div>
      ),
    },
    {
      id: "revenue",
      title: "Ingresos Totales",
      icon: DollarSign,
      value: `$${metrics.totalRevenue.toLocaleString("es-MX")}`,
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
      subtitle: "Ingreso simulado total",
    },
    {
      id: "remaining",
      title: "Boletos Restantes",
      icon: TrendingUp,
      value: metrics.remaining.toLocaleString(),
      iconBg: "bg-chart-4/10",
      iconColor: "text-chart-4",
      subtitle: `De ${metrics.totalCapacity.toLocaleString()} totales`,
    },
    {
      id: "events",
      title: "Eventos Creados",
      icon: Calendar,
      value: metrics.totalEvents,
      iconBg: "bg-chart-3/10",
      iconColor: "text-chart-3",
      subtitle: "Eventos activos",
    },
  ];

  const occupancyColor = (pct: number) => {
    if (pct >= 80) return "from-chart-5 to-chart-5";
    if (pct >= 50) return "from-primary to-chart-3";
    return "from-chart-2 to-chart-2";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 mb-1">Panel de control</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-dashboard-title">
            Bienvenido, {admin?.name || "Admin"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Resumen general de tus eventos y ventas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricCards.map((m) => (
          <Card key={m.id} className="hover-elevate" data-testid={`card-metric-${m.id}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.title}</p>
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${m.iconBg} shrink-0`}>
                  <m.icon className={`w-4 h-4 ${m.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight tabular-nums" data-testid={`text-${m.id}`}>{m.value}</div>
              {m.extra}
              {m.subtitle && <p className="text-[11px] text-muted-foreground mt-2">{m.subtitle}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Ocupación por Evento</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Porcentaje de boletos vendidos</p>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {topEvents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No hay eventos creados</p>
            )}
            {topEvents.map((evt) => (
              <div
                key={evt.id}
                className="group cursor-pointer rounded-xl p-3 -mx-1 hover-elevate transition-colors"
                onClick={() => navigate(`/events/${evt.id}`)}
                data-testid={`event-occupancy-${evt.id}`}
              >
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium truncate">{evt.name}</span>
                    <ArrowUpRight className="w-3 h-3 text-muted-foreground invisible group-hover:visible shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground">{evt.sold}/{evt.cap}</span>
                    <Badge variant="secondary" className="text-[11px] tabular-nums font-normal">{evt.pct}%</Badge>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${occupancyColor(evt.pct)} transition-all duration-500`}
                    style={{ width: `${evt.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Reservaciones Recientes</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Últimas 5 transacciones</p>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {recentReservations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No hay reservaciones</p>
              )}
              {recentReservations.map((r) => {
                const evt = events.find((e) => e.id === r.eventId);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl hover-elevate flex-wrap"
                    data-testid={`reservation-${r.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                        <Ticket className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate leading-tight">{r.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{evt?.name || "Evento"} &middot; {r.quantity} boletos</p>
                      </div>
                    </div>
                    <Badge variant={r.status === "vendido" ? "default" : "secondary"} className="text-[11px] shrink-0">
                      {r.status === "vendido" ? "Vendido" : r.status === "apartado" ? "Apartado" : r.status === "expirado" ? "Expirado" : "Cancelado"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
