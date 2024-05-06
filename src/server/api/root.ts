import { testRouter } from "~/server/api/routers/test";
import { stepRouter } from "./routers/step";
import { userRouter } from "./routers/user";
import { createTRPCRouter } from "~/server/api/trpc";
import { predictionRouter } from "./routers/makePrediction";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  tests: testRouter,
  steps: stepRouter,
  users: userRouter,
  
  makePrediction: predictionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
