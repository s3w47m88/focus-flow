"use client"

import { useState } from 'react'
import { Task } from '@/lib/types'
import { Circle, CheckCircle2, Calendar, Flag, MoreHorizontal, Trash2, Edit, User, ChevronRight, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'

interface TaskListProps {
  tasks: Task[]
  showCompleted?: boolean
  onTaskToggle: (taskId: string) => void
  onTaskEdit: (task: Task) => void
  onTaskDelete: (taskId: string) => void
}

const priorityColors = {
  1: 'text-red-500',
  2: 'text-orange-500', 
  3: 'text-blue-500',
  4: 'text-gray-400'
}

export function TaskList({ tasks, showCompleted = false, onTaskToggle, onTaskEdit, onTaskDelete }: TaskListProps) {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)
  const [menuOpenTask, setMenuOpenTask] = useState<string | null>(null)
  const [showCompletedTasks, setShowCompletedTasks] = useState(showCompleted)

  const activeTasks = tasks.filter(task => !task.completed)
  const completedTasks = tasks.filter(task => task.completed)

  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      // By priority (1 is highest)
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      // Then by due date
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return 0
    })
  }

  const sortedActiveTasks = sortTasks(activeTasks)
  const sortedCompletedTasks = sortTasks(completedTasks)

  const formatDueDate = (date: string) => {
    const taskDate = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (taskDate.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (taskDate.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else if (taskDate < today) {
      return format(taskDate, 'MMM d') + ' (Overdue)'
    } else {
      return format(taskDate, 'MMM d')
    }
  }

  const getDueDateColor = (date: string) => {
    const taskDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (taskDate < today) {
      return 'text-red-500'
    } else if (taskDate.toDateString() === today.toDateString()) {
      return 'text-green-500'
    }
    return 'text-zinc-400'
  }

  const renderTask = (task: Task) => (
    <div
      key={task.id}
      className={`group relative flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800/50 transition-colors ${
        task.completed ? 'opacity-50' : ''
      }`}
      onMouseEnter={() => setHoveredTask(task.id)}
      onMouseLeave={() => setHoveredTask(null)}
    >
      <button
        onClick={() => onTaskToggle(task.id)}
        className={`mt-0.5 transition-colors ${
          task.completed 
            ? 'text-zinc-400' 
            : priorityColors[task.priority]
        }`}
      >
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onTaskEdit(task)}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className={`text-sm break-words ${task.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
              {task.name}
            </p>
            
            {task.description && (
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2 break-words">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2 text-xs">
              {task.dueDate && (
                <span className={`flex items-center gap-1 ${getDueDateColor(task.dueDate)}`}>
                  <Calendar className="w-3 h-3" />
                  {formatDueDate(task.dueDate)}
                  {task.dueTime && ` at ${task.dueTime}`}
                </span>
              )}
              
              {task.deadline && (
                <span className="flex items-center gap-1 text-red-400">
                  <Flag className="w-3 h-3" />
                  Deadline: {formatDueDate(task.deadline)}
                </span>
              )}
              
              {task.assignedToName && (
                <span className="flex items-center gap-1 text-zinc-400">
                  <User className="w-3 h-3" />
                  {task.assignedToName}
                </span>
              )}
              
              {task.recurringPattern && (
                <span className="text-purple-400">
                  🔁 {task.recurringPattern}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!task.completed && (
              <Flag className={`w-4 h-4 ${priorityColors[task.priority]}`} />
            )}
            
            <div className="relative">
              <button
                onClick={() => setMenuOpenTask(menuOpenTask === task.id ? null : task.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              {menuOpenTask === task.id && (
                <div className="absolute right-0 top-6 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1 z-10">
                  <button
                    onClick={() => {
                      onTaskEdit(task)
                      setMenuOpenTask(null)
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white w-full"
                  >
                    <Edit className="w-4 h-4" />
                    Edit task
                  </button>
                  <button
                    onClick={() => {
                      onTaskDelete(task.id)
                      setMenuOpenTask(null)
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 hover:text-red-300 w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete task
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="py-4">
      {sortedActiveTasks.map(renderTask)}
      
      {sortedActiveTasks.length === 0 && completedTasks.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <p>No tasks to display</p>
        </div>
      )}
      
      {completedTasks.length > 0 && (
        <div className="mt-8 border-t border-zinc-800 pt-4">
          <button
            onClick={() => setShowCompletedTasks(!showCompletedTasks)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            {showCompletedTasks ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            Completed ({completedTasks.length})
          </button>
          
          {showCompletedTasks && (
            <div className="mt-2">
              {sortedCompletedTasks.map(renderTask)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}