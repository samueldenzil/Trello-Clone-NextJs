'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Layout } from 'lucide-react'
import { useParams } from 'next/navigation'
import { ElementRef, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/trpc/client'
import { CardWithList } from '@/types'

type HeaderProps = {
  data: CardWithList
  refetchCard: any
  refetchLists: any
  refetchAuditLogs: any
}

export function Header({ data, refetchCard, refetchLists, refetchAuditLogs }: HeaderProps) {
  const params = useParams()

  const inputRef = useRef<ElementRef<'input'>>(null)

  const formSchema = z.object({
    title: z.string(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: data.title,
    },
  })

  const { mutate } = trpc.card.updateCard.useMutation({
    onSuccess: ({ card }) => {
      toast.success(`Renamed to "${card.title}"`)
      form.setValue('title', card.title)
      refetchLists()
      refetchCard()
      refetchAuditLogs()
    },
    onError: (err) => {
      toast.error(err.data?.code)
    },
  })

  const onBlur = () => {
    inputRef.current?.form?.requestSubmit()
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { title } = values
    if (data.title === title) {
      return
    }

    mutate({
      id: data.id,
      boardId: params.boardId as string,
      title,
    })
  }

  return (
    <div className="mb-6 flex w-full items-start gap-x-3">
      <Layout className="mt-1 h-5 w-5 text-neutral-700" />
      <div className="w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Enter title"
                      {...field}
                      className="relative -left-1.5 h-7 w-[95%] truncate border-transparent bg-transparent px-1 text-xl font-semibold text-neutral-700 focus-visible:border-input focus-visible:bg-white"
                      ref={inputRef}
                      onBlur={onBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <p className="text-sm text-muted-foreground">
          in list <span className="underline">{data.list.title}</span>
        </p>
      </div>
    </div>
  )
}

Header.Skeleton = function HeaderSkeleton() {
  return (
    <div className="mb-6 flex items-start gap-x-3">
      <Skeleton className="mt-1 h-6 w-6 bg-neutral-200" />
      <div>
        <Skeleton className="mb-1 h-6 w-24 bg-neutral-200" />
        <Skeleton className="h-6 w-12 bg-neutral-200" />
      </div>
    </div>
  )
}
