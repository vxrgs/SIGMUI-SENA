# SIGMUI — Parking Management System (PARKALIA)

Web application to browse parking zones, reserve spots, pay, and manage vehicles and users. A SENA project developed by the **G+ Projects** team.

> **Status:** under active development. See the [roadmap](docs/ROADMAP.md) and the [GitHub Projects guide](docs/GITHUB_PROJECTS.md).

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)

## Features

| Module | Description | Status |
| --- | --- | --- |
| Authentication | Sign up, sign in (JWT in an `httpOnly` cookie), password recovery | ✅ |
| Zones | Browse zones, rates, schedules, and available spots | ✅ |
| Vehicles | Per-user vehicle CRUD | ✅ |
| Reservations and payments | Reserve a spot, pay, cancel and release the spot | ✅ |
| Administration | Manage users, plus rates and schedules per zone | ✅ |
| Payment gateway | Wompi, DaviPay, Bold, and cash (for testing) | 🚧 Planned |
| Maps | Parking lot locations with Google Maps | 🚧 Planned |
| Per-parking organization | Data and permissions separated by parking lot | 🚧 Planned |
| *Parking administrator* role | Capacity control, slot control, and key custody | 🚧 Planned |

## Tech stack

- **Backend:** Node.js (ESM), Express 5, Sequelize
- **Database:** MySQL 8 or SQLite (zero-config local mode)
- **Views:** Pug + Tailwind CSS 4
- **Security:** `bcryptjs`, `jsonwebtoken`, `httpOnly` cookies
- **Email:** Nodemailer

## Requirements

- Node.js 20 or later
- MySQL 8 (optional: without it the app uses SQLite at `data/sigmui.sqlite`)

## Getting started

```bash
git clone https://github.com/vxrgs/SIGMUI-SENA.git
cd SIGMUI-SENA
npm install
cp .env.example .env      # on Windows: copy .env.example .env
npm run dev
```

The app is available at <http://localhost:3000>.

> In PowerShell, if `npm` fails because of the execution policy, use `npm.cmd run dev`.

### MySQL database

1. Create the database (the app also tries to create it on startup):
   ```sql
   CREATE DATABASE IF NOT EXISTS sigmui CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Fill in `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, and `DB_PORT` in `.env`.
3. On startup, Sequelize creates any missing tables (`DB_SYNC=safe`).

To use SQLite, leave `DB_HOST` and `DB_NAME` empty.

### Demo accounts

Only outside production (`NODE_ENV` other than `production`):

| Role | Email | Password |
| --- | --- | --- |
| Citizen (`Ciudadano`) | `usuario@ejemplo.com` | `password123` |
| Administrator (`Administrador`) | `admin@ejemplo.com` | `admin123` |

## Environment variables

Template in [`.env.example`](.env.example). **Never commit your `.env` file.**

| Variable | Description |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` | MySQL connection |
| `DB_SYNC` | `safe` creates missing tables · `alter` adjusts tables to the models |
| `DB_STORAGE` | Optional SQLite file path |
| `NODE_ENV` | `development` or `production` |
| `PORT` | HTTP port (default 3000) |
| `JWT_SECRET` | Required in production: a long, random string |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | First administrator (useful in production) |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` | SMTP server |

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Server with auto-reload + Tailwind watch build |
| `npm start` | Starts the server |
| `npm run build` | Builds and minifies the CSS |

## Project structure

```text
SIGMUI-SENA/
├── index.js              # Entry point: Express, view routes, and startup
├── src/
│   ├── db/               # Database connection, sync, and seed
│   ├── middleware/       # Session, requireAuth, requireAdmin
│   ├── models/           # Sequelize models and associations
│   ├── routes/           # APIs: vehicles, reservations/payments, users
│   └── utils/            # Passwords, email, HTTP errors
├── frontend/
│   ├── public/           # Static files
│   └── src/
│       ├── css/          # Tailwind
│       ├── js/pages/     # Per-page JavaScript
│       └── views/        # Pug templates (layouts, components, pages)
└── docs/                 # Technical documentation
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [GitHub Projects guide](docs/GITHUB_PROJECTS.md)
- [Contributing guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md): branching workflow, commit format, and Pull Request process.

## Team

**G+ Projects** — SENA.
