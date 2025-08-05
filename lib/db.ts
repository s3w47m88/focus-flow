import { Database, Task, Project, Organization } from './types'
import fs from 'fs/promises'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'data', 'database.json')

export async function getDatabase(): Promise<Database> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading database:', error)
    throw error
  }
}

export async function saveDatabase(database: Database): Promise<void> {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(database, null, 2))
  } catch (error) {
    console.error('Error saving database:', error)
    throw error
  }
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
  const db = await getDatabase()
  const newTask: Task = {
    ...task,
    id: `task-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: task.files || []
  }
  db.tasks.push(newTask)
  await saveDatabase(db)
  return newTask
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
  const db = await getDatabase()
  const taskIndex = db.tasks.findIndex(t => t.id === id)
  if (taskIndex === -1) return null
  
  db.tasks[taskIndex] = {
    ...db.tasks[taskIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  await saveDatabase(db)
  return db.tasks[taskIndex]
}

export async function deleteTask(id: string): Promise<boolean> {
  const db = await getDatabase()
  const initialLength = db.tasks.length
  db.tasks = db.tasks.filter(t => t.id !== id)
  if (db.tasks.length < initialLength) {
    await saveDatabase(db)
    return true
  }
  return false
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const db = await getDatabase()
  const projectIndex = db.projects.findIndex(p => p.id === id)
  if (projectIndex === -1) return null
  
  db.projects[projectIndex] = {
    ...db.projects[projectIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  await saveDatabase(db)
  return db.projects[projectIndex]
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = await getDatabase()
  const initialLength = db.projects.length
  db.projects = db.projects.filter(p => p.id !== id)
  
  // Also delete all tasks in this project
  db.tasks = db.tasks.filter(t => t.projectId !== id)
  
  if (db.projects.length < initialLength) {
    await saveDatabase(db)
    return true
  }
  return false
}

export async function createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
  const db = await getDatabase()
  
  // Find the highest order number for projects in this organization
  const orgProjects = db.projects.filter(p => p.organizationId === project.organizationId)
  const maxOrder = Math.max(0, ...orgProjects.map(p => p.order || 0))
  
  const newProject: Project = {
    ...project,
    id: `project-${Date.now()}`,
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db.projects.push(newProject)
  await saveDatabase(db)
  return newProject
}

export async function createOrganization(organization: Omit<Organization, 'id'>): Promise<Organization> {
  const db = await getDatabase()
  
  // Find the highest order number for organizations
  const maxOrder = Math.max(0, ...db.organizations.map(o => o.order || 0))
  
  const newOrganization: Organization = {
    ...organization,
    id: `org-${Date.now()}`,
    order: maxOrder + 1
  }
  db.organizations.push(newOrganization)
  await saveDatabase(db)
  return newOrganization
}

export async function updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null> {
  const db = await getDatabase()
  const orgIndex = db.organizations.findIndex(o => o.id === id)
  if (orgIndex === -1) return null
  
  db.organizations[orgIndex] = {
    ...db.organizations[orgIndex],
    ...updates
  }
  await saveDatabase(db)
  return db.organizations[orgIndex]
}

export async function reorderProjects(organizationId: string, projectIds: string[]): Promise<void> {
  const db = await getDatabase()
  
  // Update the order of each project
  projectIds.forEach((projectId, index) => {
    const projectIndex = db.projects.findIndex(p => p.id === projectId)
    if (projectIndex !== -1) {
      db.projects[projectIndex].order = index
    }
  })
  
  await saveDatabase(db)
}

export async function reorderOrganizations(organizationIds: string[]): Promise<void> {
  const db = await getDatabase()
  
  // Update the order of each organization
  organizationIds.forEach((orgId, index) => {
    const orgIndex = db.organizations.findIndex(o => o.id === orgId)
    if (orgIndex !== -1) {
      db.organizations[orgIndex].order = index
    }
  })
  
  await saveDatabase(db)
}

export async function deleteOrganization(id: string): Promise<boolean> {
  const db = await getDatabase()
  const initialLength = db.organizations.length
  db.organizations = db.organizations.filter(o => o.id !== id)
  
  // Also delete all projects in this organization
  const projectsToDelete = db.projects.filter(p => p.organizationId === id).map(p => p.id)
  db.projects = db.projects.filter(p => p.organizationId !== id)
  
  // Also delete all tasks in projects that belonged to this organization
  db.tasks = db.tasks.filter(t => !projectsToDelete.includes(t.projectId))
  
  if (db.organizations.length < initialLength) {
    await saveDatabase(db)
    return true
  }
  return false
}