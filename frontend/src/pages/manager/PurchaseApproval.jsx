// frontend/src/pages/manager/PurchaseApproval.jsx
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { fmtQty } from '../../utils/format'
import {
  ClipboardCheck, CheckCircle, XCircle, Clock,
  BarChart3, Trophy, Eye, AlertTriangle, Play, ChevronRight
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const STATUS_CFG = {
  PENDING:  { label: 'Menunggu',  cls: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Disetujui', cls: 'bg-green-100 text-green-700'  },
  REJECTED: { label: 'Ditolak',   cls: 'bg-red-100 text-red-700'      },
}

const RANK_COLOR = ['#f59e0b', '#6b7280', '#cd7f32', '#3b82f6', '#8b5cf6', '#10b981']

export default function PurchaseApproval() {
  const [list,          setList]          = useState([])
  const [loading,       setLoading]       = useState(true)
  const [statusFilter,  setStatusFilter]  = useState('PENDING')

  // Modal detail + aksi
  const [selectedReq,   setSelectedReq]   = useState(null)
  const [actionModal,   setActionModal]   = useState(false)
  const [actionType,    setActionType]    = useState('') // 'approve' | 'reject'
  const [noteApproval,  setNoteApproval]  = useState('')
  const [actioning,     setActioning]     = useState(false)

  // Modal TOPSIS
  const [topsisModal,   setTopsisModal]   = useState(false)
  const [topsisReq,     setTopsisReq]     = useState(null)  // purchase request
  const [criteria,      setCriteria]      = useState([])
  const [editWeight,    setEditWeight]    = useState(false)
  const [weights,       setWeights]       = useState({})
  const [topsisResult,  setTopsisResult]  = useState(null)
  const [topsisLoading, setTopsisLoading] = useState(false)

  const loadList = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/purchase-requests', { params })
      setList(data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadList() }, [statusFilter])

  // Buka modal approve/reject
  const openAction = (req, type) => {
    setSelectedReq(req)
    setActionType(type)
    setNoteApproval('')
    setActionModal(true)
  }

  const handleAction = async () => {
    if (!selectedReq) return
    setActioning(true)
    try {
      const endpoint = actionType === 'approve'
        ? `/purchase-requests/${selectedReq.id}/approve`
        : `/purchase-requests/${selectedReq.id}/reject`
      await api.put(endpoint, { note_approval: noteApproval })
      toast.success(actionType === 'approve' ? '✅ Pengajuan disetujui!' : '❌ Pengajuan ditolak')
      setActionModal(false)
      loadList()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memproses')
    } finally { setActioning(false) }
  }

  // Buka modal TOPSIS
  const openTopsis = async (req) => {
    setTopsisReq(req)
    setTopsisResult(null)
    setEditWeight(false)
    setTopsisModal(true)
    // Load kriteria vendor
    try {
      const { data } = await api.get('/topsis/criteria?topsis_type=VENDOR')
      setCriteria(data.data)
      const w = {}
      data.data.forEach(c => { w[c.id] = c.weight })
      setWeights(w)
    } catch {
      toast.error('Gagal memuat kriteria')
    }
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + parseFloat(b || 0), 0)

  const saveWeights = async () => {
    if (Math.abs(totalWeight - 1) > 0.001)
      return toast.error(`Total bobot harus = 1. Saat ini: ${totalWeight.toFixed(4)}`)
    for (const c of criteria) {
      await api.put(`/topsis/criteria/${c.id}`, { ...c, weight: parseFloat(weights[c.id]) })
    }
    toast.success('Bobot disimpan!')
    setEditWeight(false)
  }

  const handleRunTopsis = async () => {
    if (!topsisReq) return
    setTopsisLoading(true)
    try {
      const { data } = await api.post('/topsis/analyze', {
        material_id:         topsisReq.material_id,
        purchase_request_id: topsisReq.id,
        title: `Pemilihan Vendor - ${topsisReq.kode_barang} (${new Date().toLocaleDateString('id-ID')})`,
      })
      setTopsisResult(data.data)
      toast.success('🎯 Analisis TOPSIS selesai! Vendor terbaik ditemukan.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menjalankan TOPSIS')
    } finally { setTopsisLoading(false) }
  }

  const pendingCount   = list.filter(r => r.status === 'PENDING').length
  const approvedCount  = list.filter(r => r.status === 'APPROVED').length
  const rejectedCount  = list.filter(r => r.status === 'REJECTED').length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Persetujuan Pembelian</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tinjau pengajuan dari Admin Inventori, setujui dan tentukan vendor terbaik dengan TOPSIS
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3 py-3">
          <div className="p-2 rounded-lg bg-yellow-100 text-yellow-700"><Clock size={16} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            <p className="text-xs text-gray-500">Menunggu</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 py-3">
          <div className="p-2 rounded-lg bg-green-100 text-green-700"><CheckCircle size={16} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
            <p className="text-xs text-gray-500">Disetujui</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 py-3">
          <div className="p-2 rounded-lg bg-red-100 text-red-700"><XCircle size={16} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
            <p className="text-xs text-gray-500">Ditolak</p>
          </div>
        </div>
      </div>

      {/* Filter tab */}
      <div className="card mb-4 p-3 flex gap-2">
        {[['PENDING','Menunggu'], ['APPROVED','Disetujui'], ['REJECTED','Ditolak'], ['','Semua']].map(
          ([val, lbl]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === val
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {lbl}
              {val === 'PENDING' && pendingCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.5 text-[10px]">
                  {pendingCount}
                </span>
              )}
            </button>
          )
        )}
      </div>

      {/* Tabel */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="text-left px-4 py-3 font-medium">No. Pengajuan</th>
                  <th className="text-left px-4 py-3 font-medium">Material</th>
                  <th className="text-left px-4 py-3 font-medium">Diajukan Oleh</th>
                  <th className="text-right px-4 py-3 font-medium">Stok / Min</th>
                  <th className="text-right px-4 py-3 font-medium">Jml Diminta</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      <ClipboardCheck size={40} className="mx-auto mb-2 opacity-30" />
                      Tidak ada pengajuan
                    </td>
                  </tr>
                ) : (
                  list.map(r => {
                    const st = STATUS_CFG[r.status] || STATUS_CFG.PENDING
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">
                          {r.request_no}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">{r.nama_barang}</p>
                          <p className="text-xs text-gray-400">{r.kode_barang}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{r.requester_name}</td>
                        <td className="px-4 py-3 text-right text-xs">
                          <span className={parseFloat(r.current_stock) === 0 ? 'text-red-600 font-bold' : 'text-orange-600 font-semibold'}>
                            {fmtQty(r.current_stock)}
                          </span>
                          <span className="text-gray-400"> / {fmtQty(r.min_stock)} {r.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {fmtQty(r.qty_requested)}
                          <span className="text-gray-400 text-xs ml-1">{r.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${st.cls}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {r.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => openAction(r, 'approve')}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium transition-colors"
                                >
                                  <CheckCircle size={12} /> Setujui
                                </button>
                                <button
                                  onClick={() => openAction(r, 'reject')}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
                                >
                                  <XCircle size={12} /> Tolak
                                </button>
                              </>
                            )}
                            {r.status === 'APPROVED' && (
                              <button
                                onClick={() => openTopsis(r)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors"
                              >
                                <BarChart3 size={12} /> Pilih Vendor
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Approve / Reject ── */}
      <Modal
        open={actionModal}
        onClose={() => setActionModal(false)}
        title={actionType === 'approve' ? '✅ Setujui Pengajuan' : '❌ Tolak Pengajuan'}
        size="md"
      >
        {selectedReq && (
          <div className="space-y-4">
            <div className={`p-3 rounded-lg text-sm ${actionType === 'approve' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className="font-semibold">{selectedReq.nama_barang}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                No: {selectedReq.request_no} · Diminta: {fmtQty(selectedReq.qty_requested)} {selectedReq.unit}
              </p>
              <p className="text-xs text-gray-500">
                Stok saat ini: <strong className="text-red-600">{fmtQty(selectedReq.current_stock)} {selectedReq.unit}</strong>
              </p>
            </div>

            {selectedReq.note && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-xs text-gray-500 mb-1">Catatan dari Admin:</p>
                <p className="text-gray-700">{selectedReq.note}</p>
              </div>
            )}

            {actionType === 'approve' && (
              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                💡 Setelah disetujui, Anda dapat menjalankan analisis TOPSIS untuk memilih vendor terbaik.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {actionType === 'approve' ? 'Catatan Persetujuan' : 'Alasan Penolakan'}
                {actionType === 'reject' && <span className="text-red-500 ml-1">*</span>}
              </label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder={actionType === 'approve' ? 'Catatan tambahan (opsional)...' : 'Tulis alasan penolakan...'}
                value={noteApproval}
                onChange={e => setNoteApproval(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setActionModal(false)} className="btn-secondary">Batal</button>
              <button
                onClick={handleAction}
                disabled={actioning || (actionType === 'reject' && !noteApproval.trim())}
                className={`btn-primary ${actionType === 'reject' ? 'bg-red-600 hover:bg-red-700 border-red-600' : ''}`}
              >
                {actioning ? 'Memproses...' : actionType === 'approve' ? '✅ Setujui' : '❌ Tolak'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal TOPSIS Pemilihan Vendor ── */}
      <Modal
        open={topsisModal}
        onClose={() => { setTopsisModal(false); setTopsisResult(null) }}
        title="🎯 Analisis TOPSIS — Pemilihan Vendor"
        size="xl"
      >
        {topsisReq && (
          <div className="space-y-5">
            {/* Info pengajuan */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 text-sm">
              <AlertTriangle size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-blue-800">{topsisReq.nama_barang}</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Stok: {fmtQty(topsisReq.current_stock)} {topsisReq.unit} &nbsp;·&nbsp;
                  Diminta: {fmtQty(topsisReq.qty_requested)} {topsisReq.unit} &nbsp;·&nbsp;
                  No: {topsisReq.request_no}
                </p>
              </div>
            </div>

            {/* Kriteria & Bobot */}
            {!topsisResult && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">Kriteria & Bobot TOPSIS Vendor</p>
                  <button
                    onClick={() => setEditWeight(v => !v)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {editWeight ? 'Batal' : 'Edit Bobot'}
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {criteria.map(c => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700">
                        {c.code}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-800">{c.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          c.type === 'BENEFIT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>{c.type}</span>
                      </div>
                      {editWeight ? (
                        <input
                          type="number" step="0.01" min="0" max="1"
                          className="input-field w-20 text-right text-xs"
                          value={weights[c.id] || 0}
                          onChange={e => setWeights(p => ({ ...p, [c.id]: e.target.value }))}
                        />
                      ) : (
                        <span className="font-bold text-blue-600 text-sm w-12 text-right">
                          {(parseFloat(c.weight) * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  ))}
                  {editWeight && (
                    <div className="pt-2 space-y-2">
                      <p className={`text-xs font-medium ${Math.abs(totalWeight - 1) > 0.001 ? 'text-red-600' : 'text-green-600'}`}>
                        Total: {(totalWeight * 100).toFixed(1)}%
                        {Math.abs(totalWeight - 1) > 0.001 ? ' ⚠️ harus 100%' : ' ✓'}
                      </p>
                      <button onClick={saveWeights} className="btn-primary w-full justify-center text-xs py-2">
                        Simpan Bobot
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tombol Jalankan */}
            {!topsisResult && (
              <button
                onClick={handleRunTopsis}
                disabled={topsisLoading}
                className="btn-primary w-full justify-center py-3"
              >
                {topsisLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Menganalisis vendor...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Play size={16} /> Jalankan TOPSIS — Pilih Vendor Terbaik
                  </span>
                )}
              </button>
            )}

            {/* ── Hasil TOPSIS ── */}
            {topsisResult && (
              <div className="space-y-4">
                {/* Rekomendasi Utama */}
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy size={20} className="text-yellow-500" />
                    <p className="font-bold text-gray-900">Vendor Terbaik yang Direkomendasikan</p>
                  </div>
                  <p className="text-xl font-bold text-yellow-700">{topsisResult.best_vendor?.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Nilai Preferensi (Ci):{' '}
                    <strong className="text-blue-600">
                      {(topsisResult.best_vendor?.preference_score * 100).toFixed(2)}%
                    </strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Berdasarkan {topsisResult.criteria?.length} kriteria: harga, kualitas, lead time, ketepatan kirim, reputasi
                  </p>
                </div>

                {/* Grafik */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <BarChart3 size={16} /> Perbandingan Nilai Preferensi Vendor
                    </p>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={topsisResult.results.map(r => ({
                          name:  r.name.length > 12 ? r.name.slice(0, 12) + '…' : r.name,
                          full:  r.name,
                          score: parseFloat((r.preference_score * 100).toFixed(2)),
                          rank:  r.rank,
                        }))}
                        margin={{ top: 5, right: 20, left: 0, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                        <Tooltip formatter={(v, n, p) => [`${v}%`, `Rank #${p.payload.rank} — ${p.payload.full}`]} />
                        <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                          {topsisResult.results.map((r, i) => (
                            <Cell key={r.id} fill={RANK_COLOR[i] || '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabel Ranking */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">Ranking Vendor</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr className="text-xs text-gray-500 uppercase">
                        <th className="text-center px-4 py-2 font-medium">Rank</th>
                        <th className="text-left px-4 py-2 font-medium">Vendor</th>
                        <th className="text-right px-4 py-2 font-medium">Ci (%)</th>
                        <th className="text-right px-4 py-2 font-medium">D+</th>
                        <th className="text-right px-4 py-2 font-medium">D−</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {topsisResult.results.map((r, i) => (
                        <tr key={r.id} className={i === 0 ? 'bg-yellow-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                              ${i === 0 ? 'bg-yellow-400 text-yellow-900' :
                                i === 1 ? 'bg-gray-300 text-gray-700' :
                                i === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-600'}`}>
                              {r.rank}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-medium">
                            {r.name}
                            {i === 0 && <span className="ml-2 text-xs text-yellow-600 font-normal">⭐ Terbaik</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-blue-600">
                            {(r.preference_score * 100).toFixed(2)}%
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-500">
                            {r.d_positive?.toFixed(4)}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs text-gray-500">
                            {r.d_negative?.toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <p className="text-xs text-gray-400">
                    Hasil disimpan ke Riwayat TOPSIS · ID #{topsisResult.result_id}
                  </p>
                  <button
                    onClick={() => { setTopsisModal(false); setTopsisResult(null) }}
                    className="btn-primary py-2 text-sm"
                  >
                    Selesai <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}