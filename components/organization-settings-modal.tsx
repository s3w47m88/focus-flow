"use client"

import { useState, useEffect, useRef } from 'react'
import { X, Search, Building2, Plus, Check } from 'lucide-react'
import { Organization, Project, Database } from '@/lib/types'
import { ColorPicker } from './color-picker'

interface OrganizationSettingsModalProps {
  organization: Organization
  projects: Project[]
  allProjects: Project[]
  onClose: () => void
  onSave: (updates: Partial<Organization>) => void
  onProjectAssociation: (projectId: string, organizationIds: string[]) => void
}

export function OrganizationSettingsModal({ 
  organization, 
  projects, 
  allProjects,
  onClose, 
  onSave,
  onProjectAssociation
}: OrganizationSettingsModalProps) {
  const [name, setName] = useState(organization.name)
  const [description, setDescription] = useState(organization.description || '')
  const [color, setColor] = useState(organization.color)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [associatedProjectIds, setAssociatedProjectIds] = useState<string[]>(
    projects.map(p => p.id)
  )
  const colorPickerRef = useRef<HTMLDivElement>(null)

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const filteredProjects = allProjects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleProjectToggle = (projectId: string) => {
    setAssociatedProjectIds(prev => 
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleSave = () => {
    // Save organization details
    onSave({
      name,
      description,
      color
    })

    // Update project associations
    allProjects.forEach(project => {
      const shouldBeAssociated = associatedProjectIds.includes(project.id)
      const isCurrentlyAssociated = project.organizationId === organization.id

      if (shouldBeAssociated !== isCurrentlyAssociated) {
        // Update the project's organization
        // For now, we'll just update to this organization if selected
        // In the future, this could support multiple organizations
        if (shouldBeAssociated) {
          onProjectAssociation(project.id, [organization.id])
        }
      }
    })

    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Organization Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-theme-primary focus:outline-none"
                placeholder="Organization name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-theme-primary focus:outline-none resize-none"
                placeholder="Organization description"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="relative" ref={colorPickerRef}>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-12 h-12 rounded-lg border-2 border-zinc-700 transition-transform hover:scale-105"
                  style={{ backgroundColor: color }}
                />
                {showColorPicker && (
                  <div className="absolute mt-2 z-50">
                    <ColorPicker
                      currentColor={color}
                      onColorChange={(newColor) => {
                        setColor(newColor)
                        setShowColorPicker(false)
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Associated Projects */}
          <div>
            <h3 className="text-lg font-medium mb-4">Associated Projects</h3>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-theme-primary focus:outline-none"
              />
            </div>

            {/* Project List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredProjects.map(project => {
                const isAssociated = associatedProjectIds.includes(project.id)
                return (
                  <label
                    key={project.id}
                    className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isAssociated}
                      onChange={() => handleProjectToggle(project.id)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-700 text-theme-primary focus:ring-2 focus:ring-theme-primary focus:ring-offset-0 focus:ring-offset-zinc-900"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: project.color }} 
                      />
                      <span className="text-sm">{project.name}</span>
                      {project.description && (
                        <span className="text-xs text-zinc-500">- {project.description}</span>
                      )}
                    </div>
                    {isAssociated && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </label>
                )
              })}
            </div>

            <p className="text-xs text-zinc-500 mt-2">
              Projects can be associated with multiple organizations
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}