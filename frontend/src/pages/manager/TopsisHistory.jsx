// frontend/src/pages/manager/TopsisHistory.jsx
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import { History, Eye, Trophy, Building2 } from 'lucide-react'

export default function TopsisHistory() {
  const [list,    setList]    = useState([])
  const [detail,  setDetail]  = useState(null)
  const [modal,   setModal]   = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/topsis/history')
      .then(r => setList(r.data.data))
      .finally(() => setLoading(false))
  }, [])

  const openDetail = async id => {
    const { data } = await api.get(`/topsis/history/${id}`)
    setDetail(data.data)
    setModal(true)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Analisis TOPSIS</h1>
        <p className="text-sm text-gray-500 mt-1">
          Histori hasil analisis pemilihan vendor terbaik per material
        </p>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium">Judul Analisis</th>
                <th className="text-left px-4 py-3 font-medium">Material</th>
                <th className="text-left px-4 py-3 font-medium">Dianalisis Oleh</th>
                <th className="text-center px-4 py-3 font-medium">Jml Vendor</th>
                <th className="text-center px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <History size={40} className="mx-auto mb-2 opacity-30" />
                    Belum ada riwayat analisis
                  </td>
                </tr>
              ) : (
                list.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[220px]">
                      <p className="truncate">{r.title}</p>
                    </td>
                    <td className="px-4 py-3">
                      {r.material_name
                        ? <><p className="font-medium text-gray-800 text-xs">{r.material_name}</p>
                            <p className="text-xs text-gray-400">{r.material_code}</p></>
                        : <span className="text-gray-400 text-xs">-</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-600">{r.analyzed_by_name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        <Building2 size={10} /> {r.total_vendors} vendor
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openDetail(r.id)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <Eye size={14} /> Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={`Detail: ${detail?.title || ''}`} size="xl">
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Dianalisis oleh</p>
                <p className="font-semibold">{detail.analyzed_by_name}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Tanggal</p>
                <p className="font-semibold">{new Date(detail.created_at).toLocaleString('id-ID')}</p>
              </div>
            </div>

            {detail.material_name && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="text-xs text-gray-500 mb-0.5">Material yang Dianalisis</p>
                <p className="font-semibold text-blue-800">{detail.material_name}</p>
                <p className="text-xs text-gray-500">{detail.material_code}</p>
              </div>
            )}

            {/* Best vendor highlight */}
            {detail.details?.[0] && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
                  <Trophy size={18} className="text-yellow-900" />
                </div>
                <div>
                  <p className="text-xs text-yellow-700 font-medium">Vendor Terbaik</p>
                  <p className="font-bold text-gray-900">{detail.details[0].vendor_name}</p>
                  <p className="text-xs text-gray-600">
                    Ci = <strong className="text-blue-600">{(detail.details[0].preference_score * 100).toFixed(2)}%</strong>
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="text-center px-4 py-3 font-medium">Rank</th>
                    <th className="text-left px-4 py-3 font-medium">Vendor</th>
                    <th className="text-right px-4 py-3 font-medium">Nilai Ci (%)</th>
                    <th className="text-right px-4 py-3 font-medium">D+</th>
                    <th className="text-right px-4 py-3 font-medium">D−</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {detail.details?.map((d, i) => (
                    <tr key={d.id} className={i === 0 ? 'bg-yellow-50' : ''}>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                          ${i === 0 ? 'bg-yellow-400 text-yellow-900' :
                            i === 1 ? 'bg-gray-300' :
                            i === 2 ? 'bg-orange-300' : 'bg-gray-100 text-gray-600'}`}>
                          {d.ranking}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {d.vendor_name}
                        {i === 0 && <span className="ml-2 text-xs text-yellow-600">⭐ Terbaik</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                        {(d.preference_score * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">{d.d_positive}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-gray-500">{d.d_negative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}