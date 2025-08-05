"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Archive, Trash2, Edit, Plus } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import { AddTaskModal } from '@/components/add-task-modal'
import { EditTaskModal } from '@/components/edit-task-modal'
import { AddProjectModal } from '@/components/add-project-modal'
import { EditProjectModal } from '@/components/edit-project-modal'
import { AddOrganizationModal } from '@/components/add-organization-modal'
import { EditOrganizationModal } from '@/components/edit-organization-modal'
import { ConfirmModal } from '@/components/confirm-modal'
import { TaskList } from '@/components/task-list'
import { KanbanView } from '@/components/kanban-view'
import { ColorPicker } from '@/components/color-picker'
import { RescheduleConfirmModal } from '@/components/reschedule-confirm-modal'
import { RescheduleResultModal } from '@/components/reschedule-result-modal'
import { RescheduleProgressModal } from '@/components/reschedule-progress-modal'
import { Database, Task, Project, Organization } from '@/lib/types'
import { getLocalDateString, isOverdue, isTodayOrOverdue } from '@/lib/date-utils'

export default function ViewPage() {
  const params = useParams()
  const router = useRouter()
  const view = params.view as string
  
  const [database, setDatabase] = useState<Database | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditTask, setShowEditTask] = useState(false)
  const [showAddProject, setShowAddProject] = useState(false)
  const [selectedOrgForProject, setSelectedOrgForProject] = useState<string | null>(null)
  const [showAddOrganization, setShowAddOrganization] = useState(false)
  const [showEditOrganization, setShowEditOrganization] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const [showEditProject, setShowEditProject] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; orgId: string | null; orgName: string }>({ 
    show: false, 
    orgId: null,
    orgName: ''
  })
  const [editingOrgDescription, setEditingOrgDescription] = useState<string | null>(null)
  const [showProjectColorPicker, setShowProjectColorPicker] = useState(false)
  const [showRescheduleConfirm, setShowRescheduleConfirm] = useState(false)
  const [showRescheduleResult, setShowRescheduleResult] = useState(false)
  const [showRescheduleProgress, setShowRescheduleProgress] = useState(false)
  const [rescheduleProgress, setRescheduleProgress] = useState({ current: 0, total: 0 })
  const [rescheduleResult, setRescheduleResult] = useState({ successCount: 0, failCount: 0 })
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [sortBy, setSortBy] = useState<'dueDate' | 'deadline' | 'priority'>('dueDate')
  const [filterAssignedTo, setFilterAssignedTo] = useState<string>('me-unassigned')

  useEffect(() => {
    fetchData()
    // Apply user settings
    const userColor = localStorage.getItem('userProfileColor')
    const animationsEnabled = localStorage.getItem('animationsEnabled')
    
    if (userColor) {
      document.documentElement.style.setProperty('--user-profile-color', userColor)
      
      // Convert hex to RGB
      const hex = userColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      document.documentElement.style.setProperty('--user-profile-color-rgb', `${r}, ${g}, ${b}`)
    }
    
    if (animationsEnabled === 'false') {
      document.documentElement.classList.add('no-animations')
    } else {
      document.documentElement.classList.remove('no-animations')
    }
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/database')
      const data = await response.json()
      setDatabase(data)
    } catch (error) {
      console.error('Error fetching database:', error)
    }
  }

  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      
      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const handleTaskToggle = async (taskId: string) => {
    const task = database?.tasks.find(t => t.id === taskId)
    if (!task) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: !task.completed,
          completedAt: !task.completed ? new Date().toISOString() : undefined
        })
      })
      
      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task)
    setShowEditTask(true)
  }

  const handleTaskSave = async (taskData: Partial<Task>) => {
    if (!editingTask) return
    
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      
      if (response.ok) {
        await fetchData()
        setShowEditTask(false)
        setEditingTask(null)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          await fetchData()
        }
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const handleRescheduleAll = () => {
    if (!database) return
    
    // Filter for overdue tasks only (not including today's tasks)
    const overdue = database.tasks.filter(task => {
      if (!task.dueDate || task.completed) return false
      return isOverdue(task.dueDate)
    })
    
    if (overdue.length === 0) {
      setRescheduleResult({ successCount: 0, failCount: 0 })
      setShowRescheduleResult(true)
      return
    }
    
    setOverdueTasks(overdue)
    setShowRescheduleConfirm(true)
  }
  
  const handleConfirmReschedule = async () => {
    setShowRescheduleConfirm(false)
    setShowRescheduleProgress(true)
    setRescheduleProgress({ current: 0, total: overdueTasks.length })
    
    // Get local date string (YYYY-MM-DD) without timezone conversion
    const today = getLocalDateString()
    const batchSize = 20 // Process 20 tasks at a time
    let totalSuccess = 0
    let totalFail = 0
    
    try {
      // Process tasks in batches using the batch endpoint
      for (let i = 0; i < overdueTasks.length; i += batchSize) {
        const batch = overdueTasks.slice(i, i + batchSize)
        const taskIds = batch.map(task => task.id)
        
        const response = await fetch('/api/tasks/batch-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskIds,
            updates: { dueDate: today }
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          totalSuccess += result.successCount
          totalFail += result.failCount
        } else {
          totalFail += taskIds.length
        }
        
        // Update progress
        setRescheduleProgress({ 
          current: Math.min(i + batch.length, overdueTasks.length), 
          total: overdueTasks.length 
        })
        
        // Small delay between batches for UI responsiveness
        if (i + batchSize < overdueTasks.length) {
          await new Promise(resolve => setTimeout(resolve, 50))
        }
      }
      
      await fetchData()
      
      setShowRescheduleProgress(false)
      setRescheduleResult({ successCount: totalSuccess, failCount: totalFail })
      setShowRescheduleResult(true)
    } catch (error) {
      console.error('Error rescheduling tasks:', error)
      setShowRescheduleProgress(false)
      setRescheduleResult({ successCount: totalSuccess, failCount: overdueTasks.length - totalSuccess })
      setShowRescheduleResult(true)
    }
  }

  const handleViewChange = (newView: string) => {
    router.push(`/${newView}`)
  }

  const handleProjectUpdate = async (projectId: string, updates: Partial<Project>) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error updating project:', error)
    }
  }

  const handleProjectDelete = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchData()
        // If we're currently viewing the deleted project, go to today view
        if (view === `project-${projectId}`) {
          router.push('/today')
        }
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const handleAddProject = async (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      })
      
      if (response.ok) {
        await fetchData()
        setShowAddProject(false)
        setSelectedOrgForProject(null)
      }
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const handleOpenAddProject = (organizationId: string) => {
    setSelectedOrgForProject(organizationId)
    setShowAddProject(true)
  }

  const handleOpenAddProjectGeneral = () => {
    setSelectedOrgForProject(database.organizations[0]?.id || null)
    setShowAddProject(true)
  }

  const handleAddOrganization = async (orgData: { name: string; color: string }) => {
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData)
      })
      
      if (response.ok) {
        await fetchData()
        setShowAddOrganization(false)
      }
    } catch (error) {
      console.error('Error creating organization:', error)
    }
  }

  const handleOrganizationDelete = async (orgId: string) => {
    if (!confirmDelete.orgId) return
    
    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchData()
        // If we're currently viewing the deleted organization, go to today view
        if (view === `org-${orgId}`) {
          router.push('/today')
        }
      }
    } catch (error) {
      console.error('Error deleting organization:', error)
    }
  }

  const openDeleteConfirmation = (orgId: string) => {
    const org = database?.organizations.find(o => o.id === orgId)
    if (org) {
      const projectCount = database?.projects.filter(p => p.organizationId === orgId).length || 0
      const taskCount = database?.tasks.filter(t => {
        const project = database?.projects.find(p => p.id === t.projectId)
        return project?.organizationId === orgId
      }).length || 0
      
      setConfirmDelete({
        show: true,
        orgId: orgId,
        orgName: `${org.name} (${projectCount} projects, ${taskCount} tasks)`
      })
    }
  }

  const handleOrganizationUpdate = async (orgId: string, updates: Partial<Organization>) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error updating organization:', error)
    }
  }

  const handleOpenEditOrganization = (orgId: string) => {
    const org = database?.organizations.find(o => o.id === orgId)
    if (org) {
      setEditingOrganization(org)
      setShowEditOrganization(true)
    }
  }

  const handleOpenEditProject = (projectId: string) => {
    const project = database?.projects.find(p => p.id === projectId)
    if (project) {
      setEditingProject(project)
      setShowEditProject(true)
    }
  }
  
  const handleProjectsReorder = async (organizationId: string, projectIds: string[]) => {
    try {
      const response = await fetch('/api/projects/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, projectIds })
      })
      
      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error reordering projects:', error)
    }
  }
  
  const handleOrganizationsReorder = async (organizationIds: string[]) => {
    try {
      const response = await fetch('/api/organizations/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationIds })
      })
      
      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error reordering organizations:', error)
    }
  }

  if (!database) {
    return <div className="h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>
  }

  const sortTasks = (tasks: Task[]) => {
    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        
        case 'deadline':
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        
        case 'priority':
          return a.priority - b.priority // Lower number = higher priority
        
        default:
          return 0
      }
    })
  }

  const getCurrentUserId = () => {
    // Get the first user as the current user (in a real app this would come from auth)
    return database?.users[0]?.id || null
  }

  const filterTasks = (tasks: Task[]) => {
    if (filterAssignedTo === 'all') {
      return tasks
    }
    
    const currentUserId = getCurrentUserId()
    
    if (filterAssignedTo === 'me-unassigned' && currentUserId) {
      return tasks.filter(task => task.assignedTo === currentUserId || !task.assignedTo)
    }
    
    if (filterAssignedTo === 'me' && currentUserId) {
      return tasks.filter(task => task.assignedTo === currentUserId)
    }
    
    if (filterAssignedTo === 'unassigned') {
      return tasks.filter(task => !task.assignedTo)
    }
    
    // Filter by specific user ID
    return tasks.filter(task => task.assignedTo === filterAssignedTo)
  }

  const renderContent = () => {
    if (view === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      let todayTasks = database.tasks.filter(task => {
        if (!task.dueDate) return false
        // Show tasks due today or overdue (anything up to and including today)
        return isTodayOrOverdue(task.dueDate)
      })
      
      // Apply filters and sorting
      todayTasks = filterTasks(todayTasks)
      todayTasks = sortTasks(todayTasks)
      
      // Count overdue tasks specifically
      const overdueCount = database.tasks.filter(task => {
        if (!task.dueDate || task.completed) return false
        return isOverdue(task.dueDate)
      }).length
      
      return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Today</h1>
            <div className="flex items-center gap-4">
              {overdueCount > 0 && (
                <button
                  onClick={handleRescheduleAll}
                  className="px-3 py-1 text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-md transition-colors"
                >
                  Reschedule {overdueCount} Overdue
                </button>
              )}
              <span className="text-sm text-zinc-400">
                {todayTasks.filter(t => !t.completed).length} tasks
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-400">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-zinc-800 text-white text-sm px-3 py-1 rounded border border-zinc-700 focus:outline-none focus:ring-2 ring-theme transition-all"
              >
                <option value="dueDate">Due Date</option>
                <option value="deadline">Deadline</option>
                <option value="priority">Priority</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-400">Assigned to:</label>
              <select
                value={filterAssignedTo}
                onChange={(e) => setFilterAssignedTo(e.target.value)}
                className="bg-zinc-800 text-white text-sm px-3 py-1 rounded border border-zinc-700 focus:outline-none focus:ring-2 ring-theme transition-all"
              >
                <option value="me-unassigned">Me + Unassigned</option>
                <option value="me">Me</option>
                <option value="all">All</option>
                <option value="unassigned">Unassigned</option>
                {database.users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <TaskList
            tasks={todayTasks}
            showCompleted={database.settings?.showCompletedTasks ?? true}
            onTaskToggle={handleTaskToggle}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
          />
        </div>
      )
    }
    
    if (view === 'upcoming') {
      // Get all tasks with due dates
      const upcomingTasks = database.tasks.filter(task => task.dueDate && !task.completed)
      
      const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
        try {
          const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          })
          
          if (response.ok) {
            await fetchData()
          }
        } catch (error) {
          console.error('Error updating task:', error)
        }
      }
      
      return (
        <div className="-ml-8 -mr-8">
          <h1 className="text-2xl font-bold mb-6 ml-8">Upcoming</h1>
          <div className="pl-8">
            <KanbanView
              tasks={upcomingTasks}
              projects={database.projects}
              onTaskToggle={handleTaskToggle}
              onTaskEdit={handleTaskEdit}
              onTaskUpdate={handleTaskUpdate}
            />
          </div>
        </div>
      )
    }
    
    if (view === 'search') {
      return (
        <div>
          <h1 className="text-2xl font-bold mb-6">Search</h1>
          <p className="text-zinc-400">Search functionality coming soon</p>
        </div>
      )
    }
    
    if (view === 'favorites') {
      return (
        <div>
          <h1 className="text-2xl font-bold mb-6">Favorites</h1>
          <p className="text-zinc-400">Your favorite projects will appear here</p>
        </div>
      )
    }
    
    if (view.startsWith('org-')) {
      const orgId = view.replace('org-', '')
      const organization = database.organizations.find(o => o.id === orgId)
      const orgProjects = database.projects.filter(p => p.organizationId === orgId)
      const activeProjects = orgProjects.filter(p => !p.archived)
      const archivedProjects = orgProjects.filter(p => p.archived)
      
      return (
        <div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">{organization?.name || 'Organization'}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditOrganization(orgId)}
                  className="p-2 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white"
                  title="Edit organization"
                >
                  <Edit className="w-5 h-5" />
                </button>
                {organization?.archived ? (
                  <button
                    onClick={() => handleOrganizationUpdate(orgId, { archived: false })}
                    className="p-2 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white"
                    title="Restore organization"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleOrganizationUpdate(orgId, { archived: true })}
                    className="p-2 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white"
                    title="Archive organization"
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => openDeleteConfirmation(orgId)}
                  className="p-2 hover:bg-zinc-800 rounded transition-colors text-red-400 hover:text-red-300"
                  title="Delete organization"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <p className="text-zinc-400 mb-4">
              {activeProjects.length} active projects, {archivedProjects.length} archived
            </p>
            
            {editingOrgDescription === orgId ? (
              <textarea
                value={organization?.description || ''}
                onChange={(e) => {
                  handleOrganizationUpdate(orgId, { description: e.target.value })
                }}
                onBlur={() => setEditingOrgDescription(null)}
                placeholder="Add a description..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 ring-theme transition-all"
                rows={3}
                autoFocus
              />
            ) : (
              <div
                onClick={() => setEditingOrgDescription(orgId)}
                className="text-sm text-zinc-400 cursor-pointer hover:text-zinc-300 p-3 bg-zinc-800/50 rounded-lg border border-transparent hover:border-zinc-700"
              >
                {organization?.description || 'Click to add description...'}
              </div>
            )}
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold mb-4">Active Projects</h2>
              <div className="grid gap-4">
                {activeProjects.map(project => {
                  const taskCount = database.tasks.filter(t => t.projectId === project.id).length
                  const completedCount = database.tasks.filter(t => t.projectId === project.id && t.completed).length
                  
                  return (
                    <div key={project.id} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                      <div className="flex items-start justify-between mb-2">
                        <Link
                          href={`/project-${project.id}`}
                          className="flex items-center gap-2 text-lg font-medium hover:text-zinc-300 transition-colors"
                        >
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                          {project.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleProjectUpdate(project.id, { archived: false })}
                            className="p-1 hover:bg-zinc-800 rounded transition-colors"
                            title="Unarchive project"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${project.name}"? This will also delete all tasks in this project.`)) {
                                handleProjectDelete(project.id)
                              }
                            }}
                            className="p-1 hover:bg-zinc-800 rounded transition-colors text-red-400"
                            title="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {project.description && (
                        <p className="text-sm text-zinc-400 mb-2">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span>{taskCount} tasks ({completedCount} completed)</span>
                        {project.budget && <span>Budget: ${project.budget}</span>}
                        {project.deadline && <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  )
                })}
                {activeProjects.length === 0 && (
                  <p className="text-zinc-500">No active projects</p>
                )}
              </div>
            </div>
            
            {archivedProjects.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 text-zinc-400">Archived Projects</h2>
                <div className="grid gap-4">
                  {archivedProjects.map(project => {
                    const taskCount = database.tasks.filter(t => t.projectId === project.id).length
                    
                    return (
                      <div key={project.id} className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800 opacity-60">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 text-lg font-medium">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                            {project.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleProjectUpdate(project.id, { archived: false })}
                              className="p-1 hover:bg-zinc-800 rounded transition-colors"
                              title="Restore project"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to permanently delete "${project.name}"? This will also delete all tasks in this project.`)) {
                                  handleProjectDelete(project.id)
                                }
                              }}
                              className="p-1 hover:bg-zinc-800 rounded transition-colors text-red-400"
                              title="Delete project permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-zinc-500">
                          <span>{taskCount} tasks</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }
    
    if (view.startsWith('project-')) {
      const projectId = view.replace('project-', '')
      const project = database.projects.find(p => p.id === projectId)
      const projectTasks = database.tasks.filter(t => t.projectId === projectId)
      
      return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <div className="relative">
                <span 
                  className="w-4 h-4 rounded-full block cursor-pointer hover:ring-2 hover:ring-zinc-400 transition-all" 
                  style={{ backgroundColor: project?.color }}
                  onMouseEnter={() => setShowProjectColorPicker(true)}
                  onMouseLeave={() => setShowProjectColorPicker(false)}
                ></span>
                {showProjectColorPicker && project && (
                  <div onMouseEnter={() => setShowProjectColorPicker(true)} onMouseLeave={() => setShowProjectColorPicker(false)}>
                    <ColorPicker
                      currentColor={project.color}
                      onColorChange={(color) => {
                        handleProjectUpdate(project.id, { color })
                        setShowProjectColorPicker(false)
                      }}
                      onClose={() => setShowProjectColorPicker(false)}
                    />
                  </div>
                )}
              </div>
              {project?.name || 'Project'}
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAddTask(true)}
                className="btn-theme-primary text-white rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                Task
              </button>
              <span className="text-sm text-zinc-400">
                {projectTasks.filter(t => !t.completed).length} active, {projectTasks.filter(t => t.completed).length} completed
              </span>
            </div>
          </div>
          
          <TaskList
            tasks={projectTasks}
            showCompleted={database.settings?.showCompletedTasks ?? true}
            onTaskToggle={handleTaskToggle}
            onTaskEdit={handleTaskEdit}
            onTaskDelete={handleTaskDelete}
          />
        </div>
      )
    }
    
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Not Found</h1>
        <p className="text-zinc-400">This view does not exist</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-zinc-950 flex">
      <Sidebar 
        data={database}
        onAddTask={() => setShowAddTask(true)}
        currentView={view}
        onViewChange={handleViewChange}
        onProjectUpdate={handleProjectUpdate}
        onProjectDelete={handleProjectDelete}
        onAddProject={handleOpenAddProject}
        onAddProjectGeneral={handleOpenAddProjectGeneral}
        onAddOrganization={() => setShowAddOrganization(true)}
        onOrganizationDelete={openDeleteConfirmation}
        onOrganizationEdit={handleOpenEditOrganization}
        onProjectEdit={handleOpenEditProject}
        onProjectsReorder={handleProjectsReorder}
        onOrganizationsReorder={handleOrganizationsReorder}
      />
      
      <main className="flex-1 text-white overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {renderContent()}
        </div>
      </main>
      
      <AddTaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        data={database}
        onAddTask={handleAddTask}
        onDataRefresh={fetchData}
        defaultProjectId={view.startsWith('project-') ? view.replace('project-', '') : undefined}
      />
      
      <EditTaskModal
        isOpen={showEditTask}
        onClose={() => {
          setShowEditTask(false)
          setEditingTask(null)
        }}
        task={editingTask}
        data={database}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        onDataRefresh={fetchData}
        onTaskSelect={(task) => {
          setEditingTask(task)
        }}
      />
      
      {selectedOrgForProject && (
        <AddProjectModal
          isOpen={showAddProject}
          onClose={() => {
            setShowAddProject(false)
            setSelectedOrgForProject(null)
          }}
          organizationId={selectedOrgForProject}
          onAddProject={handleAddProject}
        />
      )}
      
      <AddOrganizationModal
        isOpen={showAddOrganization}
        onClose={() => setShowAddOrganization(false)}
        onAddOrganization={handleAddOrganization}
      />
      
      <EditOrganizationModal
        isOpen={showEditOrganization}
        onClose={() => {
          setShowEditOrganization(false)
          setEditingOrganization(null)
        }}
        organization={editingOrganization}
        onUpdate={(updates) => {
          if (editingOrganization) {
            handleOrganizationUpdate(editingOrganization.id, updates)
          }
        }}
      />
      
      <EditProjectModal
        isOpen={showEditProject}
        onClose={() => {
          setShowEditProject(false)
          setEditingProject(null)
        }}
        project={editingProject}
        onUpdate={(updates) => {
          if (editingProject) {
            handleProjectUpdate(editingProject.id, updates)
          }
        }}
      />
      
      <ConfirmModal
        isOpen={confirmDelete.show}
        onClose={() => setConfirmDelete({ show: false, orgId: null, orgName: '' })}
        onConfirm={() => {
          if (confirmDelete.orgId) {
            handleOrganizationDelete(confirmDelete.orgId)
          }
        }}
        title="Delete Organization"
        description={`Are you sure you want to delete "${confirmDelete.orgName}"? This will permanently delete the organization and all its projects and tasks.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
      
      <RescheduleConfirmModal
        isOpen={showRescheduleConfirm}
        onClose={() => setShowRescheduleConfirm(false)}
        onConfirm={handleConfirmReschedule}
        taskCount={overdueTasks.length}
      />
      
      <RescheduleProgressModal
        isOpen={showRescheduleProgress}
        current={rescheduleProgress.current}
        total={rescheduleProgress.total}
      />
      
      <RescheduleResultModal
        isOpen={showRescheduleResult}
        onClose={() => setShowRescheduleResult(false)}
        successCount={rescheduleResult.successCount}
        failCount={rescheduleResult.failCount}
      />
    </div>
  )
}