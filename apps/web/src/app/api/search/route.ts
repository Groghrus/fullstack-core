import { NextRequest, NextResponse } from 'next/server'
import { searchThemes } from '@/lib/search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') ?? '').trim()
  if (q.length < 2) {
    return NextResponse.json({ query: q, results: [] })
  }
  try {
    const results = await searchThemes(q)
    return NextResponse.json({ query: q, results })
  } catch {
    // Индекс не собрался (например, на сервере не нашлись .md) — клиент
    // сам упадёт в локальный фильтр по названиям.
    return NextResponse.json({ query: q, results: [] }, { status: 500 })
  }
}