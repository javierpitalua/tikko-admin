import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { EventosService } from "../../api/services/EventosService";
import type { EventosListItem } from "../../api/models/EventosListItem";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, MapPin, Calendar, Plus, Ticket, ArrowUpRight, Loader2,
  LayoutGrid, List, Filter,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicado: "Publicado",
};

const STATUS_DOT: Record<string, string> = {
  borrador: "bg-amber-400",
  en_revision: "bg-blue-400",
  publicado: "bg-emerald-400",
};

function mapEstadoToKey(estado?: string | null): string {
  if (!estado) return "borrador";
  const lower = estado.toLowerCase();
  if (lower.includes("publicado") || lower.includes("activo")) return "publicado";
  if (lower.includes("revisión") || lower.includes("revision") || lower.includes("pendiente")) return "en_revision";
  return "borrador";
}

function formatDateRange(start?: string | null, end?: string | null) {
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (!s && !e) return null;
  const fmt = (d: Date, year?: boolean) =>
    d.toLocaleDateString("es-MX", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) });
  if (s && e) return `${fmt(s)} – ${fmt(e, true)}`;
  if (s) return fmt(s, true);
  return fmt(e!, true);
}

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop";

export default function EventsPage() {
  const [, navigate] = useLocation();
  const [events, setEvents] = useState<EventosListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    setLoading(true);
    EventosService.getApiV1EventosList()
      .then((res) => {
        setEvents(res.items || []);
        setError("");
      })
      .catch((err) => {
        setError("Error al cargar los eventos");
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(events.map((e) => e.tipoDeCategoriaEvento).filter(Boolean))] as string[];

  const filtered = events.filter((e) => {
    const matchesSearch = (e.nombre || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.ubicacion || "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "all" || e.tipoDeCategoriaEvento === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-events-title">Eventos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} {filtered.length === 1 ? "evento" : "eventos"}
              {categoryFilter !== "all" ? ` en ${categoryFilter}` : ""}
            </p>
          </div>
          <Button onClick={() => navigate("/events/new")} data-testid="button-new-event">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Evento
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              placeholder="Buscar por nombre o ubicación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
              data-testid="input-search-events"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] h-10" data-testid="select-category">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center border border-border rounded-md">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-l-md transition-colors ${viewMode === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="button-view-grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-r-md transition-colors ${viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="button-view-list"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((event) => {
            const statusKey = mapEstadoToKey(event.estadoDeEvento);
            const imageUrl = event.imagen_Evento_Id ? `https://dev-api.tikko.mx${event.imagen_Evento_Id}` : PLACEHOLDER_IMAGE;
            const dateRange = formatDateRange(event.fechaInicio, event.fechaFin);

            return (
              <Card
                key={event.id}
                className="overflow-visible hover-elevate cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/events/${event.id}`); }}
                onClick={() => navigate(`/events/${event.id}`)}
                data-testid={`card-event-${event.id}`}
              >
                <div className="aspect-[16/9] overflow-hidden rounded-t-md relative">
                  <img
                    src={imageUrl}
                    alt={event.nombre || ""}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                    <div>
                      {event.tipoDeCategoriaEvento && (
                        <Badge variant="secondary" className="text-[10px] bg-white/15 text-white border-0 backdrop-blur-md">
                          {event.tipoDeCategoriaEvento}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[statusKey] || STATUS_DOT.borrador}`} />
                      <span className="text-[11px] font-medium text-white/90">
                        {event.estadoDeEvento || STATUS_LABELS[statusKey] || "Borrador"}
                      </span>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-semibold text-foreground leading-snug line-clamp-2 text-[15px]"
                      data-testid={`link-event-${event.id}`}
                    >
                      {event.nombre}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0 invisible group-hover:visible mt-0.5" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {dateRange && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{dateRange}</span>
                      </div>
                    )}
                    {event.ubicacion && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{event.ubicacion}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && viewMode === "list" && (
        <div className="space-y-2">
          {filtered.map((event) => {
            const statusKey = mapEstadoToKey(event.estadoDeEvento);
            const imageUrl = event.imagen_Evento_Id ? `https://dev-api.tikko.mx${event.imagen_Evento_Id}` : null;
            const dateRange = formatDateRange(event.fechaInicio, event.fechaFin);

            return (
              <Card
                key={event.id}
                className="hover-elevate cursor-pointer group"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") navigate(`/events/${event.id}`); }}
                onClick={() => navigate(`/events/${event.id}`)}
                data-testid={`card-event-${event.id}`}
              >
                <CardContent className="p-3 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-accent shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate" data-testid={`link-event-${event.id}`}>
                      {event.nombre}
                    </h3>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      {dateRange && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {dateRange}
                        </span>
                      )}
                      {event.ubicacion && (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[160px]">{event.ubicacion}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {event.tipoDeCategoriaEvento && (
                      <Badge variant="secondary" className="text-[11px]">{event.tipoDeCategoriaEvento}</Badge>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${STATUS_DOT[statusKey] || STATUS_DOT.borrador}`} />
                      <span className="text-xs text-muted-foreground">
                        {event.estadoDeEvento || STATUS_LABELS[statusKey] || "Borrador"}
                      </span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground invisible group-hover:visible" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent mx-auto mb-4">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-base font-medium text-foreground">No se encontraron eventos</p>
          <p className="text-sm text-muted-foreground mt-1">Intenta con otra búsqueda o categoría</p>
          {(search || categoryFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => { setSearch(""); setCategoryFilter("all"); }}
              data-testid="button-clear-filters"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
