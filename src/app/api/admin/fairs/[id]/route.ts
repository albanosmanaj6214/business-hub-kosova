import { softDelete } from '@/lib/soft-delete'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return softDelete('fair', params.id)
}
