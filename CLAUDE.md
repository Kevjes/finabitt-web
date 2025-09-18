# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server (with Turbopack for faster builds)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

Access the application at [http://localhost:3000](http://localhost:3000) during development.

## Project Overview

**Finabitt** is a comprehensive web application that integrates three core modules: habit tracking, performance management, and financial management. Built with a mobile-first approach using Next.js 15, Firebase, and Tailwind CSS.

### Core Architecture

The project follows **Clean Architecture principles** with clear separation of concerns:

```
src/
├── domain/          # Business entities and use cases
├── data/           # Repositories and data sources
├── presentation/   # React components and UI hooks
├── infrastructure/ # External services (Firebase)
└── shared/        # Types, constants, utilities
```

### Key Design Principles

1. **Mobile-first responsive design** using Tailwind CSS
2. **Dark/Light theme support** with system preference detection
3. **Module synchronization** - actions in one module can trigger updates in others
4. **User validation required** - all suggestions must be explicitly approved by users
5. **Clean Architecture** - dependencies flow inward toward the domain layer

### Technology Stack

- **Frontend**: Next.js 15 with React 19, TypeScript
- **Styling**: Tailwind CSS v4 with custom design system
- **Backend**: Firebase (Authentication + Firestore)
- **Build Tool**: Turbopack for faster development builds

### Authentication & Data Flow

- Firebase Authentication handles user login/registration
- `AuthProvider` context manages authentication state globally
- `ThemeProvider` context manages dark/light mode with localStorage persistence
- All data flows through Firebase Firestore with type-safe interfaces

### Design System

**Colors:**
- Primary: Blue (#3B82F6) with light/dark variants
- Accent: Orange/Amber (#F59E0B)
- Semantic: Success (green), Warning (amber), Error (red), Info (blue)

**Theme Management:**
- Uses Tailwind's `dark:` prefix for dark mode styles
- Theme state managed via `useTheme` hook
- Supports 'light', 'dark', and 'system' preferences

### Module Integration

The application features three interconnected modules:

1. **Habits Module**: Track good/bad habits with frequency settings
2. **Performance Module**: Task management with priority and status tracking
3. **Finance Module**: Account management, transactions, budgets, and goals

**Cross-module synchronization:**
- Habits can automatically create recurring tasks
- Completed habits can trigger financial transactions (savings from avoided bad habits)
- Tasks can be linked to pending financial transactions
- Account linking rules allow automated transfers between accounts

### Key Interfaces

Core TypeScript interfaces are defined in `src/shared/types/index.ts`:
- `User`, `Habit`, `HabitProgress`
- `Task` (with status: pending/in_progress/completed/cancelled/rescheduled)
- `Account`, `Transaction`, `Budget`, `Goal`
- Cross-module linking via `linkedHabitId`, `linkedTransactionId`, etc.

### Firebase Configuration

Firebase is pre-configured with:
- Project ID: `finabitt05f45`
- Authentication and Firestore enabled
- Configuration in `src/infrastructure/firebase/config.ts`

### Component Organization

- **UI Components**: Reusable components in `src/presentation/components/ui/`
- **Feature Components**: Module-specific components organized by feature
- **Hooks**: Custom React hooks in `src/presentation/hooks/`
- **Providers**: Context providers for authentication and theme management