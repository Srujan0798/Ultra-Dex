// Ultra-Dex Production Pattern: tRPC Router
// Copy to server/routers/ directory

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure, protectedProcedure, adminProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

// =============================================================================
// USER ROUTER
// =============================================================================

export const userRouter = router({
  // Get current user profile
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      include: {
        organizationMemberships: {
          include: { organization: true },
        },
      },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    return user;
  }),

  // Update current user profile
  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).optional(),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.user.update({
        where: { clerkId: ctx.userId },
        data: input,
      });
    }),

  // List all users (admin only)
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const users = await prisma.user.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' },
      });

      let nextCursor: string | undefined;
      if (users.length > input.limit) {
        const nextItem = users.pop();
        nextCursor = nextItem!.id;
      }

      return { users, nextCursor };
    }),
});

// =============================================================================
// PROJECT ROUTER
// =============================================================================

export const projectRouter = router({
  // List projects for current organization
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify user has access to organization
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          user: { clerkId: ctx.userId },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      return prisma.project.findMany({
        where: {
          organizationId: input.organizationId,
          ...(input.status && { status: input.status }),
        },
        include: {
          owner: { select: { name: true, imageUrl: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }),

  // Get single project
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.id },
        include: {
          owner: true,
          tasks: { orderBy: { createdAt: 'desc' } },
          organization: true,
        },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Verify access
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: project.organizationId,
          user: { clerkId: ctx.userId },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return project;
    }),

  // Create project
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        organizationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user has write access to organization
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: input.organizationId,
          user: { clerkId: ctx.userId },
          role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const user = await prisma.user.findUnique({
        where: { clerkId: ctx.userId },
      });

      return prisma.project.create({
        data: {
          name: input.name,
          description: input.description,
          organizationId: input.organizationId,
          ownerId: user!.id,
        },
      });
    }),

  // Update project
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        status: z.enum(['ACTIVE', 'ARCHIVED', 'COMPLETED']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Verify write access
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: project.organizationId,
          user: { clerkId: ctx.userId },
          role: { in: ['OWNER', 'ADMIN', 'MEMBER'] },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return prisma.project.update({
        where: { id },
        data,
      });
    }),

  // Delete project
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findUnique({
        where: { id: input.id },
      });

      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Only owner/admin can delete
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: project.organizationId,
          user: { clerkId: ctx.userId },
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });

      if (!membership) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return prisma.project.delete({ where: { id: input.id } });
    }),
});

// =============================================================================
// ROOT ROUTER
// =============================================================================

export const appRouter = router({
  user: userRouter,
  project: projectRouter,
});

export type AppRouter = typeof appRouter;
