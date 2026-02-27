import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { EventosService } from "../../api/services/EventosService";
import type { EventosListItem } from "../../api/models/EventosListItem";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Ticket, Calendar, TrendingUp, BarChart3, ArrowUpRight, Loader2,
  Plus, MapPin, Clock,
} from "lucide-react";
import { useLocation } from "wouter";

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
}

function daysUntil(dateStr: string) {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

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

  const published = events.filter((e) =>
    (e.estadoDeEvento || "").toLowerCase().includes("publicado") ||
    (e.estadoDeEvento || "").toLowerCase().includes("activo")
  ).length;
  const upcoming = events.filter((e) => e.fechaInicio && new Date(e.fechaInicio) > new Date()).length;
  const categoriesCount = new Set(events.map((e) => e.tipoDeCategoriaEvento).filter(Boolean)).size;

  const metricCards = [
    {
      id: "events",
      title: "Eventos Creados",
      icon: Calendar,
      value: events.length,
      iconBg: "bg-indigo-500/10 dark:bg-indigo-400/10",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      subtitle: "Total registrados",
    },
    {
      id: "published",
      title: "Publicados",
      icon: TrendingUp,
      value: published,
      iconBg: "bg-indigo-400/10 dark:bg-indigo-300/10",
      iconColor: "text-indigo-500 dark:text-indigo-300",
      subtitle: "Visibles al público",
    },
    {
      id: "upcoming",
      title: "Próximos",
      icon: Ticket,
      value: upcoming,
      iconBg: "bg-violet-400/10 dark:bg-violet-300/10",
      iconColor: "text-violet-500 dark:text-violet-300",
      subtitle: "Por iniciar",
    },
    {
      id: "categories",
      title: "Categorías",
      icon: BarChart3,
      value: categoriesCount,
      iconBg: "bg-violet-500/10 dark:bg-violet-400/10",
      iconColor: "text-violet-600 dark:text-violet-400",
      subtitle: "Tipos de eventos",
    },
  ];

  const recentEvents = events.slice(0, 5);
  const upcomingEvents = events
    .filter((e) => e.fechaInicio && new Date(e.fechaInicio) > new Date())
    .sort((a, b) => new Date(a.fechaInicio!).getTime() - new Date(b.fechaInicio!).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground" data-testid="text-greeting">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mt-0.5" data-testid="text-dashboard-title">
            {admin?.name || "Admin"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Aquí tienes el resumen de tu actividad</p>
        </div>
        <Button onClick={() => navigate("/events/new")} data-testid="button-new-event">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((m) => (
              <Card
                key={m.id}
                className="hover-elevate cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate("/events"); }}
                onClick={() => navigate("/events")}
                data-testid={`card-metric-${m.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${m.iconBg} shrink-0`}>
                      <m.icon className={`w-5 h-5 ${m.iconColor}`} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold tracking-tight tabular-nums" data-testid={`text-${m.id}`}>{m.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{m.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground">Eventos Recientes</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate("/events")} data-testid="button-view-all-events">
                  Ver todos
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>

              {recentEvents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Sin eventos todavía</p>
                    <p className="text-xs text-muted-foreground mt-1">Crea tu primer evento para comenzar</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {recentEvents.map((evt) => {
                    const imgUrl = evt.imagen_Evento_Id
                      ? `https://dev-api.tikko.mx${evt.imagen_Evento_Id}`
                      : null;
                    return (
                      <Card
                        key={evt.id}
                        className="hover-elevate cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/events/${evt.id}`); }}
                        onClick={() => navigate(`/events/${evt.id}`)}
                        data-testid={`event-row-${evt.id}`}
                      >
                        <CardContent className="p-3 flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-accent shrink-0">
                            {imgUrl ? (
                              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Ticket className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate leading-tight">{evt.nombre}</p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {evt.fechaInicio && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {formatDateShort(evt.fechaInicio)}
                                </span>
                              )}
                              {evt.ubicacion && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate max-w-[120px]">{evt.ubicacion}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant={
                                (evt.estadoDeEvento || "").toLowerCase().includes("publicado") ||
                                (evt.estadoDeEvento || "").toLowerCase().includes("activo")
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-[11px]"
                            >
                              {evt.estadoDeEvento || "Borrador"}
                            </Badge>
                            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Próximos Eventos</h2>
              {upcomingEvents.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent mb-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">No hay eventos próximos</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((evt) => {
                    const days = evt.fechaInicio ? daysUntil(evt.fechaInicio) : null;
                    const imgUrl = evt.imagen_Evento_Id
                      ? `https://dev-api.tikko.mx${evt.imagen_Evento_Id}`
                      : null;
                    return (
                      <Card
                        key={evt.id}
                        className="hover-elevate cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/events/${evt.id}`); }}
                        onClick={() => navigate(`/events/${evt.id}`)}
                        data-testid={`upcoming-event-${evt.id}`}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-[2/1] overflow-hidden rounded-t-md bg-accent relative">
                            {imgUrl ? (
                              <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-violet-500/20 dark:from-indigo-500/10 dark:to-violet-500/10">
                                <Ticket className="w-8 h-8 text-muted-foreground/50" />
                              </div>
                            )}
                            {days !== null && days > 0 && (
                              <div className="absolute top-2 right-2">
                                <Badge variant="secondary" className="text-[10px] bg-background/70 dark:bg-background/60 border-0 backdrop-blur-sm">
                                  {days === 1 ? "Mañana" : `En ${days} días`}
                                </Badge>
                              </div>
                            )}
                          </div>
                          <div className="p-3.5">
                            <p className="text-sm font-medium truncate">{evt.nombre}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {evt.fechaInicio ? formatDateShort(evt.fechaInicio) : "Sin fecha"}
                              </span>
                            </div>
                            {evt.tipoDeCategoriaEvento && (
                              <Badge variant="secondary" className="text-[10px] mt-2">{evt.tipoDeCategoriaEvento}</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
