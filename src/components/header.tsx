import { Bell } from "lucide-react"
import Image from "next/image"

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="FahamPesa" width={120} height={40} className="h-10 w-auto" />
        </div>
        <div className="text-lg font-semibold text-gray-900">Subscription Plan</div>
        <Bell className="w-6 h-6 text-gray-400" />
      </div>
    </header>
  )
}
