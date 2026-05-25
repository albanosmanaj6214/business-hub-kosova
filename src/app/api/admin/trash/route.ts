import { listTrash } from '@/lib/soft-delete'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET() { return listTrash() }
