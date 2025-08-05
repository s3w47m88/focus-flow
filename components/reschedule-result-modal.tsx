"use client"

import { CheckCircle, XCircle } from 'lucide-react'

interface RescheduleResultModalProps {
  isOpen: boolean
  onClose: () => void
  successCount: number
  failCount: number
}

export function RescheduleResultModal({ 
  isOpen, 
  onClose, 
  successCount,
  failCount 
}: RescheduleResultModalProps) {
  if (!isOpen) return null

  const hasErrors = failCount > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${hasErrors ? 'bg-amber-500/10' : 'bg-green-500/10'}`}>
              {hasErrors ? (
                <XCircle className="w-6 h-6 text-amber-500" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-500" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                {hasErrors ? 'Partial Success' : 'Tasks Rescheduled'}
              </h3>
              <p className="text-zinc-400 text-sm">
                {hasErrors ? (
                  <>
                    Successfully rescheduled {successCount} {successCount === 1 ? 'task' : 'tasks'} to today.
                    <br />
                    <span className="text-amber-400">
                      {failCount} {failCount === 1 ? 'task' : 'tasks'} failed to update.
                    </span>
                  </>
                ) : (
                  `Successfully rescheduled ${successCount} ${successCount === 1 ? 'task' : 'tasks'} to today.`
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end p-6 pt-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}