// frontend/src/pages/inventory/StockOut.jsx
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { ArrowUpCircle, AlertTriangle } from 'lucide-react'
import { fmtQty } from '../../utils/format'

export default function StockOut() {
  const [materials, setMaterials] = useState([])
  const [form, setForm] = useState({ material_id:'', quantity:'', note:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.get('/materials').then(r => setMaterials(r.data.data)) }, [])

  const f = p => e => setForm(prev => ({...prev, [p]: e.target.value}))
  const selected = materials.find(m => m.id == form.material_id)
  const isInsufficient = selected && form.quantity && parseFloat(form.quantity) > parseFloat(selected.current_stock)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.material_id) return toast.error('Pilih material dulu')
    if (isInsufficient)    return toast.error('Stok tidak mencukupi!')
    setSaving(true)
    try {
      await api.post('/stocks/out', form)
      toast.success('Stok keluar berhasil dicatat!')
      setForm({ material_id:'', quantity:'', note:'' })
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <ArrowUpCircle className="text-red-600" size={20}/>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Keluar</h1>
          <p className="text-sm text-gray-500">Catat pengeluaran material</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
            <select className="input-field" required value={form.material_id} onChange={f('material_id')}>
              <option value="">-- Pilih Material --</option>
              {materials.map(m => (
                <option key={m.id} value={m.id} disabled={parseFloat(m.current_stock)===0}>
                  {m.kode_barang} – {m.nama_barang} (Stok: {m.current_stock} {m.unit})
                  {parseFloat(m.current_stock)===0 ? ' [HABIS]' : ''}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2
              ${parseFloat(selected.current_stock)<=parseFloat(selected.min_stock)
                ? 'bg-yellow-50 text-yellow-800' : 'bg-blue-50 text-blue-800'}`}>
              {parseFloat(selected.current_stock)<=parseFloat(selected.min_stock) &&
                <AlertTriangle size={16} className="flex-shrink-0"/>}
              Stok saat ini: <strong>{fmtQty(selected.current_stock)} {selected.unit}</strong>
              {parseFloat(selected.current_stock)<=parseFloat(selected.min_stock) &&
                <span className="font-medium text-yellow-700"> – Stok menipis!</span>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
            <input className="input-field" type="number" min="1" required
              value={form.quantity} onChange={f('quantity')}/>
            {isInsufficient && (
              <p className="text-xs text-red-600 mt-1">
                Stok tidak mencukupi! Tersedia: {fmtQty(selected.current_stock)} {selected.unit}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea className="input-field" rows={2} value={form.note} onChange={f('note')}/>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving||isInsufficient} className="btn-danger">
              {saving ? 'Menyimpan...' : 'Catat Stok Keluar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}