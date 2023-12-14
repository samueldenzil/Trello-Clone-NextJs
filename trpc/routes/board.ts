import { auth } from '@clerk/nextjs'
import { ACTION, ENTITY_TYPE } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createAuditLog } from '@/lib/create-audit-log'
import prisma from '@/lib/db'
import { decreaseAvailableCount, hasAvailableCount, incrementAvailableCount } from '@/lib/org-limit'
import { checkSubscription } from '@/lib/subscription'
import { CreateBoardValidator } from '@/lib/validators/create-board-validator'
import { publicProcedure, router } from '../trpc'

export const boardRouter = router({
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

    const canCreate = await hasAvailableCount()
    const isPro = await checkSubscription()

    if (!canCreate && !isPro) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You have reached your limit of free boards. Please upgrade to create more.',
      })
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

      if (!isPro) {
        await incrementAvailableCount()
      }

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

  updateBoard: publicProcedure
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

    const isPro = await checkSubscription()

    const { id } = input

    try {
      const board = await prisma.board.delete({
        where: {
          id,
          orgId,
        },
      })

      if (!isPro) {
        await decreaseAvailableCount()
      }

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
})
