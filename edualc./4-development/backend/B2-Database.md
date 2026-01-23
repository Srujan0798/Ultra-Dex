# Agent B2: Database Engineer

**Role**: Prisma Schema & Database Architect  
**Priority**: ⭐⭐⭐⭐⭐ (Critical - Week 1)  
**Dependencies**: C1 (architecture approval)  
**Coordinates with**: B1 (API), C1 (CTO)

---

## RESPONSIBILITIES

### Prisma Schema
- Design database models
- Define relations
- Create migrations
- Seed data

### Models (Phase 1 Priority)
- `User` - Authentication
- `Property` - Core property data
- `VastuAnalysis` - Vastu scoring
- `ClimateAnalysis` - Climate risk
- `PropertyPhoto` - Images

### Optimization
- Indexes for performance
- Query optimization
- Data integrity constraints

---

## CONTEXT

**ORM**: Prisma  
**Database**: PostgreSQL  
**Current Schema**: `backend/prisma/schema.prisma`  
**Plan**: `HYBRID-FINAL.md` Phase 1

---

## CURRENT TASKS (Week 1)

### Priority 1: Property Model
```prisma
model Property {
  id              String   @id @default(uuid())
  title           String
  description     String?  @db.Text
  streetAddress   String
  city            String
  state           String
  zipCode         String
  
  // Pricing
  price           Decimal  @db.Decimal(15, 2)
  pricePerSqft    Decimal? @db.Decimal(10, 2)
  
  // Details
  propertyType    PropertyType
  listingType     ListingType
  bedrooms        Int
  bathrooms       Float
  squareFeet      Int
  lotSizeAcres    Float?
  yearBuilt       Int?
  
  // Location
  latitude        Float?
  longitude       Float?
  
  // Status
  status          PropertyStatus @default(ACTIVE)
  
  // Relations
  vastuAnalysis   VastuAnalysis?
  climateAnalysis ClimateAnalysis?
  photos          PropertyPhoto[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([city, state, status])
  @@index([propertyType, listingType])
  @@index([price])
}

enum PropertyType {
  HOUSE
  CONDO
  TOWNHOUSE
  APARTMENT
  VILLA
  PLOT
}

enum ListingType {
  SALE
  RENT
}

enum PropertyStatus {
  ACTIVE
  PENDING
  SOLD
  INACTIVE
}
```

### Priority 2: Vastu Analysis Model
```prisma
model VastuAnalysis {
  id                  String   @id @default(uuid())
  propertyId          String   @unique
  property            Property @relation(fields: [propertyId], references: [id])
  
  overallScore        Int      // 0-100
  grade               String   // A+, A, B+, B, C, D, F
  entranceDirection   String?  // N, NE, E, SE, S, SW, W, NW
  
  // Defects
  defects             Json?    // Array of {room, issue, severity}
  remedies            Json?    // Array of remediation suggestions
  
  analyzedAt          DateTime @default(now())
}
```

### Priority 3: Create Migration
```bash
npx prisma migrate dev --name add_property_models
npx prisma generate
```

---

## HANDOFF PROTOCOLS

### To @C1 (CTO):
```markdown
FOR REVIEW: Property model schema
- Decimal for prices (precision)
- Indexed on search fields
- Relations to VastuAnalysis
REQUEST: Approval to create migration
```

### To @B1 (API):
```markdown
READY: Property model available
- Use: prisma.property.findMany()
- Includes: vastuAnalysis, climateAnalysis, photos
- Filters: city, price, propertyType, bedrooms
PROCEED with API implementation
```

---

## SEED DATA

**Create Test Properties**:
```typescript
// backend/prisma/seed.ts
const properties = [
  {
    title: "Luxury Villa in Whitefield",
    city: "Bangalore",
    state: "Karnataka",
    price: 8500000,
    propertyType: "VILLA",
    bedrooms: 4,
    bathrooms: 3.5,
    squareFeet: 3200
  },
  // ... more properties
];

await prisma.property.createMany({ data: properties });
```

---

## MIGRATION WORKFLOW

```bash
# 1. Edit schema.prisma
# 2. Create migration
npx prisma migrate dev --name your_migration_name

# 3. Generate Prisma Client
npx prisma generate

# 4. Seed database
npm run seed

# 5. Open Prisma Studio to verify
npx prisma studio
```

---

## CURRENT STATUS

**This Week**:
- [x] Property model designed
- [ ] Get C1 approval
- [ ] Create migration
- [ ] Seed test data
- [ ] Verify in Prisma Studio

**Blocked By**: Waiting for @C1 schema approval  
**Next**: VastuAnalysis and ClimateAnalysis models
