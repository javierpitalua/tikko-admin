import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reserveTicketSchema, type ReserveTicketInput, type Reservation, type ReservationStatus } from "@shared/schema";
import { getEvents, getReservations, saveReservations, generateId, generateReservationCode } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Ticket, User, Mail, Phone, Calendar, MapPin, AlertCircle,
  CheckCircle2, Copy, Clock, Loader2,
} from "lucide-react";
import { ReservacionesService } from "../../api/services/ReservacionesService";
import type { ReservacionesListItem } from "../../api/models/ReservacionesListItem";

const STATUS_CONFIG: Record<ReservationStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  apartado: { label: "Apartado", variant: "outline" },
  vendido: { label: "Vendido", variant: "default" },
  expirado: { label: "Expirado", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

function getTimeRemaining(createdAt: string, status: ReservationStatus): { text: string; expired: boolean } {
  if (status === "vendido") return { text: "Confirmado", expired: false };
  if (status === "cancelado") return { text: "Cancelado", expired: true };
  if (status === "expirado") return { text: "Expirado", expired: true };

  const created = new Date(createdAt).getTime();
  const expiresAt = created + 48 * 3600000;
  const now = Date.now();
  const diff = expiresAt - now;

  if (diff <= 0) return { text: "Expirado", expired: true };

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return { text: `${hours}h ${minutes}m`, expired: false };
  return { text: `${minutes}m`, expired: false };
}

export default function ReservePage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const events = getEvents();
  const [reservations, setReservations] = useState(getReservations());
  const [lastReservation, setLastReservation] = useState<Reservation | null>(null);
  const [, setTick] = useState(0);
  const [apiReservations, setApiReservations] = useState<ReservacionesListItem[]>([]);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadApiReservations();
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

  const form = useForm<ReserveTicketInput>({
    resolver: zodResolver(reserveTicketSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      eventId: "",
      zoneId: "",
      quantity: 1,
    },
  });

  const selectedEventId = form.watch("eventId");
  const selectedZoneId = form.watch("zoneId");
  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const selectedZone = selectedEvent?.zones.find((z) => z.id === selectedZoneId);

  const availableZones = useMemo(() => {
    if (!selectedEvent) return [];
    return selectedEvent.zones.filter((z) => z.capacity - z.sold > 0);
  }, [selectedEvent]);

  function onSubmit(data: ReserveTicketInput) {
    setLastReservation(null);

    const userReservationsForEvent = reservations.filter(
      (r) => r.email === data.email && r.eventId === data.eventId && (r.status === "apartado" || r.status === "vendido")
    );
    const totalExisting = userReservationsForEvent.reduce((sum, r) => sum + r.quantity, 0);

    if (totalExisting + data.quantity > 8) {
      const remaining = 8 - totalExisting;
      form.setError("quantity", {
        message: remaining <= 0
          ? `Ya tienes 8 boletos apartados para este evento. No puedes apartar más.`
          : `Solo puedes apartar ${remaining} boleto(s) más para este evento (máximo 8 por usuario por evento).`,
      });
      return;
    }

    if (selectedZone && data.quantity > selectedZone.capacity - selectedZone.sold) {
      form.setError("quantity", {
        message: `Solo quedan ${selectedZone.capacity - selectedZone.sold} boletos disponibles en esta zona.`,
      });
      return;
    }

    const now = new Date();
    const newReservation: Reservation = {
      id: generateId(),
      code: generateReservationCode(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      eventId: data.eventId,
      zoneId: data.zoneId,
      quantity: data.quantity,
      date: now.toISOString().split("T")[0],
      createdAt: now.toISOString(),
      status: "apartado",
    };

    const updatedReservations = [...reservations, newReservation];
    saveReservations(updatedReservations);
    setReservations(updatedReservations);
    setLastReservation(newReservation);

    toast({ title: "Boletos apartados con éxito" });
    form.reset();
    loadApiReservations();
  }

  function updateReservationStatus(id: string, newStatus: ReservationStatus) {
    const updated = reservations.map((r) =>
      r.id === id ? { ...r, status: newStatus } : r
    );
    saveReservations(updated);
    setReservations(updated);
    toast({ title: `Estado actualizado a "${STATUS_CONFIG[newStatus].label}"` });
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast({ title: "Código copiado al portapapeles" });
  }

  const subtotal = selectedZone ? selectedZone.price * (form.watch("quantity") || 0) : 0;

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
                      name="name"
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
                      name="email"
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
                    name="phone"
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
                    name="eventId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evento</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue("zoneId", "");
                          }}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-event">
                              <SelectValue placeholder="Selecciona un evento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {events.map((evt) => (
                              <SelectItem key={evt.id} value={evt.id}>{evt.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedEvent && (
                    <FormField
                      control={form.control}
                      name="zoneId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zona</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-zone">
                                <SelectValue placeholder="Selecciona una zona" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {availableZones.map((z) => (
                                <SelectItem key={z.id} value={z.id}>
                                  {z.name} - ${z.price.toLocaleString("es-MX")} ({z.capacity - z.sold} disponibles)
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
                    name="quantity"
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

                  <Button type="submit" className="w-full" data-testid="button-reserve">
                    <Ticket className="w-4 h-4 mr-2" />
                    Apartar Boletos
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

        </div>

        <div className="space-y-4">
          {selectedEvent && (
            <Card data-testid="card-event-preview">
              <div className="aspect-video overflow-hidden rounded-t-md">
                <img src={selectedEvent.image} alt={selectedEvent.name} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold">{selectedEvent.name}</h3>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {new Date(selectedEvent.startDate).toLocaleDateString("es-MX", { day: "numeric", month: "short" })} - {new Date(selectedEvent.endDate).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {selectedEvent.location}
                  </div>
                </div>
                {selectedZone && (
                  <div className="p-3 rounded-md bg-accent/50 space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
                      <span className="text-muted-foreground">Zona:</span>
                      <span className="font-medium">{selectedZone.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
                      <span className="text-muted-foreground">Precio unitario:</span>
                      <span className="font-medium">${selectedZone.price.toLocaleString("es-MX")}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
                      <span className="text-muted-foreground">Cantidad:</span>
                      <span className="font-medium">{form.watch("quantity") || 0}</span>
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
            <Card className="border-primary/30 bg-primary/5" data-testid="card-reservation-confirmation">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="font-semibold text-lg">Reservación Creada</h3>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-md bg-background border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Código de reserva</p>
                    <p className="text-2xl font-mono font-bold tracking-wider mt-1" data-testid="text-reservation-code">{lastReservation.code}</p>
                  </div>
                  <Button size="icon" variant="outline" onClick={() => copyCode(lastReservation.code)} data-testid="button-copy-code">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Evento</p>
                    <p className="font-medium">{events.find((e) => e.id === lastReservation.eventId)?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Boletos</p>
                    <p className="font-medium">{lastReservation.quantity}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Estado</p>
                    <Badge variant="outline">Apartado</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Expira en</p>
                    <p className="font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      48 horas
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Tienes 48 horas para confirmar el pago antes de que la reservación expire automáticamente.</p>
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
              <table className="w-full text-sm" data-testid="table-reservations">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Folio</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Evento</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Zona</th>
                    <th className="text-center py-3 px-3 font-medium text-muted-foreground">Boletos</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground">Subtotal</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Expiración</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground">Estado</th>
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
                        <td className="py-3 px-3">
                          <code className="font-mono text-xs font-semibold" data-testid={`text-folio-${r.id}`}>{r.folio || `#${r.id}`}</code>
                        </td>
                        <td className="py-3 px-3">
                          <div>
                            <p className="font-medium">{r.nombre || "—"}</p>
                            <p className="text-xs text-muted-foreground">{r.correoElectronico || ""}</p>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            className="text-left text-primary underline-offset-2 hover:underline cursor-pointer"
                            onClick={() => navigate("/events")}
                            data-testid={`link-event-${r.id}`}
                          >
                            {r.evento || "—"}
                          </button>
                        </td>
                        <td className="py-3 px-3">{r.zonaEvento || "—"}</td>
                        <td className="py-3 px-3 text-center">{r.cantidadBoletos ?? 0}</td>
                        <td className="py-3 px-3 text-right font-medium">
                          {r.subtotal != null ? `$${r.subtotal.toLocaleString("es-MX")}` : "—"}
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {r.fechaReservacion ? new Date(r.fechaReservacion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                        </td>
                        <td className="py-3 px-3">
                          {r.fechaExpiracion ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(r.fechaExpiracion).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="py-3 px-3">
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
