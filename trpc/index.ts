import { auth } from '@clerk/nextjs'
import { ENTITY_TYPE } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import prisma from '@/lib/db'
import { boardRouter } from './routes/board'
import { cardRouter } from './routes/card'
import { listRouter } from './routes/list'
import { publicProcedure, router } from './trpc'

export const appRouter = router({
  board: boardRouter,
  list: listRouter,
  card: cardRouter,
  getLogs: publicProcedure
    .input(
      z.object({
        cardId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { cardId } = input

      try {
        const auditLogs = await prisma.auditLog.findMany({
          where: {
            orgId,
            entityId: cardId,
            entityType: ENTITY_TYPE.CARD,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        })

        return auditLogs
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }
    }),
})

// export type definition of API
export type AppRouter = typeof appRouter
