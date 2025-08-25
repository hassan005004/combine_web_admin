# Overview

DomainHub is a multi-domain content management system that allows users to manage multiple websites from a single administrative interface. The application provides comprehensive tools for creating and managing domains, pages, SEO settings, and domain-specific configurations. It features a modern React frontend with shadcn/ui components, an Express.js backend, and PostgreSQL database integration with Drizzle ORM for type-safe database operations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development patterns
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, modern UI components
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form validation
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with TypeScript in ESM format
- **Framework**: Express.js for REST API endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL store for persistent authentication
- **Authentication**: Replit OpenID Connect integration for secure user authentication
- **API Design**: RESTful endpoints with structured error handling and logging middleware

## Database Design
- **Primary Database**: PostgreSQL with Neon serverless integration
- **Schema Management**: Drizzle Kit for migrations and schema versioning
- **Core Tables**:
  - Users: Authentication and profile data
  - Domains: Website configuration and metadata
  - Pages: Dynamic content with JSON-based sections
  - Domain Settings: Navigation and UI customization
  - SEO Settings: Search engine optimization and analytics
  - Sessions: Secure session storage

## Authentication & Authorization
- **Authentication Provider**: Replit OpenID Connect for secure user login
- **Session Strategy**: Server-side sessions with PostgreSQL persistence
- **Security**: HTTPS-only cookies with proper CSRF protection
- **User Management**: Single-user system with potential for multi-user expansion

## Content Management Features
- **Dynamic Page Builder**: JSON-based content sections for flexible page layouts
- **Domain Management**: Multi-domain support with individual configurations
- **SEO Tools**: Meta tags, analytics integration, and search engine optimization
- **Navigation Control**: Customizable menus and site structure
- **Real-time Validation**: Client-side and server-side data validation

# External Dependencies

## Core Infrastructure
- **Database**: Neon PostgreSQL serverless database for scalable data storage
- **Authentication**: Replit OpenID Connect service for secure user authentication
- **Deployment**: Replit hosting platform with integrated development environment

## Frontend Libraries
- **UI Framework**: Radix UI primitives with shadcn/ui for accessible, customizable components
- **Data Fetching**: TanStack Query for efficient server state management
- **Form Management**: React Hook Form with Hookform Resolvers for form validation
- **Styling**: Tailwind CSS with class-variance-authority for component variants
- **Utilities**: clsx for conditional styling, date-fns for date handling

## Backend Libraries
- **Database**: Drizzle ORM with @neondatabase/serverless for database connectivity
- **Validation**: Zod for runtime type checking and validation
- **Session Storage**: connect-pg-simple for PostgreSQL session management
- **Security**: Passport.js with OpenID Connect strategy for authentication
- **Development**: tsx for TypeScript execution, esbuild for production builds

## Development Tools
- **Build System**: Vite with React plugin for fast development and optimized builds
- **TypeScript**: Full type safety across frontend, backend, and shared schemas
- **Code Quality**: ESLint configuration with modern standards
- **Asset Handling**: PostCSS with Autoprefixer for CSS processing