import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Ticket, User, Mail, Phone, Calendar, MapPin, AlertCircle,
  Loader2, CheckCircle2, Clock, Info, CreditCard, Hash,
} from "lucide-react";
import { ReservacionesService } from "../../api/services/ReservacionesService";
import { EventosService } from "../../api/services/EventosService";
import { ZonasEventoService } from "../../api/services/ZonasEventoService";
import { EstadosDeReservacionService } from "../../api/services/EstadosDeReservacionService";
import type { ReservacionesListItem } from "../../api/models/ReservacionesListItem";
import type { EventosListItem } from "../../api/models/EventosListItem";
import type { ZonasEventoListItem } from "../../api/models/ZonasEventoListItem";

const reserveFormSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  correoElectronico: z.string().email("Correo electrónico inválido"),
  telefono: z.string().min(10, "Mínimo 10 dígitos").max(10, "Máximo 10 dígitos"),
  eventoId: z.string().min(1, "Selecciona un evento"),
  zonaEventoId: z.string().min(1, "Selecciona una zona"),
  cantidadBoletos: z.number().min(1, "Mínimo 1 boleto").max(8, "Máximo 8 boletos"),
});

type ReserveFormInput = z.infer<typeof reserveFormSchema>;

const STATUS_DOT: Record<string, string> = {
  apartado: "bg-amber-400",
  vendido: "bg-emerald-400",
  pagado: "bg-emerald-400",
  cancelado: "bg-red-400",
  expirado: "bg-muted-foreground",
};

function getStatusDot(status: string) {
  const lower = status.toLowerCase();
  for (const [key, cls] of Object.entries(STATUS_DOT)) {
    if (lower.includes(key)) return cls;
  }
  return "bg-muted-foreground";
}

export default function ReservePage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [apiReservations, setApiReservations] = useState<ReservacionesListItem[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiEvents, setApiEvents] = useState<EventosListItem[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [apiZones, setApiZones] = useState<ZonasEventoListItem[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastReservation, setLastReservation] = useState<{
    folio: string;
    nombre: string;
    evento: string;
    zona: string;
    cantidadBoletos: number;
    subtotal: number;
  } | null>(null);

  useEffect(() => {
    loadApiReservations();
    loadApiEvents();
  }, []);

  async function loadApiReservations() {
    setApiLoading(true);
    try {
      const res = await ReservacionesService.getApiV1ReservacionesList();
      setApiReservations(res.items || []);
    } catch (err) {
      console.error("Error loading reservations:", err);
      setApiReservations([]);
    } finally {
      setApiLoading(false);
    }
  }

  async function loadApiEvents() {
    setEventsLoading(true);
    try {
      const res = await EventosService.getApiV1EventosList();
      const all = res.items || [];
      const published = all.filter((e) => {
        const status = (e.estadoDeEvento || "").toLowerCase();
        return status.includes("publicado") || status.includes("activo");
      });
      setApiEvents(published);
    } catch (err) {
      console.error("Error loading events:", err);
      setApiEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }

  async function loadZonesForEvent(eventoId: number) {
    setZonesLoading(true);
    setApiZones([]);
    try {
      const res = await ZonasEventoService.getApiV1ZonasEventoList(eventoId);
      setApiZones(res.items || []);
    } catch (err) {
      console.error("Error loading zones:", err);
      setApiZones([]);
    } finally {
      setZonesLoading(false);
    }
  }

  const form = useForm<ReserveFormInput>({
    resolver: zodResolver(reserveFormSchema),
    defaultValues: {
      nombre: "",
      correoElectronico: "",
      telefono: "",
      eventoId: "",
      zonaEventoId: "",
      cantidadBoletos: 1,
    },
  });

  const selectedEventId = form.watch("eventoId");
  const selectedZoneId = form.watch("zonaEventoId");
  const selectedEvent = apiEvents.find((e) => String(e.id) === selectedEventId);
  const selectedZone = apiZones.find((z) => String(z.id) === selectedZoneId);
  const qty = form.watch("cantidadBoletos") || 0;
  const subtotal = selectedZone ? (selectedZone.precio || 0) * qty : 0;

  function generateFolio(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "RES-";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async function onSubmit(data: ReserveFormInput) {
    setSubmitting(true);
    try {
      const statusRes = await EstadosDeReservacionService.getApiV1EstadosDeReservacionList();
      const statuses = statusRes.items || [];
      const apartadoStatus = statuses.find((s: any) =>
        (s.clave || s.descripcion || "").toLowerCase().includes("apartad")
      );
      const estadoDeReservacionId = apartadoStatus?.id || statuses[0]?.id || 1;

      const now = new Date();
      const expiration = new Date(now.getTime() + 48 * 3600000);
      const zone = apiZones.find((z) => String(z.id) === data.zonaEventoId);
      const precioUnitario = zone?.precio || 0;

      const folio = generateFolio();
      const evt = apiEvents.find((e) => String(e.id) === data.eventoId);

      await ReservacionesService.postApiV1ReservacionesCreate({
        folio,
        nombre: data.nombre,
        correoElectronico: data.correoElectronico,
        telefono: data.telefono,
        eventoId: Number(data.eventoId),
        zonaEventoId: Number(data.zonaEventoId),
        estadoDeReservacionId,
        cantidadBoletos: data.cantidadBoletos,
        precioUnitario: precioUnitario,
        subtotal: precioUnitario * data.cantidadBoletos,
        fechaReservacion: now.toISOString(),
        fechaExpiracion: expiration.toISOString(),
      });

      setLastReservation({
        folio,
        nombre: data.nombre,
        evento: evt?.nombre || "",
        zona: zone?.nombre || "",
        cantidadBoletos: data.cantidadBoletos,
        subtotal: precioUnitario * data.cantidadBoletos,
      });

      toast({ title: "Boletos apartados con éxito" });
      form.reset();
      setApiZones([]);
      await loadApiReservations();
    } catch (err: any) {
      console.error("Error creating reservation:", err);
      let detail = "Intenta de nuevo";
      if (err?.body?.ValidationSummary?.ErrorDetails?.length) {
        detail = err.body.ValidationSummary.ErrorDetails
          .map((d: any) => `${d.PropertyName}: ${d.Errors?.map((e: any) => e.Description).join(", ")}`)
          .join("; ");
      } else if (err?.body?.ValidationSummary?.ErrorMessage) {
        detail = err.body.ValidationSummary.ErrorMessage;
      } else if (err?.body?.detail || err?.body?.title) {
        detail = err.body.detail || err.body.title;
      } else if (err?.message) {
        detail = err.message;
      }
      toast({ title: "Error al crear la reservación", description: detail, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  const eventImgUrl = selectedEvent?.imagen_Evento_Id
    ? `https://dev-api.tikko.mx${selectedEvent.imagen_Evento_Id}`
    : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-reserve-title">Apartar Boletos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Reserva boletos para los eventos disponibles</p>
        </div>
        {!apiLoading && (
          <Badge variant="secondary" className="text-xs self-start sm:self-auto">
            {apiReservations.length} {apiReservations.length === 1 ? "reservación" : "reservaciones"}
          </Badge>
        )}
      </div>

      {lastReservation && (
        <Card className="border-emerald-500/30 dark:border-emerald-400/20" data-testid="card-reservation-confirmation">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">Reservación creada exitosamente</h3>
                <div className="mt-3 p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Folio</span>
                  </div>
                  <p className="text-xl font-mono font-bold tracking-wider" data-testid="text-reservation-folio">{lastReservation.folio}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Evento</p>
                    <p className="text-sm font-medium mt-0.5 truncate">{lastReservation.evento}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Zona</p>
                    <p className="text-sm font-medium mt-0.5 truncate">{lastReservation.zona}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Boletos</p>
                    <p className="text-sm font-medium mt-0.5">{lastReservation.cantidadBoletos}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total</p>
                    <p className="text-sm font-bold mt-0.5">${lastReservation.subtotal.toLocaleString("es-MX")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Tienes 48 horas para confirmar el pago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-foreground">Datos de Reservación</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Completa todos los campos para apartar tus boletos</p>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Datos personales</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre completo</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input {...field} placeholder="Tu nombre completo" className="pl-10" data-testid="input-reserve-name" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="correoElectronico"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo electrónico</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input {...field} type="email" placeholder="tu@correo.com" className="pl-10" data-testid="input-reserve-email" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="telefono"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número celular</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input {...field} placeholder="10 dígitos" className="pl-10" maxLength={10} data-testid="input-reserve-phone" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t border-border pt-5 space-y-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Selección de boletos</p>
                    <FormField
                      control={form.control}
                      name="eventoId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Evento</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue("zonaEventoId", "");
                              loadZonesForEvent(Number(val));
                            }}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-event">
                                <SelectValue placeholder={eventsLoading ? "Cargando eventos..." : "Selecciona un evento"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {apiEvents.map((evt) => (
                                <SelectItem key={evt.id} value={String(evt.id)}>{evt.nombre || `Evento #${evt.id}`}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedEventId && (
                      <FormField
                        control={form.control}
                        name="zonaEventoId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zona</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger data-testid="select-zone">
                                  <SelectValue placeholder={zonesLoading ? "Cargando zonas..." : "Selecciona una zona"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {apiZones.map((z) => (
                                  <SelectItem key={z.id} value={String(z.id)}>
                                    {z.nombre || `Zona #${z.id}`} — ${(z.precio || 0).toLocaleString("es-MX")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="cantidadBoletos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad de boletos</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={field.value <= 1}
                                onClick={() => field.onChange(Math.max(1, field.value - 1))}
                                data-testid="button-decrease-qty"
                              >
                                -
                              </Button>
                              <span className="text-lg font-semibold tabular-nums w-8 text-center" data-testid="input-reserve-quantity">
                                {field.value}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={field.value >= 8}
                                onClick={() => field.onChange(Math.min(8, field.value + 1))}
                                data-testid="button-increase-qty"
                              >
                                +
                              </Button>
                              <span className="text-xs text-muted-foreground ml-1">máx. 8 por evento</span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {selectedZone && (
                    <div className="rounded-lg bg-accent/50 p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Precio unitario</span>
                        <span>${(selectedZone.precio || 0).toLocaleString("es-MX")}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cantidad</span>
                        <span>{qty}</span>
                      </div>
                      <div className="border-t border-border pt-2 flex items-center justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold tabular-nums">${subtotal.toLocaleString("es-MX")}</span>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={submitting} data-testid="button-reserve">
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Ticket className="w-4 h-4 mr-2" />
                    )}
                    {submitting ? "Apartando..." : "Apartar Boletos"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedEvent && (
            <Card data-testid="card-event-preview">
              {eventImgUrl && (
                <div className="aspect-video overflow-hidden rounded-t-md relative">
                  <img src={eventImgUrl} alt={selectedEvent.nombre || ""} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-semibold text-sm drop-shadow-sm">{selectedEvent.nombre}</p>
                  </div>
                </div>
              )}
              <CardContent className={`p-4 space-y-3 ${!eventImgUrl ? "pt-5" : ""}`}>
                {!eventImgUrl && <h3 className="font-semibold text-sm">{selectedEvent.nombre}</h3>}
                <div className="space-y-2">
                  {selectedEvent.fechaInicio && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {new Date(selectedEvent.fechaInicio).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                        {selectedEvent.fechaFin && ` – ${new Date(selectedEvent.fechaFin).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`}
                      </span>
                    </div>
                  )}
                  {selectedEvent.ubicacion && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{selectedEvent.ubicacion}</span>
                    </div>
                  )}
                </div>
                {apiZones.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-2">Zonas disponibles</p>
                    <div className="space-y-1.5">
                      {apiZones.map((z) => (
                        <div
                          key={z.id}
                          className={`flex items-center justify-between text-xs p-2 rounded-md transition-colors ${
                            String(z.id) === selectedZoneId
                              ? "bg-indigo-500/10 dark:bg-indigo-400/10 text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          <span className="font-medium">{z.nombre}</span>
                          <span className="tabular-nums">${(z.precio || 0).toLocaleString("es-MX")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-400/10 shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <p className="font-medium text-foreground text-sm">Antes de reservar</p>
                  <p>Máximo 8 boletos por usuario por evento.</p>
                  <p>Los boletos apartados se reservan por 48 horas.</p>
                  <p>Recibirás confirmación por correo electrónico.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-base font-semibold text-foreground" data-testid="text-reservations-title">
            Reservaciones
          </h2>
          {!apiLoading && apiReservations.length > 0 && (
            <Badge variant="secondary" className="text-[11px]">{apiReservations.length}</Badge>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {apiLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground" data-testid="reservations-loading">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Cargando reservaciones...</span>
              </div>
            ) : apiReservations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14" data-testid="reservations-empty">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-3">
                  <Ticket className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">Sin reservaciones</p>
                <p className="text-xs text-muted-foreground mt-1">Las reservaciones aparecerán aquí</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {apiReservations.map((r) => {
                  const statusLower = (r.estadoDeReservacion || "").toLowerCase();
                  return (
                    <div
                      key={r.id}
                      className="flex items-center gap-4 p-4 hover:bg-accent/30 transition-colors"
                      data-testid={`row-reservation-${r.id}`}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent shrink-0">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 items-center">
                        <div className="min-w-0">
                          <code className="font-mono text-xs font-semibold" data-testid={`text-folio-${r.id}`}>{r.folio || `#${r.id}`}</code>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{r.nombre || "—"}</p>
                        </div>

                        <div className="min-w-0">
                          <button
                            type="button"
                            className="text-sm font-medium text-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block max-w-full text-left"
                            onClick={() => navigate("/events")}
                            data-testid={`link-event-${r.id}`}
                          >
                            {r.evento || "—"}
                          </button>
                          <p className="text-xs text-muted-foreground truncate">{r.zonaEvento || ""}</p>
                        </div>

                        <div className="hidden lg:block">
                          <p className="text-xs text-muted-foreground">
                            {r.fechaReservacion ? new Date(r.fechaReservacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                          </p>
                        </div>

                        <div className="hidden lg:flex items-center gap-3">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Boletos</p>
                            <p className="text-sm font-semibold tabular-nums">{r.cantidadBoletos ?? 0}</p>
                          </div>
                          <div className="text-right flex-1">
                            <p className="text-xs text-muted-foreground">Subtotal</p>
                            <p className="text-sm font-semibold tabular-nums">
                              {r.subtotal != null ? `$${r.subtotal.toLocaleString("es-MX")}` : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:justify-end">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(r.estadoDeReservacion || "")}`} />
                          <span className="text-xs font-medium" data-testid={`badge-status-${r.id}`}>
                            {r.estadoDeReservacion || "Desconocido"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
