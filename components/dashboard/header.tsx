import { Activity } from "lucide-react"

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2">
            <Activity className="h-6 w-6 text-red-500" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">StrokeSense</h1>
        </div>
      </div>
    </header>
  )
}

