# EcoTracker Pro

Personal Carbon Footprint Dashboard - Track, analyze, and reduce your environmental impact.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Recharts, React Router
- **Backend**: Node.js, Express, TypeScript, better-sqlite3
- **MCP**: Model Context Protocol integration for external data sources

## Quick Start

### 1. Install dependencies

```bash
# From the project root
npm run install:all
```

### 2. Set up the backend

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Seed the database with demo data
npm run seed
```

### 3. Start development servers

Open two terminals:

```bash
# Terminal 1 - Backend (runs on :3001)
npm run dev:backend

# Terminal 2 - Frontend (runs on :5173)
npm run dev:frontend
```

Open http://localhost:5173 in your browser.

## Project Structure

```
EcoTracker-Pro/
├── backend/
│   └── src/
│       ├── index.ts            # Express server entry
│       ├── database.ts         # SQLite setup & schema
│       ├── seed.ts             # Demo data seeder
│       ├── routes/
│       │   ├── activities.ts   # Activity CRUD
│       │   ├── emissions.ts    # Emission queries & stats
│       │   ├── goals.ts        # Goal CRUD with progress
│       │   └── reports.ts      # Weekly/monthly reports
│       ├── utils/
│       │   └── carbonCalculator.ts  # Emission factors & math
│       └── mcp/
│           ├── config.ts       # MCP server configuration
│           └── client.ts       # MCP client utilities
├── frontend/
│   └── src/
│       ├── App.tsx             # Routes & app shell
│       ├── api/client.ts       # API client functions
│       ├── types/index.ts      # TypeScript interfaces
│       ├── context/ThemeContext.tsx
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── Sidebar.tsx
│       │   └── ThemeToggle.tsx
│       └── pages/
│           ├── Dashboard.tsx   # Charts & overview
│           ├── Activities.tsx  # Log & manage activities
│           ├── Goals.tsx       # Set & track goals
│           ├── Reports.tsx     # Weekly/monthly reports
│           ├── DataSources.tsx # MCP server status
│           └── Settings.tsx    # User preferences
└── README.md
```

## API Endpoints

### Activities
- `GET    /api/activities/:userId` - List activities (supports filters)
- `POST   /api/activities` - Create activity (auto-calculates emissions)
- `PUT    /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Emissions
- `GET /api/emissions/summary/:userId` - Emission summary by period
- `GET /api/emissions/by-category/:userId` - Totals by category
- `GET /api/emissions/trend/:userId` - Daily trend data
- `GET /api/emissions/stats/:userId` - Overall statistics

### Goals
- `GET    /api/goals/:userId` - List goals with progress
- `POST   /api/goals` - Create goal
- `PUT    /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Reports
- `GET /api/reports/weekly/:userId` - Weekly report
- `GET /api/reports/monthly/:userId` - Monthly report
- `GET /api/reports/emission-factors` - Carbon emission factors reference
- `GET /api/reports/data-sources` - MCP server status
- `GET /api/reports/eco-tips` - Sustainability tips

## Carbon Emission Factors

Activities are auto-calculated using emission factors for:
- **Transport**: Car (petrol/diesel/electric), bus, train, plane, bicycle, walking
- **Energy**: Electricity, natural gas, heating oil, solar, wind
- **Food**: Beef, pork, chicken, fish, dairy, vegetables, fruits, grains
- **Shopping**: Clothing, electronics, furniture
- **Waste**: General waste, recycling, compost

## MCP Integration

Configure external data sources in `backend/.env`:

| Server  | Env Variable              | Purpose                        |
|---------|---------------------------|--------------------------------|
| Weather | `MCP_WEATHER_API_KEY`     | Energy insights from weather   |
| Maps    | `MCP_MAPS_API_KEY`        | Travel emission calculations   |
| News    | `MCP_NEWS_API_KEY`        | Sustainability news & tips     |

## Features

- Dashboard with real-time charts (area, pie, bar)
- Activity logging with automatic CO2 calculation
- Weekly and monthly emission reports
- Goal setting with progress tracking
- Dark/light theme support
- MCP server integration for external data
- Responsive design
