import { clerk } from './clerk-client.js';

export async function isOnboarded(userId: string): Promise<boolean> {
  const user = await clerk.users.getUser(userId);
  return user.publicMetadata?.onboarded === true;
}

export async function completeOnboarding(userId: string): Promise<void> {
  const user = await clerk.users.getUser(userId);
  const existingPublicMetadata = (user.publicMetadata || {}) as Record<string, unknown>;

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...existingPublicMetadata,
      onboarded: true,
    },
  });
}
