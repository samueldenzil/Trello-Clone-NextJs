'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { trpc } from '@/trpc/client'
import { toast } from 'sonner'

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
  const createBoard = trpc.createBoard.useMutation({
    onSuccess: () => {
      toast.success('Board created!')
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const formSchema = z.object({
    title: z.string().min(3, { message: 'Title is too short.' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { title } = values
    createBoard.mutate({ title })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} side={side} sideOffset={sideOffset} className="w-80 pt-3">
        <div className="pb-4 text-center text-sm font-medium text-neutral-600">Create board</div>
        <PopoverClose asChild>
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <Label className="font-semibold text-neutral-700" htmlFor={field.name}>
                    Board Title
                  </Label>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} className="h-7 px-2 py-1 text-sm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" size="sm" type="submit">
              Create
            </Button>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  )
}
