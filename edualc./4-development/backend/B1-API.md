# Agent B1: API Backend Engineer

**Role**: Express REST API Developer  
**Priority**: ⭐⭐⭐⭐⭐ (Critical - Week 1)  
**Dependencies**: B2 (database schema), C1 (API design approval)  
**Coordinates with**: F1 (frontend), B2 (database)

---

## RESPONSIBILITIES

### REST API Endpoints
- Property search & filtering
- Property details
- Agent swarm orchestration
- Authentication/Authorization

### Route Implementation
- `GET /api/properties` - Search & filters
- `GET /api/properties/:id` - Property details
- `POST /api/agents/analyze` - Agent swarm trigger
- `POST /api/auth/login` - User authentication

### Middleware
- Authentication (JWT)
- Rate limiting
- Error handling
- Request validation (Zod)

---

## CONTEXT

**Framework**: Express.js + TypeScript  
**Database**: Prisma ORM  
**Validation**: Zod schemas  
**Auth**: JWT + bcrypt  
**Plan**: `HYBRID-FINAL.md` Phase 1

---

## CURRENT TASKS (Week 1)

### Priority 1: Property Search API
```typescript
// backend/src/routes/properties.ts
router.get('/properties', async (req, res) => {
  const { city, minPrice, maxPrice, propertyType, minBedrooms } = req.query;
  
  const properties = await prisma.property.findMany({
    where: {
      city: { contains: city, mode: 'insensitive' },
      price: { gte: minPrice, lte: maxPrice },
      propertyType: { in: propertyType.split(',') },
      bedrooms: { gte: minBedrooms },
      status: 'ACTIVE'
    },
    include: {
      photos: { where: { isPrimary: true }, take: 1 },
      vastuAnalysis: { select: { overallScore: true, grade: true } },
      climateAnalysis: { select: { overallRiskScore: true } }
    },
    skip: (page - 1) * limit,
    take: limit
  });
  
  res.json({ 
    success: true, 
    data: { properties, pagination: {...} }
  });
});
```

### Priority 2: Property Details API
```typescript
// GET /api/properties/:id
// Return full property with all analyses
```

### Priority 3: Agent Swarm API
```typescript
// POST /api/agents/analyze
// Trigger 6 core agents for property analysis
```

---

## API DESIGN

**Response Format** (Required):
```typescript
{
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    total: number;
  };
}
```

**Error Handling**:
```typescript
- 400: Bad Request (validation error)
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error
```

---

## HANDOFF PROTOCOLS

### From @B2 (Database):
```markdown
READY: Property model in Prisma
- Property table created
- VastuAnalysis relation ready
- Use prisma.property.findMany()
```

### To @F1 (Frontend):
```markdown
COMPLETED: Property search API
- Endpoint: GET /api/properties
- Query params: city, minPrice, maxPrice, propertyType, minBedrooms, page, limit
- Response includes: vastuScore, climateRisk, photos
TEST: curl http://localhost:3001/api/properties?city=Bangalore
```

---

## EXAMPLE IMPLEMENTATION

**Properties Route**:
```typescript
// backend/src/routes/properties.ts
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

const router = Router();

const searchSchema = z.object({
  city: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  propertyType: z.string().optional(),
  minBedrooms: z.coerce.number().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20)
});

router.get('/', async (req, res) => {
  const query = searchSchema.parse(req.query);
  // Implementation...
});

export default router;
```

---

## CURRENT STATUS

**This Week**:
- [ ] Implement property search endpoint
- [ ] Implement property details endpoint
- [ ] Create agent swarm orchestration endpoint
- [ ] Add authentication middleware

**Dependencies**: Waiting for @B2 schema completion  
**Next**: Agent swarm integration
