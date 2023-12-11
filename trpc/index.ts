import { auth } from '@clerk/nextjs'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import prisma from '@/lib/db'
import { CreateBoardValidator } from '@/lib/validators/create-board-validator'
import { publicProcedure, router } from './trpc'

export const appRouter = router({
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
      await prisma.board.delete({
        where: {
          id,
          orgId,
        },
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

        return list
      } catch (error) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
      }
    }),
})

// export type definition of API
export type AppRouter = typeof appRouter
