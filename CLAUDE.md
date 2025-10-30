# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered legal request triage system built as a takehome assessment. The application acts as a "frontdoor" for employees to submit legal requests and get routed to the appropriate legal team member based on configurable rules.

**Core Functionality:**
- `/chat` route: Conversational interface where requestors submit legal requests and receive triage guidance
- `/configure` route: Admin interface for configuring triage rules (currently a placeholder)
- AI agent determines request type and asks follow-up questions (location, department, etc.) to route requests to the correct contact

## Architecture

### Monorepo Structure
- **`/server`**: Express.js backend (TypeScript, Node.js)
- **`/client`**: React frontend (TypeScript, Vite)
- **Root `.env`**: Shared environment configuration for both client and server

### Backend (`/server`)
- **Single entry point**: `src/index.ts` contains the entire Express server
- **Streaming architecture**: Uses OpenAI SDK with streaming responses via `openai.responses.create()`
- **API endpoint**: `POST /api/chat` accepts message history and streams AI responses back
- **Message sanitization**: Only allows `system`, `user`, and `assistant` roles
- **Model**: Currently uses `gpt-5-nano-2025-08-07` via Groq API (can be switched to OpenAI)

### Frontend (`/client`)
- **Framework**: React 19 with react-router-dom for navigation
- **Build tool**: Vite with environment variables loaded from root
- **Chat interface** (`src/pages/ChatPage.tsx`):
  - Manages message state and streaming UI
  - Sends conversation history to `/api/chat` endpoint
  - Uses ReadableStream API to handle streaming responses
- **Configure page** (`src/pages/ConfigurePage.tsx`): Placeholder for triage rule configuration
- **Navigation**: Navbar in `App.tsx` with links to `/chat` and `/configure`

## Development Commands

### Initial Setup
```bash
# Install dependencies for both client and server
cd server && npm install
cd ../client && npm install

# Configure environment variables
# Copy .env.example to .env and populate OPENAI_API_KEY
```

### Running the Application
```bash
# Terminal 1: Start backend (port 8999)
cd server
npm run dev

# Terminal 2: Start frontend (port 5173)
cd client
npm run dev
```

### Other Commands
```bash
# Backend
cd server
npm run build          # Compile TypeScript to dist/
npm start              # Build and run production server

# Frontend
cd client
npm run build          # Build production bundle
npm run lint           # Run ESLint
npm run preview        # Preview production build
```

## Key Implementation Details

### Environment Variables
- `OPENAI_API_KEY`: Required for AI functionality
- `OPENAI_BASE_URL`: API endpoint (defaults to Groq, can use OpenAI)
- `PORT`: Backend server port (default: 8999)
- `VITE_API_BASE_URL`: Frontend uses this to reach backend (default: http://localhost:8999)

### Streaming Implementation
- Backend uses OpenAI's Responses API with `stream: true`
- Filters for `response.output_text.delta` events
- Frontend uses `ReadableStream` with `TextDecoder` to handle chunked responses
- Abort controllers properly clean up streams when requests are cancelled

### Message Flow
1. User submits message in ChatPage
2. Frontend sends full conversation history to `/api/chat`
3. Backend sanitizes messages and forwards to OpenAI
4. Backend streams response chunks back to client
5. Frontend incrementally updates UI as chunks arrive

## Design Constraints

Per the assessment requirements:
- Stack must remain TypeScript, React, Express.js
- Must maintain `/chat` and `/configure` routes at specified URLs
- Authentication, deployment, and unit tests are intentionally out of scope
