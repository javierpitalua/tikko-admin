import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Ticket, ShieldCheck, AlertCircle, Copy, Check } from "lucide-react";

export default function VerifyPage() {
  const { verifyToken, pendingToken, admin, logout } = useAuth();
  const [, navigate] = useLocation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  if (!admin || !pendingToken) {
    navigate("/login");
    return null;
  }

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
      setError("Token inválido. Intenta de nuevo.");
    }
  }

  function handleCopy() {
    if (pendingToken) {
      navigator.clipboard.writeText(pendingToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
              <CardTitle className="text-xl">Token de seguridad</CardTitle>
            </div>
            <CardDescription>
              Se ha enviado un token de verificación a <span className="font-medium text-foreground">{admin.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-md bg-accent/50 border border-border">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide font-medium">Token simulado (copia este código)</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-2xl font-mono font-bold tracking-[0.3em] text-foreground" data-testid="text-token">
                  {pendingToken}
                </code>
                <Button size="icon" variant="ghost" onClick={handleCopy} data-testid="button-copy-token">
                  {copied ? <Check className="w-4 h-4 text-chart-2" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="text-verify-error">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">Ingresa el código de 6 dígitos</p>
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

            <div className="text-center">
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="text-sm text-muted-foreground hover:underline underline-offset-4"
                data-testid="link-back-login"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
