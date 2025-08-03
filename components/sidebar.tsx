"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Calendar, CalendarDays, Star, Hash, GripVertical, Trash2, Archive, FolderPlus, Building2 } from 'lucide-react'
import { Database, Project } from '@/lib/types'

interface SidebarProps {
  data: Database
  onAddTask: () => void
  currentView: string
  onViewChange: (view: string) => void
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void
  onProjectDelete?: (projectId: string) => void
  onAddProject?: (organizationId: string) => void
  onAddProjectGeneral?: () => void
  onAddOrganization?: () => void
  onOrganizationDelete?: (organizationId: string) => void
}

export function Sidebar({ data, onAddTask, currentView, onViewChange, onProjectUpdate, onProjectDelete, onAddProject, onAddProjectGeneral, onAddOrganization, onOrganizationDelete }: SidebarProps) {
  const [expandedOrgs, setExpandedOrgs] = useState<string[]>(data.organizations.map(org => org.id))
  const [draggedProject, setDraggedProject] = useState<string | null>(null)
  const [dragOverOrg, setDragOverOrg] = useState<string | null>(null)
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)
  const [hoveredOrg, setHoveredOrg] = useState<string | null>(null)

  const toggleOrg = (orgId: string) => {
    setExpandedOrgs(prev =>
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    )
  }

  const orgProjects = (orgId: string) => 
    data.projects.filter(project => project.organizationId === orgId && !project.archived)

  return (
    <div className="w-[20%] h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4">
        <div className="text-white font-medium mb-6">{data.users?.[0]?.firstName || 'User'}</div>
        
        <div className="flex gap-2">
          <button
            onClick={onAddTask}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 flex items-center justify-center text-sm font-medium transition-colors"
            title="Add Task"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <button
            onClick={onAddProjectGeneral}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg px-3 py-2 flex items-center justify-center text-sm font-medium transition-colors"
            title="Add Project"
          >
            <Plus className="w-4 h-4" />
          </button>
          
          <button
            onClick={onAddOrganization}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg px-3 py-2 flex items-center justify-center text-sm font-medium transition-colors"
            title="Add Organization"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-2 overflow-y-auto">
        <Link
          href="/search"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentView === 'search' 
              ? 'bg-zinc-800 text-white' 
              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          Search
        </Link>

        <Link
          href="/today"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentView === 'today' 
              ? 'bg-zinc-800 text-white' 
              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Today
        </Link>

        <Link
          href="/upcoming"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            currentView === 'upcoming' 
              ? 'bg-zinc-800 text-white' 
              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Upcoming
        </Link>

        <Link
          href="/favorites"
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-4 ${
            currentView === 'favorites' 
              ? 'bg-zinc-800 text-white' 
              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
          }`}
        >
          <Star className="w-4 h-4" />
          Favorites
        </Link>

        <div className="space-y-1">
          {data.organizations.map(org => (
            <div 
              key={org.id}
              onMouseEnter={() => setHoveredOrg(org.id)}
              onMouseLeave={() => setHoveredOrg(null)}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOverOrg(org.id)
              }}
              onDragLeave={() => setDragOverOrg(null)}
              onDrop={(e) => {
                e.preventDefault()
                if (draggedProject && onProjectUpdate) {
                  onProjectUpdate(draggedProject, { organizationId: org.id })
                }
                setDraggedProject(null)
                setDragOverOrg(null)
              }}
              className={`rounded-lg transition-colors ${
                dragOverOrg === org.id ? 'bg-zinc-800/50' : ''
              }`}
            >
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => toggleOrg(org.id)}
                    className="text-sm text-zinc-400 hover:text-white transition-colors p-1"
                  >
                    <span className={`transform transition-transform block ${expandedOrgs.includes(org.id) ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>
                  <Link
                    href={`/org-${org.id}`}
                    className={`flex-1 text-sm transition-colors ${
                      currentView === `org-${org.id}`
                        ? 'text-white' 
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {org.name}
                  </Link>
                </div>
                {hoveredOrg === org.id && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onAddProject?.(org.id)}
                      className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white"
                      title="Add project"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOrganizationDelete?.(org.id)}
                      className="p-1 hover:bg-zinc-700 rounded transition-colors text-zinc-400 hover:text-white"
                      title="Delete organization"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {expandedOrgs.includes(org.id) && (
                <div className="ml-4 space-y-1">
                  {orgProjects(org.id).map(project => (
                    <div
                      key={project.id}
                      draggable
                      onDragStart={() => setDraggedProject(project.id)}
                      onDragEnd={() => {
                        setDraggedProject(null)
                        setDragOverOrg(null)
                      }}
                      onMouseEnter={() => setHoveredProject(project.id)}
                      onMouseLeave={() => setHoveredProject(null)}
                      className="cursor-move relative group"
                    >
                      <div
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          currentView === `project-${project.id}`
                            ? 'bg-zinc-800 text-white' 
                            : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                        } ${
                          draggedProject === project.id ? 'opacity-50' : ''
                        }`}
                      >
                        <GripVertical className="w-3 h-3 opacity-40" />
                        <Link
                          href={`/project-${project.id}`}
                          className="flex items-center gap-2 flex-1"
                        >
                          <Hash className="w-4 h-4" style={{ color: project.color }} />
                          {project.name}
                        </Link>
                        {hoveredProject === project.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (onProjectUpdate) {
                                  onProjectUpdate(project.id, { archived: true })
                                }
                              }}
                              className="p-1 hover:bg-zinc-700 rounded transition-colors"
                              title="Archive project"
                            >
                              <Archive className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm(`Are you sure you want to delete "${project.name}"? This will also delete all tasks in this project.`)) {
                                  if (onProjectDelete) {
                                    onProjectDelete(project.id)
                                  }
                                }
                              }}
                              className="p-1 hover:bg-zinc-700 rounded transition-colors"
                              title="Delete project"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}