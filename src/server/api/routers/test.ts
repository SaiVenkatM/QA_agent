import { z } from "zod";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { tests } from "~/server/db/schema";
import { steps } from "~/server/db/schema";

import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { Code } from "lucide-react";

export const testRouter = createTRPCRouter({
  /**
   * Returns all tests for a given user Private Procedure, must be logged in to work
   * NOTE: sorting should be done clientside, instead of serverside. 
   * should not request an additional query to sort data that we already have
   **/
  getAllTests: publicProcedure
    .query(async (opts) => {
      let currUserId = opts.ctx.currentUserId;
      let db = opts.ctx.db;
      const allTests = await db.query.tests.findMany({
        where: eq(tests.author_id, currUserId)
      })
      return allTests
    }),

  /**
   * Gets test given a test id
   * Checks if the test id is also owned by the currently logged in user
   *
   * @param id a string of the requested tests' id
   **/
  getTest: privateProcedure
    // input is id (number)
    .input(
      z.object({
        id: z.string(),
      }),
    )
    // requests row using the id
    .query(async (opts) => {
      let currUserId = opts.ctx.currentUserId;
      let db = opts.ctx.db;

      const test = await db.query.tests.findFirst({
        where: and(eq(tests.author_id, currUserId), eq(tests.id, opts.input.id))
      })

      return test
    }),

  /**
   * Gets test and steps
   * 
   * @param test_id
   * 
   **/

  getTestWithSteps: privateProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    // requests row using the id
    .query(async (opts) => {
      let currUserId = opts.ctx.currentUserId;
      let db = opts.ctx.db;

      const test = await db.query.tests.findFirst({
        with: {
          // gets all the values of the steps as well (need to test)
          steps: {
            columns: {
              id: true,
              actionType: true,
              tapType: true,
              scrollDirection: true,
              description: true
            }
          }
        },
        where: and(eq(tests.author_id, currUserId), eq(tests.id, opts.input.id))
      })

      return test
    }),


  /**
   * creates a new test
   * uses default values provided by schema for 
   * createdAt
   * updatedAt
   * status
   *
   * @param name a string of the requested tests' id
   * @param duration unknown?
   * @param description description of the test
   * @param sampleInput sample input for the test ("unsure of this")
   * @param expectedOutput exprected output for a test
   * @param trigger trigger for test (unsure what this is?)
   **/
  addTest: publicProcedure
    .input(
      z.object({
        name: z.string(),
        duration: z.number(),
        description: z.string(),
        sampleInput: z.string(),
        expectedOutput: z.string(),
        trigger: z.string()
      }),
    )
    .mutation(async (opts) => {

      let currUserId = opts.ctx.currentUserId;
      let db = opts.ctx.db;
      let input = opts.input

      return await db.insert(tests).values({
        name: input.name,
        duration: input.duration,
        description: input.description,
        sampleInput: input.sampleInput,
        expectedOutput: input.expectedOutput,
        trigger: input.trigger,

        author_id: currUserId,
        updatedBy: currUserId
      })
    }),

  /**
   * updates a test with new values
   * must provide the entire test object for not
   * TODO: could update this later so we can update each component of a test
   *
   * requires you to own the test you want to update
   * 
   * @param the full test object that you want to update
   * @returns the updated test object
   **/
  updateTest: publicProcedure
    .input(
      // this will represent just a full test object
      z.object({
        id: z.string(),
        name: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        queuedAt: z.date(),
        duration: z.number(),
        description: z.string(),
        sampleInput: z.string(),
        expectedOutput: z.string(),
        status: z.number(),
        trigger: z.string(),
        authorId: z.string(),
        updatedBy: z.string()
      }),
    )
    .mutation(async (opts) => {

      let currUserId = opts.ctx.currentUserId;
      let db = opts.ctx.db;
      let input = opts.input

      const updatedTest = await db.update(tests)
        .set({
          id: input.id,
          name: input.name,
          createdAt: input.createdAt,
          updatedAt: input.createdAt,
          queuedAt: input.queuedAt,
          duration: input.duration,
          description: input.description,
          sampleInput: input.sampleInput,
          expectedOutput: input.expectedOutput,
          status: input.status,
          trigger: input.trigger,
          author_id: input.authorId,
          updatedBy: input.updatedBy
        })
        .where(and(eq(tests.id, currUserId), eq(tests.id, input.id)))
        .returning()

      // get first out of the array (id must be unique => there can only be one test updated)
      return updatedTest[0]
    }),

  /**
   * deletes a test with new values
   * must provide the entire test object for not
   * TODO: could update this later so we can update each component of a test
   * requires you to own the test (and the steps of that test) you want to update
   * @param id the test id that you want to delete 
   */
  deleteTest: privateProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async (opts) => {

      const currUserId = opts.ctx.currentUserId;
      const db = opts.ctx.db;
      // deletes test iff user owns test
      const deletedTest = await db.delete(tests)
        .where(and(eq(tests.id, opts.input.id), eq(tests.author_id, currUserId))).returning()

      // deletes steps iff user owns the steps
      const deletedSteps = await db.delete(steps)
        .where(and(eq(steps.test_id, opts.input.id), eq(steps.author_id, currUserId))).returning()

      //TODO: better error handling
      if (deletedSteps.length + deletedTest.length == 0) {
        throw new TRPCError({
          message: "something went wrong with deleting your test",
          code: "BAD_REQUEST"
        })
      }
    }),
})

// TODO: reformat the things below with the format above
// TODO: do we want to do these things one by one? 
// we dont need this file to be 500 lines long, it will be so hard to change later if we have to update.
//
//
// updates test name given a test id
//   updateTestName: publicProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         name: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input, ctx = opts.ctx
//       return await ctx.db.update(tests).set({ name: input.name }).where(sql`${tests.id} = ${input.id}`)
//     }),
//
//   // updates when the test was updated given a test id
//   updateTestUpdatedAt: publicProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         updatedAt: z.date()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input, ctx = opts.ctx
//       return await ctx.db.update(tests).set({ updatedAt: input.updatedAt }).where(sql`${tests.id} = ${input.id}`)
//     }),
//
//   //updates when test was last queued at
//   updateTestQueuedAt: publicProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         queuedAt: z.date()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input, ctx = opts.ctx
//       return await ctx.db.update(tests).set({ queuedAt: input.queuedAt }).where(sql`${tests.id} = ${input.id}`)
//     }),
//
//   // updates who last updated the test, may take an uuid?
//   updateTestUpdatedby: publicProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         updatedBy: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input, ctx = opts.ctx
//       return await ctx.db.update(tests).set({ updatedBy: input.updatedBy }).where(sql`${tests.id} = ${input.id}`)
//     }),
//
//   // updates test duration
//   updateTestDuration: publicProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         duration: z.number()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input, ctx = opts.ctx
//       return await ctx.db.update(tests).set({ duration: input.duration }).where(sql`${tests.id} = ${input.id}`)
//     }),
//
//   // updates the description given a test id
//   updateTestDescription: publicProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         description: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input, ctx = opts.ctx
//       return await ctx.db.update(tests).set({ description: input.description }).where(sql`${tests.id} = ${input.id}`)
//     }),
//
//   // updates the sample input given a test id
//   updateTestSampleInput: publicProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         sampleInput: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input, ctx = opts.ctx
//       return await ctx.db.update(tests).set({ sampleInput: input.sampleInput }).where(sql`${tests.id} = ${input.id}`)
//     }),
//
//   // updates the expected output given a test id
//   updateTestExpectedOutput: publicProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         expectedOutput: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input, ctx = opts.ctx
//       return await ctx.db.update(tests).set({ expectedOutput: input.expectedOutput }).where(sql`${tests.id} = ${input.id}`)
//     }),
//
//   // updates the if the test ran given a test id
//   updateTestStatus: publicProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         status: z.number()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input, ctx = opts.ctx
//       return await ctx.db.update(tests).set({ status: input.status }).where(sql`${tests.id} = ${input.id}`)
//     }),
//
//   // deletes a test given a test id
//   deleteTest: publicProcedure
//     .input(
//       z.object({
//         id: z.string(),
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input, ctx = opts.ctx
//       return await ctx.db.delete(tests).where(sql`${tests.id} = ${input.id}`)
//     }),
// });
//
// export const stepRouter = createTRPCRouter({
//
//   // gets the steps for a given test id
//   getSteps: publicProcedure
//     // input is id (number)
//     .input(
//       z.object({
//         id: z.string(),
//       }),
//     )
//     // requests row using the id
//     .query(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const specificTest = await ctx.db.select().from(tests).where(sql`${tests.id} = ${input.id}`);
//       return specificTest
//     }),
//   getTestWithSteps: privateProcedure
//     // input is id (number)
//     .input(
//       z.object({
//         id: z.string(),
//       }),
//     )
//     // requests row using the id
//     .query(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const specificTest = await ctx.db.query.stepTable.findMany({
//         with: {
//           stepTable: true
//         }
//       }
//
//       ).(sql`${tests.id} = ${input.id}`);
//       return specificTest
//     }),
//
//   // adds a test with given inputs
//   addTest: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         name: z.string(),
//         createdAt: z.date(),
//         updatedAt: z.date(),
//         queuedAt: z.date(),
//         updatedBy: z.string(),
//         description: z.string(),
//         sampleInput: z.string(),
//         expectedOutput: z.string(),
//         status: z.number(),
//         trigger: z.string()
//       }),
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const insertTest = await ctx.db.insert(tests).values({
//         id: input.id,
//         name: input.name,
//         createdAt: input.createdAt,
//         updatedAt: input.updatedAt,
//         author_id: ctx.currentUserId,
//         queuedAt: input.queuedAt,
//         updatedBy: input.updatedBy,
//         description: input.description,
//         sampleInput: input.sampleInput,
//         expectedOutput: input.expectedOutput,
//         status: input.status,
//         trigger: input.trigger
//       })
//
//       return insertTest
//     }),
//
//   //updates test name given a test id
//   updateTestName: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         name: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(tests).set({ name: input.name }).where(and(eq(tests.id, input.id), eq(tests.author_id, ctx.currentUserId)))
//       return error
//     }),
//
//   // updates when the test was updated given a test id
//   updateTestUpdatedAt: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         updatedAt: z.date()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(tests).set({ updatedAt: input.updatedAt }).where(and(eq(tests.id, input.id), eq(tests.author_id, ctx.currentUserId)))
//       return error
//     }),
//
//   //updates when test was last queued at
//   updateTestQueuedAt: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         queuedAt: z.date()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(tests).set({ queuedAt: input.queuedAt }).where(and(eq(tests.id, input.id), eq(tests.author_id, ctx.currentUserId)))
//       return error
//     }),
//
//   // updates who last updated the test, may take an uuid?
//   updateTestUpdatedby: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         updatedBy: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(tests).set({ updatedBy: input.updatedBy }).where(and(eq(tests.id, input.id), eq(tests.author_id, ctx.currentUserId)))
//       return error
//     }),
//
//   // updates test duration
//   updateTestDuration: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         duration: z.number()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(tests).set({ duration: input.duration }).where(and(eq(tests.id, input.id), eq(tests.author_id, ctx.currentUserId)))
//       return error
//     }),
//
//   // updates the description given a test id
//   updateTestDescription: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         description: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(tests).set({ description: input.description }).where(and(eq(tests.id, input.id), eq(tests.author_id, ctx.currentUserId)))
//       return error
//     }),
//
//   // updates the sample input given a test id
//   updateTestSampleInput: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         sampleInput: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(tests).set({ sampleInput: input.sampleInput }).where(and(eq(tests.id, input.id), eq(tests.author_id, ctx.currentUserId)))
//       return error
//     }),
//
//   // updates the expected output given a test id
//   updateTestExpectedOutput: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         expectedOutput: z.string()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(tests).set({ expectedOutput: input.expectedOutput }).where(and(eq(tests.id, input.id), eq(tests.author_id, ctx.currentUserId)))
//       return error
//     }),
//
//   // updates the if the test ran given a test id
//   updateTestStatus: privateProcedure
//     .input(
//       z.object({
//         id: z.string(),
//         status: z.number()
//       })
//     )
//     .mutation(async (opts) => {
//       const input = opts.input
//       const ctx = opts.ctx
//       const error = await ctx.db.update(tests).set({ status: input.status }).where(and(eq(tests.id, input.id), eq(tests.author_id, ctx.currentUserId)))
//       return error
//     }),
