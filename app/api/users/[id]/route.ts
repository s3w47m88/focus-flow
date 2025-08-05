import { NextRequest, NextResponse } from 'next/server'
import { readDatabase, writeDatabase } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await readDatabase()
    const updates = await request.json()
    
    const userIndex = data.users.findIndex(u => u.id === params.id)
    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Update user
    data.users[userIndex] = {
      ...data.users[userIndex],
      ...updates,
      id: params.id // Ensure ID doesn't get overwritten
    }
    
    await writeDatabase(data)
    
    return NextResponse.json(data.users[userIndex])
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}