# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

EduFlow (教学服务管理系统) is a Next.js 16 prototype application for managing educational services, including student enrollment, tutoring sessions, and income tracking. This is a **frontend-only prototype** that uses localStorage for data persistence - there is no backend API.

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **React**: v19
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **UI Components**: shadcn/ui (radix-ui based)
- **Forms**: react-hook-form + zod validation
- **Icons**: lucide-react
- **Notifications**: sonner

## Project Structure

```
app/
  (auth)/          # Authentication pages (login, register)
  (dashboard)/     # Main application pages with sidebar layout
  layout.tsx       # Root layout with AuthProvider
components/
  ui/              # shadcn/ui components (do not modify directly)
  layout/          # DashboardLayout (sidebar, header)
  calendar/        # Calendar views (Day, Week, Month)
  students/        # Student-related dialogs
  feedback/        # Feedback form component
contexts/
  AuthContext.tsx  # Authentication state and methods
hooks/
  useCalendarData.ts
lib/
  storage.ts       # LocalStorage management for mock data
  mock-data.ts     # Exports STORAGE_KEYS and data accessors
  mock-data/       # Individual mock data files (users, orders, students, etc.)
  utils.ts         # Utility functions (cn helper)
types/
  index.ts         # All TypeScript interfaces and enums
```

## Architecture Notes

### Role-Based Access Control

The system has 5 roles defined in `types/index.ts`:
- `SALES` (招生老师) - Student enrollment, order creation
- `TUTOR` (伴学教练) - Teaching, feedback submission
- `MANAGER` (学管) - Team management, study plan review
- `OPERATOR` (运营人员) - Order management, user management
- `ADMIN` (管理员) - System configuration

Users can have **multiple roles** and switch between them via the header dropdown. The `currentRole` in AuthContext determines which navigation items and dashboard views are shown.

### Data Persistence

All data is stored in browser localStorage with keys prefixed `eduflow:`. See `STORAGE_KEYS` in `lib/storage.ts`. The `initializeMockData()` function seeds initial data on first load. **This is a prototype** - data will be lost if localStorage is cleared.

### Route Groups

- `(auth)` - Pages without sidebar (login, register)
- `(dashboard)` - Pages with sidebar layout, requires authentication

### Dashboard Layout Pattern

Dashboard pages in `app/(dashboard)/` are wrapped by `app/(dashboard)/layout.tsx` which:
1. Checks authentication status via `useAuth()`
2. Redirects to `/login` if not authenticated
3. Renders `DashboardSidebar` and `DashboardHeader`
4. Navigation items are filtered by `currentRole`

### Adding New Pages

1. Create the page file in `app/(dashboard)/your-page/page.tsx`
2. Add navigation entry in `components/layout/DashboardLayout.tsx` under `navItems` with appropriate roles
3. Use `"use client"` directive for pages that need client-side hooks

## Code Conventions

- Path alias: `@/*` maps to project root
- Components in `components/ui/` are shadcn/ui - avoid direct modifications
- Use `cn()` utility for conditional class merging
- Mock data files in `lib/mock-data/` export arrays of typed objects
