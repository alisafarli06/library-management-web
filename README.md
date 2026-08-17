# Library Management Web

React frontend for the existing Library Management Spring Boot API.

This repository currently contains the application foundation only (Vite, React, TypeScript). Feature screens and API clients will be added later against the real backend.

## Stack

- React 19
- TypeScript (strict)
- Vite 7

## Prerequisites

- Node.js 20+
- The backend running at `http://localhost:8080` when you start integrating APIs (see `library-management-api`)

## Setup

```bash
npm install
cp .env.example .env
```

`VITE_API_ORIGIN` defaults to `http://localhost:8080`. During `npm run dev`, `/api` is always proxied to the local API (not to a production Render URL that may be in `.env`). Production builds call `VITE_API_ORIGIN` directly.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server (port 5173) |
| `npm run typecheck` | TypeScript project build (`tsc -b`) |
| `npm run build` | Typecheck and production bundle |
| `npm run preview` | Serve the production build locally |

During development, requests to `/api` are proxied to `http://localhost:8080`. A production `VITE_API_ORIGIN` in `.env` is ignored by the dev proxy so localhost:5173 is not sent to Render (which only allows the Vercel origin).

## What is not included yet

- Pages and feature UI
- Auth flows or JWT storage
- HTTP client wrappers or DTO types
- Mock data
