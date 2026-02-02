# Analytics Dashboard

A production-ready analytics dashboard built with Next.js 14, TypeScript, Tailwind CSS, PostgreSQL, and Recharts.

## Features

- **Data Visualization**: Interactive charts (line, bar, pie, area) with Recharts
- **Real-time Updates**: Live data streaming via WebSockets
- **Data Ingestion API**: RESTful endpoints for metric ingestion
- **User Authentication**: JWT-based auth with role-based access control
- **Time-series Database**: PostgreSQL with efficient indexing
- **Export Capabilities**: CSV and PDF report generation
- **Responsive Design**: Mobile-first with dark/light mode

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Charts**: Recharts
- **State**: Zustand + React Query
- **Real-time**: Socket.io

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd analytics-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Setup the database:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Seed the database (optional):
```bash
npx prisma db seed
```

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

Default credentials:
- Email: `admin@example.com`
- Password: `admin123`

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks
│   └── lib/              # Utilities
├── prisma/               # Database schema
├── public/               # Static assets
├── types/                # TypeScript types
└── tests/                # Test files
```

## API Documentation

### Authentication

All API requests (except login) require authentication via Bearer token or session cookie.

### Data Ingestion

#### POST /api/ingest/metrics

Ingest a single metric data point.

**Headers:**
```
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "page_view",
  "value": 1,
  "metadata": {
    "page": "/home",
    "userAgent": "Mozilla/5.0..."
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### POST /api/ingest/batch

Ingest multiple metrics at once.

**Request Body:**
```json
{
  "metrics": [
    {
      "type": "page_view",
      "value": 1,
      "timestamp": "2024-01-01T00:00:00Z"
    },
    {
      "type": "purchase",
      "value": 99.99,
      "timestamp": "2024-01-01T00:01:00Z"
    }
  ]
}
```

### Metrics API

#### GET /api/metrics

Query metrics with filters.

**Query Parameters:**
- `type`: Metric type (e.g., `page_view`, `purchase`)
- `start`: Start date (ISO 8601)
- `end`: End date (ISO 8601)
- `limit`: Maximum results (default: 1000)

**Response:**
```json
{
  "metrics": [
    {
      "id": "uuid",
      "type": "page_view",
      "value": 1,
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1500
}
```

### Export API

#### GET /api/export/csv

Export metrics as CSV.

**Query Parameters:**
- Same as `/api/metrics`
- `columns`: Comma-separated column names

#### GET /api/export/pdf

Export dashboard as PDF report.

**Query Parameters:**
- `dashboardId`: Dashboard ID to export

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `REDIS_URL` | Redis connection (optional) | No |
| `SMTP_HOST` | Email server host | No |
| `SMTP_PORT` | Email server port | No |

See `.env.example` for all available variables.

## Development

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma migrate reset
```

### Code Quality

```bash
# Run linter
npm run lint

# Type check
npm run type-check

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Docker

```bash
# Build image
docker build -t analytics-dashboard .

# Run container
docker run -p 3000:3000 --env-file .env.local analytics-dashboard
```

### Self-Hosted

```bash
# Build
npm run build

# Start production server
npm start
```

## Architecture

### Data Flow

```
Data Source → Ingest API → PostgreSQL → Dashboard Query → Charts
                     ↓
              WebSocket Server → Real-time Updates
```

### Authentication Flow

```
Login → NextAuth → JWT Token → API Routes → Database
          ↓
    Session Cookie → Client
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Write tests for new features
- Update documentation as needed

## License

MIT License - see LICENSE file for details

## Support

- Documentation: [https://docs.example.com](https://docs.example.com)
- Issues: [GitHub Issues](https://github.com/yourusername/analytics-dashboard/issues)
- Email: support@example.com

## Roadmap

- [ ] AI-powered anomaly detection
- [ ] Natural language querying
- [ ] Custom widget builder
- [ ] Multi-language support
- [ ] White-label customization
- [ ] Advanced filtering with saved views
