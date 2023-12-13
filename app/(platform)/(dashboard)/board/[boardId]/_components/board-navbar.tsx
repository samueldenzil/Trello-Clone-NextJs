import { Board } from '@prisma/client'

import { BoardTitleForm } from './board-title-form'
import { BoardOptions } from './board-options'

type BoardNavbarProps = {
  board: Board
}

export function BoardNavbar({ board }: BoardNavbarProps) {
  return (
    <div className="fixed top-14 z-40 flex h-14 w-full items-center gap-x-4 bg-black/50 px-6 text-white">
      <BoardTitleForm initialData={board} />
      <div className="ml-auto">
        <BoardOptions id={board.id} />
      </div>
    </div>
  )
}
