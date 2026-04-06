// Type definitions for Content Studio

export interface Content {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  categoryId?: string | null;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  content: string;
  createdAt: Date;
}

export interface Media {
  id: string;
  ownerId: string;
  url: string;
  type: string;
  size?: number;
  metadata?: Record<string, unknown>;
  contentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
