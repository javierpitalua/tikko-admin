import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const tokenSchema = z.object({
  token: z.string().length(6, "El token debe tener 6 dígitos"),
});

export const reserveTicketSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  phone: z.string().regex(/^\d{10}$/, "El número celular debe tener 10 dígitos"),
  eventId: z.string().min(1, "Selecciona un evento"),
  zoneId: z.string().min(1, "Selecciona una zona"),
  quantity: z.number().min(1, "Mínimo 1 boleto").max(8, "Máximo 8 boletos por usuario por evento"),
});

export interface Admin {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Zone {
  id: string;
  name: string;
  capacity: number;
  price: number;
  sold: number;
}

export interface Activity {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount: number;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  image: string;
  category: string;
  zones: Zone[];
  activities: Activity[];
  coupons: Coupon[];
  products: Product[];
  adminId: string;
}

export interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventId: string;
  zoneId: string;
  quantity: number;
  date: string;
  status: "apartado" | "vendido";
}

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type TokenInput = z.infer<typeof tokenSchema>;
export type ReserveTicketInput = z.infer<typeof reserveTicketSchema>;
