// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Server Actions module
 * @module code/server-actions
 */

// Ultra-Dex Production Pattern: Next.js 15 Server Actions
// Copy this file to your app/actions/ directory

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// =============================================================================
// SCHEMA DEFINITIONS
// =============================================================================

const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

const UpdateUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

// =============================================================================
// ACTION RESPONSE TYPE
// =============================================================================

type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// =============================================================================
// USER ACTIONS
// =============================================================================

export async function createUser(
  prevState: ActionResponse<{ id: string }> | null,
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const rawData = {
    email: formData.get('email'),
    name: formData.get('name'),
    role: formData.get('role') || 'USER',
  };

  const validated = CreateUserSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await prisma.user.create({
      data: validated.data,
    });

    console.log(
      JSON.stringify({
        level: 'info',
        event: 'user_created',
        userId: user.id,
        createdBy: userId,
      })
    );

    revalidatePath('/users');
    return { success: true, data: { id: user.id } };
  } catch (error) {
    console.error('Failed to create user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

export async function updateUser(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  const rawData = {
    id: formData.get('id'),
    name: formData.get('name'),
    email: formData.get('email'),
  };

  const validated = UpdateUserSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.user.update({
      where: { id: validated.data.id },
      data: {
        ...(validated.data.name && { name: validated.data.name }),
        ...(validated.data.email && { email: validated.data.email }),
      },
    });

    revalidatePath('/users');
    revalidatePath(`/users/${validated.data.id}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to update user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}

export async function deleteUser(id: string): Promise<ActionResponse> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    console.log(
      JSON.stringify({
        level: 'info',
        event: 'user_deleted',
        deletedUserId: id,
        deletedBy: userId,
      })
    );

    revalidatePath('/users');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('Failed to delete user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

// =============================================================================
// USAGE IN COMPONENTS
// =============================================================================

/*
// In a Client Component:

'use client';

import { useActionState } from 'react';
import { createUser } from '@/app/actions/user';

export function CreateUserForm() {
  const [state, formAction, isPending] = useActionState(createUser, null);

  return (
    <form action={formAction}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />

      {state?.error && (
        <p className="text-red-500">{state.error}</p>
      )}

      {state?.fieldErrors?.email && (
        <p className="text-red-500">{state.fieldErrors.email[0]}</p>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
*/
