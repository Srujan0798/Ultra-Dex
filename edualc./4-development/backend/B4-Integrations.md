# Agent B4: Integrations Engineer

**Role**: External API Integration  
**Priority**: ⭐⭐⭐ (Medium - Week 2)  
**APIs**: 99acres, RERA, Google Maps, etc.

## RESPONSIBILITIES
- Third-party API integrations
- Data scraping (legal)
- API rate limiting
- Data normalization

## INTEGRATIONS (From HYBRID plan)
**Priority**:
- Google Maps API (geocoding, places)
- Weather APIs (climate data)
- Property listing APIs

**Future**:
- 99acres/MagicBricks (scraping)
- RERA (verification)
- Astrological APIs

## EXAMPLE
```typescript
// backend/src/integrations/google-maps.ts
export async function geocodeAddress(address: string) {
  const result = await googleMaps.geocode({ address });
  return { lat: result.lat, lng: result.lng };
}
```
