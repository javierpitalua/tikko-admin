import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { reserveTicketSchema, type ReserveTicketInput } from "@shared/schema";
import { getEvents, getReservations, saveReservations, generateId } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Ticket, User, Mail, Phone, Calendar, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ReservePage() {
  const { toast } = useToast();
  const events = getEvents();
  const [reservations, setReservations] = useState(getReservations());
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);

    const userReservationsForEvent = reservations.filter(
      (r) => r.email === data.email && r.eventId === data.eventId
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

    const newReservation = {
      id: generateId(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      eventId: data.eventId,
      zoneId: data.zoneId,
      quantity: data.quantity,
      date: new Date().toISOString().split("T")[0],
      status: "apartado" as const,
    };

    const updatedReservations = [...reservations, newReservation];
    saveReservations(updatedReservations);
    setReservations(updatedReservations);

    setSuccess(true);
    toast({ title: "Boletos apartados con éxito" });
    form.reset();
  }

  const subtotal = selectedZone ? selectedZone.price * (form.watch("quantity") || 0) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-reserve-title">Apartar Boletos</h1>
        <p className="text-muted-foreground mt-1">Reserva boletos para los eventos disponibles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Datos de Reservación</CardTitle>
              <CardDescription>Completa todos los campos para apartar tus boletos</CardDescription>
            </CardHeader>
            <CardContent>
              {success && (
                <div className="flex items-center gap-2 p-4 mb-6 rounded-md bg-chart-2/10 text-chart-2" data-testid="text-reserve-success">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">Boletos apartados correctamente. Recibirás un correo de confirmación.</p>
                </div>
              )}

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
                    {new Date(selectedEvent.date).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {selectedEvent.location}
                  </div>
                </div>
                {selectedZone && (
                  <div className="p-3 rounded-md bg-accent/50 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Zona:</span>
                      <span className="font-medium">{selectedZone.name}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Precio unitario:</span>
                      <span className="font-medium">${selectedZone.price.toLocaleString("es-MX")}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Cantidad:</span>
                      <span className="font-medium">{form.watch("quantity") || 0}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex items-center justify-between gap-2">
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
        </div>
      </div>

      {reservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservaciones Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Evento</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Cantidad</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.slice(-10).reverse().map((r) => {
                    const evt = events.find((e) => e.id === r.eventId);
                    return (
                      <tr key={r.id} className="border-b border-border last:border-0" data-testid={`row-reservation-${r.id}`}>
                        <td className="py-2 pr-4">{r.name}</td>
                        <td className="py-2 pr-4">{evt?.name || "N/A"}</td>
                        <td className="py-2 pr-4">{r.quantity}</td>
                        <td className="py-2 pr-4">{r.date}</td>
                        <td className="py-2">
                          <Badge variant={r.status === "vendido" ? "default" : "secondary"}>
                            {r.status === "vendido" ? "Vendido" : "Apartado"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
