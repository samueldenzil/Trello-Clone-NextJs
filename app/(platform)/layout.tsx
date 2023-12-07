import { Provider } from '@/components/providers/provider'
import { ClerkProvider } from '@clerk/nextjs'

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <Provider>{children}</Provider>
    </ClerkProvider>
  )
}
