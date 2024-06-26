/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { getAuth } from "@clerk/nextjs/server";
import { TRPCError, initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "~/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

type CreateContextOptions = Record<string, never>;

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
// NOTE: disabling, we arent using testing or createSSGhelpers
// const createInnerTRPCContext = (_opts: CreateContextOptions) => {
//   return {
//     db,
//
//   };
// };

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */

export const createTRPCContext = (opts: CreateNextContextOptions) => {
  
  const {req} = opts;

  const sesh = getAuth(req);

  const userId = sesh.userId;

  //NOTE: here we check if userID exists, if not we error since we only want
  //authenticated users to access private procedures
  if (!userId) {
    throw new TRPCError({
        message: "current user is not authenticated, please log in",
        code: "UNAUTHORIZED"
    });
  }
  
  return {
    db,
    // user id of the current user
    currentUserId: userId,
  };
};

// export const createTRPCContext = (_opts: CreateNextContextOptions) => {
//   return createInnerTRPCContext({});
// };

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

// checks if user is authed
const enforceUserIsAutherd = t.middleware(async ({ctx, next}) => {
  if (!ctx.currentUserId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not Authorized"
    });
  }

  // i have no clue how this works 
  // just returning the context thats passed into the middleware
  return next({
    ctx: {
      currentUserId: ctx.currentUserId,
      db: ctx.db
    }
  });
})

// this means that whenever we use a private procedure, this middle ware
// is going to run on the context / request to that procedure
// meaning that we will always be checking if this user is autherticated.
export const privateProcedure = t.procedure.use(enforceUserIsAutherd)
