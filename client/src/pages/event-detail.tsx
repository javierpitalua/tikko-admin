import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { getEvents, saveEvents, generateId } from "@/lib/store";
import type { Event, Zone, Activity, Coupon } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, MapPin, Calendar, Edit2, Plus, Trash2,
  Ticket, Clock, Tag, Save, Users,
} from "lucide-react";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [zoneDialog, setZoneDialog] = useState(false);
  const [activityDialog, setActivityDialog] = useState(false);
  const [couponDialog, setCouponDialog] = useState(false);

  const [zoneForm, setZoneForm] = useState({ name: "", capacity: "", price: "" });
  const [activityForm, setActivityForm] = useState({ name: "", time: "", description: "" });
  const [couponForm, setCouponForm] = useState({ code: "", discount: "", active: true });

  useEffect(() => {
    const events = getEvents();
    const found = events.find((e) => e.id === params.id);
    if (found) setEvent(found);
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

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/events")} data-testid="button-back-events">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a eventos
      </Button>

      <div className="relative rounded-md overflow-hidden">
        <div className="aspect-[21/9] md:aspect-[3/1]">
          <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
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
        </div>
      </div>

      <p className="text-muted-foreground" data-testid="text-event-description">{event.description}</p>

      <Tabs defaultValue="zones" className="w-full">
        <TabsList className="w-full justify-start flex-wrap gap-1">
          <TabsTrigger value="zones" data-testid="tab-zones">
            <Ticket className="w-4 h-4 mr-1.5" />
            Zonas
          </TabsTrigger>
          <TabsTrigger value="activities" data-testid="tab-activities">
            <Clock className="w-4 h-4 mr-1.5" />
            Actividades
          </TabsTrigger>
          <TabsTrigger value="coupons" data-testid="tab-coupons">
            <Tag className="w-4 h-4 mr-1.5" />
            Cupones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zones" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-lg font-semibold">Zonas ({event.zones.length})</h2>
            <Button size="sm" onClick={() => openZoneDialog()} data-testid="button-add-zone">
              <Plus className="w-4 h-4 mr-1" />
              Agregar Zona
            </Button>
          </div>
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
                      <p>Capacidad: {zone.capacity}</p>
                      <p>Precio: ${zone.price.toLocaleString("es-MX")}</p>
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
        </TabsContent>

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
              <div className="text-center py-8 text-muted-foreground">No hay actividades registradas</div>
            )}
          </div>
        </TabsContent>

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
            {event.coupons.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">No hay cupones registrados</div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={zoneDialog} onOpenChange={setZoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingZone ? "Editar Zona" : "Nueva Zona"}</DialogTitle>
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
    </div>
  );
}
