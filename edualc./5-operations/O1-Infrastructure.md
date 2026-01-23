# Agent O1: Infrastructure Engineer

**Role**: Cloud & DevOps  
**Priority**: ⭐⭐⭐ (Medium - Week 2)  
**Platforms**: Vercel, Railway, AWS

## RESPONSIBILITIES
- Frontend deployment (Vercel)
- Backend deployment (Railway)
- Database hosting (Railway Postgres)
- Redis (Upstash)
- S3 storage (PropertyPhotos)

## DEPLOYMENT STRATEGY
**Frontend**: Vercel
- Auto-deploy from main branch
- Preview deployments for PRs
- Edge functions

**Backend**: Railway
- PostgreSQL + Redis included
- Auto-scaling
- Environment variables

**File Storage**: AWS S3
- Property photos
- Documents (PDFs)
- Vastu reports

## ENVIRONMENTS
- Production: rest-in-u.vercel.app
- Staging: staging.rest-in-u.vercel.app
- Dev: localhost
