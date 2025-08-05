import { NextResponse } from 'next/server'
import { reorderProjects } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { organizationId, projectIds } = await request.json()
    
    if (!organizationId || !Array.isArray(projectIds)) {
      return NextResponse.json(
        { error: 'Invalid request data' }, 
        { status: 400 }
      )
    }
    
    await reorderProjects(organizationId, projectIds)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering projects:', error)
    return NextResponse.json(
      { error: 'Failed to reorder projects' }, 
      { status: 500 }
    )
  }
}