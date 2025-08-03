"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Archive, Trash2 } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import { AddTaskModal } from '@/components/add-task-modal'
import { EditTaskModal } from '@/components/edit-task-modal'
import { AddProjectModal } from '@/components/add-project-modal'
import { AddOrganizationModal } from '@/components/add-organization-modal'
import { ConfirmModal } from '@/components/confirm-modal'
import { TaskList } from '@/components/task-list'
import { Database, Task, Project } from '@/lib/types'

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
  const [confirmDelete, setConfirmDelete] = useState<{ show: boolean; orgId: string | null; orgName: string }>({ 
    show: false, 
    orgId: null,
    orgName: ''
  })

  useEffect(() => {
    fetchData()
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

  const handleRescheduleAll = async () => {
    if (!confirm('Reschedule all tasks on this page to today?')) return
    
    const today = new Date().toISOString().split('T')[0]
    const todayTasks = database.tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      taskDate.setHours(0, 0, 0, 0)
      const todayDate = new Date()
      todayDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() <= todayDate.getTime()
    })
    
    try {
      const updatePromises = todayTasks.map(task => 
        fetch(`/api/tasks/${task.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dueDate: today })
        })
      )
      
      await Promise.all(updatePromises)
      await fetchData()
    } catch (error) {
      console.error('Error rescheduling tasks:', error)
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

  if (!database) {
    return <div className="h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>
  }

  const renderContent = () => {
    if (view === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const todayTasks = database.tasks.filter(task => {
        if (!task.dueDate) return false
        const taskDate = new Date(task.dueDate)
        taskDate.setHours(0, 0, 0, 0)
        // Show tasks due today or overdue (anything up to and including today)
        return taskDate.getTime() <= today.getTime()
      })
      
      return (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Today</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRescheduleAll}
                className="px-3 py-1 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
              >
                Reschedule All
              </button>
              <span className="text-sm text-zinc-400">
                {todayTasks.filter(t => !t.completed).length} tasks
              </span>
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
      return (
        <div>
          <h1 className="text-2xl font-bold mb-6">Upcoming</h1>
          <p className="text-zinc-400">Kanban view coming soon</p>
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
            <h1 className="text-2xl font-bold mb-2">{organization?.name || 'Organization'}</h1>
            <p className="text-zinc-400">
              {activeProjects.length} active projects, {archivedProjects.length} archived
            </p>
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
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project?.color }}></span>
              {project?.name || 'Project'}
            </h1>
            <span className="text-sm text-zinc-400">
              {projectTasks.filter(t => !t.completed).length} active, {projectTasks.filter(t => t.completed).length} completed
            </span>
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
    </div>
  )
}