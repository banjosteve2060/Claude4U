# Ava - Unit4 ERP AI Assistant

## Overview

Ava is a full-stack AI-powered ERP assistant built for Professional Services Organisations (PSOs). It provides an intelligent chat interface where employees can interact with an AI assistant called **Ava** to manage their day-to-day ERP tasks — from logging timesheets and booking absences to tracking project financials, resource utilisation, and budget performance.

The application is designed as a demonstration and internal tool for Unit4, showcasing how AI can be embedded into ERP workflows. It combines real-time collaboration (multiple users can work on shared tasks simultaneously), a plugin system via the Model Context Protocol (MCP), and optional integration with Anthropic's Claude API for intelligent, context-aware responses. When Claude is not connected, Ava falls back to built-in canned responses with realistic PSO demo data.

The app is role-aware — each of the 10 PSO roles (Consultant, Project Manager, Solution Architect, etc.) gets a tailored onboarding experience and relevant task suggestions.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Backend | Express.js 5, Socket.IO 4 |
| Database | PostgreSQL 16 |
| AI | Claude API (Anthropic) - claude-sonnet-4 |
| Icons | Lucide React |
| Reverse Proxy | Nginx (Alpine) |
| Containerisation | Docker + Docker Compose |
| Plugin System | MCP (Model Context Protocol) |

---

## Running with Docker

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Production Mode

```bash
docker compose up -d --build
```

This starts three containers:

| Container | Port | Description |
|-----------|------|-------------|
| **frontend** | `8080` | Nginx serving the React production build |
| **backend** | `3001` | Express.js API + Socket.IO server |
| **postgres** | `5433` | PostgreSQL 16 database |

Open **http://localhost:8080** in your browser.

### Development Mode (with hot reload)

```bash
docker compose --profile dev up --build
```

This starts an additional Vite dev server on port `3000` with hot module replacement.

Open **http://localhost:3000** in your browser.

### Stopping the Application

```bash
docker compose down
```

To also remove the database volume (full reset):

```bash
docker compose down -v
```

### Rebuilding After Code Changes

```bash
docker compose up -d --build
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Database only
docker compose logs -f postgres
```

### Environment Variables

The following environment variables are pre-configured in `docker-compose.yml`:

| Variable | Service | Default | Description |
|----------|---------|---------|-------------|
| `POSTGRES_DB` | postgres | `ava` | Database name |
| `POSTGRES_USER` | postgres | `ava` | Database user |
| `POSTGRES_PASSWORD` | postgres | `ava_secret_password` | Database password |
| `DATABASE_URL` | backend | `postgresql://ava:ava_secret_password@postgres:5432/ava` | Full connection string |
| `NODE_ENV` | backend | `production` | Node environment |
| `PORT` | backend | `3001` | Backend server port |
| `FRONTEND_URL` | backend | `*` | CORS origin (dynamic) |

---

## Running Without Docker

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ running locally

### Setup

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Set database URL
export DATABASE_URL=postgresql://your_user:your_password@localhost:5432/ava

# Start the backend
cd server && node server.js &

# Start the frontend dev server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## Features

### AI Chat Assistant (Ava)
- Conversational AI assistant powered by Claude API (Anthropic)
- Context-aware responses based on the active task and conversation history
- Built-in canned responses with realistic PSO demo data when Claude is not configured
- Automatic fallback — uses Claude when an API key is set, canned responses otherwise
- Processing progress indicators shown in the Tools & Actions panel
- Per-task message history with full persistence

### Claude API Integration
- Configure your Anthropic API key via the in-app Settings panel
- Uses Claude Sonnet 4 (`claude-sonnet-4-20250514`) with a 1024 max token limit
- System prompt includes full PSO domain knowledge and benchmarks
- Task context (title, category) is passed to Claude for relevant responses
- Token usage is logged to the backend console
- MCP plugin tools are surfaced to Claude when available

### Task & Folder Management
- Hierarchical folder and task structure
- Protected system folders: My Tasks, Project Financials, Shared with Me, Notepad
- Create, rename, and delete custom folders
- Create tasks within any folder
- Task status tracking (pending, in progress, completed)
- Tabbed interface — open multiple tasks simultaneously
- Split view — compare two tasks side by side

### Project Financial Management
A dedicated **Project Financials** folder with 6 pre-built financial tasks, each containing realistic PSO demo data:

| Task | What It Shows |
|------|---------------|
| **Project Overview** | Portfolio health across 7 active projects, risk register, milestone tracking |
| **Revenue & Billing** | Invoicing summary, overdue amounts, Q1 revenue recognition, revenue mix |
| **Resource Utilisation** | Utilisation rates by role, bench time, capacity planning, top performers |
| **Project Margins** | Gross margin by project (18-42%), cost breakdowns, trend analysis |
| **Forecasting** | Annual revenue forecast (£5.29M), pipeline by stage, resource demand |
| **Budget Tracking** | Budget vs actuals by project, variance analysis, burn rate monitoring |

### Data Insights Panel
- Visual dashboard in the Tools & Actions panel for financial tasks
- KPI cards with colour-coded status indicators (green/amber/red)
- Progress bars showing project completion, utilisation, margins, and budget spend
- Automatically appears when a financial task is active
- Collapsible with smooth animation
- Fully supports dark mode

### Real-Time Collaboration
- Multiple users can work on shared tasks simultaneously
- Live presence indicators (who's online)
- Typing indicators for collaborators
- Real-time message broadcasting via Socket.IO
- Share tasks with other users by email
- View collaborators on each task
- Shared tasks appear in the "Shared with Me" folder

### Message Pinning
- Pin important AI responses to the Notepad folder
- Hover over any Ava message to reveal the pin button
- Pinned content persists as the first message when reopening the task

### Onboarding System
- Role-specific interactive onboarding for all 10 PSO roles
- Step-by-step guided tour highlighting key features
- Auto-advance with 5-second timer per step
- Pauses on user interaction
- Fallback modal for missing spotlight targets
- Tracks completion status per user

### MCP Plugin System
- Connect external tools via the Model Context Protocol
- Pre-configured plugin templates: Filesystem, Web Search, Slack, GitHub, Database
- Dynamic tool discovery and execution
- Plugin tools are surfaced to Claude for AI-assisted usage
- Enable/disable plugins per user
- Environment variable configuration per plugin

### User Interface
- **Dark mode** with persistent preference
- **7 theme colours**: Green, Blue, Purple, Orange, Teal, Rose, Indigo
- **Responsive design** — works on desktop, tablet, and mobile
- **Collapsible sidebars** (left task panel and right tools panel)
- **Quick Actions** — Summarise, Translate, Explain, Format + custom user-created actions
- **Customisable branding** — app name and logo URL configurable in Settings

### User Management & Admin
- Email-based login restricted to `@unit4.com` domain
- 10 pre-seeded PSO role users (see below)
- Admin dashboard for creating and deleting users
- Role assignment on user creation
- User activity tracking (last login, task count)
- Data isolation — each user has their own folders, tasks, and settings

---

## Built-In Users

The application comes with 10 pre-configured users, one for each PSO role. All users log in with their email and name — there are no passwords (authentication is email-based).

| Email | Name | Role |
|-------|------|------|
| `admin@unit4.com` | Admin User | Admin |
| `consultant@unit4.com` | Alex Consultant | Consultant |
| `senior.consultant@unit4.com` | Sarah Senior | Senior Consultant |
| `principal.consultant@unit4.com` | Peter Principal | Principal Consultant |
| `project.manager@unit4.com` | Paula Manager | Project Manager |
| `solution.architect@unit4.com` | Sam Architect | Solution Architect |
| `technical.consultant@unit4.com` | Tom Technical | Technical Consultant |
| `functional.consultant@unit4.com` | Fiona Functional | Functional Consultant |
| `team.lead@unit4.com` | Taylor Lead | Team Lead |
| `practice.manager@unit4.com` | Pat Practice | Practice Manager |

**To log in:** Enter any of the above email addresses and the corresponding name on the login screen. The admin user (`admin@unit4.com`) has access to the user management panel where new users can be created.

---

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Backend health check |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:email/exists` | Check if user exists |
| GET | `/api/users` | List all users (admin only) |
| POST | `/api/users` | Create a new user |
| DELETE | `/api/users/:email` | Delete a user |
| GET | `/api/users/:email/data` | Get user data (folders, settings) |
| PUT | `/api/users/:email/data` | Save user data |

### Tasks & Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/:taskId/messages` | Get messages for a task |
| POST | `/api/tasks/:taskId/messages` | Add a message to a task |
| GET | `/api/tasks/:taskId/collaborators` | Get task collaborators |
| POST | `/api/tasks/:taskId/collaborators` | Add a collaborator |
| DELETE | `/api/tasks/:taskId/collaborators/:email` | Remove a collaborator |
| GET | `/api/users/:email/shared-tasks` | Get tasks shared with a user |

### Claude AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/claude/configure` | Set the Claude API key |
| GET | `/api/claude/status` | Check if Claude is configured |
| POST | `/api/claude/chat` | Send a message to Claude |

### MCP Plugins
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mcp/connect` | Connect an MCP plugin |
| POST | `/api/mcp/disconnect` | Disconnect a plugin |
| GET | `/api/mcp/plugins` | List connected plugins |
| GET | `/api/mcp/tools` | List all available tools |
| POST | `/api/mcp/execute` | Execute an MCP tool |

---

## Project Structure

```
ClaudeU4/
├── src/
│   ├── erpAI.jsx              # Main application component
│   ├── Onboarding.jsx         # Role-specific onboarding flows
│   ├── useCollaboration.js    # Real-time collaboration hook (Socket.IO)
│   ├── main.jsx               # React entry point
│   └── index.css              # Global styles
│
├── server/
│   ├── server.js              # Express API + Socket.IO + canned responses
│   ├── db.js                  # PostgreSQL schema, queries, default data
│   ├── claudeService.js       # Claude API client + system prompt
│   ├── mcpClient.js           # MCP plugin client
│   ├── Dockerfile             # Backend production image
│   └── package.json           # Backend dependencies
│
├── docker-compose.yml         # Multi-service orchestration
├── Dockerfile                 # Frontend production image (Nginx)
├── Dockerfile.dev             # Frontend dev image (Vite)
├── nginx.conf                 # Nginx reverse proxy config
├── package.json               # Root project config + frontend deps
├── vite.config.js             # Vite build configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
└── index.html                 # SPA entry HTML
```

---

## Database

PostgreSQL 16 with the following tables (auto-created on first startup):

| Table | Purpose |
|-------|---------|
| `registered_users` | User accounts (email, name, role, created date) |
| `user_data` | User preferences and folder structure (JSONB) |
| `tasks` | Task items |
| `task_messages` | Chat message history per task |
| `collaborators` | Task-to-user sharing mappings |
| `invitations` | Pending task invitations |
| `shared_tasks` | Shared task registry |

The database is seeded automatically with the 10 default users on first startup.

---

## Connecting Claude AI

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. In the app, click the **Settings** icon (gear icon in the left sidebar)
3. Paste your API key in the Claude API Key field
4. Click **Save** — Ava will now use Claude for all responses

When Claude is connected, the canned demo responses are disabled and all conversations go through the Claude API with full PSO context in the system prompt.
