import { restore } from '@/lib/soft-delete'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return restore('fair', params.id)
}
