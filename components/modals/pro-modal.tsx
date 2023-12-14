import Image from 'next/image'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useProModal } from '@/hooks/use-pro-modal'
import { trpc } from '@/trpc/client'

export function ProModal() {
  const { isOpen, onClose } = useProModal()

  const { mutate, isLoading } = trpc.stripeRedirect.useMutation({
    onSuccess: (data) => {
      window.location.href = data
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const onClick = () => {
    mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <div className="relative flex aspect-video items-center justify-center">
          <Image src="/hero.svg" alt="Hero" className="object-cover" fill />
        </div>
        <div className="mx-auto space-y-6 p-6 text-neutral-700">
          <h2 className="text-xl font-semibold">Upgrade to Taskify Pro Today!</h2>
          <p className="text-xs font-semibold text-neutral-600">Explore the best of Taskify</p>
          <div className="pl-3">
            <ul className="list-disc text-sm">
              <li>Unlimited boards</li>
              <li>Advanced checklists</li>
              <li>Admin and security features</li>
              <li>And more!</li>
            </ul>
          </div>
          <Button variant="primary" className="w-full" disabled={isLoading} onClick={onClick}>
            Upgrade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
