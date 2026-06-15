# Optimus 🚀 — Personal AI Workflow Assistant

Optimus is your advanced personal AI assistant designed to unify your digital life, automate background workflows, and amplify daily productivity. It acts as a central hub connecting your email client, calendar, chat apps, and digital workspace, delivering context-aware daily briefings, real-time alerts, and intelligent text automation.

---

## 🏗️ Project Statement & AI Development

This project represents a hybrid, collaborative AI-driven architecture:
* **Codebase Implementation:** 100% written, styled, and optimized by AI.
* **System Architecture, Design, & Connections:** Directed, structured, and overseen by human creators.

This approach leverages state-of-the-art AI for development and execution, while keeping security protocols, integration architectures, and product design closely aligned with engineering best practices.

---

## ✨ Implemented Core Features

### 🤖 1. Advanced AI Agent
* **API Integration:** Leverages the latest Gemini models (`gemini-2.5-flash` and `gemini-2.5-pro`) for intelligent, contextual conversation and reasoning.
* **Function Calling / Tools:** The AI agent can directly execute functions on your behalf, including reading emails, listing calendar events, creating calendar events, and preparing drafts.

### 📧 2. Deep Gmail Integration
* **Real-time Access:** Scan your Gmail inbox, count unread messages, and locate specific emails.
* **Email Search:** Search your email threads by sender, subject line, or keywords.
* **Draft Creator:** Draft responses automatically using the AI and save them directly as Gmail drafts.
* **Direct Send:** Send approved responses directly to recipients via secure OAuth connections.

### 📅 3. Dynamic Google Calendar Integration
* **Bidirectional Sync:** Syncs live calendar events with Google Calendar.
* **Dynamic Widget:** The dashboard calendar widget displays live Google Calendar events and supports full CRUD actions (Add and Delete).
* **AI Tooling:** The AI assistant can list, create, and delete calendar events through chat tools.

### 💬 4. WhatsApp Linker
* **Live Connection:** Integrates with WhatsApp via Baileys socket connection.
* **Pairing Code / QR:** Connect using phone numbers and pairing codes generated directly on the UI.
* **AI Chat Dispatch:** Ask the assistant to send WhatsApp updates or alerts.

### 📋 5. Customized Daily Briefings
* **Schedule Generator:** Configure recurring times, frequencies, specific apps (Gmail, Slack), and priority filters.
* **Intelligent Synthesis:** Summarizes recent unread threads, upcoming meetings, and urgent tasks into a clean daily digest.
* **Multi-Platform Dispatch:** Send the generated briefing directly to your WhatsApp or Gmail account as a draft or direct message.

### 🛠️ 6. Workspace Productivity Widgets
* **Quick Tasks (Todos):** Add, toggle, and delete workspace checklist items, persisted to your database.
* **Sticky Notes:** Drag-and-drop color-coded memo pads with persistent layout positioning.
* **World Clock:** View multiple timezones dynamically (Local, New York, London, Tokyo) with visual day/night theme indicators.
* **Weather Widget:** Today's forecast using the OpenWeather API with geolocation fallback.

---

## 🗄️ Database Architecture (InsForge BaaS)

Optimus uses a PostgreSQL database schema managed via **InsForge**. The tables are structured to support multi-tenancy and data isolation:

1. `users` — Secure profiles, Google OAuth credential payloads (tokens are encrypted).
2. `briefing_schedules` — User briefing preferences, selected applications, and timing rules.
3. `generated_briefings` — Log of compiled briefings, summaries, and categories metadata.
4. `todos` — User tasks, workspace priorities, and completion status.
5. `sticky_notes` — Position, colors, and content of user dashboard notes.
6. `saved_articles` — Curated bookmarks and saved feeds for subsequent AI summaries.

---

## 🔒 Security & Security Practices

* **Sensitive Data Isolation:** All API credentials, OAuth tokens, and system secrets are loaded server-side using environment variables (`.env.local`).
* **Session Verification:** API endpoints verify the active user's session before performing database mutations or dispatching integrations actions.
* **Local Storage Fallbacks:** All features gracefully fall back to local sandboxed settings when integration accounts are not connected, ensuring user data privacy by default.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_INSFORGE_BASE_URL=https://your-project.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build for Production
```bash
npm run build
```
The Next.js compiler uses Turbopack to compile the client-side routes and serverless APIs cleanly.
