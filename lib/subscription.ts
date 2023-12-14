import { auth } from '@clerk/nextjs'

import prisma from '@/lib/db'

const DAY_IN_MS = 86_400_000

export const checkSubscription = async () => {
  const { orgId } = auth()

  if (!orgId) {
    return false
  }

  const orgSubscription = await prisma.orgSubscription.findUnique({
    where: { orgId },
    select: {
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripePriceId: true,
      stripeSubscriptionId: true,
    },
  })

  if (!orgSubscription) {
    return false
  }

  const isValid =
    orgSubscription.stripePriceId &&
    orgSubscription.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now()

  return !!isValid
}
