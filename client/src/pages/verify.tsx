import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Ticket, ShieldCheck, AlertCircle, Mail, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyPage() {
  const { verifyToken, pendingToken, admin, logout } = useAuth();
  const [, navigate] = useLocation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!admin || !pendingToken) {
      navigate("/login");
    } else if (!emailSent) {
      setEmailSent(true);
      toast({
        title: "Código enviado",
        description: `Hemos enviado un código de verificación a tu correo electrónico.`,
      });
    }
  }, [admin, pendingToken, navigate, emailSent, toast]);

  if (!admin || !pendingToken) {
    return null;
  }

  const maskedEmail = admin.email.replace(/(.{2})(.*)(@.*)/, (_, start, middle, domain) =>
    start + "*".repeat(Math.min(middle.length, 6)) + domain
  );

  function handleVerify() {
    setError("");
    if (otp.length !== 6) {
      setError("Ingresa los 6 dígitos del token");
      return;
    }
    const success = verifyToken(otp);
    if (success) {
      navigate("/dashboard");
    } else {
      setError("Token inválido. Revisa tu correo e intenta de nuevo.");
    }
  }

  function handleResend() {
    setResent(true);
    toast({ title: "Token reenviado", description: `Se envió un nuevo código a ${maskedEmail}` });
    setTimeout(() => setResent(false), 10000);
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
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Verificación</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">Un paso más para acceder</p>
        </div>

        <Card className="auth-card border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground" data-testid="text-verify-title">Verifica tu identidad</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Ingresa el código de 6 dígitos</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/50">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="text-sm min-w-0">
                  <p className="text-muted-foreground text-xs">Código enviado a:</p>
                  <p className="font-medium text-foreground truncate" data-testid="text-masked-email">{maskedEmail}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-chart-3/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Código enviado por correo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Revisa tu bandeja de entrada en {maskedEmail}</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm" data-testid="text-verify-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex flex-col items-center gap-4 py-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Código de verificación</p>
                <InputOTP maxLength={6} value={otp} onChange={setOtp} data-testid="input-otp">
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="w-12 h-12 rounded-xl border-border/60 bg-accent/30 text-base font-semibold" />
                    <InputOTPSlot index={1} className="w-12 h-12 rounded-xl border-border/60 bg-accent/30 text-base font-semibold" />
                    <InputOTPSlot index={2} className="w-12 h-12 rounded-xl border-border/60 bg-accent/30 text-base font-semibold" />
                    <InputOTPSlot index={3} className="w-12 h-12 rounded-xl border-border/60 bg-accent/30 text-base font-semibold" />
                    <InputOTPSlot index={4} className="w-12 h-12 rounded-xl border-border/60 bg-accent/30 text-base font-semibold" />
                    <InputOTPSlot index={5} className="w-12 h-12 rounded-xl border-border/60 bg-accent/30 text-base font-semibold" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button onClick={handleVerify} className="w-full h-11 rounded-xl text-sm font-medium" data-testid="button-verify">
                Verificar e Ingresar
              </Button>

              <div className="flex flex-col items-center gap-3 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={resent}
                  className="rounded-xl"
                  data-testid="button-resend"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {resent ? "Código reenviado" : "Reenviar código"}
                </Button>
                <button
                  onClick={() => { logout(); navigate("/login"); }}
                  className="text-sm text-muted-foreground hover:underline underline-offset-4 transition-colors"
                  data-testid="link-back-login"
                >
                  Volver al inicio de sesión
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground/60">
                Revisa tu bandeja de entrada y carpeta de spam. El código expira en 10 minutos.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground/60 text-center mt-6">Tikko Admin v1.0</p>
      </div>
    </div>
  );
}
