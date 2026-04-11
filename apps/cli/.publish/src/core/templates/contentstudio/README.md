# ContentStudio Template

ContentStudio is a headless CMS template with content versioning, media management, and publication workflow.

## Included

- Prisma schema for Content, ContentVersion, Media, Category, Tag
- Content CRUD and publish helpers
- Media upload and management helpers
- Versioning utilities with rollback

## Directory

```text
templates/contentstudio/
  schema.prisma
  api/
    content.ts
    media.ts
    versions.ts
  lib/
    prisma.ts
    slugify.ts
    versioning.ts
    media.ts
```

## Data Model

- Content: canonical content record with status and publish date.
- ContentVersion: immutable snapshots of content body.
- Media: asset library for uploads and attachments.
- Category and Tag: taxonomy support.

## Setup

1. Copy template into your project.
2. Install Prisma dependencies:

```bash
npm install prisma @prisma/client
```

3. Configure database:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/contentstudio"
```

4. Generate client and run migration:

```bash
npx prisma generate
npx prisma migrate dev --name init_contentstudio
```

## Core APIs

### Content

- createContent(authorId, data)
- updateContent(contentId, authorId, data)
- publishContent(contentId, authorId)
- listContent(authorId, status?)

### Media

- uploadMedia(ownerId, { fileName, mimeType, url? })
- getMedia(ownerId)
- removeMedia(ownerId, mediaId)

### Versions

- getPostVersions(contentId)
- rollbackPost(contentId, versionNumber)

## Versioning

`lib/versioning.ts` provides:

- createVersion(contentId)
- restoreVersion(contentId, versionNumber)
- diff(before, after)

On each content update, a version snapshot is created before applying changes, enabling rollbacks and audits.

## Production Notes

- Enforce author ownership checks at the route layer.
- Validate media MIME types and size limits before storing.
- Use object storage (S3/R2) for actual asset hosting.
