import { useState } from "react";
import { useLocation } from "wouter";
import { getEvents } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Calendar, Users, Plus, Ticket, ArrowUpRight } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  borrador: "Borrador",
  en_revision: "En revisión",
  publicado: "Publicado",
};

export default function EventsPage() {
  const [, navigate] = useLocation();
  const events = getEvents();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = [...new Set(events.map((e) => e.category))];

  const filtered = events.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.location.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === "all" || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 mb-1">Gestión</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-events-title">Eventos</h1>
          <p className="text-muted-foreground text-sm mt-1">{events.length} eventos registrados</p>
        </div>
        <Button onClick={() => navigate("/events/new")} className="rounded-xl" data-testid="button-new-event">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <Input
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 h-11 rounded-xl bg-accent/40 border-border/60"
            data-testid="input-search-events"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] h-11 rounded-xl" data-testid="select-category">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((event) => {
          const totalSold = event.zones.reduce((s, z) => s + z.sold, 0);
          const totalCap = event.zones.reduce((s, z) => s + z.capacity, 0);
          const pct = totalCap > 0 ? Math.round((totalSold / totalCap) * 100) : 0;

          return (
            <Card
              key={event.id}
              className="overflow-visible hover-elevate cursor-pointer group"
              onClick={() => navigate(`/events/${event.id}`)}
              data-testid={`card-event-${event.id}`}
            >
              <div className="aspect-[16/9] overflow-hidden rounded-t-xl relative">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={event.status === "publicado" ? "default" : "secondary"}
                    className="text-[11px]"
                  >
                    {STATUS_LABELS[event.status] || event.status}
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <Badge variant="secondary" className="text-[11px] bg-black/40 text-white border-0 backdrop-blur-sm">{event.category}</Badge>
                </div>
              </div>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="font-semibold text-foreground leading-snug line-clamp-2"
                    data-testid={`link-event-${event.id}`}
                  >
                    {event.name}
                  </h3>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0 invisible group-hover:visible mt-0.5" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{new Date(event.startDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })} - {new Date(event.endDate).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Ticket className="w-3.5 h-3.5 shrink-0" />
                      <span className="tabular-nums">{totalSold}/{totalCap}</span>
                    </div>
                    <Badge variant="secondary" className="text-[11px] tabular-nums font-normal">{pct}%</Badge>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all ${pct >= 80 ? "from-chart-5 to-chart-5" : pct >= 50 ? "from-primary to-chart-3" : "from-chart-2 to-chart-2"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-accent mx-auto mb-4">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground">No se encontraron eventos</p>
          <p className="text-sm text-muted-foreground mt-1">Intenta con otra búsqueda o categoría</p>
        </div>
      )}
    </div>
  );
}
