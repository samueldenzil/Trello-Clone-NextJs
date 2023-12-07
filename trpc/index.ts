import { z } from 'zod'

import { publicProcedure, router } from './trpc'

export const appRouter = router({
  getTodos: publicProcedure.query(async () => {
    return [10, 20, 30]
  }),
  setTitle: publicProcedure.input(z.object({ title: z.string() })).mutation(({ input }) => {
    console.log('the title is ', input.title)
    return { success: true }
  }),
})

// export type definition of API
export type AppRouter = typeof appRouter
