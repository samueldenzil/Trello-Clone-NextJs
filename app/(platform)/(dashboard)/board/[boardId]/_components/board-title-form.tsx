'use client'

import { Board } from '@prisma/client'
import { ElementRef, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { trpc } from '@/trpc/client'

type BoardTitleFormProps = {
  data: Board
}

export function BoardTitleForm({ data }: BoardTitleFormProps) {
  const formRef = useRef<ElementRef<'form'>>(null)
  const inputRef = useRef<ElementRef<'input'>>(null)

  const [isEditing, setIsEditing] = useState(false)

  const enableEditing = () => {
    // TODO: focus inputs
    setIsEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  const disableEditing = () => {
    setIsEditing(false)
  }

  const form = useForm<Board>({
    defaultValues: data,
  })

  const { mutate, isLoading } = trpc.updateBoardTitle.useMutation({
    onSuccess: (data) => {
      toast.success(`Board "${data.title}" updated!`)
      document.title = `${data.title} | Taskify`
      disableEditing()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  function onSubmit(values: Board) {
    mutate({ id: values.id, title: values.title })
  }

  const onBlur = () => {
    formRef.current?.requestSubmit()
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
                {/* <Label className="font-semibold text-neutral-700" htmlFor={field.name}>
                  Board Title
                </Label> */}
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
