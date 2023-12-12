'use client'

import { List } from '@prisma/client'
import { MoreHorizontal, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ElementRef, useRef } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { trpc } from '@/trpc/client'

type ListOptionsProps = {
  data: List
  onAddCart: () => void
}

export function ListOptions({ data, onAddCart }: ListOptionsProps) {
  const closeRef = useRef<ElementRef<'button'>>(null)

  const router = useRouter()

  const { mutate: mutateCopy, isLoading: isLoadingCopy } = trpc.copyList.useMutation({
    onSuccess: ({ list }) => {
      toast.success(`List "${list.title}" copied`)
      closeRef.current?.click()
      router.refresh()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const { mutate: mutateDelete, isLoading: isLoadingDelete } = trpc.deleteList.useMutation({
    onSuccess: (list) => {
      toast.success(`List "${list.title}" deleted`)
      closeRef.current?.click()
      router.refresh()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const onCopy = () => {
    mutateCopy({ id: data.id, boardId: data.boardId })
  }

  const onDelete = () => {
    mutateDelete({ id: data.id, boardId: data.boardId })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="h-auto w-auto p-2" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="px-0 pb-3 pt-3" side="bottom" align="start">
        <div className="pb-4 text-center text-sm font-medium text-neutral-600">List actions</div>
        <PopoverClose asChild ref={closeRef}>
          <Button
            className="absolute right-2 top-2 h-auto w-auto p-2 text-neutral-600"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </PopoverClose>

        <Button
          onClick={onAddCart}
          className="h-auto w-full justify-start rounded-none p-2 px-5 text-sm font-normal"
          variant="ghost"
        >
          Add card...
        </Button>
        <Button
          className="h-auto w-full justify-start rounded-none p-2 px-5 text-sm font-normal"
          variant="ghost"
          disabled={isLoadingCopy}
          onClick={onCopy}
        >
          Copy list...
        </Button>
        <Separator />
        <Button
          className="h-auto w-full justify-start rounded-none p-2 px-5 text-sm font-normal"
          variant="ghost"
          disabled={isLoadingDelete}
          onClick={onDelete}
        >
          Delete this list...
        </Button>
      </PopoverContent>
    </Popover>
  )
}
