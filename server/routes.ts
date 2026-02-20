import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { log } from "./index";

const API_BASE = "https://dev-api.tikko.mx";

async function getAuthToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/Auth/Login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: process.env.TIKKO_API_USER || "admin@tikko.mx",
        password: process.env.TIKKO_API_PASS || "Admin123!",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token || data.accessToken || null;
  } catch (err) {
    console.error("[cron] Error getting auth token:", err);
    return null;
  }
}

async function getStatusId(token: string, keyword: string): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/EstadosDeReservacion/List`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const items = data.items || [];
    const match = items.find((s: any) => {
      const clave = (s.clave || "").toLowerCase();
      const desc = (s.descripcion || "").toLowerCase();
      return clave.includes(keyword) || desc.includes(keyword);
    });
    return match?.id || null;
  } catch (err) {
    console.error(`[cron] Error getting status '${keyword}':`, err);
    return null;
  }
}

async function expireReservations() {
  log("Running reservation expiration check...", "cron");

  const token = await getAuthToken();
  if (!token) {
    log("Could not get auth token, skipping expiration check", "cron");
    return;
  }

  const apartadoId = await getStatusId(token, "apartad");
  const expiradaId = await getStatusId(token, "expirad");

  if (!apartadoId || !expiradaId) {
    log(`Missing status IDs (apartado=${apartadoId}, expirada=${expiradaId}), skipping`, "cron");
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/api/v1/Reservaciones/List?EstadoDeReservacionId=${apartadoId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      log(`Error fetching reservations: ${res.status}`, "cron");
      return;
    }
    const data = await res.json();
    const reservations = data.items || [];
    const now = new Date();
    let expiredCount = 0;

    for (const r of reservations) {
      if (r.fechaPago) continue;

      const expDate = r.fechaExpiracion ? new Date(r.fechaExpiracion) : null;
      if (!expDate || expDate >= now) continue;

      try {
        const editRes = await fetch(`${API_BASE}/api/v1/Reservaciones/Edit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: r.id,
            folio: r.folio,
            nombre: r.nombre,
            correoElectronico: r.correoElectronico,
            telefono: r.telefono,
            eventoId: r.eventoId,
            zonaEventoId: r.zonaEventoId,
            estadoDeReservacionId: expiradaId,
            cantidadBoletos: r.cantidadBoletos,
            precioUnitario: r.precioUnitario,
            subtotal: r.subtotal,
            fechaReservacion: r.fechaReservacion,
            fechaExpiracion: r.fechaExpiracion,
            fechaPago: r.fechaPago,
          }),
        });

        if (editRes.ok) {
          expiredCount++;
          log(`Expired reservation ${r.folio} (ID: ${r.id})`, "cron");
        } else {
          const errText = await editRes.text();
          log(`Failed to expire reservation ${r.folio}: ${editRes.status} ${errText}`, "cron");
        }
      } catch (err) {
        log(`Error expiring reservation ${r.folio}: ${err}`, "cron");
      }
    }

    log(`Expiration check complete: ${expiredCount}/${reservations.length} reservations expired`, "cron");
  } catch (err) {
    log(`Error during expiration check: ${err}`, "cron");
  }
}

async function proxyToApi(req: Request, res: Response) {
  const url = `${API_BASE}${req.originalUrl}`;
  const headers: Record<string, string> = {
    "Content-Type": req.headers["content-type"] || "application/json",
  };
  if (req.headers["authorization"]) {
    headers["Authorization"] = req.headers["authorization"] as string;
  }

  try {
    const isMultipart = (req.headers["content-type"] || "").includes("multipart");
    let body: any = undefined;

    if (req.method !== "GET" && req.method !== "HEAD") {
      if (isMultipart) {
        const rawRes = await fetch(url, {
          method: req.method,
          headers: { Authorization: headers["Authorization"] || "" },
          body: req.rawBody as Buffer,
          duplex: "half",
        } as any);
        const data = await rawRes.text();
        res.status(rawRes.status);
        rawRes.headers.forEach((v, k) => {
          if (k.toLowerCase() !== "transfer-encoding") res.setHeader(k, v);
        });
        return res.send(data);
      }
      body = JSON.stringify(req.body);
    }

    const apiRes = await fetch(url, {
      method: req.method,
      headers,
      body,
    });

    const data = await apiRes.text();
    res.status(apiRes.status);
    apiRes.headers.forEach((v, k) => {
      if (k.toLowerCase() !== "transfer-encoding") res.setHeader(k, v);
    });
    res.send(data);
  } catch (err: any) {
    log(`Proxy error: ${err.message}`, "proxy");
    res.status(502).json({ message: "Error connecting to API" });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/v1/") || req.path.startsWith("/api/Archivos/")) {
      return proxyToApi(req, res);
    }
    next();
  });

  expireReservations();
  setInterval(expireReservations, 10 * 60 * 1000);

  return httpServer;
}
