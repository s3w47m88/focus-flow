"use client"

import { useState, useRef, useEffect } from 'react'
import { X, Calendar, Clock, Flag, Bell, Paperclip, Hash, User, Tag, Plus, Circle, CheckCircle2, Trash2 } from 'lucide-react'
import { Database, Task, Reminder } from '@/lib/types'
import { format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TimePicker } from '@/components/time-picker'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  data: Database
  task?: Task | null // Optional - if provided, it's edit mode
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> | Partial<Task>) => void
  onDelete?: (taskId: string) => void
  onDataRefresh?: () => void
  defaultProjectId?: string
  onTaskSelect?: (task: Task) => void
}

export function TaskModal({ 
  isOpen, 
  onClose, 
  data, 
  task, 
  onSave, 
  onDelete,
  onDataRefresh, 
  defaultProjectId,
  onTaskSelect 
}: TaskModalProps) {
  const isEditMode = !!task
  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState<string>('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<1 | 2 | 3 | 4>(4)
  const [selectedProject, setSelectedProject] = useState(defaultProjectId || '')
  const [selectedParentTask, setSelectedParentTask] = useState<string | null>(null)
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showReminderInput, setShowReminderInput] = useState(false)
  const [newReminderDate, setNewReminderDate] = useState('')
  const [newReminderTime, setNewReminderTime] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showAddTag, setShowAddTag] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [assignedTo, setAssignedTo] = useState<string | null>(null)
  const [showAssignInput, setShowAssignInput] = useState(false)
  const [assignEmail, setAssignEmail] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)
  const [newSubtaskName, setNewSubtaskName] = useState('')
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)

  // Load task data in edit mode
  useEffect(() => {
    if (task && isEditMode) {
      setTaskName(task.name)
      setDescription(task.description || '')
      setDueDate(task.dueDate || '')
      setDueTime(task.dueTime || '')
      setDeadline(task.deadline || '')
      setPriority(task.priority)
      setSelectedProject(task.projectId || '')
      setSelectedParentTask(task.parentId || null)
      setSelectedTags(task.tags || [])
      setAssignedTo(task.assignedTo || null)
      setReminders(task.reminders || [])
    }
  }, [task, isEditMode])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen && !isEditMode) {
      // Reset form for add mode
      setTaskName('')
      setDescription('')
      setDueDate('')
      setDueTime('')
      setDeadline('')
      setPriority(4)
      setSelectedProject(defaultProjectId || '')
      setSelectedParentTask(null)
      setReminders([])
      setSelectedTags([])
      setAssignedTo(null)
      setShowReminderInput(false)
      setNewReminderDate('')
      setNewReminderTime('')
      setShowAddTag(false)
      setNewTagName('')
      setShowAssignInput(false)
      setAssignEmail('')
    }
  }, [isOpen, defaultProjectId, isEditMode])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const taskData: any = {
      name: taskName,
      description,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      deadline: deadline || undefined,
      priority,
      projectId: selectedProject,
      parentId: selectedParentTask || undefined,
      tags: selectedTags,
      files: [],
      assignedTo: assignedTo || undefined,
      reminders,
    }

    if (!isEditMode) {
      taskData.completed = false
    }

    onSave(taskData)
    onClose()
  }

  const handleAddReminder = () => {
    if (newReminderDate) {
      const datetime = newReminderTime 
        ? `${newReminderDate}T${newReminderTime}:00`
        : `${newReminderDate}T09:00:00`
      
      setReminders([...reminders, {
        id: `reminder-${Date.now()}`,
        datetime,
        sent: false
      }])
      setNewReminderDate('')
      setNewReminderTime('')
      setShowReminderInput(false)
    }
  }

  const handleRemoveReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id))
  }

  const handleAddTag = async () => {
    if (newTagName.trim()) {
      const existingTag = data.tags.find(t => 
        t.name.toLowerCase() === newTagName.trim().toLowerCase()
      )
      
      if (existingTag) {
        if (!selectedTags.includes(existingTag.id)) {
          setSelectedTags([...selectedTags, existingTag.id])
        }
      } else {
        const newTag = {
          id: `tag-${Date.now()}`,
          name: newTagName.trim(),
          color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
        }
        
        try {
          const response = await fetch('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTag)
          })
          
          if (response.ok) {
            setSelectedTags([...selectedTags, newTag.id])
            if (onDataRefresh) onDataRefresh()
          }
        } catch (error) {
          console.error('Failed to create tag:', error)
        }
      }
      
      setNewTagName('')
      setShowAddTag(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleAssignUser = () => {
    if (assignEmail.trim() && assignEmail.includes('@')) {
      setAssignedTo(assignEmail.trim())
      setAssignEmail('')
      setShowAssignInput(false)
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskName.trim() || !task) return

    const subtask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      name: newSubtaskName.trim(),
      completed: false,
      priority: 4,
      projectId: task.projectId,
      parentId: task.id,
      tags: [],
      files: [],
      reminders: []
    }

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subtask)
      })

      if (response.ok) {
        setNewSubtaskName('')
        setIsAddingSubtask(false)
        if (onDataRefresh) onDataRefresh()
      }
    } catch (error) {
      console.error('Failed to create subtask:', error)
    }
  }

  const toggleSubtaskComplete = async (subtask: Task) => {
    try {
      const response = await fetch(`/api/tasks/${subtask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !subtask.completed })
      })

      if (response.ok && onDataRefresh) {
        onDataRefresh()
      }
    } catch (error) {
      console.error('Failed to update subtask:', error)
    }
  }

  if (!isOpen) return null

  const currentProject = data.projects.find(p => p.id === selectedProject)
  const projectColor = currentProject?.color || '#6B7280'
  const parentTask = task && task.parentId 
    ? data.tasks.find(t => t.id === task.parentId) 
    : null
  const subtasks = isEditMode && task
    ? data.tasks.filter(t => t.parentId === task.id)
    : []
  
  // Highlight deadlines
  const deadlineHighlight = deadline && new Date(deadline) < new Date() 
    ? 'text-red-500' 
    : deadline && new Date(deadline) < new Date(Date.now() + 24 * 60 * 60 * 1000)
    ? 'text-orange-500'
    : ''

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div 
        ref={modalRef} 
        className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-800"
      >
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-white">
            {isEditMode ? 'Edit Task' : 'Add Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Parent task navigation (edit mode only) */}
          {isEditMode && parentTask && onTaskSelect && (
            <button
              type="button"
              onClick={() => onTaskSelect(parentTask)}
              className="text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-2"
            >
              ← Go to parent task: {parentTask.name}
            </button>
          )}

          {/* Task Name */}
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Task name"
            className="w-full bg-transparent text-xl font-medium text-white placeholder-zinc-500 focus:outline-none"
            required
            autoFocus
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full bg-zinc-800 text-white rounded-lg px-4 py-3 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px] resize-none"
          />

          {/* Assignee */}
          {assignedTo && (
            <div className="flex items-center gap-2 text-sm bg-zinc-800 rounded px-3 py-1.5 w-fit">
              <User className="w-3 h-3 text-zinc-400" />
              <span className="text-zinc-300">{assignedTo}</span>
              <button
                type="button"
                onClick={() => setAssignedTo(null)}
                className="ml-auto text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800 rounded-lg flex items-center pr-2 focus-within:ring-2 focus-within:ring-red-500">
              <Calendar className="ml-4 w-4 h-4 text-zinc-500 flex-shrink-0" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 bg-transparent text-white pl-3 pr-2 py-3 focus:outline-none"
              />
              <button
                onClick={() => setDueDate('')}
                className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-zinc-800 rounded-lg flex items-center pr-2 focus-within:ring-2 focus-within:ring-red-500">
              <Clock className="ml-4 w-4 h-4 text-zinc-500 flex-shrink-0" />
              <div className="flex-1 relative">
                <TimePicker
                  value={dueTime}
                  onChange={setDueTime}
                  placeholder="Select time"
                  className="bg-transparent border-0 hover:bg-transparent focus:ring-0"
                />
              </div>
              {dueTime && (
                <button
                  onClick={() => setDueTime('')}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Deadline */}
          <div className="relative">
            <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
              <Calendar className="w-4 h-4" />
              Deadline
              {deadlineHighlight && (
                <span className={`text-xs ${deadlineHighlight}`}>
                  {new Date(deadline) < new Date() ? 'Overdue' : 'Due soon'}
                </span>
              )}
            </div>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={`w-full bg-zinc-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus-within:ring-red-500 ${
                deadlineHighlight ? deadlineHighlight : 'text-white'
              }`}
            />
          </div>

          {/* Project & Parent Task */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
                <Hash className="w-4 h-4" />
                Project
              </div>
              <Select 
                value={selectedProject} 
                onValueChange={setSelectedProject}
                required
              >
                <SelectTrigger className="w-full bg-zinc-800 text-white border-zinc-700 focus:ring-2 focus:ring-red-500">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {data.organizations.map((org) => {
                    const orgProjects = data.projects.filter(p => p.organizationId === org.id)
                    if (orgProjects.length === 0) return null
                    
                    return (
                      <div key={org.id}>
                        <div className="px-2 py-1.5 text-xs text-zinc-500 font-medium">
                          {org.name}
                        </div>
                        {orgProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: project.color }}
                              />
                              <span>{project.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
                <Hash className="w-4 h-4" />
                Parent Task (Optional)
              </div>
              <Select 
                value={selectedParentTask || 'none'} 
                onValueChange={(value) => setSelectedParentTask(value === 'none' ? null : value)}
                disabled={!selectedProject}
              >
                <SelectTrigger className="w-full bg-zinc-800 text-white border-zinc-700 focus:ring-2 focus:ring-red-500">
                  <SelectValue placeholder={
                    !selectedProject 
                      ? "Select a project first" 
                      : "No parent task"
                  } />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {selectedProject && (
                    <>
                      <SelectItem value="none">
                        <span className="text-zinc-400">No parent task</span>
                      </SelectItem>
                      {data.tasks
                        .filter(t => t.projectId === selectedProject && !t.completed && (!isEditMode || t.id !== task?.id))
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-2">
                              <span>{t.parentId ? '↳ ' : ''}{t.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      }
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
              <Flag className="w-4 h-4" />
              Priority
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p as 1 | 2 | 3 | 4)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    priority === p
                      ? p === 1 
                        ? 'bg-red-500 text-white'
                        : p === 2
                        ? 'bg-orange-500 text-white'
                        : p === 3
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-700 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  P{p}
                </button>
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
              <Bell className="w-4 h-4" />
              Reminders
            </div>
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center gap-2 mb-2 text-sm">
                <div className="bg-zinc-800 rounded px-3 py-1.5 flex items-center gap-2">
                  <Bell className="w-3 h-3 text-zinc-400" />
                  <span className="text-zinc-300">
                    {format(new Date(reminder.datetime), 'MMM d, yyyy h:mm a')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveReminder(reminder.id)}
                    className="text-zinc-500 hover:text-white ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {showReminderInput ? (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  className="flex-1 bg-zinc-800 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <input
                  type="time"
                  value={newReminderTime}
                  onChange={(e) => setNewReminderTime(e.target.value)}
                  className="bg-zinc-800 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={handleAddReminder}
                  className="bg-red-500 text-white rounded px-3 py-1.5 text-sm hover:bg-red-600 transition-colors"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReminderInput(false)
                    setNewReminderDate('')
                    setNewReminderTime('')
                  }}
                  className="text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowReminderInput(true)}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Add Reminder
              </button>
            )}
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
              <Tag className="w-4 h-4" />
              Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedTags.includes(tag.id)
                      ? 'bg-opacity-100 text-white'
                      : 'bg-opacity-20 text-zinc-400 hover:bg-opacity-40'
                  }`}
                  style={{ 
                    backgroundColor: selectedTags.includes(tag.id) 
                      ? tag.color 
                      : tag.color + '33' 
                  }}
                >
                  {tag.name}
                </button>
              ))}
              {showAddTag ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Tag name"
                    className="bg-zinc-800 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-32"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="text-zinc-400 hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTag(false)
                      setNewTagName('')
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddTag(true)}
                  className="px-3 py-1.5 rounded-full border border-dashed border-zinc-600 text-sm text-zinc-400 hover:text-white hover:border-zinc-400 transition-all"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Tag
                </button>
              )}
            </div>
          </div>

          {/* Subtasks (Edit mode only) */}
          {isEditMode && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
                <Circle className="w-4 h-4" />
                Subtasks
              </div>
              {subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => toggleSubtaskComplete(subtask)}
                    className="text-zinc-400 hover:text-white"
                  >
                    {subtask.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>
                  <span className={`flex-1 ${subtask.completed ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>
                    {subtask.name}
                  </span>
                  {onTaskSelect && (
                    <button
                      type="button"
                      onClick={() => onTaskSelect(subtask)}
                      className="text-zinc-400 hover:text-white text-sm"
                    >
                      Open
                    </button>
                  )}
                </div>
              ))}
              {isAddingSubtask ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskName}
                    onChange={(e) => setNewSubtaskName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                    placeholder="Subtask name"
                    className="flex-1 bg-zinc-800 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="bg-red-500 text-white rounded px-3 py-1.5 text-sm hover:bg-red-600 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSubtask(false)
                      setNewSubtaskName('')
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingSubtask(true)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add Subtask
                </button>
              )}
            </div>
          )}

          {/* Assignee Input */}
          {!assignedTo && (
            <div>
              <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
                <User className="w-4 h-4" />
                Assigned to
              </div>
              {showAssignInput ? (
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAssignUser())}
                    placeholder="Email address"
                    className="flex-1 bg-zinc-800 text-white rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAssignUser}
                    className="bg-red-500 text-white rounded px-3 py-1.5 text-sm hover:bg-red-600 transition-colors"
                  >
                    Assign
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignInput(false)
                      setAssignEmail('')
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAssignInput(true)}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <User className="w-4 h-4 inline mr-1" />
                  Assign to someone
                </button>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between pt-6 border-t border-zinc-800">
            <div>
              {isEditMode && onDelete && task && (
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="text-red-500 hover:text-red-400 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Task
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {isEditMode ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}