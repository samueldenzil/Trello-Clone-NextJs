'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { ElementRef, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useEventListener, useOnClickOutside } from 'usehooks-ts'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { trpc } from '@/trpc/client'
import ListWrapper from './list-wrapper'

type ListFormProps = {
  refetchLists: any
}

export function ListForm({ refetchLists }: ListFormProps) {
  const params = useParams()

  const formRef = useRef<ElementRef<'form'>>(null)
  const inputRef = useRef<ElementRef<'input'>>(null)

  const [isEditing, setIsEditing] = useState(false)

  const enableEditing = () => {
    setIsEditing(true)
    setTimeout(() => {
      formRef.current?.focus()
    })
  }

  const disableEditing = () => {
    setIsEditing(false)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      disableEditing()
    }
  }

  const formSchema = z.object({
    title: z.string().min(3, { message: 'Minimum 3 chars required.' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
    },
  })

  const { mutate, isLoading } = trpc.list.createList.useMutation({
    onSuccess: (list) => {
      toast.success(`List "${list.title}" created`)
      disableEditing()
      form.reset()
      refetchLists()
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    // console.log(values)
    mutate({ boardId: params.boardId as string, title: values.title })
  }

  useEventListener('keydown', onKeyDown)
  useOnClickOutside(formRef, disableEditing)

  if (isEditing) {
    return (
      <ListWrapper>
        <Form {...form}>
          <form
            ref={formRef}
            className="w-full space-y-4 rounded-md bg-white p-3 shadow-md"
            onSubmit={form.handleSubmit(onSubmit)}
          >
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
                      disabled={isLoading}
                      className="h-7 border-transparent px-2 py-1 text-sm font-medium transition hover:border-input focus:border-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-1">
              <Button type="submit" variant="primary" size="sm" disabled={isLoading}>
                Add list
              </Button>
              <Button onClick={disableEditing} size="sm" variant="ghost">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </Form>
      </ListWrapper>
    )
  }

  return (
    <ListWrapper>
      <button
        className="flex w-full items-center rounded-md bg-white/80 p-3 text-sm font-medium transition hover:bg-white/50"
        onClick={enableEditing}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add a button
      </button>
    </ListWrapper>
  )
}
