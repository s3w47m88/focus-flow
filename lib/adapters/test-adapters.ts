#!/usr/bin/env node

/**
 * Test script for database adapters
 * Run with: npx tsx lib/adapters/test-adapters.ts
 */

import { FileAdapter } from './file-adapter'
import { SupabaseAdapter } from './supabase-adapter'
import { DatabaseAdapter } from '../db-adapter'
import { Task, Project, Organization, Tag } from '../types'

async function testAdapter(adapter: DatabaseAdapter, adapterName: string) {
  console.log(`\n=== Testing ${adapterName} ===\n`)

  try {
    // Initialize
    console.log('1. Initializing adapter...')
    if (adapter.initialize) {
      await adapter.initialize()
    }
    console.log('✓ Initialization successful')

    // Test Organization CRUD
    console.log('\n2. Testing Organization operations...')
    const testOrg: Organization = {
      id: `org-test-${Date.now()}`,
      name: 'Test Organization',
      color: '#FF5733',
      description: 'Test org for adapter testing',
      order: 0
    }

    const createdOrg = await adapter.createOrganization(testOrg)
    console.log('✓ Created organization:', createdOrg.id)

    const fetchedOrg = await adapter.getOrganization(createdOrg.id)
    console.log('✓ Fetched organization:', fetchedOrg?.name)

    const updatedOrg = await adapter.updateOrganization(createdOrg.id, {
      name: 'Updated Test Organization'
    })
    console.log('✓ Updated organization name:', updatedOrg.name)

    // Test Project CRUD
    console.log('\n3. Testing Project operations...')
    const testProject: Project = {
      id: `project-test-${Date.now()}`,
      name: 'Test Project',
      color: '#3498DB',
      organizationId: createdOrg.id,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0
    }

    const createdProject = await adapter.createProject(testProject)
    console.log('✓ Created project:', createdProject.id)

    const fetchedProject = await adapter.getProject(createdProject.id)
    console.log('✓ Fetched project:', fetchedProject?.name)

    // Test Task CRUD
    console.log('\n4. Testing Task operations...')
    const testTask: Task = {
      id: `task-test-${Date.now()}`,
      name: 'Test Task',
      description: 'Test task description',
      priority: 2,
      projectId: createdProject.id,
      tags: [],
      files: [],
      reminders: [],
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const createdTask = await adapter.createTask(testTask)
    console.log('✓ Created task:', createdTask.id)

    const updatedTask = await adapter.updateTask(createdTask.id, {
      completed: true,
      completedAt: new Date().toISOString()
    })
    console.log('✓ Updated task completion:', updatedTask.completed)

    // Test Tag CRUD
    console.log('\n5. Testing Tag operations...')
    const testTag: Tag = {
      id: `tag-test-${Date.now()}`,
      name: 'Test Tag',
      color: '#E74C3C'
    }

    const createdTag = await adapter.createTag(testTag)
    console.log('✓ Created tag:', createdTag.id)

    // Test batch operations
    console.log('\n6. Testing batch operations...')
    await adapter.batchUpdateTasks([
      {
        id: createdTask.id,
        changes: { priority: 1 }
      }
    ])
    console.log('✓ Batch updated tasks')

    // Test getters
    console.log('\n7. Testing bulk fetch operations...')
    const allOrgs = await adapter.getOrganizations()
    console.log(`✓ Fetched ${allOrgs.length} organizations`)

    const allProjects = await adapter.getProjects()
    console.log(`✓ Fetched ${allProjects.length} projects`)

    const allTasks = await adapter.getTasks()
    console.log(`✓ Fetched ${allTasks.length} tasks`)

    const allTags = await adapter.getTags()
    console.log(`✓ Fetched ${allTags.length} tags`)

    // Test settings
    console.log('\n8. Testing settings operations...')
    const settings = await adapter.getSettings()
    console.log('✓ Fetched settings:', settings)

    await adapter.updateSettings({ showCompletedTasks: false })
    console.log('✓ Updated settings')

    // Test user operations
    console.log('\n9. Testing user operations...')
    const users = await adapter.getUsers()
    console.log(`✓ Fetched ${users.length} users`)

    const currentUser = await adapter.getCurrentUser()
    console.log('✓ Current user:', currentUser?.firstName || 'None')

    // Cleanup
    console.log('\n10. Cleaning up test data...')
    await adapter.deleteTask(createdTask.id)
    console.log('✓ Deleted test task')

    await adapter.deleteTag(createdTag.id)
    console.log('✓ Deleted test tag')

    await adapter.deleteProject(createdProject.id)
    console.log('✓ Deleted test project')

    await adapter.deleteOrganization(createdOrg.id)
    console.log('✓ Deleted test organization')

    console.log(`\n✅ All tests passed for ${adapterName}!`)

  } catch (error) {
    console.error(`\n❌ Error testing ${adapterName}:`, error)
  } finally {
    if (adapter.close) {
      await adapter.close()
    }
  }
}

async function runTests() {
  console.log('Database Adapter Test Suite')
  console.log('==========================')

  // Test FileAdapter
  const fileAdapter = new FileAdapter()
  await testAdapter(fileAdapter, 'FileAdapter')

  // Test SupabaseAdapter (will show placeholder messages)
  console.log('\n\nNote: SupabaseAdapter tests will show placeholder messages')
  console.log('as the implementation requires actual Supabase configuration.')
  
  // Temporarily set env vars for testing
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'placeholder-key'
  
  const supabaseAdapter = new SupabaseAdapter()
  await testAdapter(supabaseAdapter, 'SupabaseAdapter')

  console.log('\n\n✅ Test suite completed!')
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

export { testAdapter, runTests }