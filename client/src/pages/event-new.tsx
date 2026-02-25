import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth-context";
import { EventosService } from "../../api/services/EventosService";
import { ArchivosUploadService } from "../../api/services/ArchivosUploadService";
import { TiposDeCategoriaEventoService } from "../../api/services/TiposDeCategoriaEventoService";
import { UbicacionesService } from "../../api/services/UbicacionesService";
import type { UbicacionesListItem } from "../../api/models/UbicacionesListItem";
import type { TiposDeCategoriaEventoListItem } from "../../api/models/TiposDeCategoriaEventoListItem";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Upload, X, ImageIcon, Calendar, MapPin, Ticket, Clock, Loader2 } from "lucide-react";

const newEventSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  startDate: z.string().min(1, "La fecha de inicio es requerida"),
  endDate: z.string().min(1, "La fecha de fin es requerida"),
  ubicacionId: z.string().min(1, "La ubicación es requerida"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  tipoDeCategoriaEventoId: z.string().min(1, "Selecciona una categoría"),
});

type NewEventInput = z.infer<typeof newEventSchema>;

const placeholderBanner = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&h=400&fit=crop";

export default function EventNewPage() {
  const [, navigate] = useLocation();
  const { admin } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bannerImage, setBannerImage] = useState<string>("");
  const [archivoId, setArchivoId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<TiposDeCategoriaEventoListItem[]>([]);
  const [locations, setLocations] = useState<UbicacionesListItem[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  const form = useForm<NewEventInput>({
    resolver: zodResolver(newEventSchema),
    defaultValues: { name: "", startDate: "", endDate: "", ubicacionId: "", description: "", tipoDeCategoriaEventoId: "" },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    Promise.all([
      TiposDeCategoriaEventoService.getApiV1TiposDeCategoriaEventoList(),
      UbicacionesService.getApiV1UbicacionesList(),
    ])
      .then(([catRes, locRes]) => {
        setCategories(catRes.items || []);
        setLocations(locRes.items || []);
      })
      .catch((err) => {
        console.error("Error loading catalogs:", err);
        toast({ title: "Error al cargar catálogos", variant: "destructive" });
      })
      .finally(() => setLoadingCatalogs(false));
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
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

    if (!admin?.id) {
      toast({ title: "No se pudo identificar al usuario. Inicia sesión nuevamente.", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    try {
      const result = await ArchivosUploadService.postApiArchivosUpload({
        File: file,
        UsuarioId: admin.id,
      });
      setArchivoId(Number(result.operationId));
      toast({ title: "Imagen subida correctamente" });
    } catch (err: any) {
      toast({ title: "Error al subir la imagen", description: err?.message, variant: "destructive" });
      setBannerImage("");
      setArchivoId(null);
    } finally {
      setUploadingImage(false);
    }
  }

  async function onSubmit(data: NewEventInput) {
    setSubmitting(true);
    try {
      const result = await EventosService.postApiV1EventosCreate({
        nombre: data.name,
        descripcion: data.description,
        fechaInicio: new Date(data.startDate + "T00:00:00").toISOString(),
        fechaFin: new Date(data.endDate + "T23:59:59").toISOString(),
        ubicacionId: Number(data.ubicacionId),
        tipoDeCategoriaEventoId: Number(data.tipoDeCategoriaEventoId),
        archivoId: archivoId ?? undefined,
      });

      if (result.ok) {
        toast({ title: "Evento creado exitosamente" });
        navigate("/events");
      } else {
        const errors = result.validationSummary?.errors;
        const msg = errors && errors.length > 0
          ? errors.map((e: any) => e.description || e.errorMessage || "").filter(Boolean).join(", ")
          : "Error al crear el evento";
        toast({ title: msg, variant: "destructive" });
      }
    } catch (err: any) {
      const msg = err?.body?.validationSummary?.errors?.[0]?.description || err?.message || "Error de conexión";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return "";
    return new Date(dateStr + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  }

  const selectedCatName = categories.find((c) => String(c.id) === watchedValues.tipoDeCategoriaEventoId)?.nombre || "";
  const selectedLocName = locations.find((l) => String(l.id) === watchedValues.ubicacionId)?.nombre || "";

  const previewImage = bannerImage || placeholderBanner;
  const hasAnyData = watchedValues.name || watchedValues.startDate || watchedValues.ubicacionId || watchedValues.tipoDeCategoriaEventoId || watchedValues.description;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/events")} className="rounded-xl" data-testid="button-back-events">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a eventos
      </Button>

      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70 mb-1">Nuevo</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Crear Evento</h1>
        <p className="text-sm text-muted-foreground mt-1">Completa los datos y ve la vista previa en tiempo real.</p>
      </div>

      {loadingCatalogs ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Imagen de banner</label>
                    {bannerImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-border">
                        <img src={bannerImage} alt="Banner preview" className="w-full h-40 object-cover" data-testid="img-banner-preview" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 bg-black/50 text-white rounded-lg"
                          onClick={() => setBannerImage("")}
                          data-testid="button-remove-banner"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        {uploadingImage && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                            <span className="text-white text-sm ml-2">Subiendo...</span>
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="absolute bottom-2 left-2 bg-black/40 border-white/30 text-white backdrop-blur-sm rounded-xl"
                          onClick={() => fileInputRef.current?.click()}
                          data-testid="button-change-banner"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          Cambiar
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center w-full h-36 rounded-xl border-2 border-dashed border-border/60 bg-accent/30 cursor-pointer hover-elevate"
                        data-testid="dropzone-banner"
                      >
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent mb-2">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">Sube una imagen de banner</p>
                        <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG o WebP</p>
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

                  <div className="grid grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="ubicacionId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Ubicación</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl" data-testid="select-event-location"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.filter((loc) => loc.id != null).map((loc) => (
                              <SelectItem key={loc.id} value={String(loc.id)}>{loc.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="tipoDeCategoriaEventoId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Categoría</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl" data-testid="select-event-category"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.filter((cat) => cat.id != null).map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>{cat.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Descripción</FormLabel>
                      <FormControl><Textarea {...field} placeholder="Describe el evento..." className="resize-none rounded-xl" rows={3} data-testid="input-event-description" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" disabled={submitting || uploadingImage} className="w-full rounded-xl" data-testid="button-create-event">
                    {submitting || uploadingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {uploadingImage ? "Subiendo imagen..." : submitting ? "Creando..." : "Crear Evento"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="lg:sticky lg:top-24 space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">Vista previa</p>
            <Card className="overflow-visible">
              <div className="rounded-t-xl overflow-hidden relative">
                <div className="aspect-[16/9]">
                  <img
                    src={previewImage}
                    alt="Vista previa del banner"
                    className="w-full h-full object-cover"
                    data-testid="img-preview-card"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  {selectedCatName && (
                    <Badge variant="secondary" className="mb-2 bg-white/15 text-white border-0 backdrop-blur-sm text-[11px]">
                      {selectedCatName}
                    </Badge>
                  )}
                  <h2 className="text-lg font-bold text-white leading-snug" data-testid="text-preview-name">
                    {watchedValues.name || "Nombre del evento"}
                  </h2>
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2.5">
                  {(watchedValues.startDate || watchedValues.endDate) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {watchedValues.startDate ? formatDate(watchedValues.startDate) : "Inicio"}
                        {" - "}
                        {watchedValues.endDate ? formatDate(watchedValues.endDate) : "Fin"}
                      </span>
                    </div>
                  )}
                  {selectedLocName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{selectedLocName}</span>
                    </div>
                  )}
                </div>

                {watchedValues.description && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{watchedValues.description}</p>
                  </div>
                )}

                {!hasAnyData && (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground">Los datos del evento aparecerán aquí mientras llenas el formulario</p>
                  </div>
                )}

                <div className="pt-3 border-t border-border/50 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Boletos</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Sin zonas configuradas</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Actividades</span>
                    </div>
                    <span className="text-xs text-muted-foreground">0</span>
                  </div>
                </div>

                <Badge variant="secondary" className="text-[11px]">Borrador</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
