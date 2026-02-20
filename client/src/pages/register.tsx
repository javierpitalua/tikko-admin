import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { UsuariosService } from "../../api/services/UsuariosService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Ticket, User, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

const registerSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  correo: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nombre: "", apellido: "", correo: "", password: "" },
  });

  async function onSubmit(data: RegisterInput) {
    setError("");
    setLoading(true);
    try {
      const result = await UsuariosService.postApiV1UsuariosCreate({
        nombre: data.nombre,
        apellidoPaterno: data.apellido,
        correoElectronico: data.correo,
        password: data.password,
        habilitado: true,
      });
      if (result.ok) {
        toast({ title: "Cuenta creada exitosamente. Ahora puedes iniciar sesión." });
        navigate("/login");
      } else {
        const errors = (result as any).validationSummary?.errors;
        const msg = errors && errors.length > 0
          ? errors.map((e: any) => e.description || e.errorMessage || "").filter(Boolean).join(", ")
          : "Error al crear la cuenta";
        setError(msg);
      }
    } catch (err: any) {
      const msg = err?.body?.validationSummary?.errors?.[0]?.description
        || err?.body?.validationSummary?.errorMessage
        || err?.message
        || "Error de conexión";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center auth-gradient-modern p-4 relative overflow-hidden">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="w-full max-w-[420px] relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-chart-3 mb-5 shadow-xl auth-logo-glow">
            <Ticket className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tikko Admin</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Crea tu cuenta para comenzar</p>
        </div>

        <Card className="auth-card border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground" data-testid="text-register-title">Crear Cuenta</h2>
              <p className="text-sm text-muted-foreground mt-1">Completa tus datos para registrarte</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2.5" data-testid="text-register-error">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nombre</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input
                              {...field}
                              placeholder="Tu nombre"
                              className="pl-11 h-11 rounded-xl bg-accent/40 border-border/60 focus:bg-background transition-colors"
                              data-testid="input-nombre"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="apellido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Apellido</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input
                              {...field}
                              placeholder="Tu apellido"
                              className="pl-11 h-11 rounded-xl bg-accent/40 border-border/60 focus:bg-background transition-colors"
                              data-testid="input-apellido"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="correo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Correo electrónico</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="tu@correo.com"
                            className="pl-11 h-11 rounded-xl bg-accent/40 border-border/60 focus:bg-background transition-colors"
                            data-testid="input-correo"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="Mínimo 6 caracteres"
                            className="pl-11 h-11 rounded-xl bg-accent/40 border-border/60 focus:bg-background transition-colors"
                            data-testid="input-password"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl text-sm font-medium mt-2" data-testid="button-register">
                  {loading ? "Creando cuenta..." : "Crear Cuenta"}
                  {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </form>
            </Form>

            <div className="mt-8 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-primary font-medium underline-offset-4 hover:underline transition-colors"
                  data-testid="link-login"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground/60 text-center mt-6">Tikko Admin v1.0</p>
      </div>
    </div>
  );
}
