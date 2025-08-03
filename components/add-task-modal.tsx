"use client"

import { useState } from 'react'
import { X, Calendar, Clock, Flag, Bell, Paperclip, Hash, User, Tag } from 'lucide-react'
import { Database, Task, Reminder } from '@/lib/types'
import { format } from 'date-fns'

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  data: Database
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
}

const reminderPresets = [
  { label: '5 minutes before', value: '5', unit: 'minutes' },
  { label: '10 minutes before', value: '10', unit: 'minutes' },
  { label: '15 minutes before', value: '15', unit: 'minutes' },
  { label: '30 minutes before', value: '30', unit: 'minutes' },
  { label: '1 hour before', value: '1', unit: 'hours' },
  { label: '2 hours before', value: '2', unit: 'hours' },
  { label: '3 hours before', value: '3', unit: 'hours' },
  { label: '1 day before', value: '1', unit: 'days' },
  { label: '2 days before', value: '2', unit: 'days' },
  { label: '1 week before', value: '1', unit: 'weeks' },
  { label: '2 weeks before', value: '2', unit: 'weeks' },
  { label: '1 month before', value: '1', unit: 'months' },
]

export function AddTaskModal({ isOpen, onClose, data, onAddTask }: AddTaskModalProps) {
  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [priority, setPriority] = useState<1 | 2 | 3 | 4>(4)
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [showReminderDropdown, setShowReminderDropdown] = useState(false)
  const [customReminder, setCustomReminder] = useState({ amount: '', unit: 'minutes' })

  if (!isOpen) return null

  const handleSubmit = () => {
    if (!taskName.trim() || !selectedProject) return

    onAddTask({
      name: taskName,
      description,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      priority,
      reminders,
      projectId: selectedProject,
      tags: selectedTags,
      files: [],
      completed: false
    })

    // Reset form
    setTaskName('')
    setDescription('')
    setDueDate('')
    setDueTime('')
    setPriority(4)
    setSelectedProject('')
    setSelectedTags([])
    setReminders([])
    onClose()
  }

  const addReminder = (reminder: Reminder) => {
    setReminders([...reminders, reminder])
    setShowReminderDropdown(false)
    setCustomReminder({ amount: '', unit: 'minutes' })
  }

  const addCustomReminder = () => {
    if (customReminder.amount) {
      addReminder({
        id: `reminder-${Date.now()}`,
        type: 'custom',
        value: `${customReminder.amount} ${customReminder.unit} before`,
        amount: parseInt(customReminder.amount),
        unit: customReminder.unit as any
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Add Task</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Task name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-zinc-800 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="relative">
              <Clock className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full bg-zinc-800 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
              <Flag className="w-4 h-4" />
              Priority
            </div>
            <div className="flex gap-2">
              {([1, 2, 3, 4] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    priority === p
                      ? p === 1 ? 'bg-red-500 text-white' :
                        p === 2 ? 'bg-orange-500 text-white' :
                        p === 3 ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  P{p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
              <Bell className="w-4 h-4" />
              Reminders
            </div>
            <div className="relative">
              <button
                onClick={() => setShowReminderDropdown(!showReminderDropdown)}
                className="bg-zinc-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
              >
                Add Reminder
              </button>
              
              {showReminderDropdown && (
                <div className="absolute top-full mt-2 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 w-64 max-h-96 overflow-y-auto z-10">
                  {reminderPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => addReminder({
                        id: `reminder-${Date.now()}`,
                        type: 'preset',
                        value: preset.label,
                        amount: parseInt(preset.value),
                        unit: preset.unit as any
                      })}
                      className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                  <div className="border-t border-zinc-700 p-3">
                    <p className="text-xs text-zinc-400 mb-2">Custom</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={customReminder.amount}
                        onChange={(e) => setCustomReminder({ ...customReminder, amount: e.target.value })}
                        className="w-20 bg-zinc-700 text-white px-2 py-1 rounded text-sm"
                      />
                      <select
                        value={customReminder.unit}
                        onChange={(e) => setCustomReminder({ ...customReminder, unit: e.target.value })}
                        className="flex-1 bg-zinc-700 text-white px-2 py-1 rounded text-sm"
                      >
                        <option value="minutes">minutes</option>
                        <option value="hours">hours</option>
                        <option value="days">days</option>
                        <option value="weeks">weeks</option>
                        <option value="months">months</option>
                        <option value="years">years</option>
                      </select>
                      <button
                        onClick={addCustomReminder}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {reminders.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {reminders.map((reminder) => (
                  <span
                    key={reminder.id}
                    className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs flex items-center gap-1"
                  >
                    {reminder.value}
                    <button
                      onClick={() => setReminders(reminders.filter(r => r.id !== reminder.id))}
                      className="text-zinc-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
              <Hash className="w-4 h-4" />
              Project
            </div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-zinc-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Select a project</option>
              {data.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2 text-sm text-zinc-400">
              <Tag className="w-4 h-4" />
              Tags
            </div>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    setSelectedTags(
                      selectedTags.includes(tag.id)
                        ? selectedTags.filter(id => id !== tag.id)
                        : [...selectedTags, tag.id]
                    )
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-6 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!taskName.trim() || !selectedProject}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Task
          </button>
        </div>
      </div>
    </div>
  )
}