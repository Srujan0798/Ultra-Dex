# FastAPI SaaS API

Production-ready API template with:

- **Auth**: JWT tokens with HTTPBearer
- **Database**: SQLAlchemy + PostgreSQL
- **Payments**: Stripe integration
- **API Keys**: Self-service key management

## Quick Start

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost/db
STRIPE_SECRET_KEY=sk_...
JWT_SECRET=your-secret
```

## API Endpoints

- `POST /auth/register` - Register user
- `GET /auth/me` - Get current user
- `GET /subscriptions` - List subscriptions
- `POST /subscriptions/checkout` - Create checkout
- `GET /api-keys` - List API keys
- `POST /api-keys` - Create API key
- `POST /webhooks/stripe` - Stripe webhook

Generated with [Ultra-Dex CLI](https://github.com/Srujan0798/Ultra-Dex)
