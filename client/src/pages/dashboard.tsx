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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
          Bienvenido, {admin?.name || "Admin"}
        </h1>
        <p className="text-muted-foreground mt-1">Resumen general de tus eventos y ventas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-metric-tickets">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Boletos Apartados/Vendidos</CardTitle>
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10">
              <Ticket className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-tickets">{metrics.totalTicketsSold}</div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs">{metrics.apartados} apartados</Badge>
              <Badge variant="secondary" className="text-xs">{metrics.vendidos} vendidos</Badge>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Totales</CardTitle>
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-chart-2/10">
              <DollarSign className="w-4 h-4 text-chart-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">
              ${metrics.totalRevenue.toLocaleString("es-MX")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ingreso simulado total</p>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-remaining">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Boletos Restantes</CardTitle>
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-chart-4/10">
              <TrendingUp className="w-4 h-4 text-chart-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-remaining-tickets">{metrics.remaining.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">De {metrics.totalCapacity.toLocaleString()} en total</p>
          </CardContent>
        </Card>

        <Card data-testid="card-metric-events">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Eventos Creados</CardTitle>
            <div className="flex items-center justify-center w-9 h-9 rounded-md bg-chart-3/10">
              <Calendar className="w-4 h-4 text-chart-3" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-events">{metrics.totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Eventos activos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Ocupación por Evento</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {topEvents.map((evt) => (
              <div key={evt.id} className="space-y-2" data-testid={`event-occupancy-${evt.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{evt.name}</span>
                  <span className="text-xs text-muted-foreground">{evt.sold}/{evt.cap} ({evt.pct}%)</span>
                </div>
                <div className="h-2 rounded-md bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-md bg-primary transition-all duration-500"
                    style={{ width: `${evt.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">Reservaciones Recientes</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReservations.map((r) => {
                const evt = events.find((e) => e.id === r.eventId);
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-md bg-accent/30 flex-wrap"
                    data-testid={`reservation-${r.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{evt?.name || "Evento"} &middot; {r.quantity} boletos</p>
                    </div>
                    <Badge variant={r.status === "vendido" ? "default" : "secondary"}>
                      {r.status === "vendido" ? "Vendido" : "Apartado"}
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
