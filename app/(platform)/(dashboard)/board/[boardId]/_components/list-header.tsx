import { zodResolver } from '@hookform/resolvers/zod'
import { List } from '@prisma/client'
import { ElementRef, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useEventListener } from 'usehooks-ts'
import { z } from 'zod'

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { trpc } from '@/trpc/client'
import { ListOptions } from './list-options'

type ListHeaderProps = {
  data: List
  refetchLists: any
  onAddCard: () => void
}

export function ListHeader({ data, refetchLists, onAddCard }: ListHeaderProps) {
  const formRef = useRef<ElementRef<'form'>>(null)
  const inputRef = useRef<ElementRef<'input'>>(null)

  const [isEditing, setIsEditing] = useState(false)

  const enableEditing = () => {
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  const disableEditing = () => {
    setIsEditing(false)
  }

  const formSchema = z.object({
    boardId: z.string(),
    id: z.string(),
    title: z.string().min(3, { message: 'Minimum 3 chars required.' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: data.id,
      boardId: data.boardId,
      title: data.title,
    },
  })

  const { mutate, isLoading } = trpc.list.updateList.useMutation({
    onSuccess: (list) => {
      toast.success(`Renamed to "${list.title}"`)
      form.setValue('title', list.title)
      disableEditing()
      refetchLists()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { boardId, id, title } = values
    if (title === data.title) {
      return disableEditing()
    }

    mutate({ boardId, id, title })
  }

  const onBlur = () => {
    formRef.current?.requestSubmit()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      formRef.current?.requestSubmit()
    }
  }

  useEventListener('keydown', onKeyDown)

  return (
    <div className="flex items-start justify-between gap-x-2 px-2 pt-2 text-sm font-semibold">
      {isEditing ? (
        <Form {...form}>
          <form ref={formRef} className="flex-1" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Enter list title..."
                      {...field}
                      ref={inputRef}
                      onBlur={onBlur}
                      disabled={isLoading}
                      className="h-7 truncate border-transparent bg-transparent px-2 py-1 text-sm transition hover:border-input focus:border-input focus:bg-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      ) : (
        <div
          className="h-7 w-full border-transparent px-2.5 py-1 text-sm font-medium"
          onClick={enableEditing}
        >
          {form.getValues('title')}
        </div>
      )}

      <ListOptions data={data} onAddCart={onAddCard} refetchLists={refetchLists} />
    </div>
  )
}
