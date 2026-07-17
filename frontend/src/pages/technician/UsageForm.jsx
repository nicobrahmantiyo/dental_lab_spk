// frontend/src/pages/technician/UsageForm.jsx
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { PlusCircle } from 'lucide-react'
import { fmtQty } from '../../utils/format'

export default function UsageForm() {
  const [materials, setMaterials] = useState([])
  const [form, setForm] = useState({
    material_id:'', sub_uniq_id:'', patient_name:'', doctor_name:'',
    qty_of_usage:'1', qty_of_return:'0', item_received:false,
    notes:'', month_of_usage:'', usage_date: new Date().toISOString().split('T')[0],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.get('/materials').then(r => setMaterials(r.data.data)) }, [])

  const f = p => e => setForm(prev => ({...prev, [p]: e.target.value}))
  const selected = materials.find(m => m.id == form.material_id)

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.material_id) return toast.error('Pilih material dulu')
    setSaving(true)
    try {
      await api.post('/usage', form)
      toast.success('Pemakaian berhasil dicatat!')
      setForm({
        material_id:'', sub_uniq_id:'', patient_name:'', doctor_name:'',
        qty_of_usage:'1', qty_of_return:'0', item_received:false,
        notes:'', month_of_usage:'', usage_date: new Date().toISOString().split('T')[0],
      })
    } finally { setSaving(false) }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <PlusCircle className="text-blue-600" size={20}/>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Input Pemakaian</h1>
          <p className="text-sm text-gray-500">Catat pemakaian material per pasien</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Material */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
            <select className="input-field" required value={form.material_id} onChange={f('material_id')}>
              <option value="">-- Pilih Material --</option>
              {materials.map(m => (
                <option key={m.id} value={m.id} disabled={parseFloat(m.current_stock)===0}>
                  {m.kode_barang} – {m.nama_barang} (Stok: {m.current_stock} {m.unit})
                </option>
              ))}
            </select>
            {selected && (
              <p className={`text-xs mt-1 ${parseFloat(selected.current_stock)<=parseFloat(selected.min_stock)?'text-yellow-600':'text-green-600'}`}>
                Stok tersedia: {fmtQty(selected.current_stock)} {selected.unit}
              </p>
            )}
          </div>

          {/* Tanggal & Bulan */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pemakaian *</label>
              <input className="input-field" type="date" required value={form.usage_date} onChange={f('usage_date')}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month of Usage</label>
              <input className="input-field" value={form.month_of_usage} onChange={f('month_of_usage')} placeholder="Dec-2024"/>
            </div>
          </div>

          {/* Sub Uniq Id */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sub Uniq Id</label>
            <input className="input-field" value={form.sub_uniq_id} onChange={f('sub_uniq_id')} placeholder="Contoh: ZQPUT4V4-017233"/>
          </div>

          {/* Pasien & Dokter */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pasien</label>
              <input className="input-field" value={form.patient_name} onChange={f('patient_name')}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Dokter</label>
              <input className="input-field" value={form.doctor_name} onChange={f('doctor_name')}/>
            </div>
          </div>

          {/* Qty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty Pemakaian *</label>
              <input className="input-field" type="number" min="1" required value={form.qty_of_usage} onChange={f('qty_of_usage')}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty Return</label>
              <input className="input-field" type="number" min="0" value={form.qty_of_return} onChange={f('qty_of_return')}/>
            </div>
          </div>

          {/* Item Received */}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="item_received" checked={form.item_received}
              onChange={e => setForm(prev => ({...prev, item_received: e.target.checked}))}
              className="w-4 h-4 text-blue-600 rounded"/>
            <label htmlFor="item_received" className="text-sm text-gray-700">Item Received?</label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className="input-field" rows={2} value={form.notes} onChange={f('notes')}/>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary px-6">
              {saving ? 'Menyimpan...' : 'Catat Pemakaian'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}