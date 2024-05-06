import { z } from "zod";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

import { and, eq, sql } from "drizzle-orm";
export const userRouter = createTRPCRouter({
    updateUser: publicProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        })
      )
      .mutation(async (opts) => {
        let db = opts.ctx.db
        let input = opts.input
        const insertedUser = await db.update(users)
          .set({
            id: input.id,
            name: input.name,
            email: input.email,
          })
        return insertedUser;
      }),
  
    // returns whether the user exists given the test id
    getUser: publicProcedure
      .input(
        z.object({
          id: z.string(),
        })
      )
      .query(async (opts) => {
        let db = opts.ctx.db
        let input = opts.input
        const user = await db.query.users.findFirst({where: eq(users.id, input.id)})
        return user
      })

  })
  
  
  