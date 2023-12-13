import { auth, currentUser } from '@clerk/nextjs'
import { ACTION, ENTITY_TYPE } from '@prisma/client'

import prisma from '@/lib/db'

type Props = {
  entityId: string
  entityType: ENTITY_TYPE
  entityTitle: string
  action: ACTION
}

export const createAuditLog = async (props: Props) => {
  try {
    const { orgId } = auth()
    const user = await currentUser()

    if (!user || !orgId) {
      throw new Error('User not found')
    }

    const { action, entityId, entityTitle, entityType } = props

    const userName =
      user.firstName && user.lastName
        ? user.firstName + ' ' + user.lastName
        : (user.username as string)

    await prisma.auditLog.create({
      data: {
        orgId,
        entityId,
        entityType,
        entityTitle,
        action,
        userId: user.id,
        userImage: user.imageUrl,
        userName,
      },
    })
  } catch (error) {
    console.log('[AUDIT_LOG_ERROR]:', error)
  }
}
