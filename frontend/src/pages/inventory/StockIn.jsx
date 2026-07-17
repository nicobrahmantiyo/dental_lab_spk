// frontend/src/pages/inventory/StockIn.jsx
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { ArrowDownCircle } from 'lucide-react'
import { fmtQty } from '../../utils/format'

export default function StockIn() {
  const [materials, setMaterials] = useState([])
  const [form, setForm] = useState({ material_id:'', quantity:'', price_per_unit:'', batch_number:'', note:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.get('/materials').then(r => setMaterials(r.data.data)) }, [])

  const f = p => e => setForm(prev => ({...prev, [p]: e.target.value}))
  const selected = materials.find(m => m.id == form.material_id)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.material_id) return toast.error('Pilih material dulu')
    setSaving(true)
    try {
      await api.post('/stocks/in', form)
      toast.success('Stok masuk berhasil dicatat!')
      setForm({ material_id:'', quantity:'', price_per_unit:'', batch_number:'', note:'' })
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <ArrowDownCircle className="text-green-600" size={20}/>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stok Masuk</h1>
          <p className="text-sm text-gray-500">Catat penerimaan material baru</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
            <select className="input-field" required value={form.material_id} onChange={f('material_id')}>
              <option value="">-- Pilih Material --</option>
              {materials.map(m => (
                <option key={m.id} value={m.id}>
                  {m.kode_barang} – {m.nama_barang} (Stok: {m.current_stock} {m.unit})
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              Stok saat ini: <strong>{fmtQty(selected.current_stock)} {selected.unit}</strong>
&nbsp;·&nbsp; Min stok: <strong>{fmtQty(selected.min_stock)} {selected.unit}</strong>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah *</label>
              <input className="input-field" type="number" min="1" required
                value={form.quantity} onChange={f('quantity')}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga/Unit (Rp)</label>
              <input className="input-field" type="number" min="0"
                value={form.price_per_unit} onChange={f('price_per_unit')}/>
            </div>
          </div>

          {form.quantity && form.price_per_unit && (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800">
              Total: <strong>Rp {(Number(form.quantity)*Number(form.price_per_unit)).toLocaleString('id-ID')}</strong>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
            <input className="input-field" value={form.batch_number} onChange={f('batch_number')} placeholder="Opsional"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea className="input-field" rows={2} value={form.note} onChange={f('note')} placeholder="Opsional"/>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary px-6">
              {saving ? 'Menyimpan...' : 'Catat Stok Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}