// frontend/src/pages/inventory/PurchaseRequest.jsx
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { fmtQty } from '../../utils/format'
import {
  ShoppingCart, Plus, AlertTriangle, CheckCircle,
  XCircle, Clock, Eye, Package
} from 'lucide-react'

const STATUS_CFG = {
  PENDING:  { label: 'Menunggu',  cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
  APPROVED: { label: 'Disetujui', cls: 'bg-green-100 text-green-700',  icon: CheckCircle },
  REJECTED: { label: 'Ditolak',   cls: 'bg-red-100 text-red-700',      icon: XCircle },
}

const EMPTY_FORM = { material_id: '', qty_requested: '', note: '' }

export default function PurchaseRequest() {
  const [list,         setList]         = useState([])
  const [lowMaterials, setLowMaterials] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [modal,        setModal]        = useState(false)
  const [detailModal,  setDetailModal]  = useState(false)
  const [detail,       setDetail]       = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const loadList = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/purchase-requests', { params })
      setList(data.data)
    } finally { setLoading(false) }
  }

  const loadLowMaterials = async () => {
    const { data } = await api.get('/materials', { params: { low_stock: 1 } })
    // Filter hanya yang stok <= min_stock
    const low = (data.data || []).filter(
      m => parseFloat(m.current_stock) <= parseFloat(m.min_stock)
    )
    setLowMaterials(low)
  }

  useEffect(() => { loadList() }, [statusFilter])
  useEffect(() => { loadLowMaterials() }, [])

  const f = p => e => setForm(prev => ({ ...prev, [p]: e.target.value }))

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setModal(true)
  }

  const openDetail = async id => {
    const item = list.find(r => r.id === id)
    setDetail(item)
    setDetailModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.material_id || !form.qty_requested)
      return toast.error('Material dan jumlah wajib diisi')

    setSaving(true)
    try {
      await api.post('/purchase-requests', {
        material_id:   parseInt(form.material_id),
        qty_requested: parseFloat(form.qty_requested),
        note:          form.note || null,
      })
      toast.success('Pengajuan pembelian berhasil dikirim ke Manajer!')
      setModal(false)
      loadList()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membuat pengajuan')
    } finally { setSaving(false) }
  }

  const selectedMat = lowMaterials.find(m => m.id === parseInt(form.material_id))

  const pendingCount = list.filter(r => r.status === 'PENDING').length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengajuan Pembelian</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ajukan pembelian material stok menipis/habis ke Manajer
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Buat Pengajuan
        </button>
      </div>

      {/* Info stok menipis */}
      {lowMaterials.length > 0 && (
        <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
          <AlertTriangle size={18} className="text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-orange-800">
              {lowMaterials.length} material stok menipis/habis
            </p>
            <p className="text-xs text-orange-600 mt-0.5">
              {lowMaterials.slice(0, 3).map(m => m.nama_barang).join(', ')}
              {lowMaterials.length > 3 ? ` dan ${lowMaterials.length - 3} lainnya` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(STATUS_CFG).map(([key, cfg]) => {
          const Icon = cfg.icon
          const count = list.filter(r => r.status === key).length
          return (
            <div key={key} className="card flex items-center gap-3 py-3">
              <div className={`p-2 rounded-lg ${cfg.cls}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{cfg.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter */}
      <div className="card mb-4 p-3 flex gap-2">
        {[['', 'Semua'], ['PENDING', 'Menunggu'], ['APPROVED', 'Disetujui'], ['REJECTED', 'Ditolak']].map(
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
                  <th className="text-right px-4 py-3 font-medium">Stok Saat Ini</th>
                  <th className="text-right px-4 py-3 font-medium">Jml Diminta</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Tgl Pengajuan</th>
                  <th className="text-center px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
                      Belum ada pengajuan pembelian
                    </td>
                  </tr>
                ) : (
                  list.map(r => {
                    const st = STATUS_CFG[r.status] || STATUS_CFG.PENDING
                    const Icon = st.icon
                    return (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">
                          {r.request_no}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">
                            {r.nama_barang}
                          </p>
                          <p className="text-xs text-gray-400">{r.kode_barang}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={
                            parseFloat(r.current_stock) === 0
                              ? 'text-red-600 font-bold'
                              : 'text-orange-600 font-semibold'
                          }>
                            {fmtQty(r.current_stock)}
                          </span>
                          <span className="text-gray-400 text-xs ml-1">{r.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {fmtQty(r.qty_requested)}
                          <span className="text-gray-400 text-xs ml-1">{r.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${st.cls}`}>
                            <Icon size={11} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(r.requested_at).toLocaleDateString('id-ID', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => openDetail(r.id)}
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <Eye size={13} /> Detail
                          </button>
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

      {/* Modal Buat Pengajuan */}
      <Modal open={modal} onClose={() => setModal(false)} title="Buat Pengajuan Pembelian" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            ℹ️ Hanya material dengan stok di bawah minimum yang dapat diajukan. Pengajuan akan dikirim
            ke Manajer untuk disetujui sebelum pembelian dilakukan.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material (Stok Menipis/Habis) *
            </label>
            {lowMaterials.length === 0 ? (
              <div className="input-field bg-gray-50 text-gray-400 text-sm py-2.5">
                ✅ Semua stok material masih mencukupi
              </div>
            ) : (
              <select className="input-field" required value={form.material_id} onChange={f('material_id')}>
                <option value="">-- Pilih Material --</option>
                {lowMaterials.map(m => (
                  <option key={m.id} value={m.id}>
                    [{m.kode_barang}] {m.nama_barang} — Stok: {fmtQty(m.current_stock)} {m.unit}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Info stok material yang dipilih */}
          {selectedMat && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-orange-800">{selectedMat.nama_barang}</p>
              <div className="flex gap-4 text-orange-700">
                <span>Stok saat ini: <strong>{fmtQty(selectedMat.current_stock)} {selectedMat.unit}</strong></span>
                <span>Min stok: <strong>{fmtQty(selectedMat.min_stock)} {selectedMat.unit}</strong></span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah yang Diminta *
            </label>
            <input
              className="input-field"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="Masukkan jumlah..."
              value={form.qty_requested}
              onChange={f('qty_requested')}
            />
            {selectedMat && (
              <p className="text-xs text-gray-400 mt-1">Satuan: {selectedMat.unit}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catatan (opsional)
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="Alasan pengajuan, urgensi, dll..."
              value={form.note}
              onChange={f('note')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || lowMaterials.length === 0}
              className="btn-primary"
            >
              {saving ? 'Mengirim...' : '📋 Kirim Pengajuan ke Manajer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)} title="Detail Pengajuan" size="md">
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">No. Pengajuan</p>
                <p className="font-mono font-semibold text-blue-600">{detail.request_no}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-0.5">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CFG[detail.status]?.cls}`}>
                  {STATUS_CFG[detail.status]?.label}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Info Material</p>
              <p className="font-semibold">{detail.nama_barang}</p>
              <p className="text-xs text-gray-500">{detail.kode_barang}</p>
              <div className="flex gap-4 text-xs text-gray-600 pt-1">
                <span>Stok saat pengajuan: <strong className="text-red-600">{fmtQty(detail.current_stock)} {detail.unit}</strong></span>
                <span>Min: <strong>{fmtQty(detail.min_stock)}</strong></span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Jumlah Diminta</p>
              <p className="text-xl font-bold text-gray-900">
                {fmtQty(detail.qty_requested)} <span className="text-sm text-gray-400">{detail.unit}</span>
              </p>
            </div>

            {detail.note && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Catatan</p>
                <p className="text-gray-700">{detail.note}</p>
              </div>
            )}

            {detail.status !== 'PENDING' && (
              <div className={`rounded-lg p-3 ${detail.status === 'APPROVED' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className="text-xs font-medium mb-1">
                  {detail.status === 'APPROVED' ? '✅ Catatan Persetujuan' : '❌ Alasan Penolakan'}
                </p>
                <p className="text-xs text-gray-700">{detail.note_approval || '-'}</p>
                {detail.approver_name && (
                  <p className="text-xs text-gray-500 mt-1">oleh: {detail.approver_name} · {new Date(detail.responded_at).toLocaleString('id-ID')}</p>
                )}
              </div>
            )}

            <div className="text-xs text-gray-400 pt-1">
              Dibuat: {new Date(detail.requested_at).toLocaleString('id-ID')}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}