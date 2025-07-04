# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js data dashboard application built with TypeScript and PostgreSQL. The project serves as a scalable platform for data analysis tools with authentication, designed for small team internal use (3-5 people).

## Development Rules & Methodology

When working on this project, always follow these core principles:

### Step One: Project Documentation Review
- First review all project documentation under the `project-docs` directory to understand project objectives, architecture, and implementation methods
- If no `project-docs` folder exists, create one with the following structure:
  ```
  /project-docs
      ├── overview.md          # Project Overview: High-level background, core vision, main objectives, and problems solved
      ├── requirements.md      # Requirements & Features: System requirements, feature descriptions, business rules, edge cases
      ├── tech-specs.md        # Technical Specifications: Tech stack, development methods, coding standards, database design
      ├── user-structure.md    # User Flow & Project Structure: User journey, data flow, project file structure
      └── timeline.md          # Project Timeline & Progress: Project milestones, progress tracking, change records
  ```

### Step Two: Task Understanding & Implementation

#### For Requirements Analysis:
- Review all project documentation to understand existing system features
- Fully comprehend user requirements and think from the user's perspective
- As a product manager, identify gaps in user requirements and discuss until satisfied
- Use the simplest solution to meet user requirements rather than complex solutions
- Use MCP servers like use context7 for get actual documentation about packages/libs

#### For Code Writing:
- Review all project documentation to understand existing functionality and technical specifications
- Use SOLID principles for code structure design and design patterns for common problems
- Write comprehensive comments for all code modules
- Incorporate necessary monitoring measures to identify where errors occur
- Use simple and controllable solutions rather than complex ones

#### For Problem Solving:
- Completely read the code repository and understand all functionality and logic
- Consider causes of code errors and propose problem-solving approaches
- Engage in multiple interactions, summarizing results and adjusting solutions until satisfied
- Always understand requirements and determine scope of modifications
- Ensure each code change doesn't break existing functionality
- Maintain minimal changes whenever possible

### Step Three: Reflection & Documentation
After completing tasks, reflect on the steps taken, consider potential issues and improvements, and update files in the `project-doc` directory.

### Core Methodology
- **Systems Thinking**: Break down requirements into manageable parts and carefully consider each step
- **Decision Tree**: Evaluate multiple solutions and their consequences using structured methods
- **Iterative Improvement**: Consider improvements, edge cases, and optimizations before finalizing code

## Tech Stack & Architecture

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components in `/src/components/ui/`

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js API Routes
- **Authentication**: iron-session (cookie-based)
- **Validation**: Zod (for data validation)

### Database
- **Database**: PostgreSQL 14+
- **Client**: Native `pg` client
- **Migrations**: Simple SQL files

### Deployment
- **Process Manager**: PM2
- **Configuration**: `ecosystem.config.js`
- **SSL**: Cloudflare

## Development Setup

### Prerequisites
- Node.js 18+ (specified in package.json engines)
- PostgreSQL 14+
- npm or yarn

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Setup
Create `.env.local` with required database and session configurations.

## Project Structure

```
├── project-docs/          # Project documentation
├── src/
│   ├── app/
│   │   ├── dashboard/     # Main dashboard page
│   │   ├── login/         # Authentication page
│   │   ├── api/
│   │   │   └── auth/      # Authentication API routes
│   │   └── layout.tsx     # Root layout
│   ├── components/
│   │   ├── ui/            # Reusable UI components
│   │   └── Layout.tsx     # Main layout component
│   ├── lib/
│   │   ├── auth.ts        # Authentication utilities
│   │   ├── db.ts          # Database connection
│   │   └── utils.ts       # Common utilities
│   ├── middleware.ts      # Authentication middleware
│   └── types/             # TypeScript type definitions
├── ecosystem.config.js    # PM2 deployment config
└── package.json
```

## Authentication System

The project uses iron-session for secure, cookie-based authentication. Sessions are encrypted and stored in HTTP-only cookies.

## Notes

- Always run `npm run lint` before committing changes
- Use TypeScript strict mode - all types must be properly defined
- Follow mobile-first approach with Tailwind CSS
- Validate all API inputs with Zod
- Use parameterized queries for database operations
- Keep secrets in environment variables only