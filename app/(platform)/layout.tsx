import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'

import { Provider } from '@/components/providers/provider'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <Provider>
        {children}
        <Toaster />
      </Provider>
    </ClerkProvider>
  )
}
