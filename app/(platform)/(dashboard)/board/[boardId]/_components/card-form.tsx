'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, X } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { ElementRef, KeyboardEventHandler, forwardRef, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { useEventListener, useOnClickOutside } from 'usehooks-ts'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/trpc/client'

type CardFormProps = {
  listId: string
  isEditing: boolean
  refetchLists: any
  enableEditing: () => void
  disableEditing: () => void
}

export const CardForm = forwardRef<HTMLTextAreaElement, CardFormProps>(
  ({ listId, isEditing, refetchLists, enableEditing, disableEditing }, ref) => {
    const formRef = useRef<ElementRef<'form'>>(null)

    const params = useParams()

    const formSchema = z.object({
      title: z.string().min(3, { message: 'Title is too short.' }),
    })

    const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: '',
      },
    })

    const { mutate, isLoading } = trpc.card.createCard.useMutation({
      onSuccess: ({ card }) => {
        toast.success(`Card "${card.title}" created`)
        form.reset()
        disableEditing()
        refetchLists()
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
      console.log(values)
      mutate({ title: values.title, boardId: params.boardId as string, listId })
    }

    const onKeyDown = (e: any) => {
      if (e.key === 'Escape') {
        disableEditing()
      }
    }

    const onTextareaKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        formRef.current?.requestSubmit()
      }
    }

    useEventListener('keydown', onKeyDown)
    useOnClickOutside(formRef, disableEditing)

    if (isEditing) {
      return (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="m-1 space-y-4 px-1 py-0.5"
            ref={formRef}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="w-full space-y-2">
                  <div className="w-full space-y-1">
                    <FormControl>
                      <Textarea
                        placeholder="Enter a title for this card..."
                        className="resize-none shadow-sm outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        {...field}
                        disabled={isLoading}
                        onKeyDown={onTextareaKeyDown}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-1">
              <Button type="submit" variant="primary" disabled={isLoading}>
                Add card
              </Button>
              <Button type="submit" onClick={disableEditing} size="sm" variant="ghost">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </Form>
      )
    }

    return (
      <div className="px-2 pt-2">
        <Button
          onClick={enableEditing}
          className="h-auto w-full justify-start px-2 py-1.5 text-sm text-muted-foreground"
          size="sm"
          variant="ghost"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add a card
        </Button>
      </div>
    )
  }
)

CardForm.displayName = 'CardForm'
