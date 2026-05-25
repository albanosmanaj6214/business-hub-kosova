import Link from 'next/link'
import { INCOTERMS } from '@/lib/export-terms'
import { ExpertContactCard } from '@/components/contact/ExpertContactCard'
import { FloatingExpertCTA } from '@/components/contact/FloatingExpertCTA'
import { ArrowLeft, Ship } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function IncotermsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <Link href="/dashboard/terma" className="inline-flex items-center text-sm text-[#2E86C1] hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" /> Kthehu te termet
      </Link>

      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-[#1B4F72]/10 p-2.5 shrink-0">
          <Ship className="h-6 w-6 text-[#1B4F72]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incoterms 2020</h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Rregulla ndërkombëtare të Dhomës Ndërkombëtare të Tregtisë (ICC) që përcaktojnë kush paguan çka dhe kush mban rrezikun në çdo fazë të transportit. 11 terme, nga përgjegjësia minimale (EXW) te maksimumi (DDP).
          </p>
        </div>
      </div>

      {/* Responsibility scale */}
      <div className="rounded-xl border border-gray-200 p-6">
        <div className="text-sm font-medium text-gray-700 mb-3">Sa përgjegjësi mban shitësi</div>
        <div className="flex items-center gap-1 text-xs font-mono">
          <span className="text-[#27AE60] font-semibold">Blerësi mban</span>
          <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-[#27AE60] via-[#F39C12] to-[#E74C3C] mx-2" />
          <span className="text-[#E74C3C] font-semibold">Shitësi mban</span>
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-gray-400 font-mono flex-wrap gap-1">
          <span>EXW</span><span>FCA</span><span>FAS</span><span>FOB</span><span>CFR/CIF</span><span>CPT/CIP</span><span>DAP</span><span>DPU</span><span>DDP</span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Kodi</th>
                <th className="text-left p-3 font-medium text-gray-500">Emri</th>
                <th className="text-left p-3 font-medium text-gray-500">Mënyra</th>
                <th className="text-left p-3 font-medium text-gray-500">Transporti</th>
                <th className="text-left p-3 font-medium text-gray-500">Rreziku kalon</th>
                <th className="text-left p-3 font-medium text-gray-500">Dogana imp.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {INCOTERMS.map((it) => (
                <tr key={it.code} className="hover:bg-gray-50 align-top">
                  <td className="p-3 font-bold text-[#1B4F72] whitespace-nowrap">{it.code}</td>
                  <td className="p-3 text-gray-900 min-w-[180px]">{it.name}<div className="text-xs text-gray-500 mt-1">{it.note}</div></td>
                  <td className="p-3 text-gray-600 whitespace-nowrap">{it.mode === 'sea' ? 'Vetëm detar' : 'Çdo mënyrë'}</td>
                  <td className="p-3"><span className={it.carriagePaidBy === 'shitësi' ? 'text-[#E74C3C]' : 'text-[#27AE60]'}>{it.carriagePaidBy}</span></td>
                  <td className="p-3 text-gray-600 min-w-[200px] text-xs">{it.riskTransfer}</td>
                  <td className="p-3"><span className={it.importCustoms === 'shitësi' ? 'text-[#E74C3C]' : 'text-gray-600'}>{it.importCustoms}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <strong>Këshillë:</strong> Për fillestarët në eksport, <strong>FCA</strong> është më i sigurti dhe fleksibili. Shmang EXW (blerësi mund të mos arrijë t’i bëjë formalitetet doganore kosovare) dhe DDP (merr përsipër taksat e huaja që mund të mos i njohësh).
      </div>

      <div id="expert-contact">
        <ExpertContactCard
        variant="EXPORT_GUIDE"
        contextRef="Incoterms — këshillë për kontratë eksporti"
        source="dashboard-incoterms"
      />
      </div>
      <FloatingExpertCTA variant="EXPORT_GUIDE" />
    </div>
  )
}
