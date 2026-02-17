import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { EventosService } from "../../api/services/EventosService";
import type { EventosListItem } from "../../api/models/EventosListItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Calendar, TrendingUp, BarChart3, ArrowUpRight, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const { admin } = useAuth();
  const [, navigate] = useLocation();
  const [events, setEvents] = useState<EventosListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    EventosService.getApiV1EventosList()
      .then((res) => setEvents(res.items || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const metricCards: Array<{
    id: string;
    title: string;
    icon: typeof Calendar;
    value: number;
    iconBg: string;
    iconColor: string;
    subtitle: string;
    href?: string;
  }> = [
    {
      id: "events",
      title: "Eventos Creados",
      icon: Calendar,
      value: events.length,
      iconBg: "bg-chart-3/10",
      iconColor: "text-chart-3",
      subtitle: "Total de eventos registrados",
      href: "/events",
    },
    {
      id: "published",
      title: "Publicados",
      icon: TrendingUp,
      value: events.filter((e) => (e.estadoDeEvento || "").toLowerCase().includes("publicado") || (e.estadoDeEvento || "").toLowerCase().includes("activo")).length,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      subtitle: "Eventos visibles al público",
      href: "/events",
    },
    {
      id: "upcoming",
      title: "Próximos",
      icon: Ticket,
      value: events.filter((e) => e.fechaInicio && new Date(e.fechaInicio) > new Date()).length,
      iconBg: "bg-chart-4/10",
      iconColor: "text-chart-4",
      subtitle: "Eventos por iniciar",
      href: "/events",
    },
    {
      id: "categories",
      title: "Categorías",
      icon: BarChart3,
      value: new Set(events.map((e) => e.tipoDeCategoriaEvento).filter(Boolean)).size,
      iconBg: "bg-chart-2/10",
      iconColor: "text-chart-2",
      subtitle: "Tipos de eventos",
      href: "/events",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 mb-1">Panel de control</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-dashboard-title">
            Bienvenido, {admin?.name || "Admin"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Resumen general de tus eventos</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metricCards.map((m) => (
              <Card
                key={m.id}
                className={`hover-elevate${m.href ? " cursor-pointer" : ""}`}
                onClick={m.href ? () => navigate(m.href!) : undefined}
                data-testid={`card-metric-${m.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{m.title}</p>
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${m.iconBg} shrink-0`}>
                      <m.icon className={`w-4 h-4 ${m.iconColor}`} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold tracking-tight tabular-nums" data-testid={`text-${m.id}`}>{m.value}</div>
                  {m.subtitle && <p className="text-[11px] text-muted-foreground mt-2">{m.subtitle}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <div>
                <CardTitle className="text-base font-semibold">Eventos Recientes</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Últimos eventos registrados</p>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="space-y-2">
                {events.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No hay eventos creados</p>
                )}
                {events.slice(0, 8).map((evt) => {
                  const startDate = evt.fechaInicio ? new Date(evt.fechaInicio) : null;
                  return (
                    <div
                      key={evt.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl hover-elevate cursor-pointer flex-wrap"
                      onClick={() => navigate(`/events/${evt.id}`)}
                      data-testid={`event-row-${evt.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                          <Ticket className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">{evt.nombre}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {startDate ? startDate.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "Sin fecha"}{" "}
                            {evt.ubicacion ? `· ${evt.ubicacion}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {evt.tipoDeCategoriaEvento && (
                          <Badge variant="secondary" className="text-[11px] font-normal">{evt.tipoDeCategoriaEvento}</Badge>
                        )}
                        <Badge variant={((evt.estadoDeEvento || "").toLowerCase().includes("publicado") || (evt.estadoDeEvento || "").toLowerCase().includes("activo")) ? "default" : "secondary"} className="text-[11px]">
                          {evt.estadoDeEvento || "Borrador"}
                        </Badge>
                        <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
