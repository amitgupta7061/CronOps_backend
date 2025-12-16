# CronOps Backend

A production-ready multi-user Cron Job Scheduling platform built with Node.js, Express, PostgreSQL, Prisma 7, Redis, and BullMQ.

## Features

- 🔐 **JWT Authentication** - Secure access and refresh token system
- ⏰ **Cron Job Management** - Create, update, delete, pause/resume cron jobs
- 🚀 **Job Scheduling** - Redis-backed BullMQ for reliable scheduling
- 📊 **Execution Logs** - Detailed logs with statistics
- 🔒 **Security** - Rate limiting, Helmet, CORS, input validation with Zod 4
- 🐳 **Docker Ready** - Full Docker and docker-compose setup

## Tech Stack

- **Runtime**: Bun
- **Framework**: Express.js 5
- **Database**: PostgreSQL
- **ORM**: Prisma 7 (with driver adapters)
- **Queue**: BullMQ + Redis
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Zod 4

## Prerequisites

- Bun >= 1.0
- Node.js >= 20.19.0
- PostgreSQL 14+
- Redis 7+
- Docker & Docker Compose (optional)

## Quick Start

### Using Docker (Recommended)

```bash
# Start all services (PostgreSQL, Redis, API, Worker)
docker-compose up -d

# Run migrations
docker-compose exec backend bunx prisma migrate deploy

# Seed the database
docker-compose exec backend bun src/prisma/seed.js
```

### Local Development

1. **Install dependencies**
```bash
bun install
```

2. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start PostgreSQL and Redis** (or use docker-compose for just these)
```bash
docker compose up -d postgres redis
```

4. **Generate Prisma client**
```bash
bun run db:generate
```

5. **Run database migrations**
```bash
bun run db:migrate
```

6. **Seed the database (optional)**
```bash
bun run db:seed
```

7. **Start the API server**
```bash
bun run dev
```

8. **Start the worker (in a separate terminal)**
```bash
bun run worker:dev
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout (invalidate refresh token) |
| GET | `/api/auth/me` | Get current user profile |

### Cron Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Create a new cron job |
| GET | `/api/jobs` | List all jobs (paginated) |
| GET | `/api/jobs/:id` | Get job by ID |
| PUT | `/api/jobs/:id` | Update a job |
| DELETE | `/api/jobs/:id` | Delete a job |
| POST | `/api/jobs/:id/pause` | Pause a job |
| POST | `/api/jobs/:id/resume` | Resume a job |

### Execution Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/:jobId/logs` | Get logs for a job |
| GET | `/api/jobs/:jobId/stats` | Get statistics for a job |
| GET | `/api/logs/:id` | Get log by ID |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats` | Get user dashboard statistics |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

## Example Requests

### Create a Cron Job

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Health Check",
    "cronExpression": "*/5 * * * *",
    "timezone": "UTC",
    "targetType": "HTTP",
    "targetUrl": "https://api.example.com/health",
    "httpMethod": "GET",
    "timeout": 10000,
    "maxRetries": 3
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@cronops.dev",
    "password": "Password123!"
  }'
```

## Project Structure

```
src/
├── app.js              # Express app setup
├── server.js           # Server entry point
├── controllers/        # Request handlers
│   ├── authController.js
│   ├── cronJobController.js
│   └── executionLogController.js
├── services/           # Business logic
│   ├── authService.js
│   ├── cronJobService.js
│   └── executionLogService.js
├── routes/             # API routes
│   ├── authRoutes.js
│   ├── jobRoutes.js
│   └── ...
├── middleware/         # Express middleware
│   ├── auth.js
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   └── validate.js
├── jobs/               # BullMQ queue setup
│   ├── queue.js
│   └── redis.js
├── workers/            # Background workers
│   └── cronWorker.js
├── prisma/             # Prisma client
│   ├── client.js
│   └── seed.js
└── utils/              # Utilities
    ├── config.js
    ├── errors.js
    ├── logger.js
    ├── validators.js
    └── cronValidator.js
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection URL | - |
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `REDIS_PASSWORD` | Redis password | - |
| `JWT_ACCESS_SECRET` | JWT access token secret | - |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | - |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | 7d |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run start` | Start production server |
| `bun run worker` | Start worker process |
| `bun run worker:dev` | Start worker with hot reload |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:migrate` | Run database migrations |
| `bun run db:push` | Push schema to database |
| `bun run db:seed` | Seed the database |
| `bun run db:studio` | Open Prisma Studio |

## License

MIT
