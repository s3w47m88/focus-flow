"use client"

import { Loader2 } from 'lucide-react'

interface RescheduleProgressModalProps {
  isOpen: boolean
  current: number
  total: number
}

export function RescheduleProgressModal({ 
  isOpen, 
  current,
  total 
}: RescheduleProgressModalProps) {
  if (!isOpen) return null

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            <h3 className="text-lg font-semibold text-white">
              Rescheduling Tasks...
            </h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Progress</span>
              <span className="text-white">{current} of {total}</span>
            </div>
            
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all duration-300 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            <p className="text-sm text-zinc-500 text-center">
              Please wait while we update your tasks...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}