import { auth } from '@clerk/nextjs'

import { MAX_FREE_BOARDS } from '@/constants/boards'
import prisma from '@/lib/db'

export const incrementAvailableCount = async () => {
  const { userId, orgId } = auth()

  if (!userId || !orgId) {
    throw new Error('Unauthorized')
  }

  const orgLimit = await prisma.orgLimit.findUnique({
    where: {
      orgId,
    },
  })

  if (orgLimit) {
    await prisma.orgLimit.update({
      where: {
        orgId,
      },
      data: {
        count: orgLimit.count + 1,
      },
    })
  } else {
    await prisma.orgLimit.create({
      data: {
        orgId,
        count: 1,
      },
    })
  }
}

export const decreaseAvailableCount = async () => {
  const { userId, orgId } = auth()

  if (!userId || !orgId) {
    throw new Error('Unauthorized')
  }

  const orgLimit = await prisma.orgLimit.findUnique({
    where: {
      orgId,
    },
  })

  if (orgLimit) {
    await prisma.orgLimit.update({
      where: {
        orgId,
      },
      data: {
        count: orgLimit.count > 0 ? orgLimit.count - 1 : 0,
      },
    })
  } else {
    await prisma.orgLimit.create({
      data: {
        orgId,
        count: 1,
      },
    })
  }
}

export const hasAvailableCount = async () => {
  const { userId, orgId } = auth()

  if (!userId || !orgId) {
    throw new Error('Unauthorized')
  }

  const orgLimit = await prisma.orgLimit.findUnique({
    where: {
      orgId,
    },
  })

  if (!orgLimit || orgLimit.count < MAX_FREE_BOARDS) {
    return true
  }

  return false
}

export const getAvailableCount = async () => {
  const { userId, orgId } = auth()

  if (!userId || !orgId) {
    return 0
  }

  const orgLimit = await prisma.orgLimit.findUnique({
    where: {
      orgId,
    },
  })

  if (!orgLimit) {
    return 0
  }

  return orgLimit.count
}
