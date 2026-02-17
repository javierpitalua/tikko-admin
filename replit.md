# Tikko Admin - Panel de Gestión de Eventos

## Overview
Event management dashboard (boletera) built with React, TypeScript, and Shadcn UI components. Connects to external API at `https://dev-api.tikko.mx` for authentication and event data. Uses localStorage for reservations and local state.

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + Shadcn UI
- **Routing**: wouter
- **API Client**: Auto-generated OpenAPI client in `client/api/` (openapi-typescript-codegen)
- **API Base URL**: `https://dev-api.tikko.mx`
- **Auth**: JWT token-based authentication via `AuthService.postApiV1AuthLogin`
- **Events Data**: Fetched from `EventosService.getApiV1EventosList`
- **Local State**: localStorage for reservations and local admin info

## Key Features
1. Admin login via API (JWT token authentication)
2. Dashboard with event metrics from API
3. Event listing with search and category filtering (from API)
4. Event detail with tabs (Evento, Actividades, Recinto, Precios, Adicionales, Cupones)
5. Event status management
6. Event preview mode (read-only view as customers would see it)
7. Create new events with date ranges
8. Activities with single date + time range (date, startTime/endTime) - same day only
9. Products/merchandise management per event
10. Ticket reservation with strict validation (max 8 per user per event)

## API Integration
- **Auth**: `AuthService.postApiV1AuthLogin({ userName, password })` → returns JWT token
- **Events List**: `EventosService.getApiV1EventosList()` → returns `EventosListResponse` with items
- **API Models**: `EventosListItem` has fields: id, nombre, descripcion, bannerUrl, fechaInicio, fechaFin, estadoDeEvento, tipoDeCategoriaEvento, ubicacion
- **Token**: Stored in localStorage as `tikko_token`, set on `OpenAPI.TOKEN` for authenticated requests

## Schema Notes
- API Event uses: nombre, descripcion, bannerUrl, fechaInicio, fechaFin, estadoDeEvento, tipoDeCategoriaEvento, ubicacion
- Activity has `date` (single day), `startTime`/`endTime`
- Activity display format: "16 abr 20:00 - 23:00 hrs"

## Project Structure
- `client/api/` - Auto-generated OpenAPI client (services, models, core)
- `client/src/pages/` - All page components (login, register, dashboard, events, event-detail, event-new, reserve)
- `client/src/components/app-sidebar.tsx` - Sidebar navigation component
- `client/src/lib/auth-context.tsx` - Authentication context provider (uses AuthService API)
- `client/src/lib/store.ts` - localStorage data management for local state
- `shared/schema.ts` - TypeScript interfaces and Zod validation schemas
- `openapi.json` - OpenAPI spec for the backend API

## Running
- `npm run dev` starts both the Express server and Vite dev server on port 5000
