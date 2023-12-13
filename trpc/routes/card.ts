import { auth } from '@clerk/nextjs'
import { ACTION, ENTITY_TYPE } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createAuditLog } from '@/lib/create-audit-log'
import prisma from '@/lib/db'
import { publicProcedure, router } from '../trpc'

export const cardRouter = router({
  getCard: publicProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { id } = input

      try {
        const card = await prisma.card.findUnique({
          where: {
            id,
            list: {
              board: {
                orgId,
              },
            },
          },
          include: {
            list: {
              select: {
                title: true,
              },
            },
          },
        })

        return card
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Something went wrong' })
      }
    }),

  createCard: publicProcedure
    .input(
      z.object({
        title: z.string(),
        boardId: z.string(),
        listId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { boardId, listId, title } = input

      try {
        const list = await prisma.list.findUnique({
          where: {
            id: listId,
            boardId,
            board: {
              orgId,
            },
          },
        })

        if (!list) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'List not found' })
        }

        const lastCard = await prisma.card.findFirst({
          where: {
            listId,
          },
          orderBy: {
            order: 'desc',
          },
          select: {
            order: true,
          },
        })

        const newOrder = lastCard ? lastCard.order + 1 : 1

        const card = await prisma.card.create({
          data: {
            title,
            listId,
            order: newOrder,
          },
        })

        await createAuditLog({
          entityId: card.id,
          entityTitle: card.title,
          entityType: ENTITY_TYPE.CARD,
          action: ACTION.CREATE,
        })

        return { card }
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }
    }),

  updateCard: publicProcedure
    .input(
      z.object({
        id: z.string(),
        boardId: z.string(),
        title: z
          .string({
            required_error: 'Title is required',
            invalid_type_error: 'Title is required',
          })
          .min(3, { message: 'Title is too short.' })
          .optional(),
        description: z
          .string({
            required_error: 'Description is required',
            invalid_type_error: 'Description is required',
          })
          .min(3, { message: 'Description is too short.' })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { boardId, description, id, title } = input

      try {
        const card = await prisma.card.update({
          where: {
            id,
            list: {
              boardId,
              board: {
                orgId,
              },
            },
          },
          data: {
            title,
            description,
          },
        })

        await createAuditLog({
          entityId: card.id,
          entityTitle: card.title,
          entityType: ENTITY_TYPE.CARD,
          action: ACTION.UPDATE,
        })

        return { card }
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }
    }),

  deleteCard: publicProcedure
    .input(z.object({ id: z.string(), boardId: z.string() }))
    .mutation(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { id, boardId } = input

      try {
        const card = await prisma.card.delete({
          where: {
            id,
            list: {
              boardId,
              board: {
                orgId,
              },
            },
          },
        })

        await createAuditLog({
          entityId: card.id,
          entityTitle: card.title,
          entityType: ENTITY_TYPE.CARD,
          action: ACTION.DELETE,
        })

        return { card }
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }
    }),

  updateCardOrder: publicProcedure
    .input(
      z.object({
        boardId: z.string(),
        items: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            order: z.number(),
            listId: z.string(),
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
        const transaction = items.map((card) =>
          prisma.card.update({
            where: {
              id: card.id,
              list: {
                boardId,
                board: {
                  orgId,
                },
              },
            },
            data: {
              order: card.order,
              listId: card.listId,
            },
          })
        )

        const updatedCards = await prisma.$transaction(transaction)

        return { updatedCards }
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong` })
      }
    }),

  copyCard: publicProcedure
    .input(z.object({ id: z.string(), boardId: z.string() }))
    .mutation(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { id, boardId } = input

      try {
        const cardToCopy = await prisma.card.findUnique({
          where: {
            id,
            list: {
              boardId,
              board: {
                orgId,
              },
            },
          },
        })

        if (!cardToCopy) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Card not found' })
        }

        const lastCard = await prisma.card.findFirst({
          where: {
            listId: cardToCopy.listId,
            list: {
              boardId,
              board: {
                orgId,
              },
            },
          },
          orderBy: {
            order: 'desc',
          },
          select: {
            order: true,
          },
        })

        const newOrder = lastCard ? lastCard.order + 1 : 1

        const card = await prisma.card.create({
          data: {
            title: `${cardToCopy.title} - Copy`,
            description: cardToCopy.description,
            order: newOrder,
            listId: cardToCopy.listId,
          },
        })

        await createAuditLog({
          entityId: card.id,
          entityTitle: card.title,
          entityType: ENTITY_TYPE.CARD,
          action: ACTION.CREATE,
        })

        return { card }
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }
    }),
})
