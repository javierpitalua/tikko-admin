import { useMemo } from "react";
import { getEvents, getReservations } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, DollarSign, Calendar, TrendingUp, Users, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const { admin } = useAuth();
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
    return { ...e, sold, cap, pct: Math.round((sold / cap) * 100) };
  }).sort((a, b) => b.pct - a.pct);

  const metricCards = [
    {
      id: "tickets",
      title: "Boletos Apartados/Vendidos",
      icon: Ticket,
      value: metrics.totalTicketsSold,
      gradient: "from-primary/12 to-chart-3/8",
      iconColor: "text-primary",
      extra: (
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">{metrics.apartados} apartados</Badge>
          <Badge variant="secondary" className="text-xs">{metrics.vendidos} vendidos</Badge>
        </div>
      ),
    },
    {
      id: "revenue",
      title: "Ingresos Totales",
      icon: DollarSign,
      value: `$${metrics.totalRevenue.toLocaleString("es-MX")}`,
      gradient: "from-chart-2/12 to-chart-2/5",
      iconColor: "text-chart-2",
      subtitle: "Ingreso simulado total",
    },
    {
      id: "remaining",
      title: "Boletos Restantes",
      icon: TrendingUp,
      value: metrics.remaining.toLocaleString(),
      gradient: "from-chart-4/12 to-chart-4/5",
      iconColor: "text-chart-4",
      subtitle: `De ${metrics.totalCapacity.toLocaleString()} en total`,
    },
    {
      id: "events",
      title: "Eventos Creados",
      icon: Calendar,
      value: metrics.totalEvents,
      gradient: "from-chart-3/12 to-chart-3/5",
      iconColor: "text-chart-3",
      subtitle: "Eventos activos",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-dashboard-title">
          Bienvenido, {admin?.name || "Admin"}
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">Resumen general de tus eventos y ventas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {metricCards.map((m) => (
          <Card key={m.id} data-testid={`card-metric-${m.id}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{m.title}</CardTitle>
              <div className={`flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br ${m.gradient}`}>
                <m.icon className={`w-5 h-5 ${m.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight" data-testid={`text-${m.id}`}>{m.value}</div>
              {m.extra}
              {m.subtitle && <p className="text-xs text-muted-foreground mt-2">{m.subtitle}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <CardTitle className="text-base font-semibold">Ocupación por Evento</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-5">
            {topEvents.map((evt) => (
              <div key={evt.id} className="space-y-2" data-testid={`event-occupancy-${evt.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{evt.name}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{evt.sold}/{evt.cap} ({evt.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-chart-3 transition-all duration-500"
                    style={{ width: `${evt.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <CardTitle className="text-base font-semibold">Reservaciones Recientes</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReservations.map((r) => {
                const evt = events.find((e) => e.id === r.eventId);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-accent/40 flex-wrap"
                    data-testid={`reservation-${r.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{evt?.name || "Evento"} &middot; {r.quantity} boletos</p>
                    </div>
                    <Badge variant={r.status === "vendido" ? "default" : "secondary"}>
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
