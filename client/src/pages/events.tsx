import { useState } from "react";
import { useLocation } from "wouter";
import { getEvents } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Calendar, Users, Plus } from "lucide-react";

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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-events-title">Eventos</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">{events.length} eventos registrados</p>
        </div>
        <Button onClick={() => navigate("/events/new")} data-testid="button-new-event">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Evento
        </Button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-events"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-category">
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
          const pct = Math.round((totalSold / totalCap) * 100);

          return (
            <Card
              key={event.id}
              className="overflow-visible hover-elevate cursor-pointer group transition-all duration-200"
              onClick={() => navigate(`/events/${event.id}`)}
              data-testid={`card-event-${event.id}`}
            >
              <div className="aspect-[16/9] overflow-hidden rounded-t-xl relative">
                <img
                  src={event.image}
                  alt={event.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute top-3 right-3">
                  <Badge
                    variant={event.status === "publicado" ? "default" : "secondary"}
                  >
                    {STATUS_LABELS[event.status] || event.status}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-5 space-y-3.5">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h3
                    className="font-semibold text-foreground leading-snug line-clamp-2"
                    data-testid={`link-event-${event.id}`}
                  >
                    {event.name}
                  </h3>
                  <Badge variant="secondary" className="shrink-0">{event.category}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{new Date(event.startDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })} - {new Date(event.endDate).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>{totalSold} / {totalCap} boletos ({pct}%)</span>
                  </div>
                </div>

                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-chart-3 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mx-auto mb-5">
            <Search className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground">No se encontraron eventos</p>
          <p className="text-muted-foreground mt-1.5 text-sm">Intenta con otra búsqueda o categoría</p>
        </div>
      )}
    </div>
  );
}
