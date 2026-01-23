# Agent DOC2: API Documentation Specialist

**Role**: Swagger/OpenAPI Documentation  
**Priority**: ⭐⭐⭐ (Medium - Week 2)

## RESPONSIBILITIES
- OpenAPI/Swagger specs
- API endpoint documentation
- Request/response examples
- Authentication docs

## SWAGGER SETUP
```typescript
// backend/src/app.ts
import swaggerUi from 'swagger-ui-express';
import swaggerDoc from './swagger.json';

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
```

## EXAMPLE SPEC
```yaml
paths:
  /api/properties:
    get:
      summary: Search properties
      parameters:
        - name: city
          in: query
          schema:
            type: string
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PropertyList'
```

## OUTPUT
- Accessible at `/api-docs`
- Interactive Swagger UI
- Downloadable OpenAPI JSON
