import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Ticket, User, Mail, Phone, Calendar, MapPin, AlertCircle,
  Loader2, CheckCircle2, Clock,
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
      setApiEvents(res.items || []);
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

  const subtotal = selectedZone ? (selectedZone.precio || 0) * (form.watch("cantidadBoletos") || 0) : 0;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight" data-testid="text-reserve-title">Apartar Boletos</h1>
        <p className="text-muted-foreground mt-1">Reserva boletos para los eventos disponibles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos de Reservación</CardTitle>
              <CardDescription>Completa todos los campos para apartar tus boletos</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                        <FormLabel>Número celular (10 dígitos)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input {...field} placeholder="5512345678" className="pl-10" maxLength={10} data-testid="input-reserve-phone" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                                  {z.nombre || `Zona #${z.id}`} - ${(z.precio || 0).toLocaleString("es-MX")}
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
                        <FormLabel>Cantidad de boletos (máx. 8 por evento)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="number"
                              min={1}
                              max={8}
                              value={field.value}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="pl-10"
                              data-testid="input-reserve-quantity"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

        <div className="space-y-4">
          {selectedEvent && (
            <Card data-testid="card-event-preview">
              {selectedEvent.bannerUrl && (
                <div className="aspect-video overflow-hidden rounded-t-md">
                  <img src={selectedEvent.bannerUrl} alt={selectedEvent.nombre || ""} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">{selectedEvent.nombre}</h3>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  {selectedEvent.fechaInicio && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {new Date(selectedEvent.fechaInicio).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                      {selectedEvent.fechaFin && ` - ${new Date(selectedEvent.fechaFin).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}`}
                    </div>
                  )}
                  {selectedEvent.ubicacion && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {selectedEvent.ubicacion}
                    </div>
                  )}
                </div>
                {selectedZone && (
                  <div className="p-3 rounded-md bg-accent/50 space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
                      <span className="text-muted-foreground">Zona:</span>
                      <span className="font-medium">{selectedZone.nombre}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
                      <span className="text-muted-foreground">Precio unitario:</span>
                      <span className="font-medium">${(selectedZone.precio || 0).toLocaleString("es-MX")}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
                      <span className="text-muted-foreground">Cantidad:</span>
                      <span className="font-medium">{form.watch("cantidadBoletos") || 0}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex items-center justify-between gap-3 flex-wrap">
                      <span className="font-medium">Subtotal:</span>
                      <span className="text-lg font-bold text-primary">${subtotal.toLocaleString("es-MX")}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Información importante</p>
                  <p>Máximo 8 boletos por usuario por evento.</p>
                  <p>Los boletos apartados se reservan por 48 horas.</p>
                  <p>Recibirás confirmación por correo electrónico.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {lastReservation && (
            <Card className="border-primary/30" data-testid="card-reservation-confirmation">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="font-semibold text-lg">Reservación Creada</h3>
                </div>
                <div className="p-3 rounded-md bg-accent/50">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Folio</p>
                  <p className="text-xl font-mono font-bold tracking-wider mt-1" data-testid="text-reservation-folio">{lastReservation.folio}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Nombre</p>
                    <p className="font-medium">{lastReservation.nombre}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Evento</p>
                    <p className="font-medium">{lastReservation.evento}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Zona</p>
                    <p className="font-medium">{lastReservation.zona}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Boletos</p>
                    <p className="font-medium">{lastReservation.cantidadBoletos}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Subtotal</p>
                    <p className="font-medium">${lastReservation.subtotal.toLocaleString("es-MX")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Estado</p>
                    <Badge variant="outline">Apartado</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Tienes 48 horas para confirmar el pago.</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base" data-testid="text-reservations-title">
            Reservaciones Realizadas {!apiLoading && `(${apiReservations.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiLoading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground" data-testid="reservations-loading">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Cargando reservaciones...</span>
            </div>
          ) : apiReservations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="reservations-empty">
              No hay reservaciones registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed" data-testid="table-reservations">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                  <col className="w-[12%]" />
                  <col className="w-[8%]" />
                  <col className="w-[12%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Folio</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Evento</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Zona</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Boletos</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Subtotal</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {apiReservations.map((r) => {
                    const statusLower = (r.estadoDeReservacion || "").toLowerCase();
                    const badgeVariant: "default" | "secondary" | "destructive" | "outline" =
                      statusLower.includes("vendido") || statusLower.includes("pagad") ? "default"
                      : statusLower.includes("cancelad") ? "destructive"
                      : statusLower.includes("expirad") ? "secondary"
                      : "outline";
                    return (
                      <tr key={r.id} className="border-b border-border last:border-0" data-testid={`row-reservation-${r.id}`}>
                        <td className="py-3 px-4">
                          <code className="font-mono text-xs font-semibold" data-testid={`text-folio-${r.id}`}>{r.folio || `#${r.id}`}</code>
                        </td>
                        <td className="py-3 px-4">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{r.nombre || "—"}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.correoElectronico || ""}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            className="text-left text-primary underline-offset-2 hover:underline cursor-pointer truncate block max-w-full"
                            onClick={() => navigate("/events")}
                            data-testid={`link-event-${r.id}`}
                          >
                            {r.evento || "—"}
                          </button>
                        </td>
                        <td className="py-3 px-4 truncate">{r.zonaEvento || "—"}</td>
                        <td className="py-3 px-4 text-center">{r.cantidadBoletos ?? 0}</td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {r.fechaReservacion ? new Date(r.fechaReservacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-medium whitespace-nowrap">
                          {r.subtotal != null ? `$${r.subtotal.toLocaleString("es-MX")}` : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={badgeVariant} data-testid={`badge-status-${r.id}`}>
                            {r.estadoDeReservacion || "Desconocido"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
