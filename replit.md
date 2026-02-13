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
5. Event detail with editable zones (capacity, price), activities, and coupons
6. Create new events
7. Ticket reservation with strict validation (max 8 per user per event)

## Project Structure
- `client/src/pages/` - All page components (login, register, verify, dashboard, events, event-detail, event-new, reserve)
- `client/src/components/app-sidebar.tsx` - Sidebar navigation component
- `client/src/lib/auth-context.tsx` - Authentication context provider
- `client/src/lib/store.ts` - localStorage data management and seed data
- `shared/schema.ts` - TypeScript interfaces and Zod validation schemas

## Running
- `npm run dev` starts both the Express server and Vite dev server on port 5000
