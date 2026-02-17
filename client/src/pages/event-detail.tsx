import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { getEvents, saveEvents, generateId } from "@/lib/store";
import { EventosService } from "../../api/services/EventosService";
import { ActividadesEventoService } from "../../api/services/ActividadesEventoService";
import { ZonasEventoService } from "../../api/services/ZonasEventoService";
import { ProductosAdicionalEventoService } from "../../api/services/ProductosAdicionalEventoService";
import { CuponesZonaEventoService } from "../../api/services/CuponesZonaEventoService";
import { EstadosDeEventoService } from "../../api/services/EstadosDeEventoService";
import { TiposDeCategoriaEventoService } from "../../api/services/TiposDeCategoriaEventoService";
import { UbicacionesService } from "../../api/services/UbicacionesService";
import type { EstadosDeEventoListItem } from "../../api/models/EstadosDeEventoListItem";
import type { EventosListItem } from "../../api/models/EventosListItem";
import type { ActividadesEventoListItem } from "../../api/models/ActividadesEventoListItem";
import type { ZonasEventoListItem } from "../../api/models/ZonasEventoListItem";
import type { ProductosAdicionalEventoListItem } from "../../api/models/ProductosAdicionalEventoListItem";
import type { CuponesZonaEventoListItem } from "../../api/models/CuponesZonaEventoListItem";
import type { EditEventoRequest } from "../../api/models/EditEventoRequest";
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
  Send, Eye, Loader2, CheckCircle,
} from "lucide-react";

const CATEGORIES = ["Música", "Tecnología", "Deportes", "Gastronomía", "Cultura", "Teatro", "Arte", "Otro"];

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<Event | null>(null);
  const [apiItem, setApiItem] = useState<EventosListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: "", startDate: "", endDate: "", ubicacionId: "", tipoDeCategoriaEventoId: "", description: "", image: "" });
  const [categories, setCategories] = useState<Array<{ id?: number; nombre?: string | null }>>([]);
  const [locations, setLocations] = useState<Array<{ id?: number; nombre?: string | null }>>([]);
  const [eventStatuses, setEventStatuses] = useState<EstadosDeEventoListItem[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);

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
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{ event: any; activities: Activity[]; zones: Zone[]; products: Product[] } | null>(null);
  const [activeTab, setActiveTab] = useState("basic");

  const [zoneForm, setZoneForm] = useState({ name: "", capacity: "", price: "" });
  const [activityForm, setActivityForm] = useState({ name: "", startDate: "", endDate: "", startTime: "", endTime: "", description: "" });
  const [couponForm, setCouponForm] = useState({ code: "", discount: "", active: true, zonaEventoId: "" });
  const [productForm, setProductForm] = useState({ name: "", price: "", available: true });
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: string; name: string } | null>(null);
  const [priceEditDialog, setPriceEditDialog] = useState(false);
  const [priceEditZone, setPriceEditZone] = useState<Zone | null>(null);
  const [priceEditValue, setPriceEditValue] = useState("");

  function mapApiActivitiesToLocal(items: ActividadesEventoListItem[]): Activity[] {
    return items.map((item) => {
      let startDate = "";
      let startTime = "";
      let endDate = "";
      let endTime = "";

      if (item.fechaHoraInicio) {
        const d = new Date(item.fechaHoraInicio);
        startDate = d.toISOString().split("T")[0];
        startTime = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
      }
      if (item.fechaHoraFin) {
        const d = new Date(item.fechaHoraFin);
        endDate = d.toISOString().split("T")[0];
        endTime = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
      }

      return {
        id: String(item.id),
        name: item.nombre || "",
        startDate,
        endDate,
        startTime,
        endTime,
        description: item.descripcion || "",
      };
    });
  }

  function mapApiZonesToLocal(items: ZonasEventoListItem[]): Zone[] {
    return items.map((item) => ({
      id: String(item.id),
      name: item.nombre || "",
      capacity: item.capacidad || 0,
      price: item.precio || 0,
      sold: 0,
    }));
  }

  function mapApiProductsToLocal(items: ProductosAdicionalEventoListItem[]): Product[] {
    return items.map((item) => ({
      id: String(item.id),
      name: item.nombre || "",
      price: item.esGratuito ? 0 : (item.precio || 0),
      available: item.disponible ?? true,
    }));
  }

  function mapApiCouponsToLocal(items: CuponesZonaEventoListItem[]): Coupon[] {
    return items.map((item) => ({
      id: String(item.id),
      code: item.codigo || "",
      discount: item.porcentajeDescuento || 0,
      active: true,
      zonaEventoId: item.zonaEventoId,
      zonaEvento: item.zonaEvento || "",
    }));
  }

  function refreshCoupons() {
    if (!event) return;
    const zoneIds = event.zones.map((z) => Number(z.id));
    if (zoneIds.length === 0) {
      setEvent((prev) => prev ? { ...prev, coupons: [] } : prev);
      return;
    }
    Promise.all(zoneIds.map((zid) => CuponesZonaEventoService.getApiV1CuponesZonaEventoList(zid).catch(() => ({ items: [] }))))
      .then((results) => {
        const allCoupons: Coupon[] = [];
        results.forEach((res) => {
          allCoupons.push(...mapApiCouponsToLocal((res as any).items || []));
        });
        setEvent((prev) => prev ? { ...prev, coupons: allCoupons } : prev);
      });
  }

  function mapApiEventToLocal(item: EventosListItem): Event {
    const statusRaw = (item.estadoDeEvento || "").toLowerCase();
    let status: EventStatus = "borrador";
    if (statusRaw.includes("publicado") || statusRaw.includes("activo")) status = "publicado";
    else if (statusRaw.includes("revisión") || statusRaw.includes("revision") || statusRaw.includes("pendiente")) status = "en_revision";

    return {
      id: String(item.id),
      name: item.nombre || "",
      startDate: item.fechaInicio ? item.fechaInicio.split("T")[0] : "",
      endDate: item.fechaFin ? item.fechaFin.split("T")[0] : "",
      location: item.ubicacion || "",
      description: item.descripcion || "",
      image: item.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop",
      category: item.tipoDeCategoriaEvento || "",
      status,
      zones: [],
      activities: [],
      coupons: [],
      products: [],
      adminId: item.creadoPor || "",
    };
  }

  useEffect(() => {
    const numericId = Number(params.id);
    if (isNaN(numericId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    Promise.all([
      EventosService.getApiV1EventosList(undefined, undefined, undefined, undefined, numericId),
      TiposDeCategoriaEventoService.getApiV1TiposDeCategoriaEventoList().catch(() => ({ items: [] })),
      UbicacionesService.getApiV1UbicacionesList().catch(() => ({ items: [] })),
      ActividadesEventoService.getApiV1ActividadesEventoList(numericId).catch(() => ({ items: [] })),
      ZonasEventoService.getApiV1ZonasEventoList(numericId).catch(() => ({ items: [] })),
      ProductosAdicionalEventoService.getApiV1ProductosAdicionalEventoList(numericId).catch(() => ({ items: [] })),
      EstadosDeEventoService.getApiV1EstadosDeEventoList().catch(() => ({ items: [] })),
    ])
      .then(([eventRes, catRes, locRes, actRes, zonRes, prodRes, statusRes]) => {
        setEventStatuses((statusRes as any).items || []);
        const items = eventRes.items || [];
        if (items.length > 0) {
          const raw = items[0];
          setApiItem(raw);
          const found = mapApiEventToLocal(raw);
          const activities = mapApiActivitiesToLocal((actRes as any).items || []);
          const zones = mapApiZonesToLocal((zonRes as any).items || []);
          const products = mapApiProductsToLocal((prodRes as any).items || []);
          found.activities = activities;
          found.zones = zones;
          found.products = products;
          const zoneIds = zones.map((z) => Number(z.id));
          if (zoneIds.length > 0) {
            Promise.all(zoneIds.map((zid) => CuponesZonaEventoService.getApiV1CuponesZonaEventoList(zid).catch(() => ({ items: [] }))))
              .then((couponResults) => {
                const allCoupons: Coupon[] = [];
                couponResults.forEach((res) => {
                  allCoupons.push(...mapApiCouponsToLocal((res as any).items || []));
                });
                found.coupons = allCoupons;
                setEvent({ ...found });
              })
              .catch(() => {
                setEvent(found);
              });
          } else {
            found.coupons = [];
            setEvent(found);
          }
          setDraft({
            name: found.name,
            startDate: found.startDate,
            endDate: found.endDate,
            ubicacionId: raw.ubicacionId ? String(raw.ubicacionId) : "",
            tipoDeCategoriaEventoId: raw.tipoDeCategoriaEventoId ? String(raw.tipoDeCategoriaEventoId) : "",
            description: found.description,
            image: found.image,
          });
        } else {
          setNotFound(true);
        }
        setCategories((catRes as any).items || []);
        setLocations((locRes as any).items || []);
      })
      .catch((err) => {
        console.error("Error fetching event:", err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground text-lg">Evento no encontrado</p>
        <Button variant="outline" className="rounded-xl" onClick={() => navigate("/events")} data-testid="button-back-to-events">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a eventos
        </Button>
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
      ubicacionId: apiItem?.ubicacionId ? String(apiItem.ubicacionId) : "",
      tipoDeCategoriaEventoId: apiItem?.tipoDeCategoriaEventoId ? String(apiItem.tipoDeCategoriaEventoId) : "",
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
      ubicacionId: apiItem?.ubicacionId ? String(apiItem.ubicacionId) : "",
      tipoDeCategoriaEventoId: apiItem?.tipoDeCategoriaEventoId ? String(apiItem.tipoDeCategoriaEventoId) : "",
      description: event!.description,
      image: event!.image,
    });
    setEditing(false);
  }

  function saveBasicInfo() {
    if (!event || !apiItem) return;
    if (!draft.name.trim() || !draft.startDate || !draft.endDate || !draft.ubicacionId || !draft.tipoDeCategoriaEventoId) {
      toast({ title: "Completa todos los campos obligatorios", variant: "destructive" });
      return;
    }

    setSaving(true);
    const requestBody: EditEventoRequest = {
      id: Number(event.id),
      nombre: draft.name.trim(),
      descripcion: draft.description.trim(),
      bannerUrl: draft.image || null,
      fechaInicio: new Date(draft.startDate + "T00:00:00").toISOString(),
      fechaFin: new Date(draft.endDate + "T23:59:59").toISOString(),
      ubicacionId: Number(draft.ubicacionId),
      tipoDeCategoriaEventoId: Number(draft.tipoDeCategoriaEventoId),
      estadoDeEventoId: apiItem.estadoDeEventoId,
    };

    EventosService.postApiV1EventosEdit(requestBody)
      .then((result: any) => {
        if (result && result.ok === false) {
          const errors = result.validationSummary?.errors;
          const msg = errors && errors.length > 0
            ? errors.map((e: any) => e.description || e.errorMessage || "").filter(Boolean).join(", ")
            : "Error al actualizar el evento";
          toast({ title: msg, variant: "destructive" });
          return;
        }

        const selectedLocation = locations.find((l) => l.id === Number(draft.ubicacionId));
        const selectedCategory = categories.find((c) => c.id === Number(draft.tipoDeCategoriaEventoId));

        const updated: Event = {
          ...event,
          name: draft.name.trim(),
          startDate: draft.startDate,
          endDate: draft.endDate,
          location: selectedLocation?.nombre || event.location,
          category: selectedCategory?.nombre || event.category,
          description: draft.description.trim(),
          image: draft.image,
        };
        setEvent(updated);
        setApiItem({
          ...apiItem,
          nombre: updated.name,
          descripcion: updated.description,
          bannerUrl: updated.image,
          fechaInicio: draft.startDate,
          fechaFin: draft.endDate,
          ubicacionId: Number(draft.ubicacionId),
          tipoDeCategoriaEventoId: Number(draft.tipoDeCategoriaEventoId),
          ubicacion: selectedLocation?.nombre || null,
          tipoDeCategoriaEvento: selectedCategory?.nombre || null,
        });
        setEditing(false);
        toast({ title: "Evento actualizado correctamente" });
      })
      .catch((err) => {
        console.error("Error updating event:", err);
        const errBody = err?.body;
        const errMsg = errBody?.validationSummary?.errorMessage || errBody?.validationSummary?.errors?.[0]?.description || "Intenta de nuevo más tarde";
        toast({ title: "Error al actualizar el evento", description: errMsg, variant: "destructive" });
      })
      .finally(() => setSaving(false));
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

  function findStatusId(keyword: string): number | undefined {
    const found = eventStatuses.find((s) => {
      const name = (s.nombre || "").toLowerCase();
      return name.includes(keyword.toLowerCase());
    });
    return found?.id;
  }

  function changeEventStatus(targetStatusKeyword: string, targetLocalStatus: EventStatus, successMsg: string, setLoading: (v: boolean) => void) {
    if (!event || !apiItem) return;
    const statusId = findStatusId(targetStatusKeyword);
    if (!statusId) {
      toast({ title: "No se encontró el estado en el catálogo", variant: "destructive" });
      return;
    }

    setLoading(true);

    const currentName = editing ? draft.name.trim() : event.name;
    const currentDesc = editing ? draft.description.trim() : event.description;
    const currentImage = editing ? draft.image : event.image;
    const currentStartDate = editing ? draft.startDate : event.startDate;
    const currentEndDate = editing ? draft.endDate : event.endDate;
    const currentUbicacionId = editing ? Number(draft.ubicacionId) : (apiItem.ubicacionId || 0);
    const currentCategoriaId = editing ? Number(draft.tipoDeCategoriaEventoId) : (apiItem.tipoDeCategoriaEventoId || 0);

    const requestBody: EditEventoRequest = {
      id: Number(event.id),
      nombre: currentName,
      descripcion: currentDesc,
      bannerUrl: currentImage || null,
      fechaInicio: new Date(currentStartDate + "T00:00:00").toISOString(),
      fechaFin: new Date(currentEndDate + "T23:59:59").toISOString(),
      ubicacionId: currentUbicacionId,
      tipoDeCategoriaEventoId: currentCategoriaId,
      estadoDeEventoId: statusId,
    };

    EventosService.postApiV1EventosEdit(requestBody)
      .then((result: any) => {
        setLoading(false);
        if (result && result.ok === false) {
          const errors = result.validationSummary?.errors;
          const msg = errors && errors.length > 0
            ? errors.map((e: any) => e.description || e.errorMessage || "").filter(Boolean).join(", ")
            : "Error al cambiar el estado del evento";
          toast({ title: msg, variant: "destructive" });
          return;
        }

        const selectedLocation = locations.find((l) => l.id === currentUbicacionId);
        const selectedCategory = categories.find((c) => c.id === currentCategoriaId);

        const updated: Event = {
          ...event,
          name: currentName,
          startDate: currentStartDate,
          endDate: currentEndDate,
          location: selectedLocation?.nombre || event.location,
          category: selectedCategory?.nombre || event.category,
          description: currentDesc,
          image: currentImage,
          status: targetLocalStatus,
        };
        setEvent(updated);
        setApiItem({
          ...apiItem,
          nombre: updated.name,
          descripcion: updated.description,
          bannerUrl: updated.image,
          fechaInicio: currentStartDate,
          fechaFin: currentEndDate,
          ubicacionId: currentUbicacionId,
          tipoDeCategoriaEventoId: currentCategoriaId,
          ubicacion: selectedLocation?.nombre || null,
          tipoDeCategoriaEvento: selectedCategory?.nombre || null,
          estadoDeEventoId: statusId,
        });
        if (editing) setEditing(false);
        toast({ title: successMsg });
      })
      .catch((err) => {
        setLoading(false);
        console.error("Error changing event status:", err);
        toast({ title: "Error al cambiar el estado del evento", variant: "destructive" });
      });
  }

  function saveEventDraft() {
    changeEventStatus("Borrador", "borrador", "Evento guardado como borrador", setSaving);
  }

  function sendToReview() {
    changeEventStatus("Revisión", "en_revision", "Evento enviado a revisión", setReviewLoading);
  }

  function approveEvent() {
    changeEventStatus("Publicado", "publicado", "Evento aprobado y publicado", setApproveLoading);
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
    if (!event || !zoneForm.name || !zoneForm.capacity || !zoneForm.price) {
      toast({ title: "Completa todos los campos obligatorios", variant: "destructive" });
      return;
    }

    const refreshZones = () => {
      ZonasEventoService.getApiV1ZonasEventoList(Number(event.id))
        .then((res) => {
          const zones = mapApiZonesToLocal(res.items || []);
          setEvent((prev) => prev ? { ...prev, zones } : prev);
        });
    };

    if (editingZone) {
      ZonasEventoService.postApiV1ZonasEventoEdit({
        id: Number(editingZone.id),
        eventoId: Number(event.id),
        nombre: zoneForm.name,
        capacidad: Number(zoneForm.capacity),
        precio: Number(zoneForm.price),
      })
        .then(() => {
          refreshZones();
          setZoneDialog(false);
          toast({ title: "Zona actualizada" });
        })
        .catch((err) => {
          console.error("Error updating zone:", err);
          toast({ title: "Error al actualizar la zona", variant: "destructive" });
        });
    } else {
      ZonasEventoService.postApiV1ZonasEventoCreate({
        eventoId: Number(event.id),
        nombre: zoneForm.name,
        capacidad: Number(zoneForm.capacity),
        precio: Number(zoneForm.price),
      })
        .then(() => {
          refreshZones();
          setZoneDialog(false);
          toast({ title: "Zona agregada" });
        })
        .catch((err) => {
          console.error("Error creating zone:", err);
          toast({ title: "Error al crear la zona", variant: "destructive" });
        });
    }
  }

  function deleteZone(zoneId: string) {
    if (!event) return;
    ZonasEventoService.postApiV1ZonasEventoDelete({ id: Number(zoneId) })
      .then(() => {
        ZonasEventoService.getApiV1ZonasEventoList(Number(event.id))
          .then((res) => {
            const zones = mapApiZonesToLocal(res.items || []);
            setEvent((prev) => prev ? { ...prev, zones } : prev);
          });
        toast({ title: "Zona eliminada" });
      })
      .catch((err) => {
        console.error("Error deleting zone:", err);
        toast({ title: "Error al eliminar la zona", variant: "destructive" });
      });
  }

  function openPriceEdit(zone: Zone) {
    setPriceEditZone(zone);
    setPriceEditValue(String(zone.price));
    setPriceEditDialog(true);
  }

  function savePriceEdit() {
    if (!event || !priceEditZone || !priceEditValue) return;
    ZonasEventoService.postApiV1ZonasEventoEdit({
      id: Number(priceEditZone.id),
      eventoId: Number(event.id),
      nombre: priceEditZone.name,
      capacidad: priceEditZone.capacity,
      precio: Number(priceEditValue),
    })
      .then(() => {
        ZonasEventoService.getApiV1ZonasEventoList(Number(event.id))
          .then((res) => {
            const zones = mapApiZonesToLocal(res.items || []);
            setEvent((prev) => prev ? { ...prev, zones } : prev);
          });
        setPriceEditDialog(false);
        toast({ title: "Precio actualizado" });
      })
      .catch((err) => {
        console.error("Error updating price:", err);
        toast({ title: "Error al actualizar el precio", variant: "destructive" });
      });
  }

  function requestDelete(type: string, id: string, name: string) {
    if (type === "activity") {
      ActividadesEventoService.getApiV1ActividadesEventoGetDescription(Number(id))
        .then((res) => {
          const description = res?.text || res?.value || name;
          setConfirmDelete({ type, id, name: String(description) });
        })
        .catch(() => {
          setConfirmDelete({ type, id, name });
        });
    } else if (type === "zone") {
      ZonasEventoService.getApiV1ZonasEventoGetDescription(Number(id))
        .then((res) => {
          const description = res?.text || res?.value || name;
          setConfirmDelete({ type, id, name: String(description) });
        })
        .catch(() => {
          setConfirmDelete({ type, id, name });
        });
    } else if (type === "product") {
      ProductosAdicionalEventoService.getApiV1ProductosAdicionalEventoGetDescription(Number(id))
        .then((res) => {
          const description = res?.text || res?.value || name;
          setConfirmDelete({ type, id, name: String(description) });
        })
        .catch(() => {
          setConfirmDelete({ type, id, name });
        });
    } else if (type === "coupon") {
      setConfirmDelete({ type, id, name });
    } else {
      setConfirmDelete({ type, id, name });
    }
  }

  function executeDelete() {
    if (!confirmDelete || !event) return;
    const { type, id } = confirmDelete;
    if (type === "activity") {
      ActividadesEventoService.postApiV1ActividadesEventoDelete({ id: Number(id) })
        .then(() => {
          ActividadesEventoService.getApiV1ActividadesEventoList(Number(event.id))
            .then((res) => {
              const activities = mapApiActivitiesToLocal(res.items || []);
              setEvent((prev) => prev ? { ...prev, activities } : prev);
            });
          setConfirmDelete(null);
          toast({ title: "Actividad eliminada" });
        })
        .catch((err) => {
          console.error("Error deleting activity:", err);
          setConfirmDelete(null);
          toast({ title: "Error al eliminar la actividad", variant: "destructive" });
        });
    } else if (type === "zone") {
      ZonasEventoService.postApiV1ZonasEventoDelete({ id: Number(id) })
        .then(() => {
          ZonasEventoService.getApiV1ZonasEventoList(Number(event.id))
            .then((res) => {
              const zones = mapApiZonesToLocal(res.items || []);
              setEvent((prev) => prev ? { ...prev, zones } : prev);
            });
          setConfirmDelete(null);
          toast({ title: "Zona eliminada" });
        })
        .catch((err) => {
          console.error("Error deleting zone:", err);
          setConfirmDelete(null);
          toast({ title: "Error al eliminar la zona", variant: "destructive" });
        });
    } else if (type === "product") {
      ProductosAdicionalEventoService.postApiV1ProductosAdicionalEventoDelete({ id: Number(id) })
        .then(() => {
          ProductosAdicionalEventoService.getApiV1ProductosAdicionalEventoList(Number(event.id))
            .then((res) => {
              const products = mapApiProductsToLocal(res.items || []);
              setEvent((prev) => prev ? { ...prev, products } : prev);
            });
          setConfirmDelete(null);
          toast({ title: "Producto eliminado" });
        })
        .catch((err) => {
          console.error("Error deleting product:", err);
          setConfirmDelete(null);
          toast({ title: "Error al eliminar el producto", variant: "destructive" });
        });
    } else if (type === "coupon") {
      CuponesZonaEventoService.postApiV1CuponesZonaEventoDelete({ id: Number(id) })
        .then(() => {
          refreshCoupons();
          setConfirmDelete(null);
          toast({ title: "Cupón eliminado" });
        })
        .catch((err) => {
          console.error("Error deleting coupon:", err);
          setConfirmDelete(null);
          toast({ title: "Error al eliminar el cupón", variant: "destructive" });
        });
    } else {
      setConfirmDelete(null);
    }
  }

  function openActivityDialog(activity?: Activity) {
    if (activity) {
      setEditingActivity(activity);
      setActivityForm({ name: activity.name, startDate: activity.startDate || "", endDate: activity.endDate || "", startTime: activity.startTime, endTime: activity.endTime, description: activity.description });
    } else {
      setEditingActivity(null);
      setActivityForm({ name: "", startDate: "", endDate: "", startTime: "", endTime: "", description: "" });
    }
    setActivityDialog(true);
  }

  function saveActivity() {
    if (!event || !activityForm.name || !activityForm.startDate || !activityForm.startTime || !activityForm.endTime) {
      toast({ title: "Completa todos los campos obligatorios", variant: "destructive" });
      return;
    }

    const endDate = activityForm.endDate || activityForm.startDate;
    const fechaHoraInicio = new Date(`${activityForm.startDate}T${activityForm.startTime}:00`).toISOString();
    const fechaHoraFin = new Date(`${endDate}T${activityForm.endTime}:00`).toISOString();

    if (editingActivity) {
      ActividadesEventoService.postApiV1ActividadesEventoEdit({
        id: Number(editingActivity.id),
        eventoId: Number(event.id),
        nombre: activityForm.name,
        descripcion: activityForm.description,
        fechaHoraInicio,
        fechaHoraFin,
      })
        .then(() => {
          ActividadesEventoService.getApiV1ActividadesEventoList(Number(event.id))
            .then((res) => {
              const activities = mapApiActivitiesToLocal(res.items || []);
              setEvent((prev) => prev ? { ...prev, activities } : prev);
            });
          setActivityDialog(false);
          toast({ title: "Actividad actualizada" });
        })
        .catch((err) => {
          console.error("Error updating activity:", err);
          toast({ title: "Error al actualizar la actividad", variant: "destructive" });
        });
    } else {
      ActividadesEventoService.postApiV1ActividadesEventoCreate({
        eventoId: Number(event.id),
        nombre: activityForm.name,
        descripcion: activityForm.description,
        fechaHoraInicio,
        fechaHoraFin,
      })
        .then(() => {
          ActividadesEventoService.getApiV1ActividadesEventoList(Number(event.id))
            .then((res) => {
              const activities = mapApiActivitiesToLocal(res.items || []);
              setEvent((prev) => prev ? { ...prev, activities } : prev);
            });
          setActivityDialog(false);
          toast({ title: "Actividad agregada" });
        })
        .catch((err) => {
          console.error("Error creating activity:", err);
          toast({ title: "Error al crear la actividad", variant: "destructive" });
        });
    }
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
      setCouponForm({ code: coupon.code, discount: String(coupon.discount), active: coupon.active, zonaEventoId: String(coupon.zonaEventoId || "") });
    } else {
      setEditingCoupon(null);
      const firstZoneId = event?.zones.length ? event.zones[0].id : "";
      setCouponForm({ code: "", discount: "", active: true, zonaEventoId: String(firstZoneId) });
    }
    setCouponDialog(true);
  }

  function saveCoupon() {
    if (!event || !couponForm.code || !couponForm.discount || !couponForm.zonaEventoId) {
      toast({ title: "Completa todos los campos (código, descuento y zona)", variant: "destructive" });
      return;
    }
    if (editingCoupon) {
      CuponesZonaEventoService.postApiV1CuponesZonaEventoEdit({
        id: Number(editingCoupon.id),
        zonaEventoId: Number(couponForm.zonaEventoId),
        codigo: couponForm.code,
        porcentajeDescuento: Number(couponForm.discount),
      })
        .then(() => {
          refreshCoupons();
          setCouponDialog(false);
          toast({ title: "Cupón actualizado" });
        })
        .catch((err) => {
          console.error("Error editing coupon:", err);
          toast({ title: "Error al actualizar el cupón", variant: "destructive" });
        });
    } else {
      CuponesZonaEventoService.postApiV1CuponesZonaEventoCreate({
        zonaEventoId: Number(couponForm.zonaEventoId),
        codigo: couponForm.code,
        porcentajeDescuento: Number(couponForm.discount),
      })
        .then(() => {
          refreshCoupons();
          setCouponDialog(false);
          toast({ title: "Cupón agregado" });
        })
        .catch((err) => {
          console.error("Error creating coupon:", err);
          toast({ title: "Error al crear el cupón", variant: "destructive" });
        });
    }
  }

  function openPreview() {
    if (!event) return;
    const numericId = Number(event.id);
    setPreviewLoading(true);
    Promise.all([
      EventosService.getApiV1EventosList(undefined, undefined, undefined, undefined, numericId).catch(() => ({ items: [] })),
      ActividadesEventoService.getApiV1ActividadesEventoList(numericId).catch(() => ({ items: [] })),
      ZonasEventoService.getApiV1ZonasEventoList(numericId).catch(() => ({ items: [] })),
      ProductosAdicionalEventoService.getApiV1ProductosAdicionalEventoList(numericId).catch(() => ({ items: [] })),
    ])
      .then(([eventRes, actRes, zonRes, prodRes]) => {
        const items = (eventRes as any).items || [];
        const raw = items.length > 0 ? items[0] : null;
        const previewEvent = raw ? mapApiEventToLocal(raw) : event;
        const activities = mapApiActivitiesToLocal((actRes as any).items || []);
        const zones = mapApiZonesToLocal((zonRes as any).items || []);
        const products = mapApiProductsToLocal((prodRes as any).items || []);
        setPreviewData({ event: previewEvent, activities, zones, products });
        setPreviewLoading(false);
        setPreviewDialog(true);
      })
      .catch(() => {
        setPreviewLoading(false);
        toast({ title: "Error al cargar la vista previa", variant: "destructive" });
      });
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
    if (!event || !productForm.name) return;

    const refreshProducts = () => {
      ProductosAdicionalEventoService.getApiV1ProductosAdicionalEventoList(Number(event.id))
        .then((res) => {
          const products = mapApiProductsToLocal(res.items || []);
          setEvent((prev) => prev ? { ...prev, products } : prev);
        });
    };

    const isGratuito = productForm.price === "0";

    if (editingProduct) {
      ProductosAdicionalEventoService.postApiV1ProductosAdicionalEventoEdit({
        id: Number(editingProduct.id),
        eventoId: Number(event.id),
        nombre: productForm.name,
        esGratuito: isGratuito,
        precio: isGratuito ? 0 : Number(productForm.price),
        disponible: productForm.available,
      })
        .then(() => {
          refreshProducts();
          setProductDialog(false);
          toast({ title: "Producto actualizado" });
        })
        .catch((err) => {
          console.error("Error updating product:", err);
          toast({ title: "Error al actualizar el producto", variant: "destructive" });
        });
    } else {
      ProductosAdicionalEventoService.postApiV1ProductosAdicionalEventoCreate({
        eventoId: Number(event.id),
        nombre: productForm.name,
        esGratuito: isGratuito,
        precio: isGratuito ? 0 : Number(productForm.price),
        disponible: productForm.available,
      })
        .then(() => {
          refreshProducts();
          setProductDialog(false);
          toast({ title: "Producto agregado" });
        })
        .catch((err) => {
          console.error("Error creating product:", err);
          toast({ title: "Error al crear el producto", variant: "destructive" });
        });
    }
  }

  function deleteProduct(productId: string) {
    if (!event) return;
    ProductosAdicionalEventoService.postApiV1ProductosAdicionalEventoDelete({ id: Number(productId) })
      .then(() => {
        ProductosAdicionalEventoService.getApiV1ProductosAdicionalEventoList(Number(event.id))
          .then((res) => {
            const products = mapApiProductsToLocal(res.items || []);
            setEvent((prev) => prev ? { ...prev, products } : prev);
          });
        toast({ title: "Producto eliminado" });
      })
      .catch((err) => {
        console.error("Error deleting product:", err);
        toast({ title: "Error al eliminar el producto", variant: "destructive" });
      });
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
          <Button variant="outline" size="sm" onClick={saveEventDraft} disabled={saving} className="rounded-xl" data-testid="button-save-draft">
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            {saving ? "Guardando..." : "Guardar"}
          </Button>
          <Button variant="outline" size="sm" onClick={openPreview} disabled={previewLoading} className="rounded-xl" data-testid="button-preview-event">
            {previewLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
            {previewLoading ? "Cargando..." : "Vista previa"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={sendToReview}
            disabled={reviewLoading || event.status === "en_revision" || event.status === "publicado"}
            className="rounded-xl"
            data-testid="button-send-review"
          >
            {reviewLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
            {reviewLoading ? "Enviando..." : "Revisión"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={approveEvent}
            disabled={approveLoading || event.status === "publicado"}
            className="rounded-xl"
            data-testid="button-approve-event"
          >
            {approveLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
            {approveLoading ? "Aprobando..." : "Aprobar"}
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
                    <Select value={draft.tipoDeCategoriaEventoId} onValueChange={(val) => setDraft({ ...draft, tipoDeCategoriaEventoId: val })}>
                      <SelectTrigger className="h-11 rounded-xl" data-testid="select-event-category">
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter((cat) => cat.id != null).map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>{cat.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Recinto / Ubicación</Label>
                    <Select value={draft.ubicacionId} onValueChange={(val) => setDraft({ ...draft, ubicacionId: val })}>
                      <SelectTrigger className="h-11 rounded-xl" data-testid="select-event-location">
                        <SelectValue placeholder="Selecciona ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.filter((loc) => loc.id != null).map((loc) => (
                          <SelectItem key={loc.id} value={String(loc.id)}>{loc.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  <Button onClick={saveBasicInfo} disabled={saving} className="rounded-xl" data-testid="button-save-event">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {saving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button variant="outline" onClick={cancelEditing} disabled={saving} className="rounded-xl" data-testid="button-cancel-edit">
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
                        <Badge variant="secondary" className="text-[11px] font-normal">
                          {act.startDate ? `${new Date(act.startDate + "T00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })} ${act.startTime} hrs` : act.startTime}{" - "}{act.endDate && act.endDate !== act.startDate ? `${new Date(act.endDate + "T00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })} ` : ""}{act.endTime} hrs
                        </Badge>
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
                          <td className="py-3.5 px-5 text-right font-medium tabular-nums">${(zone.price * zone.capacity).toLocaleString("es-MX")}</td>
                          <td className="py-3.5 px-5 text-right">
                            <Button size="icon" variant="ghost" onClick={() => openPriceEdit(zone)} data-testid={`button-edit-price-${zone.id}`}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-accent/20">
                        <td className="py-3.5 px-5 font-bold" colSpan={2}>Total</td>
                        <td className="py-3.5 px-5 text-right font-bold tabular-nums">{totalCap.toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-right font-bold tabular-nums">${event.zones.reduce((sum, z) => sum + z.price * z.capacity, 0).toLocaleString("es-MX")}</td>
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
                  {coupon.zonaEvento && (
                    <p className="text-xs text-muted-foreground">Zona: {coupon.zonaEvento}</p>
                  )}
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

      <Dialog open={priceEditDialog} onOpenChange={setPriceEditDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Editar Precio</DialogTitle>
            <DialogDescription>Modifica el precio de la zona <span className="font-semibold text-foreground">{priceEditZone?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Precio ($)</Label>
              <Input type="number" value={priceEditValue} onChange={(e) => setPriceEditValue(e.target.value)} placeholder="Ej: 1500" className="h-11 rounded-xl" data-testid="input-price-edit" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPriceEditDialog(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={savePriceEdit} className="rounded-xl" data-testid="button-save-price-edit">
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
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha de inicio</Label>
                <Input type="date" value={activityForm.startDate} onChange={(e) => setActivityForm({ ...activityForm, startDate: e.target.value })} className="h-11 rounded-xl" data-testid="input-activity-start-date" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha de fin</Label>
                <Input type="date" value={activityForm.endDate} onChange={(e) => setActivityForm({ ...activityForm, endDate: e.target.value })} className="h-11 rounded-xl" data-testid="input-activity-end-date" />
              </div>
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
            <DialogDescription>Define el código de descuento, porcentaje y la zona asociada</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Zona</Label>
              {event.zones.length > 0 ? (
                <select
                  value={couponForm.zonaEventoId}
                  onChange={(e) => setCouponForm({ ...couponForm, zonaEventoId: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-testid="select-coupon-zone"
                >
                  {event.zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-muted-foreground">No hay zonas creadas. Crea una zona primero.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Código</Label>
              <Input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="Ej: ROCK20" className="h-11 rounded-xl" data-testid="input-coupon-code" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Descuento (%)</Label>
              <Input type="number" value={couponForm.discount} onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })} placeholder="Ej: 20" className="h-11 rounded-xl" data-testid="input-coupon-discount" />
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
          {previewData ? (
            <div className="space-y-6">
              <div className="relative rounded-xl overflow-hidden">
                <div className="aspect-[16/9]">
                  <img src={previewData.event.image} alt={previewData.event.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Badge variant="secondary" className="mb-2 bg-white/15 text-white border-0 backdrop-blur-sm">{previewData.event.category}</Badge>
                  <h2 className="text-2xl font-bold text-white">{previewData.event.name}</h2>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-sm text-white/80">
                      <Calendar className="w-4 h-4" />
                      {new Date(previewData.event.startDate).toLocaleDateString("es-MX", { day: "numeric", month: "long" })} - {new Date(previewData.event.endDate).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm text-white/80">
                      <MapPin className="w-4 h-4" />
                      {previewData.event.location}
                    </span>
                  </div>
                </div>
              </div>

              {previewData.event.description && (
                <p className="text-muted-foreground leading-relaxed">{previewData.event.description}</p>
              )}

              {previewData.activities.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Actividades</h3>
                  <div className="space-y-2">
                    {previewData.activities.map((act) => (
                      <div key={act.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{act.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {act.startDate ? `${new Date(act.startDate + "T00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })} ${act.startTime} hrs` : act.startTime}{" - "}{act.endDate && act.endDate !== act.startDate ? `${new Date(act.endDate + "T00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })} ` : ""}{act.endTime} hrs | {act.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {previewData.zones.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Zonas y Precios</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewData.zones.map((zone) => {
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

              {previewData.products.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">Productos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {previewData.products.filter(p => p.available).map((product) => (
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
          ) : (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
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
