import type { Admin, Event, Reservation } from "@shared/schema";

const STORAGE_KEYS = {
  AUTH: "boletera_auth",
  EVENTS: "boletera_events",
  RESERVATIONS: "boletera_reservations",
  ADMINS: "boletera_admins",
  VERIFIED: "boletera_verified",
};

export function getAuth(): { admin: Admin; verified: boolean } | null {
  const raw = localStorage.getItem(STORAGE_KEYS.AUTH);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth(admin: Admin, verified: boolean) {
  localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify({ admin, verified }));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.AUTH);
}

export function getAdmins(): Admin[] {
  const raw = localStorage.getItem(STORAGE_KEYS.ADMINS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAdmin(admin: Admin) {
  const admins = getAdmins();
  admins.push(admin);
  localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
}

export function getEvents(): Event[] {
  const raw = localStorage.getItem(STORAGE_KEYS.EVENTS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.length > 0 && ('date' in parsed[0] || !('startDate' in parsed[0]) || !('status' in parsed[0]))) {
        localStorage.removeItem(STORAGE_KEYS.EVENTS);
      } else {
        return parsed;
      }
    } catch {}
  }
  const seed = getSeedEvents();
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(seed));
  return seed;
}

export function saveEvents(events: Event[]) {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
}

export function getReservations(): Reservation[] {
  const raw = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
  if (!raw) {
    const seed = getSeedReservations();
    localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(seed));
    return seed;
  }
  try {
    const parsed = JSON.parse(raw) as Reservation[];
    let migrated = false;
    const result = parsed.map((r: any) => {
      if (!r.code || !r.createdAt) {
        migrated = true;
        return {
          ...r,
          code: r.code || generateReservationCode(),
          createdAt: r.createdAt || new Date(r.date + "T12:00:00.000Z").toISOString(),
        };
      }
      return r;
    });
    if (migrated) localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(result));
    return result;
  } catch {
    return [];
  }
}

export function saveReservations(reservations: Reservation[]) {
  localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
}

function getSeedEvents(): Event[] {
  return [
    {
      id: "evt-1",
      name: "Festival de Rock 2026",
      startDate: "2026-04-15",
      endDate: "2026-04-17",
      location: "Arena Ciudad de México",
      description: "El festival de rock más grande de Latinoamérica con bandas nacionales e internacionales.",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop",
      category: "Música",
      status: "publicado",
      zones: [
        { id: "z1-1", name: "VIP", capacity: 200, price: 3500, sold: 145 },
        { id: "z1-2", name: "Preferente", capacity: 500, price: 1800, sold: 380 },
        { id: "z1-3", name: "General", capacity: 2000, price: 800, sold: 1450 },
      ],
      activities: [
        { id: "a1-1", name: "Meet & Greet", startDate: "2026-04-15", endDate: "2026-04-15", startTime: "14:00", endTime: "15:30", description: "Conoce a los artistas" },
        { id: "a1-2", name: "Banda Principal", startDate: "2026-04-16", endDate: "2026-04-17", startTime: "20:00", endTime: "23:00", description: "Presentación estelar" },
      ],
      coupons: [
        { id: "c1-1", code: "ROCK20", discount: 20, active: true },
        { id: "c1-2", code: "VIP10", discount: 10, active: true },
      ],
      products: [
        { id: "p1-1", name: "Camiseta del Festival", price: 450, available: true },
        { id: "p1-2", name: "Gorra Oficial", price: 280, available: true },
        { id: "p1-3", name: "Poster Conmemorativo", price: 150, available: true },
        { id: "p1-4", name: "Estacionamiento VIP", price: 350, available: true },
      ],
      adminId: "admin-seed",
    },
    {
      id: "evt-2",
      name: "Conferencia Tech Summit",
      startDate: "2026-05-22",
      endDate: "2026-05-24",
      location: "Centro Banamex",
      description: "Conferencia de tecnología e innovación con speakers internacionales.",
      image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
      category: "Tecnología",
      status: "en_revision",
      zones: [
        { id: "z2-1", name: "Platinum", capacity: 100, price: 5000, sold: 72 },
        { id: "z2-2", name: "Gold", capacity: 300, price: 2500, sold: 210 },
        { id: "z2-3", name: "Standard", capacity: 1000, price: 1200, sold: 650 },
      ],
      activities: [
        { id: "a2-1", name: "Keynote IA", startDate: "2026-05-22", endDate: "2026-05-22", startTime: "10:00", endTime: "12:00", description: "El futuro de la inteligencia artificial" },
        { id: "a2-2", name: "Workshop Cloud", startDate: "2026-05-23", endDate: "2026-05-23", startTime: "14:00", endTime: "17:00", description: "Taller práctico de cloud computing" },
        { id: "a2-3", name: "Networking", startDate: "2026-05-24", endDate: "2026-05-24", startTime: "18:00", endTime: "20:00", description: "Sesión de networking" },
      ],
      coupons: [
        { id: "c2-1", code: "TECH30", discount: 30, active: true },
      ],
      products: [
        { id: "p2-1", name: "Playera Tech Summit", price: 500, available: true },
        { id: "p2-2", name: "Mochila Conferencia", price: 650, available: true },
        { id: "p2-3", name: "Estacionamiento", price: 200, available: false },
      ],
      adminId: "admin-seed",
    },
    {
      id: "evt-3",
      name: "Copa de Futbol Invitacional",
      startDate: "2026-06-10",
      endDate: "2026-06-15",
      location: "Estadio Azteca",
      description: "Torneo de futbol con equipos de toda la república.",
      image: "https://images.unsplash.com/photo-1459865264687-595d652de67e?w=600&h=400&fit=crop",
      category: "Deportes",
      status: "borrador",
      zones: [
        { id: "z3-1", name: "Palco", capacity: 50, price: 8000, sold: 35 },
        { id: "z3-2", name: "Tribuna", capacity: 800, price: 1500, sold: 620 },
        { id: "z3-3", name: "Sol", capacity: 3000, price: 500, sold: 2100 },
      ],
      activities: [
        { id: "a3-1", name: "Ceremonia apertura", startDate: "2026-06-10", endDate: "2026-06-10", startTime: "09:00", endTime: "10:30", description: "Ceremonia de apertura del torneo" },
        { id: "a3-2", name: "Final", startDate: "2026-06-15", endDate: "2026-06-15", startTime: "17:00", endTime: "19:00", description: "Partido de la final" },
      ],
      coupons: [
        { id: "c3-1", code: "GOL15", discount: 15, active: true },
        { id: "c3-2", code: "FANS50", discount: 50, active: false },
      ],
      products: [
        { id: "p3-1", name: "Jersey Oficial", price: 900, available: true },
        { id: "p3-2", name: "Bufanda del Torneo", price: 250, available: true },
        { id: "p3-3", name: "Balón Firmado", price: 1200, available: false },
        { id: "p3-4", name: "Estacionamiento", price: 150, available: true },
      ],
      adminId: "admin-seed",
    },
    {
      id: "evt-4",
      name: "Expo Gastronomía",
      startDate: "2026-07-05",
      endDate: "2026-07-07",
      location: "Expo Guadalajara",
      description: "Experiencia culinaria con los mejores chefs del país y degustaciones.",
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
      category: "Gastronomía",
      status: "publicado",
      zones: [
        { id: "z4-1", name: "Chef Experience", capacity: 80, price: 4500, sold: 55 },
        { id: "z4-2", name: "Premium", capacity: 400, price: 2000, sold: 290 },
        { id: "z4-3", name: "Acceso General", capacity: 1500, price: 650, sold: 980 },
      ],
      activities: [
        { id: "a4-1", name: "Masterclass", startDate: "2026-07-05", endDate: "2026-07-05", startTime: "11:00", endTime: "13:00", description: "Clase magistral de cocina mexicana" },
        { id: "a4-2", name: "Degustación", startDate: "2026-07-06", endDate: "2026-07-07", startTime: "15:00", endTime: "17:00", description: "Degustación de platillos" },
      ],
      coupons: [
        { id: "c4-1", code: "FOODIE25", discount: 25, active: true },
      ],
      products: [
        { id: "p4-1", name: "Delantal Chef", price: 380, available: true },
        { id: "p4-2", name: "Kit de Especias", price: 550, available: true },
        { id: "p4-3", name: "Estacionamiento", price: 100, available: true },
      ],
      adminId: "admin-seed",
    },
    {
      id: "evt-5",
      name: "Festival de Cine Independiente",
      startDate: "2026-08-20",
      endDate: "2026-08-24",
      location: "Cineteca Nacional",
      description: "Proyecciones de cine independiente nacional e internacional.",
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop",
      category: "Cultura",
      status: "borrador",
      zones: [
        { id: "z5-1", name: "Sala Principal", capacity: 300, price: 350, sold: 220 },
        { id: "z5-2", name: "Sala Alterna", capacity: 150, price: 250, sold: 100 },
      ],
      activities: [
        { id: "a5-1", name: "Proyección inaugural", startDate: "2026-08-20", endDate: "2026-08-20", startTime: "10:00", endTime: "12:30", description: "Película de apertura" },
        { id: "a5-2", name: "Q&A con directores", startDate: "2026-08-22", endDate: "2026-08-22", startTime: "16:00", endTime: "17:30", description: "Sesión con directores invitados" },
      ],
      coupons: [],
      products: [
        { id: "p5-1", name: "Tote Bag del Festival", price: 200, available: true },
        { id: "p5-2", name: "Libro de Fotografías", price: 750, available: true },
      ],
      adminId: "admin-seed",
    },
  ];
}

function getSeedReservations(): Reservation[] {
  return [
    { id: "res-1", code: "RES-A1B2C3", name: "Carlos López", email: "carlos@mail.com", phone: "5512345678", eventId: "evt-1", zoneId: "z1-2", quantity: 4, date: "2026-02-10", createdAt: "2026-02-10T14:30:00.000Z", status: "vendido" },
    { id: "res-2", code: "RES-D4E5F6", name: "María García", email: "maria@mail.com", phone: "5598765432", eventId: "evt-1", zoneId: "z1-3", quantity: 2, date: "2026-02-11", createdAt: new Date(Date.now() - 20 * 3600000).toISOString(), status: "apartado" },
    { id: "res-3", code: "RES-G7H8I9", name: "Ana Martínez", email: "ana@mail.com", phone: "5511112222", eventId: "evt-2", zoneId: "z2-2", quantity: 3, date: "2026-02-12", createdAt: "2026-02-12T09:00:00.000Z", status: "vendido" },
    { id: "res-4", code: "RES-J0K1L2", name: "Pedro Sánchez", email: "pedro@mail.com", phone: "5533334444", eventId: "evt-3", zoneId: "z3-3", quantity: 6, date: "2026-02-08", createdAt: "2026-02-08T16:45:00.000Z", status: "expirado" },
    { id: "res-5", code: "RES-M3N4O5", name: "Laura Díaz", email: "laura@mail.com", phone: "5555556666", eventId: "evt-4", zoneId: "z4-2", quantity: 2, date: "2026-02-09", createdAt: "2026-02-09T11:20:00.000Z", status: "vendido" },
    { id: "res-6", code: "RES-P6Q7R8", name: "Roberto Flores", email: "roberto@mail.com", phone: "5577778888", eventId: "evt-2", zoneId: "z2-3", quantity: 5, date: "2026-02-07", createdAt: "2026-02-07T08:15:00.000Z", status: "vendido" },
    { id: "res-7", code: "RES-S9T0U1", name: "Sofía Hernández", email: "sofia@mail.com", phone: "5599990000", eventId: "evt-5", zoneId: "z5-1", quantity: 3, date: "2026-02-13", createdAt: new Date(Date.now() - 10 * 3600000).toISOString(), status: "apartado" },
  ];
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function generateReservationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "RES-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
