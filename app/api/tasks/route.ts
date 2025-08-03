import { NextRequest, NextResponse } from 'next/server'
import { createTask } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json()
    const newTask = await createTask(taskData)
    return NextResponse.json(newTask)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}