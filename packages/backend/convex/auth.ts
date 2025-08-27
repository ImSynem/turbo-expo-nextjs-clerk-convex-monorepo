import { ConvexError } from 'convex/values';
import { MutationCtx, QueryCtx } from './_generated/server';

/**
 * Get the current user's ID from the given context.
 *
 * Throws a ConvexError if the user is not authenticated.
 */
export async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError('You must be logged in to access this resource');
  }

  const user = await ctx.db
    .query('users')
    .withIndex('byExternalId', (q: any) => q.eq('externalId', identity.subject))
    .first();

  if (!user) {
    throw new ConvexError('User not found');
  }

  return user;
}