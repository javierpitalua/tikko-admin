import { useState, useRef } from "react";
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
import { ArrowLeft, Save, Upload, X, ImageIcon } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerImage, setBannerImage] = useState<string>("");

  const form = useForm<NewEventInput>({
    resolver: zodResolver(newEventSchema),
    defaultValues: { name: "", startDate: "", endDate: "", location: "", description: "", category: "" },
  });

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
      setBannerImage(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function onSubmit(data: NewEventInput) {
    const events = getEvents();
    const newEvent = {
      id: generateId(),
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location,
      description: data.description,
      image: bannerImage || defaultImages[Math.floor(Math.random() * defaultImages.length)],
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
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate("/events")} className="rounded-xl" data-testid="button-back-events">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a eventos
      </Button>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 mb-1">Nuevo</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Crear Evento</h1>
        <p className="text-sm text-muted-foreground mt-1">Completa los datos del evento. Después podrás agregar zonas, actividades y cupones.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Imagen de banner</label>
                {bannerImage ? (
                  <div className="relative rounded-xl overflow-hidden border border-border">
                    <img src={bannerImage} alt="Banner preview" className="w-full h-48 object-cover" data-testid="img-banner-preview" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute top-3 right-3 bg-black/50 text-white rounded-lg"
                      onClick={() => setBannerImage("")}
                      data-testid="button-remove-banner"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="absolute bottom-3 left-3 bg-black/40 border-white/30 text-white backdrop-blur-sm rounded-xl"
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-change-banner"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Cambiar imagen
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-48 rounded-xl border-2 border-dashed border-border/60 bg-accent/30 cursor-pointer hover-elevate"
                    data-testid="dropzone-banner"
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-accent mb-3">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Sube una imagen de banner</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG o WebP recomendado</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  data-testid="input-file-banner"
                />
              </div>

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nombre del evento</FormLabel>
                  <FormControl><Input {...field} placeholder="Ej: Festival de Verano 2026" className="h-11 rounded-xl" data-testid="input-event-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha de inicio</FormLabel>
                    <FormControl><Input {...field} type="date" className="h-11 rounded-xl" data-testid="input-event-start-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha de fin</FormLabel>
                    <FormControl><Input {...field} type="date" className="h-11 rounded-xl" data-testid="input-event-end-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ubicación</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Arena Ciudad de México" className="h-11 rounded-xl" data-testid="input-event-location" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Categoría</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-11 rounded-xl" data-testid="select-event-category"><SelectValue placeholder="Selecciona categoría" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Descripción</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Describe el evento..." className="resize-none rounded-xl" rows={4} data-testid="input-event-description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full rounded-xl" data-testid="button-create-event">
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
