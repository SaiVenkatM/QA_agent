import { z } from 'zod';

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { steps } from "~/server/db/schema";

import { and, eq} from "drizzle-orm";

export const stepRouter = createTRPCRouter({
  /**
   * Create a step, takes the currently logged in user as the author
   * @param order the order the test needs to be 
   * @param actionType | undefined
   * @param scrollDirection | undefined
   * @param tapType | undefined
   * @param description | undefined
   * @param test_id | undefined
   **/
  createStep: privateProcedure
    .input(
      z.object({
        order: z.number(),
        actionType: z.string() || z.undefined(),
        scrollDirection: z.string() || z.undefined(),
        tapType: z.string() || z.undefined(),
        description: z.string() || z.undefined(),
        test_id: z.string()
      })
    )

    .mutation(async (opts) => {
      const input = opts.input
      const db = opts.ctx.db
      const currUserId = opts.ctx.currentUserId

      const insertStep = await db.insert(steps).values({
        order: input.order,
        actionType: input.actionType,
        scrollDirection: input.scrollDirection,
        tapType: input.tapType,
        description: input.description,
        test_id: input.test_id,

        author_id: currUserId
      })
      return insertStep
    }),

  /**
   * gets a step given an id
   * @param id id of the step youre requesting
   **/

  getStep: privateProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async (opts) => {
      const input = opts.input
      const db = opts.ctx.db

      const step = db.query.steps.findFirst({
        where: eq(steps.id, input.id)
      })

      return step
    }),

  /**
   * deletes a step given an id
   *
   * caller must own the step they are trying to delete
   *
   * @param id id of the step youre deleting
   * @returns the step that you deleted
   **/
  deleteStep: privateProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async (opts) => {
      const input = opts.input
      const db = opts.ctx.db
      const currUserId = opts.ctx.currentUserId
      // do we want the returning step? like the deleted step
      const deletedStep = db.delete(steps).where(and(eq(steps.id, input.id), eq(steps.author_id, currUserId ))).returning()
      return deletedStep
    }),

    //NOTE: we have the state of the test and steps on the client side, should just be able to 
    //update in bulk without worrying about each individual piece
    //

  /**
   * provide the state of the information, and an update will
   * push the information to the database
   *
   * user must own the test to update it
   *
   * @param order the order the test needs to be 
   * @param actionType | undefined
   * @param scrollDirection | undefined
   * @param tapType | undefined
   * @param description | undefined
   * @param test_id | undefined
   *
   **/
  updateStep: privateProcedure
    .input(
      z.object({
        id: z.string(),
        order: z.number(),
        actionType: z.string() || z.undefined(),
        scrollDirection: z.string() || z.undefined(),
        tapType: z.string() || z.undefined(),
        description: z.string() || z.undefined(),
        test_id: z.string()
      })
    )

    .mutation(async (opts) => {
      const input = opts.input
      const db = opts.ctx.db
      const currUserId = opts.ctx.currentUserId

      const deletedStep = await db.update(steps).set({
        order: input.order,
        actionType: input.actionType,
        scrollDirection: input.scrollDirection,
        tapType: input.tapType,
        description: input.description,
        test_id: input.test_id,

        author_id: currUserId
      }).where(
      and(eq(steps.id, input.id), eq(steps.author_id, currUserId))
      ).returning()

      return deletedStep
    }),

})
    //TODO: read test.ts for what to do about whats going on under
  //
  // // updates the step order number given a step id
  // updateStepOrder: privateProcedure
  //   .input(
  //     z.object({
  //       id: z.string(),
  //       order: z.number()
  //     })
  //   )
  //   .mutation(async (opts) => {
  //     const input = opts.input
  //     const ctx = opts.ctx
  //     const error = await ctx.db.update(stepTable).set({ order: input.order }).where(and(eq(stepTable.id, input.id), eq(stepTable.authorId, ctx.currentUserId)))
  //     return error
  //   }),

//   // updates a step action given a step id
//   updateStepActionType: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         actionType: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(stepTable).set({ actionType: input.actionType }).where(and(eq(stepTable.id, input.id), eq(stepTable.authorId, ctx.currentUserId)))
//       return error
//     }),
//
//   // updates step scroll direction given a step id
//   updateStepScrollDirection: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         scrollDirection: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(stepTable).set({ scrollDirection: input.scrollDirection }).where(and(eq(stepTable.id, input.id), eq(stepTable.authorId, ctx.currentUserId)))
//       return error
//     }),
//
//   // updates a step tap type given a step id
//   updateStepTapType: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         tapType: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(stepTable).set({ tapType: input.tapType }).where(and(eq(stepTable.id, input.id), eq(stepTable.authorId, ctx.currentUserId)))
//       return error
//     }),
//
//   // updates a test given a test id
//   updateStepDescription: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         description: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(stepTable).set({ description: input.description }).where(and(eq(stepTable.id, input.id), eq(stepTable.authorId, ctx.currentUserId)))
//       return error
//     }),
// })
