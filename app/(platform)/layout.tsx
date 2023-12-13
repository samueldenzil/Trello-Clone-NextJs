import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'

import { ModalProvider } from '@/components/providers/modal-provider'
import { Provider } from '@/components/providers/provider'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <Provider>
        {children}
        <ModalProvider />
        <Toaster />
      </Provider>
    </ClerkProvider>
  )
}
