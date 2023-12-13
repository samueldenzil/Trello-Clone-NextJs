import { auth } from '@clerk/nextjs'
import { ACTION, ENTITY_TYPE } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createAuditLog } from '@/lib/create-audit-log'
import prisma from '@/lib/db'
import { publicProcedure, router } from '../trpc'

export const listRouter = router({
  getLists: publicProcedure.input(z.object({ boardId: z.string() })).query(async ({ input }) => {
    const { userId, orgId } = auth()

    if (!userId || !orgId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { boardId } = input

    try {
      const lists = await prisma.list.findMany({
        where: {
          boardId,
          board: {
            orgId,
          },
        },
        include: {
          cards: {
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      })

      return lists
    } catch (error) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
    }
  }),

  createList: publicProcedure
    .input(
      z.object({
        boardId: z.string(),
        title: z.string().min(3, { message: 'Minimum 3 chars required.' }),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { boardId, title } = input

      try {
        const board = await prisma.board.findUnique({
          where: {
            id: boardId,
            orgId,
          },
        })

        if (!board) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Board not found' })
        }

        const lastList = await prisma.list.findFirst({
          where: {
            boardId,
          },
          orderBy: {
            order: 'desc',
          },
          select: { order: true },
        })

        const newOrder = lastList ? lastList.order + 1 : 1

        const list = await prisma.list.create({
          data: {
            title,
            boardId,
            order: newOrder,
          },
        })

        await createAuditLog({
          entityId: list.id,
          entityTitle: list.title,
          entityType: ENTITY_TYPE.LIST,
          action: ACTION.CREATE,
        })

        return list
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }
    }),

  updateList: publicProcedure
    .input(
      z.object({
        boardId: z.string(),
        id: z.string(),
        title: z.string().min(3, { message: 'Minimum 3 chars required.' }),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { boardId, id, title } = input

      try {
        const list = await prisma.list.update({
          where: {
            id,
            boardId,
            board: {
              orgId,
            },
          },
          data: {
            title,
          },
        })

        await createAuditLog({
          entityId: list.id,
          entityTitle: list.title,
          entityType: ENTITY_TYPE.LIST,
          action: ACTION.UPDATE,
        })

        return list
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }
    }),

  deleteList: publicProcedure
    .input(
      z.object({
        id: z.string(),
        boardId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { boardId, id } = input

      try {
        const list = await prisma.list.delete({
          where: {
            id,
            boardId,
            board: {
              orgId,
            },
          },
        })

        await createAuditLog({
          entityId: list.id,
          entityTitle: list.title,
          entityType: ENTITY_TYPE.LIST,
          action: ACTION.DELETE,
        })

        return list
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }
    }),

  copyList: publicProcedure
    .input(
      z.object({
        id: z.string(),
        boardId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { boardId, id } = input

      try {
        const listToCopy = await prisma.list.findUnique({
          where: {
            id,
            boardId,
            board: {
              orgId,
            },
          },
          include: {
            cards: true,
          },
        })

        if (!listToCopy) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found' })
        }

        const lastList = await prisma.list.findFirst({
          where: {
            boardId,
          },
          orderBy: {
            order: 'desc',
          },
          select: { order: true },
        })

        const newOrder = lastList ? lastList.order + 1 : 1

        const list = await prisma.list.create({
          data: {
            boardId: listToCopy.boardId,
            title: `${listToCopy.title} - Copy`,
            order: newOrder,
            cards: {
              createMany: {
                data: listToCopy.cards.map((card) => ({
                  title: card.title,
                  description: card.description,
                  order: card.order,
                })),
              },
            },
          },
          include: {
            cards: true,
          },
        })

        await createAuditLog({
          entityId: list.id,
          entityTitle: list.title,
          entityType: ENTITY_TYPE.LIST,
          action: ACTION.CREATE,
        })

        return { list }
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }
    }),

  updateListOrder: publicProcedure
    .input(
      z.object({
        boardId: z.string(),
        items: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            order: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { boardId, items } = input

      try {
        const transaction = items.map((list) =>
          prisma.list.update({
            where: {
              id: list.id,
              boardId,
              board: {
                orgId,
              },
            },
            data: {
              order: list.order,
            },
          })
        )

        const lists = await prisma.$transaction(transaction)

        return { lists }
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong` })
      }
    }),
})
