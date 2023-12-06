import { Hint } from '@/components/hint'
import { HelpCircle, User2 } from 'lucide-react'

export function BoardList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center font-semibold text-neutral-700">
        <User2 className="mr-2 h-6 w-6" />
        Your boards
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div
          className="relative flex aspect-video h-full w-full flex-col items-center justify-center gap-y-1 rounded-sm bg-muted transition hover:opacity-75"
          role="button"
        >
          <p className="text-sm">Create new board</p>
          <span className="text-xs">5 remaining</span>
          <Hint
            description={`Free Workspaces can have up to 5 open boards. For unlimited boards upgrade this workspace.`}
            sideOffset={40}
          >
            <HelpCircle className="absolute bottom-2 right-2 h-[14px] w-[14px]" />
          </Hint>
        </div>
      </div>
    </div>
  )
}
