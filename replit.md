# EventTicket Admin - Panel de Gestión de Eventos

## Overview
A frontend-only event management dashboard (boletera) built with React, TypeScript, and Shadcn UI components. Uses localStorage for data persistence with seed data. No database required.

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Shadcn UI
- **Routing**: wouter
- **State**: localStorage for all data persistence (no backend/database)
- **Auth**: Simulated admin registration/login with 6-digit OTP token verification

## Key Features
1. Admin registration and login with email/password
2. Simulated token verification (6-digit OTP displayed on screen)
3. Dashboard with computed metrics (tickets sold, revenue, remaining, events count)
4. Event listing with search and category filtering
5. Event detail with 6 tabs (Evento, Actividades, Recinto, Precios, Adicionales, Cupones)
6. Event status management (Borrador → En revisión → Publicado)
7. Event preview mode (read-only view as customers would see it)
8. Create new events with date ranges (startDate/endDate)
9. Activities with time ranges (startTime/endTime)
10. Products/merchandise management per event
11. Ticket reservation with strict validation (max 8 per user per event)

## Schema Notes
- Event has `startDate`/`endDate` (not single `date`)
- Event has `status` field: "borrador" | "en_revision" | "publicado"
- Activity has `startTime`/`endTime` (not single `time`)
- Product interface: id, name, price, available

## Project Structure
- `client/src/pages/` - All page components (login, register, verify, dashboard, events, event-detail, event-new, reserve)
- `client/src/components/app-sidebar.tsx` - Sidebar navigation component
- `client/src/lib/auth-context.tsx` - Authentication context provider
- `client/src/lib/store.ts` - localStorage data management and seed data (auto-migrates old schema)
- `shared/schema.ts` - TypeScript interfaces and Zod validation schemas

## Running
- `npm run dev` starts both the Express server and Vite dev server on port 5000
