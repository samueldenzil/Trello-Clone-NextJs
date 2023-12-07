import { auth } from '@clerk/nextjs'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import prisma from '@/lib/db'
import { publicProcedure, router } from './trpc'

export const appRouter = router({
  createBoard: publicProcedure
    .input(z.object({ title: z.string() }))
    .mutation(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { title } = input
      try {
        const board = await prisma.board.create({
          data: {
            title,
          },
        })
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }

      return { success: true }
    }),
})

// export type definition of API
export type AppRouter = typeof appRouter
