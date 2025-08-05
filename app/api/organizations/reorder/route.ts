import { NextResponse } from 'next/server'
import { reorderOrganizations } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { organizationIds } = await request.json()
    
    if (!Array.isArray(organizationIds)) {
      return NextResponse.json(
        { error: 'Invalid request data' }, 
        { status: 400 }
      )
    }
    
    await reorderOrganizations(organizationIds)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering organizations:', error)
    return NextResponse.json(
      { error: 'Failed to reorder organizations' }, 
      { status: 500 }
    )
  }
}