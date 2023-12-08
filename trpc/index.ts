import { auth } from '@clerk/nextjs'
import { TRPCError } from '@trpc/server'

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

    console.log({ imageId, imageThumbUrl, imageFullUrl, imageLinkHTML, imageUserName })

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
})

// export type definition of API
export type AppRouter = typeof appRouter
