'use client'

import { Board } from '@prisma/client'
import { ElementRef, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { trpc } from '@/trpc/client'

type BoardTitleFormProps = {
  initialData: Board
}

export function BoardTitleForm({ initialData }: BoardTitleFormProps) {
  const formRef = useRef<ElementRef<'form'>>(null)
  const inputRef = useRef<ElementRef<'input'>>(null)

  const [isEditing, setIsEditing] = useState(false)

  const { data, refetch } = trpc.board.getBoardById.useQuery(
    { id: initialData.id },
    {
      initialData: {
        ...initialData,
        createdAt: initialData.createdAt.toISOString(),
        updatedAt: initialData.updatedAt.toISOString(),
      },
    }
  )

  const { mutate, isLoading } = trpc.board.updateBoard.useMutation({
    onSuccess: (data) => {
      toast.success(`Board "${data.title}" updated!`)
      document.title = `${data.title} | Taskify`
      disableEditing()
      refetch()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

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
    id: z.string(),
    title: z.string().min(3, { message: 'Title is too short.' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      id: data?.id,
      title: data?.title,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (data?.title === values.title) {
      return
    }

    mutate({ id: values.id, title: values.title })
  }

  const onBlur = () => {
    formRef.current?.requestSubmit()
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex items-center gap-x-2"
          ref={formRef}
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    className="h-7 border-none bg-transparent px-2 py-1 text-lg font-bold focus-visible:outline-none focus-visible:ring-transparent focus-visible:ring-offset-0"
                    ref={inputRef}
                    disabled={isLoading}
                    onBlur={onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    )
  }

  return (
    <Button
      className="h-auto w-auto p-1 px-2 text-lg font-bold"
      variant="transparent"
      onClick={enableEditing}
    >
      {form.getValues('title')}
    </Button>
  )
}
