"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, User, Building2, Edit } from 'lucide-react'
import { ThemePicker } from '@/components/theme-picker'
import { OrganizationSettingsModal } from '@/components/organization-settings-modal'
import { Database, Organization } from '@/lib/types'

export default function SettingsPage() {
  const router = useRouter()
  const [database, setDatabase] = useState<Database | null>(null)
  const [profileColor, setProfileColor] = useState('#EA580C')
  const [animationsEnabled, setAnimationsEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showThemePicker, setShowThemePicker] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const themePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // Close theme picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themePickerRef.current && !themePickerRef.current.contains(event.target as Node)) {
        setShowThemePicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/database')
      const data = await response.json()
      setDatabase(data)
      
      // Load user settings
      if (data.users?.[0]) {
        setProfileColor(data.users[0].profileColor || '#EA580C')
        setAnimationsEnabled(data.users[0].animationsEnabled !== false)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSave = async () => {
    if (!database?.users?.[0]) return
    
    setSaving(true)
    try {
      const response = await fetch(`/api/users/${database.users[0].id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileColor,
          animationsEnabled
        })
      })
      
      if (response.ok) {
        // Apply theme immediately
        applyUserTheme(profileColor, animationsEnabled)
        
        // Navigate back
        router.back()
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const applyUserTheme = (color: string, animationsEnabled: boolean) => {
    const root = document.documentElement
    let primaryColor = color
    
    // Handle gradients
    if (color.startsWith('linear-gradient')) {
      const matches = color.match(/#[A-Fa-f0-9]{6}/g)
      if (matches && matches.length > 0) {
        primaryColor = matches[0]
        root.style.setProperty('--user-profile-color', primaryColor)
        root.style.setProperty('--user-profile-gradient', color)
      }
    } else {
      root.style.setProperty('--user-profile-color', color)
      root.style.setProperty('--user-profile-gradient', color)
    }
    
    // Convert hex to RGB for use in rgba()
    const hex = primaryColor.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    root.style.setProperty('--user-profile-color-rgb', `${r}, ${g}, ${b}`)
    
    // Toggle animations
    if (animationsEnabled) {
      root.classList.remove('no-animations')
    } else {
      root.classList.add('no-animations')
    }
    
    // Store in localStorage for immediate effect
    localStorage.setItem('userProfileColor', color)
    localStorage.setItem('animationsEnabled', animationsEnabled.toString())
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-2xl mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="space-y-12">
          {/* Your Profile Section */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Your Profile</h2>
            <div className="space-y-6">
              {/* Profile Color */}
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Color
                </h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Choose your profile color. This will be used for your user icon and accent colors throughout the app.
                </p>
                <div className="relative flex items-center gap-4" ref={themePickerRef}>
                  <button
                    onClick={() => setShowThemePicker(!showThemePicker)}
                    className="w-12 h-12 rounded-full border-2 border-zinc-700 transition-transform hover:scale-105"
                    style={{ background: profileColor }}
                  />
                  {showThemePicker && (
                    <div className="absolute mt-2 z-50">
                      <ThemePicker
                        currentTheme={profileColor}
                        onThemeChange={(theme) => {
                          setProfileColor(theme)
                          setShowThemePicker(false)
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Animations */}
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <h3 className="text-lg font-medium mb-4">Animations</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={animationsEnabled}
                    onChange={(e) => setAnimationsEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-theme-primary focus:ring-2 focus:ring-theme-primary focus:ring-offset-0 focus:ring-offset-zinc-900"
                  />
                  <div>
                    <p className="text-white">Enable animations</p>
                    <p className="text-sm text-zinc-400">
                      Includes swirling gradients and other visual effects
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Your Organization Section */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Your Organization</h2>
            <div className="space-y-6">
              {/* Organization Name */}
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <h3 className="text-lg font-medium mb-4">Organization Name</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Set your default organization name.
                </p>
                <input
                  type="text"
                  placeholder="My Organization"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-theme-primary focus:outline-none"
                  disabled
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Organization settings coming soon
                </p>
              </div>

              {/* Default Project View */}
              <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                <h3 className="text-lg font-medium mb-4">Default Project View</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Choose how projects are displayed by default.
                </p>
                <select
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-theme-primary focus:outline-none"
                  disabled
                >
                  <option>List View</option>
                  <option>Kanban View</option>
                </select>
                <p className="text-xs text-zinc-500 mt-2">
                  View settings coming soon
                </p>
              </div>
            </div>
          </div>

          {/* Organizations Section */}
          <div>
            <h2 className="text-xl font-semibold mb-6">Organizations</h2>
            <div className="bg-zinc-900 rounded-lg border border-zinc-800">
              {database?.organizations && database.organizations.length > 0 ? (
                <div className="divide-y divide-zinc-800">
                  {database.organizations.map(org => (
                    <div key={org.id} className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex-shrink-0" 
                          style={{ backgroundColor: org.color }} 
                        />
                        <div>
                          <h3 className="font-medium">{org.name}</h3>
                          {org.description && (
                            <p className="text-sm text-zinc-400">{org.description}</p>
                          )}
                          <p className="text-xs text-zinc-500 mt-1">
                            {database.projects.filter(p => p.organizationId === org.id).length} projects
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedOrganization(org)}
                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-500">
                  No organizations found
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-theme-primary text-white rounded-lg hover:bg-theme-primary/80 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Organization Settings Modal */}
      {selectedOrganization && database && (
        <OrganizationSettingsModal
          organization={selectedOrganization}
          projects={database.projects.filter(p => p.organizationId === selectedOrganization.id)}
          allProjects={database.projects}
          onClose={() => setSelectedOrganization(null)}
          onSave={async (updates) => {
            try {
              const response = await fetch(`/api/organizations/${selectedOrganization.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
              })
              
              if (response.ok) {
                // Refresh data
                await fetchData()
                setSelectedOrganization(null)
              }
            } catch (error) {
              console.error('Error updating organization:', error)
            }
          }}
          onProjectAssociation={async (projectId, organizationIds) => {
            try {
              const response = await fetch(`/api/projects/${projectId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationId: organizationIds[0] }) // For now, just use the first org
              })
              
              if (response.ok) {
                // Refresh data
                await fetchData()
              }
            } catch (error) {
              console.error('Error updating project association:', error)
            }
          }}
        />
      )}
    </div>
  )
}