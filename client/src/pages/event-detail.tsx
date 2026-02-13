import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { getEvents, saveEvents, generateId } from "@/lib/store";
import type { Event, Zone, Activity, Coupon } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, MapPin, Calendar, Edit2, Plus, Trash2,
  Ticket, Clock, Tag, Save, Users, Image as ImageIcon,
  Upload, X, FileText, DollarSign, Settings, Building,
} from "lucide-react";

const CATEGORIES = ["Música", "Tecnología", "Deportes", "Gastronomía", "Cultura", "Teatro", "Arte", "Otro"];

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", date: "", location: "", category: "", description: "", image: "" });

  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [zoneDialog, setZoneDialog] = useState(false);
  const [activityDialog, setActivityDialog] = useState(false);
  const [couponDialog, setCouponDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const [zoneForm, setZoneForm] = useState({ name: "", capacity: "", price: "" });
  const [activityForm, setActivityForm] = useState({ name: "", time: "", description: "" });
  const [couponForm, setCouponForm] = useState({ code: "", discount: "", active: true });

  useEffect(() => {
    const events = getEvents();
    const found = events.find((e) => e.id === params.id);
    if (found) {
      setEvent(found);
      setDraft({
        name: found.name,
        date: found.date,
        location: found.location,
        category: found.category,
        description: found.description,
        image: found.image,
      });
    }
  }, [params.id]);

  if (!event) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Evento no encontrado</p>
      </div>
    );
  }

  function persistEvent(updated: Event) {
    const events = getEvents();
    const idx = events.findIndex((e) => e.id === updated.id);
    if (idx >= 0) events[idx] = updated;
    saveEvents(events);
    setEvent(updated);
  }

  function startEditing() {
    setDraft({
      name: event!.name,
      date: event!.date,
      location: event!.location,
      category: event!.category,
      description: event!.description,
      image: event!.image,
    });
    setEditing(true);
  }

  function cancelEditing() {
    setDraft({
      name: event!.name,
      date: event!.date,
      location: event!.location,
      category: event!.category,
      description: event!.description,
      image: event!.image,
    });
    setEditing(false);
  }

  function saveBasicInfo() {
    if (!event) return;
    if (!draft.name.trim() || !draft.date || !draft.location.trim() || !draft.category) {
      toast({ title: "Completa todos los campos obligatorios", variant: "destructive" });
      return;
    }
    const updated: Event = {
      ...event,
      name: draft.name.trim(),
      date: draft.date,
      location: draft.location.trim(),
      category: draft.category,
      description: draft.description.trim(),
      image: draft.image,
    };
    persistEvent(updated);
    setEditing(false);
    toast({ title: "Evento actualizado" });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Solo se permiten archivos de imagen", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setDraft((prev) => ({ ...prev, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  function handleDeleteEvent() {
    const events = getEvents().filter((e) => e.id !== event!.id);
    saveEvents(events);
    toast({ title: "Evento eliminado" });
    navigate("/events");
  }

  function openZoneDialog(zone?: Zone) {
    if (zone) {
      setEditingZone(zone);
      setZoneForm({ name: zone.name, capacity: String(zone.capacity), price: String(zone.price) });
    } else {
      setEditingZone(null);
      setZoneForm({ name: "", capacity: "", price: "" });
    }
    setZoneDialog(true);
  }

  function saveZone() {
    if (!event || !zoneForm.name || !zoneForm.capacity || !zoneForm.price) return;
    const updated = { ...event };
    if (editingZone) {
      updated.zones = updated.zones.map((z) =>
        z.id === editingZone.id
          ? { ...z, name: zoneForm.name, capacity: Number(zoneForm.capacity), price: Number(zoneForm.price) }
          : z
      );
    } else {
      updated.zones = [...updated.zones, {
        id: generateId(),
        name: zoneForm.name,
        capacity: Number(zoneForm.capacity),
        price: Number(zoneForm.price),
        sold: 0,
      }];
    }
    persistEvent(updated);
    setZoneDialog(false);
    toast({ title: editingZone ? "Zona actualizada" : "Zona agregada" });
  }

  function deleteZone(zoneId: string) {
    if (!event) return;
    const updated = { ...event, zones: event.zones.filter((z) => z.id !== zoneId) };
    persistEvent(updated);
    toast({ title: "Zona eliminada" });
  }

  function openActivityDialog(activity?: Activity) {
    if (activity) {
      setEditingActivity(activity);
      setActivityForm({ name: activity.name, time: activity.time, description: activity.description });
    } else {
      setEditingActivity(null);
      setActivityForm({ name: "", time: "", description: "" });
    }
    setActivityDialog(true);
  }

  function saveActivity() {
    if (!event || !activityForm.name || !activityForm.time) return;
    const updated = { ...event };
    if (editingActivity) {
      updated.activities = updated.activities.map((a) =>
        a.id === editingActivity.id
          ? { ...a, name: activityForm.name, time: activityForm.time, description: activityForm.description }
          : a
      );
    } else {
      updated.activities = [...updated.activities, {
        id: generateId(),
        name: activityForm.name,
        time: activityForm.time,
        description: activityForm.description,
      }];
    }
    persistEvent(updated);
    setActivityDialog(false);
    toast({ title: editingActivity ? "Actividad actualizada" : "Actividad agregada" });
  }

  function deleteActivity(activityId: string) {
    if (!event) return;
    const updated = { ...event, activities: event.activities.filter((a) => a.id !== activityId) };
    persistEvent(updated);
    toast({ title: "Actividad eliminada" });
  }

  function openCouponDialog(coupon?: Coupon) {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({ code: coupon.code, discount: String(coupon.discount), active: coupon.active });
    } else {
      setEditingCoupon(null);
      setCouponForm({ code: "", discount: "", active: true });
    }
    setCouponDialog(true);
  }

  function saveCoupon() {
    if (!event || !couponForm.code || !couponForm.discount) return;
    const updated = { ...event };
    if (editingCoupon) {
      updated.coupons = updated.coupons.map((c) =>
        c.id === editingCoupon.id
          ? { ...c, code: couponForm.code, discount: Number(couponForm.discount), active: couponForm.active }
          : c
      );
    } else {
      updated.coupons = [...updated.coupons, {
        id: generateId(),
        code: couponForm.code,
        discount: Number(couponForm.discount),
        active: couponForm.active,
      }];
    }
    persistEvent(updated);
    setCouponDialog(false);
    toast({ title: editingCoupon ? "Cupón actualizado" : "Cupón agregado" });
  }

  function deleteCoupon(couponId: string) {
    if (!event) return;
    const updated = { ...event, coupons: event.coupons.filter((c) => c.id !== couponId) };
    persistEvent(updated);
    toast({ title: "Cupón eliminado" });
  }

  const totalSold = event.zones.reduce((s, z) => s + z.sold, 0);
  const totalCap = event.zones.reduce((s, z) => s + z.capacity, 0);
  const totalRevenue = event.zones.reduce((s, z) => s + z.price * z.sold, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" onClick={() => navigate("/events")} data-testid="button-back-events">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a eventos
        </Button>
        <div className="flex items-center gap-2">
          {!editing && (
            <Button variant="outline" onClick={startEditing} data-testid="button-edit-event">
              <Edit2 className="w-4 h-4 mr-2" />
              Editar Evento
            </Button>
          )}
          <Button variant="destructive" onClick={() => setDeleteDialog(true)} data-testid="button-delete-event">
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="relative rounded-md overflow-hidden">
        <div className="aspect-[21/9] md:aspect-[3/1]">
          <img
            src={editing ? draft.image : event.image}
            alt={event.name}
            className="w-full h-full object-cover"
            data-testid="img-event-banner"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {!editing ? (
            <>
              <Badge variant="secondary" className="mb-2">{event.category}</Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-event-name">{event.name}</h1>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm text-white/80">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.date).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-white/80">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-white/80">
                  <Users className="w-4 h-4" />
                  {totalSold}/{totalCap} boletos
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-end gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="bg-black/40 border-white/30 text-white backdrop-blur-sm"
                data-testid="button-upload-image"
              >
                <Upload className="w-4 h-4 mr-2" />
                Cambiar Imagen
              </Button>
            </div>
          )}
        </div>
      </div>

      {!editing && event.description && (
        <p className="text-muted-foreground leading-relaxed" data-testid="text-event-description">{event.description}</p>
      )}

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="w-full justify-start flex-wrap gap-1">
          <TabsTrigger value="basic" data-testid="tab-basic">
            <FileText className="w-4 h-4 mr-1.5" />
            Básico
          </TabsTrigger>
          <TabsTrigger value="activities" data-testid="tab-activities">
            <Clock className="w-4 h-4 mr-1.5" />
            Actividades
          </TabsTrigger>
          <TabsTrigger value="venue" data-testid="tab-venue">
            <Building className="w-4 h-4 mr-1.5" />
            Recinto
          </TabsTrigger>
          <TabsTrigger value="prices" data-testid="tab-prices">
            <DollarSign className="w-4 h-4 mr-1.5" />
            Precios
          </TabsTrigger>
          <TabsTrigger value="extras" data-testid="tab-extras">
            <Settings className="w-4 h-4 mr-1.5" />
            Adicionales
          </TabsTrigger>
          <TabsTrigger value="coupons" data-testid="tab-coupons">
            <Tag className="w-4 h-4 mr-1.5" />
            Cupones
          </TabsTrigger>
        </TabsList>

        {/* ────────────── BÁSICO ────────────── */}
        <TabsContent value="basic" className="mt-4 space-y-4">
          {editing ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información del Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre del evento</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Nombre del evento"
                    data-testid="input-event-name"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={draft.date}
                      onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                      data-testid="input-event-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Categoría</Label>
                    <Select value={draft.category} onValueChange={(val) => setDraft({ ...draft, category: val })}>
                      <SelectTrigger data-testid="select-event-category">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Recinto / Ubicación</Label>
                  <Input
                    value={draft.location}
                    onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    placeholder="Ej: Arena Ciudad de México"
                    data-testid="input-event-location"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="Describe el evento..."
                    className="resize-none"
                    rows={4}
                    data-testid="input-event-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Imagen del evento</Label>
                  {draft.image && (
                    <div className="relative rounded-md overflow-hidden border border-border">
                      <img src={draft.image} alt="Preview" className="w-full h-40 object-cover" data-testid="img-event-preview" />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 bg-black/50 text-white"
                        onClick={() => setDraft({ ...draft, image: "" })}
                        data-testid="button-remove-image"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-image-basic"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {draft.image ? "Cambiar imagen" : "Subir imagen"}
                  </Button>
                </div>

                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <Button onClick={saveBasicInfo} data-testid="button-save-event">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                  <Button variant="outline" onClick={cancelEditing} data-testid="button-cancel-edit">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h2 className="text-lg font-semibold">Información General</h2>
                  <Button size="sm" variant="outline" onClick={startEditing} data-testid="button-edit-basic">
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Nombre</p>
                    <p className="font-medium">{event.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Categoría</p>
                    <Badge variant="secondary">{event.category}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Fecha</p>
                    <p className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {new Date(event.date).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Recinto</p>
                    <p className="flex items-center gap-1.5 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {event.location}
                    </p>
                  </div>
                </div>
                {event.description && (
                  <div className="space-y-1 pt-2 border-t border-border">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Descripción</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ────────────── ACTIVIDADES ────────────── */}
        <TabsContent value="activities" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Actividades ({event.activities.length})</h2>
            <Button size="sm" onClick={() => openActivityDialog()} data-testid="button-add-activity">
              <Plus className="w-4 h-4 mr-1" />
              Agregar Actividad
            </Button>
          </div>
          <div className="space-y-3">
            {event.activities.map((act) => (
              <Card key={act.id} data-testid={`card-activity-${act.id}`}>
                <CardContent className="flex items-center justify-between gap-4 p-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-accent shrink-0">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{act.name}</p>
                      <p className="text-sm text-muted-foreground">{act.time} - {act.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openActivityDialog(act)} data-testid={`button-edit-activity-${act.id}`}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteActivity(act.id)} data-testid={`button-delete-activity-${act.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {event.activities.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No hay actividades registradas</p>
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => openActivityDialog()}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar primera actividad
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ────────────── RECINTO ────────────── */}
        <TabsContent value="venue" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-lg font-semibold">Zonas del Recinto ({event.zones.length})</h2>
                <Button size="sm" onClick={() => openZoneDialog()} data-testid="button-add-zone">
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Zona
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Define las zonas o secciones del recinto con su capacidad.</p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.zones.map((zone) => {
              const pct = zone.capacity > 0 ? Math.round((zone.sold / zone.capacity) * 100) : 0;
              return (
                <Card key={zone.id} data-testid={`card-zone-${zone.id}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{zone.name}</h3>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openZoneDialog(zone)} data-testid={`button-edit-zone-${zone.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteZone(zone.id)} data-testid={`button-delete-zone-${zone.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Capacidad: {zone.capacity.toLocaleString()}</p>
                      <p>Vendidos: {zone.sold} ({pct}%)</p>
                    </div>
                    <div className="h-1.5 rounded-md bg-muted overflow-hidden">
                      <div className="h-full rounded-md bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {event.zones.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Building className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No hay zonas registradas</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => openZoneDialog()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar primera zona
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ────────────── PRECIOS ────────────── */}
        <TabsContent value="prices" className="mt-4 space-y-4">
          <h2 className="text-lg font-semibold">Precios por Zona</h2>
          {event.zones.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-accent/30">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Zona</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Precio Unitario</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Capacidad</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Vendidos</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Ingreso</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.zones.map((zone) => (
                        <tr key={zone.id} className="border-b border-border last:border-0" data-testid={`row-price-${zone.id}`}>
                          <td className="py-3 px-4 font-medium">{zone.name}</td>
                          <td className="py-3 px-4 text-right">${zone.price.toLocaleString("es-MX")}</td>
                          <td className="py-3 px-4 text-right">{zone.capacity.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right">{zone.sold}</td>
                          <td className="py-3 px-4 text-right font-medium">${(zone.price * zone.sold).toLocaleString("es-MX")}</td>
                          <td className="py-3 px-4 text-right">
                            <Button size="icon" variant="ghost" onClick={() => openZoneDialog(zone)} data-testid={`button-edit-price-${zone.id}`}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-accent/20">
                        <td className="py-3 px-4 font-bold" colSpan={2}>Total</td>
                        <td className="py-3 px-4 text-right font-bold">{totalCap.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-bold">{totalSold}</td>
                        <td className="py-3 px-4 text-right font-bold">${totalRevenue.toLocaleString("es-MX")}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Agrega zonas en la pestaña Recinto para definir precios</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ────────────── ADICIONALES ────────────── */}
        <TabsContent value="extras" className="mt-4 space-y-4">
          <h2 className="text-lg font-semibold">Información Adicional</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Total Boletos</p>
                <p className="text-2xl font-bold">{totalCap.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Vendidos</p>
                <p className="text-2xl font-bold">{totalSold.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Disponibles</p>
                <p className="text-2xl font-bold">{(totalCap - totalSold).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Ingreso Estimado</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString("es-MX")}</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold">Resumen de Zonas</h3>
              {event.zones.length > 0 ? (
                <div className="space-y-3">
                  {event.zones.map((zone) => {
                    const pct = zone.capacity > 0 ? Math.round((zone.sold / zone.capacity) * 100) : 0;
                    return (
                      <div key={zone.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-sm flex-wrap">
                          <span className="font-medium">{zone.name}</span>
                          <span className="text-muted-foreground">{zone.sold}/{zone.capacity} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-md bg-muted overflow-hidden">
                          <div className="h-full rounded-md bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay zonas configuradas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ────────────── CUPONES ────────────── */}
        <TabsContent value="coupons" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Cupones ({event.coupons.length})</h2>
            <Button size="sm" onClick={() => openCouponDialog()} data-testid="button-add-coupon">
              <Plus className="w-4 h-4 mr-1" />
              Agregar Cupón
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.coupons.map((coupon) => (
              <Card key={coupon.id} data-testid={`card-coupon-${coupon.id}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-primary">{coupon.code}</code>
                      <Badge variant={coupon.active ? "default" : "secondary"}>
                        {coupon.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openCouponDialog(coupon)} data-testid={`button-edit-coupon-${coupon.id}`}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteCoupon(coupon.id)} data-testid={`button-delete-coupon-${coupon.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{coupon.discount}% OFF</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {event.coupons.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No hay cupones registrados</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => openCouponDialog()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar primer cupón
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ────────────── DIALOGS ────────────── */}
      <Dialog open={zoneDialog} onOpenChange={setZoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZone ? "Editar Zona" : "Nueva Zona"}</DialogTitle>
            <DialogDescription>Define el nombre, capacidad y precio de la zona</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de la zona</Label>
              <Input value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="Ej: VIP" data-testid="input-zone-name" />
            </div>
            <div className="space-y-2">
              <Label>Capacidad</Label>
              <Input type="number" value={zoneForm.capacity} onChange={(e) => setZoneForm({ ...zoneForm, capacity: e.target.value })} placeholder="Ej: 200" data-testid="input-zone-capacity" />
            </div>
            <div className="space-y-2">
              <Label>Precio ($)</Label>
              <Input type="number" value={zoneForm.price} onChange={(e) => setZoneForm({ ...zoneForm, price: e.target.value })} placeholder="Ej: 1500" data-testid="input-zone-price" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialog(false)}>Cancelar</Button>
            <Button onClick={saveZone} data-testid="button-save-zone">
              <Save className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activityDialog} onOpenChange={setActivityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Editar Actividad" : "Nueva Actividad"}</DialogTitle>
            <DialogDescription>Define el nombre, horario y descripción de la actividad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={activityForm.name} onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })} placeholder="Ej: Meet & Greet" data-testid="input-activity-name" />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input value={activityForm.time} onChange={(e) => setActivityForm({ ...activityForm, time: e.target.value })} placeholder="Ej: 14:00" data-testid="input-activity-time" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} placeholder="Descripción de la actividad" data-testid="input-activity-description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDialog(false)}>Cancelar</Button>
            <Button onClick={saveActivity} data-testid="button-save-activity">
              <Save className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Editar Cupón" : "Nuevo Cupón"}</DialogTitle>
            <DialogDescription>Define el código de descuento y su porcentaje</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código</Label>
              <Input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="Ej: ROCK20" data-testid="input-coupon-code" />
            </div>
            <div className="space-y-2">
              <Label>Descuento (%)</Label>
              <Input type="number" value={couponForm.discount} onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })} placeholder="Ej: 20" data-testid="input-coupon-discount" />
            </div>
            <div className="flex items-center gap-3">
              <Label>Activo</Label>
              <Switch checked={couponForm.active} onCheckedChange={(val) => setCouponForm({ ...couponForm, active: val })} data-testid="switch-coupon-active" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponDialog(false)}>Cancelar</Button>
            <Button onClick={saveCoupon} data-testid="button-save-coupon">
              <Save className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Evento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar <span className="font-semibold text-foreground">"{event.name}"</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteEvent} data-testid="button-confirm-delete">
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
        data-testid="input-file-image"
      />
    </div>
  );
}
