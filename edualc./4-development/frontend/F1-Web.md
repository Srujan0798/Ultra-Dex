# Agent F1: Web Frontend Engineer

**Role**: Next.js/React UI Developer  
**Priority**: ⭐⭐⭐⭐⭐ (Critical - Week 1)  
**Dependencies**: C1 (architecture approval), B1 (API endpoints)  
**Coordinates with**: F3 (UI/UX), B1 (API)

---

## RESPONSIBILITIES

### ESTATE Mode UI
- Property search interface
- Filter components
- Map integration (Mapbox)
- Property listing cards
- Visible agent debate UI

### 3-Mode Theme System
- Blue theme (ESTATE)
- Saffron theme (INDU)
- Green/Teal theme (WEB3)
- Theme switcher component

### Components
- Search bar with filters
- Property cards
- Agent debate panel
- Glass Box component (visible reasoning)

---

## CONTEXT

**Framework**: Next.js 14 (App Router)  
**Styling**: Tailwind CSS + Shadcn UI  
**State**: Zustand + React Query  
**Plan**: `HYBRID-FINAL.md` Phase 1 - ESTATE Mode

---

## CURRENT TASKS (Week 1)

### Priority 1: ESTATE Mode Search
```typescript
// Create: frontend/src/app/estate/page.tsx
// Features:
- Search input with autocomplete
- Property type filters (House, Condo, Apartment)
- Price range slider
- Bedrooms/bathrooms filters
- Map view toggle
- List/Grid view toggle
```

### Priority 2: Property Listings
```typescript
// Create: frontend/src/components/estate/PropertyCard.tsx
// Display:
- Property photo (primary)
- Title, price, location
- Bedrooms, bathrooms, sqft
- Vastu score badge
- Climate risk badge
- "View Details" button
```

### Priority 3: Visible Debate UI
```typescript
// Create: frontend/src/components/agents/DebatePanel.tsx
// Show:
- Agent avatars + names
- Agent messages (debate format)
- Final verdict card
- "Download Uncle Report" button
```

---

## TECH STACK

**Must Use**:
- Next.js 14 App Router
- TypeScript (strict mode)
- Tailwind CSS
- Shadcn UI components
- React Query for data fetching
- Zustand for client state

**APIs to Integrate**:
- `GET /api/properties` - Property search
- `GET /api/properties/:id` - Property details

---

## HANDOFF PROTOCOLS

### From @C1 (CTO):
```markdown
APPROVED: Component architecture
- Use App Router structure
- Components in src/components/estate/
- Theme via CSS variables
PROCEED with implementation
```

### To @B1 (API Backend):
```markdown
NEED: API endpoints
- GET /api/properties?city=Bangalore&minPrice=5000000
- GET /api/properties/:id
- Response format: { properties: [], pagination: {} }
```

---

## EXAMPLE CODE

**ESTATE Mode Page**:
```typescript
// frontend/src/app/estate/page.tsx
'use client';

import { SearchBar } from '@/components/estate/SearchBar';
import { PropertyGrid } from '@/components/estate/PropertyGrid';
import { usePropertySearch } from '@/hooks/usePropertySearch';

export default function EstatePage() {
  const { properties, isLoading } = usePropertySearch();
  
  return (
    <div className="theme-estate">
      <SearchBar />
      <PropertyGrid properties={properties} loading={isLoading} />
    </div>
  );
}
```

---

## CURRENT STATUS

**This Week**:
- [ ] Create ESTATE mode search page
- [ ] Build PropertyCard component
- [ ] Implement theme switching
- [ ] Create visible debate UI

**Blocked By**: @B1 API endpoints  
**Next**: Property details page
