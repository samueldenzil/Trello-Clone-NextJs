import { auth, currentUser } from '@clerk/nextjs'
import { ENTITY_TYPE } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import prisma from '@/lib/db'
import { absoluteUrl } from '@/lib/utils'
import { boardRouter } from './routes/board'
import { cardRouter } from './routes/card'
import { listRouter } from './routes/list'
import { publicProcedure, router } from './trpc'
import { stripe } from '@/lib/stripe'

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

  stripeRedirect: publicProcedure.mutation(async () => {
    const { userId, orgId } = auth()
    const user = await currentUser()

    if (!userId || !orgId || !user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const settingsUrl = absoluteUrl(`/organization/${orgId}`)
    let url = ''

    try {
      const orgSubscription = await prisma.orgSubscription.findUnique({
        where: {
          orgId,
        },
      })

      if (orgSubscription && orgSubscription.stripeCustomerId) {
        const stripeSession = await stripe.billingPortal.sessions.create({
          customer: orgSubscription.stripeCustomerId,
          return_url: settingsUrl,
        })

        url = stripeSession.url
      } else {
        const stripeSession = await stripe.checkout.sessions.create({
          success_url: settingsUrl,
          cancel_url: settingsUrl,
          payment_method_types: ['card'],
          mode: 'subscription',
          billing_address_collection: 'auto',
          customer_email: user.emailAddresses[0].emailAddress,
          line_items: [
            {
              price_data: {
                currency: 'USD',
                product_data: {
                  name: 'Taskify Pro',
                  description: 'Unlimited boards for your organization',
                },
                unit_amount: 2000,
                recurring: {
                  interval: 'month',
                },
              },
              quantity: 1,
            },
          ],
          metadata: {
            orgId,
          },
        })

        url = stripeSession.url || ''
      }

      return url
    } catch (error) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `Something went wrong - ${error}` })
    }
  }),
})

// export type definition of API
export type AppRouter = typeof appRouter
