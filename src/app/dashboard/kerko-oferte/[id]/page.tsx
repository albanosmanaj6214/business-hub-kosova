import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Handshake, Mail, Phone, Globe, CheckCircle2, Building2 } from 'lucide-react'
import { RfqResponsePanel } from '@/components/dashboard/RfqResponsePanel'

export const dynamic = 'force-dynamic'

function dateSq(d: Date): string {
  return new Date(d).toLocaleDateString('sq-AL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function RfqDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string })?.id
  if (!userId) redirect('/login')
  const tier = String((session?.user as { tier?: string })?.tier ?? 'FREE')

  const request = await prisma.offerRequest.findUnique({
    where: { id: params.id },
    include: {
      category: { select: { nameSq: true } },
      responses: {
        include: {
          company: {
            select: {
              id: true, name: true, logoUrl: true, municipality: true, country: true,
              visibilityLevel: true, email: true, phone: true, website: true, contactPerson: true,
              ownerUserId: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!request) notFound()

  const isRequester = request.requesterUserId === userId
  const myCompany = await prisma.company.findUnique({
    where: { ownerUserId: userId },
    select: { id: true, profileStatus: true },
  })
  const myResponse = myCompany ? request.responses.find((r) => r.companyId === myCompany.id) : null

  // Kontakti i kërkuesit — i hapur vetëm për furnizuesin, oferta e të cilit u pranua.
  const acceptedResponse = request.responses.find((r) => r.status === 'ACCEPTED')
  const iAmAcceptedSupplier = !!(acceptedResponse && myCompany && acceptedResponse.companyId === myCompany.id)

  let requesterContact: { name: string | null; email: string; companyName: string | null; phone: string | null } | null = null
  if (iAmAcceptedSupplier) {
    const requester = await prisma.user.findUnique({
      where: { id: request.requesterUserId },
      select: { name: true, email: true, companyName: true, company: { select: { phone: true } } },
    })
    if (requester) {
      requesterContact = {
        name: requester.name,
        email: requester.email,
        companyName: requester.companyName,
        phone: requester.company?.phone ?? null,
      }
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/dashboard/kerko-oferte" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1B4F72]">
        <ArrowLeft className="h-4 w-4" /> Kërko Ofertë
      </Link>

      {/* Kërkesa */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{request.title}</h1>
              <p className="text-xs text-gray-500 mt-1">
                {request.category?.nameSq && <span>{request.category.nameSq} · </span>}
                krijuar {dateSq(request.createdAt)} · {request.notifiedCount} biznese të njoftuara
              </p>
            </div>
            <span className={`shrink-0 text-xs font-medium rounded-full px-2.5 py-1 ${
              request.status === 'OPEN' ? 'bg-green-100 text-green-700' :
              request.status === 'AWARDED' ? 'bg-[#1B4F72]/10 text-[#1B4F72]' :
              'bg-gray-100 text-gray-600'
            }`}>
              {request.status === 'OPEN' ? 'E hapur' : request.status === 'AWARDED' ? 'Ofertë e pranuar' : 'E mbyllur'}
            </span>
          </div>

          <p className="text-sm text-gray-700 whitespace-pre-line">{request.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
            {request.quantity && <Fact k="Sasia" v={request.quantity} />}
            {request.destinationCountry && <Fact k="Dërgesa" v={request.destinationCountry} />}
            {request.deadline && <Fact k="Afati" v={dateSq(request.deadline)} />}
            {request.budget && <Fact k="Buxheti" v={request.budget} />}
          </div>

          {request.specifications && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-500 mb-1">Specifikime</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{request.specifications}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kontakti i blerësit — vetëm për furnizuesin e pranuar */}
      {iAmAcceptedSupplier && requesterContact && (
        <Card className="border-green-300 bg-green-50/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold text-gray-900">Oferta jote u pranua — kontakti i blerësit:</h2>
            </div>
            <div className="space-y-1.5 text-sm text-gray-800">
              {requesterContact.companyName && <p className="flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-400" /> {requesterContact.companyName}</p>}
              {requesterContact.name && <p>{requesterContact.name}</p>}
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {requesterContact.email}</p>
              {requesterContact.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {requesterContact.phone}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paneli interaktiv: përgjigje / menaxhim ofertash */}
      <RfqResponsePanel
        requestId={request.id}
        requestStatus={request.status}
        isRequester={isRequester}
        tier={tier}
        hasCompany={!!myCompany}
        companyApproved={myCompany?.profileStatus === 'APPROVED'}
        myResponse={myResponse ? { id: myResponse.id, status: myResponse.status, message: myResponse.message } : null}
        responses={isRequester ? request.responses.map((r) => ({
          id: r.id,
          status: r.status,
          message: r.message,
          priceInfo: r.priceInfo,
          createdAt: r.createdAt.toISOString(),
          company: {
            id: r.company.id,
            name: r.company.name,
            municipality: r.company.municipality,
            country: r.company.country,
            verified: r.company.visibilityLevel === 'VERIFIED' || r.company.visibilityLevel === 'FEATURED',
            // Kontakti i furnizuesit hapet për kërkuesin VETËM pas pranimit të ofertës.
            contact: r.status === 'ACCEPTED'
              ? { email: r.company.email, phone: r.company.phone, website: r.company.website, contactPerson: r.company.contactPerson }
              : null,
          },
        })) : []}
      />
    </div>
  )
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-2.5">
      <p className="text-[11px] text-gray-500">{k}</p>
      <p className="text-sm font-medium text-gray-900">{v}</p>
    </div>
  )
}
