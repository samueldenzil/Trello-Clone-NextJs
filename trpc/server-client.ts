import { httpBatchLink } from '@trpc/client'
import { appRouter } from '.'

export const trpcServerClient = appRouter.createCaller({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
    }),
  ],
})
