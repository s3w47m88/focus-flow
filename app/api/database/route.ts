import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'

export async function GET() {
  try {
    const database = await getDatabase()
    return NextResponse.json(database)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch database' }, { status: 500 })
  }
}