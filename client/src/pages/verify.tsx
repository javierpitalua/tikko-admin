import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Ticket, ShieldCheck, AlertCircle, Mail, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function VerifyPage() {
  const { verifyToken, pendingToken, admin, logout } = useAuth();
  const [, navigate] = useLocation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const { toast } = useToast();

  if (!admin || !pendingToken) {
    navigate("/login");
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-md bg-primary mb-4">
            <Ticket className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Verificación</h1>
          <p className="text-muted-foreground mt-1">Un paso más para acceder</p>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl">Verifica tu identidad</CardTitle>
            </div>
            <CardDescription>
              Hemos enviado un código de 6 dígitos a tu correo electrónico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3 p-4 rounded-md bg-accent/50 border border-border">
              <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <p className="text-muted-foreground">Código enviado a:</p>
                <p className="font-medium text-foreground" data-testid="text-masked-email">{maskedEmail}</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="text-verify-error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">Ingresa el código de verificación</p>
              <InputOTP maxLength={6} value={otp} onChange={setOtp} data-testid="input-otp">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button onClick={handleVerify} className="w-full" data-testid="button-verify">
              Verificar e Ingresar
            </Button>

            <div className="flex flex-col items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResend}
                disabled={resent}
                data-testid="button-resend"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {resent ? "Código reenviado" : "Reenviar código"}
              </Button>
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="text-sm text-muted-foreground hover:underline underline-offset-4"
                data-testid="link-back-login"
              >
                Volver al inicio de sesión
              </button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Revisa tu bandeja de entrada y carpeta de spam. El código expira en 10 minutos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
