import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { getEvents, saveEvents, generateId } from "@/lib/store";
import type { Event, Zone, Activity, Coupon, Product, EventStatus } from "@shared/schema";
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
  Upload, X, FileText, DollarSign, ShoppingBag, Building, Package,
  Send, Eye,
} from "lucide-react";

const CATEGORIES = ["Música", "Tecnología", "Deportes", "Gastronomía", "Cultura", "Teatro", "Arte", "Otro"];

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", startDate: "", endDate: "", location: "", category: "", description: "", image: "" });

  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [zoneDialog, setZoneDialog] = useState(false);
  const [activityDialog, setActivityDialog] = useState(false);
  const [couponDialog, setCouponDialog] = useState(false);
  const [productDialog, setProductDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const [zoneForm, setZoneForm] = useState({ name: "", capacity: "", price: "" });
  const [activityForm, setActivityForm] = useState({ name: "", startTime: "", endTime: "", description: "" });
  const [couponForm, setCouponForm] = useState({ code: "", discount: "", active: true });
  const [productForm, setProductForm] = useState({ name: "", price: "", available: true });
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; name: string } | null>(null);

  useEffect(() => {
    const events = getEvents();
    const found = events.find((e) => e.id === params.id);
    if (found) {
      setEvent(found);
      setDraft({
        name: found.name,
        startDate: found.startDate,
        endDate: found.endDate,
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
      startDate: event!.startDate,
      endDate: event!.endDate,
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
      startDate: event!.startDate,
      endDate: event!.endDate,
      location: event!.location,
      category: event!.category,
      description: event!.description,
      image: event!.image,
    });
    setEditing(false);
  }

  function saveBasicInfo() {
    if (!event) return;
    if (!draft.name.trim() || !draft.startDate || !draft.endDate || !draft.location.trim() || !draft.category) {
      toast({ title: "Completa todos los campos obligatorios", variant: "destructive" });
      return;
    }
    const updated: Event = {
      ...event,
      name: draft.name.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate,
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

  function saveEventDraft() {
    if (!event) return;
    const updated: Event = { ...event, status: "borrador" };
    persistEvent(updated);
    toast({ title: "Evento guardado como borrador" });
  }

  function sendToReview() {
    if (!event) return;
    const updated: Event = { ...event, status: "en_revision" };
    persistEvent(updated);
    toast({ title: "Evento enviado a revisión" });
  }

  const STATUS_LABELS: Record<EventStatus, string> = {
    borrador: "Borrador",
    en_revision: "En revisión",
    publicado: "Publicado",
  };

  const STATUS_VARIANT: Record<EventStatus, "secondary" | "default" | "outline"> = {
    borrador: "secondary",
    en_revision: "outline",
    publicado: "default",
  };

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

  function requestDelete(type: string, id: string, name: string) {
    setConfirmDelete({ type, id, name });
  }

  function executeDelete() {
    if (!confirmDelete || !event) return;
    const { type, id } = confirmDelete;
    if (type === "zone") deleteZone(id);
    else if (type === "activity") deleteActivity(id);
    else if (type === "coupon") deleteCoupon(id);
    else if (type === "product") deleteProduct(id);
    setConfirmDelete(null);
  }

  function openActivityDialog(activity?: Activity) {
    if (activity) {
      setEditingActivity(activity);
      setActivityForm({ name: activity.name, startTime: activity.startTime, endTime: activity.endTime, description: activity.description });
    } else {
      setEditingActivity(null);
      setActivityForm({ name: "", startTime: "", endTime: "", description: "" });
    }
    setActivityDialog(true);
  }

  function saveActivity() {
    if (!event || !activityForm.name || !activityForm.startTime || !activityForm.endTime) return;
    const updated = { ...event };
    if (editingActivity) {
      updated.activities = updated.activities.map((a) =>
        a.id === editingActivity.id
          ? { ...a, name: activityForm.name, startTime: activityForm.startTime, endTime: activityForm.endTime, description: activityForm.description }
          : a
      );
    } else {
      updated.activities = [...updated.activities, {
        id: generateId(),
        name: activityForm.name,
        startTime: activityForm.startTime,
        endTime: activityForm.endTime,
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

  function openProductDialog(product?: Product) {
    if (product) {
      setEditingProduct(product);
      setProductForm({ name: product.name, price: String(product.price), available: product.available });
    } else {
      setEditingProduct(null);
      setProductForm({ name: "", price: "", available: true });
    }
    setProductDialog(true);
  }

  function saveProduct() {
    if (!event || !productForm.name || !productForm.price) return;
    const updated = { ...event };
    if (editingProduct) {
      updated.products = updated.products.map((p) =>
        p.id === editingProduct.id
          ? { ...p, name: productForm.name, price: Number(productForm.price), available: productForm.available }
          : p
      );
    } else {
      updated.products = [...(updated.products || []), {
        id: generateId(),
        name: productForm.name,
        price: Number(productForm.price),
        available: productForm.available,
      }];
    }
    persistEvent(updated);
    setProductDialog(false);
    toast({ title: editingProduct ? "Producto actualizado" : "Producto agregado" });
  }

  function deleteProduct(productId: string) {
    if (!event) return;
    const updated = { ...event, products: event.products.filter((p) => p.id !== productId) };
    persistEvent(updated);
    toast({ title: "Producto eliminado" });
  }

  const totalSold = event.zones.reduce((s, z) => s + z.sold, 0);
  const totalCap = event.zones.reduce((s, z) => s + z.capacity, 0);
  const totalRevenue = event.zones.reduce((s, z) => s + z.price * z.sold, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" onClick={() => navigate("/events")} className="rounded-xl" data-testid="button-back-events">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a eventos
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={STATUS_VARIANT[event.status]} data-testid="badge-event-status">
            {STATUS_LABELS[event.status]}
          </Badge>
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={startEditing}
              disabled={activeTab !== "basic"}
              className="rounded-xl"
              data-testid="button-edit-event"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Editar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={saveEventDraft} className="rounded-xl" data-testid="button-save-draft">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Guardar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreviewDialog(true)} className="rounded-xl" data-testid="button-preview-event">
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Vista previa
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={sendToReview}
            disabled={event.status === "en_revision" || event.status === "publicado"}
            className="rounded-xl"
            data-testid="button-send-review"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Revisión
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialog(true)} className="rounded-xl" data-testid="button-delete-event">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        <div className="aspect-[21/9] md:aspect-[3/1]">
          <img
            src={editing ? draft.image : event.image}
            alt={event.name}
            className="w-full h-full object-cover"
            data-testid="img-event-banner"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          {!editing ? (
            <>
              <Badge variant="secondary" className="mb-3 bg-white/15 text-white border-0 backdrop-blur-sm text-[11px]">{event.category}</Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight" data-testid="text-event-name">{event.name}</h1>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-sm text-white/80">
                  <Calendar className="w-4 h-4" />
                  {new Date(event.startDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })} - {new Date(event.endDate).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
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
                className="bg-black/40 border-white/30 text-white backdrop-blur-sm rounded-xl"
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

      <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start flex-wrap gap-1 rounded-xl bg-accent/50 p-1">
          <TabsTrigger value="basic" className="rounded-lg" data-testid="tab-basic">
            <FileText className="w-4 h-4 mr-1.5" />
            Evento
          </TabsTrigger>
          <TabsTrigger value="activities" className="rounded-lg" data-testid="tab-activities">
            <Clock className="w-4 h-4 mr-1.5" />
            Actividades
          </TabsTrigger>
          <TabsTrigger value="venue" className="rounded-lg" data-testid="tab-venue">
            <Building className="w-4 h-4 mr-1.5" />
            Recinto
          </TabsTrigger>
          <TabsTrigger value="prices" className="rounded-lg" data-testid="tab-prices">
            <DollarSign className="w-4 h-4 mr-1.5" />
            Precios
          </TabsTrigger>
          <TabsTrigger value="extras" className="rounded-lg" data-testid="tab-extras">
            <ShoppingBag className="w-4 h-4 mr-1.5" />
            Adicionales
          </TabsTrigger>
          <TabsTrigger value="coupons" className="rounded-lg" data-testid="tab-coupons">
            <Tag className="w-4 h-4 mr-1.5" />
            Cupones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-5 space-y-4">
          {editing ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Información del Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nombre del evento</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Nombre del evento"
                    className="h-11 rounded-xl"
                    data-testid="input-event-name"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha de inicio</Label>
                    <Input type="date" value={draft.startDate} onChange={(e) => setDraft({ ...draft, startDate: e.target.value })} className="h-11 rounded-xl" data-testid="input-event-start-date" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha de fin</Label>
                    <Input type="date" value={draft.endDate} onChange={(e) => setDraft({ ...draft, endDate: e.target.value })} className="h-11 rounded-xl" data-testid="input-event-end-date" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Categoría</Label>
                    <Select value={draft.category} onValueChange={(val) => setDraft({ ...draft, category: val })}>
                      <SelectTrigger className="h-11 rounded-xl" data-testid="select-event-category">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recinto / Ubicación</Label>
                    <Input
                      value={draft.location}
                      onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                      placeholder="Ej: Arena Ciudad de México"
                      className="h-11 rounded-xl"
                      data-testid="input-event-location"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Descripción</Label>
                  <Textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    placeholder="Describe el evento..."
                    className="resize-none rounded-xl"
                    rows={4}
                    data-testid="input-event-description"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Imagen del evento</Label>
                  {draft.image && (
                    <div className="relative rounded-xl overflow-hidden border border-border">
                      <img src={draft.image} alt="Preview" className="w-full h-40 object-cover" data-testid="img-event-preview" />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-lg"
                        onClick={() => setDraft({ ...draft, image: "" })}
                        data-testid="button-remove-image"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-upload-image-basic"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {draft.image ? "Cambiar imagen" : "Subir imagen"}
                  </Button>
                </div>

                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <Button onClick={saveBasicInfo} className="rounded-xl" data-testid="button-save-event">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                  <Button variant="outline" onClick={cancelEditing} className="rounded-xl" data-testid="button-cancel-edit">
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-5">
                <h2 className="text-base font-semibold">Información General</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Nombre</p>
                    <p className="font-medium">{event.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Categoría</p>
                    <Badge variant="secondary">{event.category}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Fecha de inicio</p>
                    <p className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {new Date(event.startDate).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Fecha de fin</p>
                    <p className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {new Date(event.endDate).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Recinto</p>
                    <p className="flex items-center gap-1.5 text-sm">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {event.location}
                    </p>
                  </div>
                </div>
                {event.description && (
                  <div className="space-y-1 pt-3 border-t border-border/50">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Descripción</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activities" className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-semibold">Actividades</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{event.activities.length} actividades registradas</p>
            </div>
            <Button size="sm" onClick={() => openActivityDialog()} className="rounded-xl" data-testid="button-add-activity">
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </div>
          <div className="space-y-3">
            {event.activities.map((act) => (
              <Card key={act.id} className="hover-elevate" data-testid={`card-activity-${act.id}`}>
                <CardContent className="flex items-center justify-between gap-4 p-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/8 shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{act.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="secondary" className="text-[11px] font-normal">{act.startTime} - {act.endTime}</Badge>
                        <span className="text-xs text-muted-foreground truncate">{act.description}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openActivityDialog(act)} data-testid={`button-edit-activity-${act.id}`}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => requestDelete("activity", act.id, act.name)} data-testid={`button-delete-activity-${act.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {event.activities.length === 0 && (
              <Card>
                <CardContent className="py-14 text-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mx-auto mb-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">No hay actividades</p>
                  <p className="text-sm text-muted-foreground mt-1">Agrega la primera actividad del evento</p>
                  <Button size="sm" variant="outline" className="mt-4 rounded-xl" onClick={() => openActivityDialog()}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar actividad
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="venue" className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-semibold">Zonas del Recinto</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{event.zones.length} zonas configuradas</p>
            </div>
            <Button size="sm" onClick={() => openZoneDialog()} className="rounded-xl" data-testid="button-add-zone">
              <Plus className="w-4 h-4 mr-1" />
              Agregar Zona
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.zones.map((zone) => {
              const pct = zone.capacity > 0 ? Math.round((zone.sold / zone.capacity) * 100) : 0;
              return (
                <Card key={zone.id} className="hover-elevate" data-testid={`card-zone-${zone.id}`}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/8 shrink-0">
                          <Building className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-semibold truncate">{zone.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openZoneDialog(zone)} data-testid={`button-edit-zone-${zone.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => requestDelete("zone", zone.id, zone.name)} data-testid={`button-delete-zone-${zone.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Capacidad</p>
                        <p className="text-sm font-semibold tabular-nums">{zone.capacity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Vendidos</p>
                        <p className="text-sm font-semibold tabular-nums">{zone.sold} ({pct}%)</p>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${pct >= 80 ? "from-chart-5 to-chart-5" : "from-primary to-chart-3"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {event.zones.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mx-auto mb-3">
                  <Building className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">No hay zonas registradas</p>
                <p className="text-sm text-muted-foreground mt-1">Define las secciones del recinto</p>
                <Button size="sm" variant="outline" className="mt-4 rounded-xl" onClick={() => openZoneDialog()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar primera zona
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="prices" className="mt-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Precios por Zona</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Resumen de precios y ventas por zona</p>
          </div>
          {event.zones.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-accent/30">
                        <th className="text-left py-3.5 px-5 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Zona</th>
                        <th className="text-right py-3.5 px-5 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Precio</th>
                        <th className="text-right py-3.5 px-5 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Capacidad</th>
                        <th className="text-right py-3.5 px-5 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Vendidos</th>
                        <th className="text-right py-3.5 px-5 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Ingreso</th>
                        <th className="text-right py-3.5 px-5 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.zones.map((zone) => (
                        <tr key={zone.id} className="border-b border-border/50 last:border-0" data-testid={`row-price-${zone.id}`}>
                          <td className="py-3.5 px-5 font-medium">{zone.name}</td>
                          <td className="py-3.5 px-5 text-right tabular-nums">${zone.price.toLocaleString("es-MX")}</td>
                          <td className="py-3.5 px-5 text-right tabular-nums">{zone.capacity.toLocaleString()}</td>
                          <td className="py-3.5 px-5 text-right tabular-nums">{zone.sold}</td>
                          <td className="py-3.5 px-5 text-right font-medium tabular-nums">${(zone.price * zone.sold).toLocaleString("es-MX")}</td>
                          <td className="py-3.5 px-5 text-right">
                            <Button size="icon" variant="ghost" onClick={() => openZoneDialog(zone)} data-testid={`button-edit-price-${zone.id}`}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-accent/20">
                        <td className="py-3.5 px-5 font-bold" colSpan={2}>Total</td>
                        <td className="py-3.5 px-5 text-right font-bold tabular-nums">{totalCap.toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-right font-bold tabular-nums">{totalSold}</td>
                        <td className="py-3.5 px-5 text-right font-bold tabular-nums">${totalRevenue.toLocaleString("es-MX")}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-14 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mx-auto mb-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Sin precios disponibles</p>
                <p className="text-sm text-muted-foreground mt-1">Agrega zonas en la pestaña Recinto para definir precios</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="extras" className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-semibold">Productos y Artículos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{(event.products || []).length} productos registrados</p>
            </div>
            <Button size="sm" onClick={() => openProductDialog()} className="rounded-xl" data-testid="button-add-product">
              <Plus className="w-4 h-4 mr-1" />
              Agregar Producto
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(event.products || []).map((product) => (
              <Card key={product.id} className="hover-elevate" data-testid={`card-product-${product.id}`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-chart-3/10 shrink-0">
                        <Package className="w-4 h-4 text-chart-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{product.name}</p>
                        <p className="text-lg font-bold tabular-nums">{product.price === 0 ? "Gratuito" : `$${product.price.toLocaleString("es-MX")}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openProductDialog(product)} data-testid={`button-edit-product-${product.id}`}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => requestDelete("product", product.id, product.name)} data-testid={`button-delete-product-${product.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Badge variant={product.available ? "default" : "secondary"} className="text-[11px]">
                    {product.available ? "Disponible" : "No disponible"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          {(event.products || []).length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mx-auto mb-3">
                  <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">No hay productos</p>
                <p className="text-sm text-muted-foreground mt-1">Agrega artículos como camisetas, gorras o souvenirs</p>
                <Button size="sm" variant="outline" className="mt-4 rounded-xl" onClick={() => openProductDialog()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar primer producto
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="coupons" className="mt-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-semibold">Cupones de Descuento</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{event.coupons.length} cupones registrados</p>
            </div>
            <Button size="sm" onClick={() => openCouponDialog()} className="rounded-xl" data-testid="button-add-coupon">
              <Plus className="w-4 h-4 mr-1" />
              Agregar Cupón
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {event.coupons.map((coupon) => (
              <Card key={coupon.id} className="hover-elevate" data-testid={`card-coupon-${coupon.id}`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-chart-4/10 shrink-0">
                        <Tag className="w-4 h-4 text-chart-4" />
                      </div>
                      <div>
                        <code className="font-mono font-bold text-primary text-sm">{coupon.code}</code>
                        <Badge variant={coupon.active ? "default" : "secondary"} className="text-[11px] ml-2">
                          {coupon.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openCouponDialog(coupon)} data-testid={`button-edit-coupon-${coupon.id}`}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => requestDelete("coupon", coupon.id, coupon.code)} data-testid={`button-delete-coupon-${coupon.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{coupon.discount}% OFF</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {event.coupons.length === 0 && (
            <Card>
              <CardContent className="py-14 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mx-auto mb-3">
                  <Tag className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">No hay cupones</p>
                <p className="text-sm text-muted-foreground mt-1">Crea códigos de descuento para tus clientes</p>
                <Button size="sm" variant="outline" className="mt-4 rounded-xl" onClick={() => openCouponDialog()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar primer cupón
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={zoneDialog} onOpenChange={setZoneDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingZone ? "Editar Zona" : "Nueva Zona"}</DialogTitle>
            <DialogDescription>Define el nombre, capacidad y precio de la zona</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nombre de la zona</Label>
              <Input value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} placeholder="Ej: VIP" className="h-11 rounded-xl" data-testid="input-zone-name" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Capacidad</Label>
              <Input type="number" value={zoneForm.capacity} onChange={(e) => setZoneForm({ ...zoneForm, capacity: e.target.value })} placeholder="Ej: 200" className="h-11 rounded-xl" data-testid="input-zone-capacity" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Precio ($)</Label>
              <Input type="number" value={zoneForm.price} onChange={(e) => setZoneForm({ ...zoneForm, price: e.target.value })} placeholder="Ej: 1500" className="h-11 rounded-xl" data-testid="input-zone-price" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneDialog(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={saveZone} className="rounded-xl" data-testid="button-save-zone">
              <Save className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activityDialog} onOpenChange={setActivityDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Editar Actividad" : "Nueva Actividad"}</DialogTitle>
            <DialogDescription>Define el nombre, horario y descripción de la actividad</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nombre</Label>
              <Input value={activityForm.name} onChange={(e) => setActivityForm({ ...activityForm, name: e.target.value })} placeholder="Ej: Meet & Greet" className="h-11 rounded-xl" data-testid="input-activity-name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hora de inicio</Label>
                <Input type="time" value={activityForm.startTime} onChange={(e) => setActivityForm({ ...activityForm, startTime: e.target.value })} className="h-11 rounded-xl" data-testid="input-activity-start-time" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hora de fin</Label>
                <Input type="time" value={activityForm.endTime} onChange={(e) => setActivityForm({ ...activityForm, endTime: e.target.value })} className="h-11 rounded-xl" data-testid="input-activity-end-time" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Descripción</Label>
              <Input value={activityForm.description} onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })} placeholder="Descripción de la actividad" className="h-11 rounded-xl" data-testid="input-activity-description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivityDialog(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={saveActivity} className="rounded-xl" data-testid="button-save-activity">
              <Save className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={couponDialog} onOpenChange={setCouponDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingCoupon ? "Editar Cupón" : "Nuevo Cupón"}</DialogTitle>
            <DialogDescription>Define el código de descuento y su porcentaje</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Código</Label>
              <Input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="Ej: ROCK20" className="h-11 rounded-xl" data-testid="input-coupon-code" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Descuento (%)</Label>
              <Input type="number" value={couponForm.discount} onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })} placeholder="Ej: 20" className="h-11 rounded-xl" data-testid="input-coupon-discount" />
            </div>
            <div className="flex items-center gap-3">
              <Label>Activo</Label>
              <Switch checked={couponForm.active} onCheckedChange={(val) => setCouponForm({ ...couponForm, active: val })} data-testid="switch-coupon-active" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponDialog(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={saveCoupon} className="rounded-xl" data-testid="button-save-coupon">
              <Save className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            <DialogDescription>Define el nombre, precio y disponibilidad del producto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nombre del producto</Label>
              <Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Ej: Camiseta oficial" className="h-11 rounded-xl" data-testid="input-product-name" />
            </div>
            <div className="flex items-center gap-3">
              <Label>Gratuito</Label>
              <Switch
                checked={productForm.price === "0"}
                onCheckedChange={(val) => setProductForm({ ...productForm, price: val ? "0" : "" })}
                data-testid="switch-product-free"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Precio ($)</Label>
              <Input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="Ej: 450" disabled={productForm.price === "0"} className="h-11 rounded-xl" data-testid="input-product-price" />
            </div>
            <div className="flex items-center gap-3">
              <Label>Disponible</Label>
              <Switch checked={productForm.available} onCheckedChange={(val) => setProductForm({ ...productForm, available: val })} data-testid="switch-product-available" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialog(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={saveProduct} className="rounded-xl" data-testid="button-save-product">
              <Save className="w-4 h-4 mr-1" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Eliminar Evento</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar <span className="font-semibold text-foreground">"{event.name}"</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} className="rounded-xl">Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteEvent} className="rounded-xl" data-testid="button-confirm-delete">
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar <span className="font-semibold text-foreground">"{confirmDelete?.name}"</span>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} className="rounded-xl" data-testid="button-cancel-confirm-delete">Cancelar</Button>
            <Button variant="destructive" onClick={executeDelete} className="rounded-xl" data-testid="button-accept-confirm-delete">
              <Trash2 className="w-4 h-4 mr-1" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Vista previa del evento</DialogTitle>
            <DialogDescription>Así verán los clientes tu evento</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="relative rounded-xl overflow-hidden">
              <div className="aspect-[16/9]">
                <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <Badge variant="secondary" className="mb-2 bg-white/15 text-white border-0 backdrop-blur-sm">{event.category}</Badge>
                <h2 className="text-2xl font-bold text-white">{event.name}</h2>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="flex items-center gap-1.5 text-sm text-white/80">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.startDate).toLocaleDateString("es-MX", { day: "numeric", month: "long" })} - {new Date(event.endDate).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-white/80">
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </span>
                </div>
              </div>
            </div>

            {event.description && (
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            )}

            {event.activities.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold">Actividades</h3>
                <div className="space-y-2">
                  {event.activities.map((act) => (
                    <div key={act.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{act.name}</p>
                        <p className="text-xs text-muted-foreground">{act.startTime} - {act.endTime} | {act.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.zones.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold">Zonas y Precios</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {event.zones.map((zone) => {
                    const remaining = zone.capacity - zone.sold;
                    return (
                      <Card key={zone.id}>
                        <CardContent className="p-4 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold">{zone.name}</p>
                            <p className="text-lg font-bold tabular-nums">${zone.price.toLocaleString("es-MX")}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {remaining > 0 ? `${remaining.toLocaleString()} lugares disponibles` : "Agotado"}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {(event.products || []).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold">Productos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(event.products || []).filter(p => p.available).map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30">
                      <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{product.name}</p>
                      </div>
                      <p className="font-bold text-sm tabular-nums">{product.price === 0 ? "Gratuito" : `$${product.price.toLocaleString("es-MX")}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialog(false)} className="rounded-xl">Cerrar</Button>
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
