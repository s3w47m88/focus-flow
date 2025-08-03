import { NextRequest, NextResponse } from 'next/server'
import { createProject } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const projectData = await request.json()
    const newProject = await createProject(projectData)
    return NextResponse.json(newProject)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}