import { auth } from '@clerk/nextjs'
import { ACTION, ENTITY_TYPE } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createAuditLog } from '@/lib/create-audit-log'
import prisma from '@/lib/db'
import { CreateBoardValidator } from '@/lib/validators/create-board-validator'
import { publicProcedure, router } from './trpc'

export const appRouter = router({
  getBoardById: publicProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    const { userId, orgId } = auth()

    if (!userId || !orgId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { id } = input

    try {
      const board = await prisma.board.findUnique({
        where: {
          id,
          orgId,
        },
      })

      return board
    } catch (error) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
    }
  }),

  createBoard: publicProcedure.input(CreateBoardValidator).mutation(async ({ input }) => {
    const { userId, orgId } = auth()

    if (!userId || !orgId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { title, image } = input
    const [imageId, imageThumbUrl, imageFullUrl, imageLinkHTML, imageUserName] = image.split('|')

    // console.log({ imageId, imageThumbUrl, imageFullUrl, imageLinkHTML, imageUserName })

    if (!imageId || !imageThumbUrl || !imageFullUrl || !imageLinkHTML || !imageUserName) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Missing fields. Failed to create board.',
      })
    }

    try {
      const board = await prisma.board.create({
        data: {
          title,
          orgId,
          imageId,
          imageThumbUrl,
          imageFullUrl,
          imageLinkHTML,
          imageUserName,
        },
      })

      await createAuditLog({
        entityId: board.id,
        entityTitle: board.title,
        entityType: ENTITY_TYPE.BOARD,
        action: ACTION.CREATE,
      })

      return { success: true, board }
    } catch (error) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
    }
  }),

  updateBoardTitle: publicProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3, { message: 'Title is too short.' }),
      })
    )
    .mutation(async ({ input }) => {
      const { userId, orgId } = auth()

      if (!userId || !orgId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { title, id } = input

      if (!title || !id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Missing fields. Failed to create board.',
        })
      }

      try {
        const board = await prisma.board.update({
          where: {
            id,
            orgId,
          },
          data: {
            title,
          },
        })

        await createAuditLog({
          entityId: board.id,
          entityTitle: board.title,
          entityType: ENTITY_TYPE.BOARD,
          action: ACTION.UPDATE,
        })

        return board
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }
    }),

  deleteBoard: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const { userId, orgId } = auth()

    if (!userId || !orgId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { id } = input

    try {
      const board = await prisma.board.delete({
        where: {
          id,
          orgId,
        },
      })

      await createAuditLog({
        entityId: board.id,
        entityTitle: board.title,
        entityType: ENTITY_TYPE.BOARD,
        action: ACTION.DELETE,
      })

      return { success: true, orgId }
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
