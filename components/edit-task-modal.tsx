'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Flag, Clock, Folder, Tag, User } from 'lucide-react'
import { Task, Database } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  data: Database
  onSave: (taskData: Partial<Task>) => void
  onDelete: (taskId: string) => void
}

export function EditTaskModal({ isOpen, onClose, task, data, onSave, onDelete }: EditTaskModalProps) {
  const [taskData, setTaskData] = useState<Partial<Task>>({})

  useEffect(() => {
    if (task) {
      setTaskData({
        name: task.name,
        description: task.description,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        deadline: task.deadline,
        priority: task.priority,
        projectId: task.projectId,
        assignedTo: task.assignedTo,
        tags: task.tags || []
      })
    }
  }, [task])

  if (!isOpen || !task) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...task, ...taskData })
    onClose()
  }

  const project = data.projects.find(p => p.id === taskData.projectId)
  const assignedUser = data.users.find(u => u.id === taskData.assignedTo)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <Input
              value={taskData.name || ''}
              onChange={(e) => setTaskData({ ...taskData, name: e.target.value })}
              placeholder="Task name"
              className="text-lg font-medium bg-transparent border-0 p-0 focus:ring-0"
              required
            />
          </div>

          <div>
            <Textarea
              value={taskData.description || ''}
              onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
              placeholder="Description"
              className="bg-zinc-800/50 border-zinc-700 min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-zinc-400">Due Date</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    type="date"
                    value={taskData.dueDate || ''}
                    onChange={(e) => setTaskData({ ...taskData, dueDate: e.target.value })}
                    className="pl-10 bg-zinc-800/50 border-zinc-700"
                  />
                </div>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                  <Input
                    type="time"
                    value={taskData.dueTime || ''}
                    onChange={(e) => setTaskData({ ...taskData, dueTime: e.target.value })}
                    className="pl-10 bg-zinc-800/50 border-zinc-700 w-32"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-zinc-400">Deadline</Label>
              <div className="relative">
                <Flag className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input
                  type="date"
                  value={taskData.deadline || ''}
                  onChange={(e) => setTaskData({ ...taskData, deadline: e.target.value })}
                  className="pl-10 bg-zinc-800/50 border-zinc-700"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm text-zinc-400">Priority</Label>
              <Select
                value={taskData.priority?.toString()}
                onValueChange={(value) => setTaskData({ ...taskData, priority: parseInt(value) as 1 | 2 | 3 | 4 })}
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <span className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-red-500" /> Priority 1
                    </span>
                  </SelectItem>
                  <SelectItem value="2">
                    <span className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-orange-500" /> Priority 2
                    </span>
                  </SelectItem>
                  <SelectItem value="3">
                    <span className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-blue-500" /> Priority 3
                    </span>
                  </SelectItem>
                  <SelectItem value="4">
                    <span className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-gray-400" /> Priority 4
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-zinc-400">Project</Label>
              <Select
                value={taskData.projectId}
                onValueChange={(value) => setTaskData({ ...taskData, projectId: value })}
              >
                <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-zinc-400" />
                    <SelectValue>
                      {project ? (
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                          {project.name}
                        </span>
                      ) : 'Select project'}
                    </SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {data.projects.map((project) => {
                    const org = data.organizations.find(o => o.id === project.organizationId)
                    return (
                      <SelectItem key={project.id} value={project.id}>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                          {project.name}
                          {org && <span className="text-xs text-zinc-400">({org.name})</span>}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-zinc-400">Assigned To</Label>
            <Select
              value={taskData.assignedTo || 'unassigned'}
              onValueChange={(value) => setTaskData({ ...taskData, assignedTo: value === 'unassigned' ? undefined : value })}
            >
              <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-zinc-400" />
                  <SelectValue>
                    {assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}`.trim() : 'Unassigned'}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {data.users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between pt-4 border-t border-zinc-800">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (confirm('Are you sure you want to delete this task?')) {
                  onDelete(task.id)
                  onClose()
                }
              }}
            >
              Delete Task
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}