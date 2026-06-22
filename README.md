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

### 🤖 1. Advanced AI Agent & Automation
* **API Integration:** Leverages the latest Gemini models (`gemini-2.5-flash` and `gemini-2.5-pro`) for intelligent, contextual conversation and reasoning.
* **Function Calling / Tools:** The AI agent can directly execute functions on your behalf, including reading real emails, listing real calendar events, creating calendar events, and dispatching live WhatsApp messages.

### 📧 2. Deep Gmail Integration (Live OAuth)
* **Real-time Access:** Connects securely to your actual Gmail account via OAuth. Scan your inbox, fetch live unread messages, and locate specific emails instantly.
* **Email Search:** Search your email threads by sender, subject line, or keywords.
* **Draft Creator:** Draft responses automatically using the AI and save them directly as Gmail drafts in your live account.
* **Direct Send:** Send approved responses directly to real recipients without leaving the dashboard.

### 📅 3. Dynamic Google Calendar Integration (Live OAuth)
* **Bidirectional Sync:** Syncs live calendar events directly with your personal Google Calendar.
* **Dynamic Widget:** The dashboard calendar widget displays live Google Calendar events and supports full CRUD actions (Add and Delete).
* **AI Tooling:** The AI assistant can list, create, and delete actual calendar events through chat tools.

### 💬 4. WhatsApp Gateway (Live Baileys Web Socket)
* **Live WhatsApp Connection:** Connect your actual WhatsApp account via a live Baileys web socket pairing code.
* **Persistent Sessions:** Your WhatsApp authentication session is securely encrypted and saved in the PostgreSQL database, automatically restoring when the server restarts.
* **Live Messaging:** Send actual WhatsApp messages to real phone numbers directly from the dashboard or through the AI chat agent.

### 📋 5. Customized Daily Briefings
* **Intelligent Synthesis:** Summarizes recent unread live threads and upcoming meetings into a clean daily digest with `Critical`, `High`, and `Medium` priority tagging.
* **Dedicated Briefings Dashboard:** A clean, glassmorphic UI where users can view generated summaries based on their real data and manually force a generation.

### 🎙️ 6. JARVIS Voice Assistant (Hybrid UI)
* **Web Speech API:** Browser native speech-to-text and text-to-speech for seamless voice interactions without heavy external dependencies.
* **Hybrid Commands:** Uses Gemini to intelligently translate natural human speech into strict JSON UI commands (e.g., navigating pages, reading news) while providing conversational audio responses.
* **Global Access:** Instantly trigger the AI voice overlay from anywhere in the app using the `Ctrl+Shift+M` shortcut.

### 🛠️ 7. Workspace Productivity Widgets
* **Quick Tasks (Todos):** Add, toggle, and delete workspace checklist items, persisted to your database.
* **Sticky Notes:** Drag-and-drop color-coded memo pads with persistent layout positioning.
* **World Clock:** View multiple timezones dynamically (Local, New York, London, Tokyo) with visual day/night theme indicators.
* **Weather Widget:** Today's forecast using the OpenWeather API with geolocation fallback.

### 🧠 8. Smart Intelligence Features
* **AI Task Prioritization:** One-click integration with Gemini to analyze pending to-dos and rank them dynamically by assigning an Urgency and Impact score (1-10) with reasoning badges.
* **Unified Search:** A globally accessible, debounced search bar inside the top navigation that queries across your Emails, Quick Tasks, and Sticky Notes, visually categorizing the results for rapid access.

### 💼 9. Freelance CRM & Operations Hub
* **Client & Project Registry:** Track freelance clients and projects with dynamic budget status bars and progress updates.
* **Outreach Pipeline Leads:** Manually add/edit/delete potential business leads with custom metadata (Owner Name, Category, What Need, notes) or parse them automatically using AI extraction from plain text/voice transcripts. Features a status-based quick filter bar.
* **Smart stopwatch/countdown Timer:** Track billable time per project with dynamic formatting (under 60m shown as minutes, over 60m shown as hours) and log it straight to your persistent ledger. Includes native browser notification support.
* **Invoice Generator & Financial Ledger:** Issue clean, formatted invoices (PDF/CSV exportable) and record payments/expenses in a visual bookkeeping interface that charts net MRR progress.

### 📰 10. AI News Aggregator & Creator Studio
* **Real-time News Hub:** Fetches live articles on AI, Technology, Startups, and Cybersecurity from NewsAPI.
* **Gemini Summarization:** Generate instant, readable summaries of any news article.
* **One-Click Creator Studio:** Automatically draft fully styled LinkedIn posts or Twitter threads based on selected news stories to streamline professional engagement.

### ✍️ 11. Voice Studio & Content Generation Hub
* **Writing Style Learner:** Paste 2-3 of your past emails or posts, and the AI will analyze your tone, vocabulary, and quirks to generate a strict, personalized "Style Profile".
* **Context-Aware Quick Write:** Generate Emails, Social Posts, or Action Ideas with a single click. When "Write in my voice" is enabled, it automatically overrides generic tones and drafts content using your exact saved Style Profile.
* **Unified Chat Integration:** Your custom voice profile is seamlessly injected into the Optimus Chat Assistant, ensuring any content drafted during conversation matches your authentic writing style.

---

## 🗄️ Database Architecture (InsForge BaaS)

Optimus uses a PostgreSQL database schema managed via **InsForge**. The tables are structured to support multi-tenancy and data isolation via robust Row Level Security (RLS):

1. `users` — Secure profiles and InsForge authentication states.
2. `app_connections` — Encrypted OAuth tokens for Gmail, Slack, and WhatsApp.
3. `briefing_schedules` — User briefing preferences and cron timing rules.
4. `briefings_history` — The persistent log of generated AI briefs containing the `data` JSON blob.
5. `generated_briefings` — Compiled unread email data digests and priority schedules.
6. `todos` — User tasks, workspace priorities, and completion status.
7. `sticky_notes` — Position, colors, and content of user dashboard notes.
8. `freelance_clients` — Registered clients and contact metadata.
9. `freelance_projects` — Active/completed projects, hourly rates, and target budgets.
10. `freelance_invoices` — Client invoice documents, item details, and invoice statuses.
11. `freelance_time_logs` — Recorded hours worked, task description, and project links.
12. `freelance_transactions` — Financial ledger entries tracking income and expenses.
13. `freelance_outreach` — Leads, contact details, owner name, category, and what needs.
14. `saved_articles` — Bookmark index of tech and AI news hub articles.

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
