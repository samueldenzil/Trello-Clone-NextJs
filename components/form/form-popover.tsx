'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ElementRef, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useProModal } from '@/hooks/use-pro-modal'
import {
  CreateBoardValidator,
  TCreateBoardValidator,
} from '@/lib/validators/create-board-validator'
import { trpc } from '@/trpc/client'
import { FormPicker } from './form-picker'

type FormPopoverProps = {
  children: React.ReactNode
  side?: 'left' | 'right' | 'top' | 'bottom'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

export function FormPopover({
  children,
  align,
  side = 'bottom',
  sideOffset = 0,
}: FormPopoverProps) {
  const { onOpen } = useProModal()
  const router = useRouter()
  const closeRef = useRef<ElementRef<'button'>>(null)

  const form = useForm<TCreateBoardValidator>({
    resolver: zodResolver(CreateBoardValidator),
  })

  const { mutate, isLoading } = trpc.board.createBoard.useMutation({
    onSuccess: ({ board }) => {
      toast.success('Board created!')
      closeRef.current?.click()
      form.reset()
      router.push(`/board/${board.id}`)
    },
    onError: (err) => {
      toast.error(err.message)
      onOpen()
    },
  })

  function onSubmit(values: TCreateBoardValidator) {
    const { title, image } = values
    // console.log(values)
    mutate({ title, image })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} side={side} sideOffset={sideOffset} className="w-80 pt-3">
        <div className="pb-4 text-center text-sm font-medium text-neutral-600">Create board</div>
        <PopoverClose asChild ref={closeRef}>
          <Button
            variant="ghost"
            className="absolute right-2 top-2 h-auto w-auto p-2 text-neutral-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </PopoverClose>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <FormPicker
                      onClick={(value) =>
                        form.setValue(field.name, value, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <Label className="font-semibold text-neutral-700" htmlFor={field.name}>
                    Board Title
                  </Label>
                  <FormControl>
                    <Input
                      placeholder="Enter title"
                      {...field}
                      className="h-7 px-2 py-1 text-sm"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className="w-full"
              size="sm"
              variant="primary"
              type="submit"
              disabled={isLoading}
            >
              Create
            </Button>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  )
}
