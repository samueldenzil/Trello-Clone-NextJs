import { create } from 'zustand'

type CardModalStore = {
  id?: string
  isOpen: boolean
  refetchLists: any
  setRefetchLists: (refetchLists: any) => void
  onOpen: (id: string) => void
  onClose: () => void
}

export const useCardModal = create<CardModalStore>((set) => ({
  id: undefined,
  isOpen: false,
  refetchLists: undefined,
  setRefetchLists: (refetchLists: any) => set({ refetchLists }),
  onOpen: (id: string) => set({ isOpen: true, id }),
  onClose: () => set({ isOpen: false, id: undefined }),
}))
