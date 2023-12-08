'use client'

import { Check, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { defaultImages } from '@/constants/images'

type FormPickerProps = {
  onClick: (value: string) => void
}

export function FormPicker({ onClick }: FormPickerProps) {
  const [images, setImages] = useState<typeof defaultImages | null>(null)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  // TODO: Implement unsplash api

  useEffect(() => {
    const fetchImages = async () => {
      setImages(defaultImages)
    }
    fetchImages()
  }, [])

  if (!images) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-sky-700" />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="mb-2 grid grid-cols-3 gap-2">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative aspect-video cursor-pointer bg-muted transition hover:opacity-75"
            onClick={() => {
              setSelectedImageId(image.id)
              onClick(
                `${image.id}|${image.urls.thumb}|${image.urls.full}|${image.links.html}|${image.user.name}`
              )
            }}
          >
            <Image
              src={image.urls.thumb}
              fill
              alt="Unsplash image"
              className="rounded-sm object-cover"
            />
            {image.id === selectedImageId && (
              <div className="absolute inset-y-0 flex h-full w-full items-center justify-center bg-black/30">
                <Check className="text-white" />
              </div>
            )}
            <Link
              href={image.links.html}
              target="_blank"
              className="absolute inset-x-0 bottom-0 w-full truncate bg-black/40 p-1 text-[10px] text-white opacity-0 hover:underline group-hover:opacity-100"
            >
              {image.user.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
