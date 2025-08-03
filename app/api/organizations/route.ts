import { NextRequest, NextResponse } from 'next/server'
import { createOrganization } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const organizationData = await request.json()
    const newOrganization = await createOrganization(organizationData)
    return NextResponse.json(newOrganization)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 })
  }
}