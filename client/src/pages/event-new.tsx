import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getEvents, saveEvents, generateId } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Calendar, MapPin, FolderOpen, FileText } from "lucide-react";

const newEventSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
  location: z.string().min(3, "La ubicación es requerida"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  category: z.string().min(1, "Selecciona una categoría"),
});

type NewEventInput = z.infer<typeof newEventSchema>;

const categories = ["Música", "Tecnología", "Deportes", "Gastronomía", "Cultura", "Teatro", "Arte", "Otro"];
const defaultImages = [
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&h=400&fit=crop",
];

export default function EventNewPage() {
  const [, navigate] = useLocation();
  const { admin } = useAuth();
  const { toast } = useToast();

  const form = useForm<NewEventInput>({
    resolver: zodResolver(newEventSchema),
    defaultValues: { name: "", startDate: "", endDate: "", location: "", description: "", category: "" },
  });

  function onSubmit(data: NewEventInput) {
    const events = getEvents();
    const newEvent = {
      id: generateId(),
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location,
      description: data.description,
      image: defaultImages[Math.floor(Math.random() * defaultImages.length)],
      category: data.category,
      status: "borrador" as const,
      zones: [],
      activities: [],
      coupons: [],
      products: [],
      adminId: admin?.id || "admin",
    };
    events.push(newEvent);
    saveEvents(events);
    toast({ title: "Evento creado exitosamente" });
    navigate(`/events/${newEvent.id}`);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate("/events")} data-testid="button-back-events">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a eventos
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Crear Nuevo Evento</CardTitle>
          <CardDescription>Completa los datos del evento. Después podrás agregar zonas, actividades y cupones.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del evento</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input {...field} placeholder="Ej: Festival de Verano 2026" className="pl-10" data-testid="input-event-name" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} type="date" className="pl-10" data-testid="input-event-start-date" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de fin</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input {...field} type="date" className="pl-10" data-testid="input-event-end-date" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ubicación</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input {...field} placeholder="Ej: Arena Ciudad de México" className="pl-10" data-testid="input-event-location" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger data-testid="select-event-category"><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Describe el evento..." className="resize-none" rows={4} data-testid="input-event-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" className="w-full" data-testid="button-create-event">
                <Save className="w-4 h-4 mr-2" />
                Crear Evento
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
