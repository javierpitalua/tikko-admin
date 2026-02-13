import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { registerSchema, type RegisterInput } from "@shared/schema";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Ticket, User, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const { register: registerAdmin } = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState("");

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  function onSubmit(data: RegisterInput) {
    setError("");
    const result = registerAdmin(data.name, data.email, data.password);
    if (result.success) {
      navigate("/verify");
    } else {
      setError(result.error || "Error al registrarse");
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
          <p className="text-muted-foreground mt-1.5 text-sm">Crea tu cuenta de administrador</p>
        </div>

        <Card className="auth-card border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground" data-testid="text-register-title">Crear Cuenta</h2>
              <p className="text-sm text-muted-foreground mt-1">Completa tus datos para registrarte</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                {error && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2.5" data-testid="text-register-error">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nombre completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          <Input
                            {...field}
                            placeholder="Tu nombre"
                            className="pl-11 h-11 rounded-xl bg-accent/40 border-border/60 focus:bg-background transition-colors"
                            data-testid="input-name"
                          />
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
                      <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Correo electrónico</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="admin@ejemplo.com"
                            className="pl-11 h-11 rounded-xl bg-accent/40 border-border/60 focus:bg-background transition-colors"
                            data-testid="input-email"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
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
                              placeholder="Mín. 6 chars"
                              className="pl-11 h-11 rounded-xl bg-accent/40 border-border/60 focus:bg-background transition-colors"
                              data-testid="input-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Confirmar</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                            <Input
                              {...field}
                              type="password"
                              placeholder="Repite"
                              className="pl-11 h-11 rounded-xl bg-accent/40 border-border/60 focus:bg-background transition-colors"
                              data-testid="input-confirm-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl text-sm font-medium mt-2" data-testid="button-register">
                  Crear Cuenta
                  <ArrowRight className="w-4 h-4 ml-2" />
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
