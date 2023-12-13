'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/trpc/client'
import { useForm } from 'react-hook-form'

export function FormBackup() {
  const formSchema = z.object({
    title: z.string().min(8, { message: 'Minimum 8 chars required.' }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
    },
  })

  const { data, mutate } = trpc.board.createBoard.useMutation({
    onError: (error) => {
      console.log(error.data)
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    // mutate({ title: values.title })
  }
  if (data?.success) {
    console.log('yess')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
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
      </form>
    </Form>
  )
}
