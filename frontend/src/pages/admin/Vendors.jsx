// frontend/src/pages/admin/Vendors.jsx
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'

const EMPTY = {
  name:'', contact_person:'', phone:'',
  email:'', address:'', lead_time_days:'0'
}

export default function Vendors() {
  const [vendors,  setVendors]  = useState([])
  const [modal,    setModal]    = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [loading,  setLoading]  = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/vendors')
      setVendors(data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const f = p => e => setForm(prev => ({...prev, [p]: e.target.value}))
  const openCreate = () => { setEditItem(null); setForm(EMPTY); setModal(true) }
  const openEdit   = v  => { setEditItem(v); setForm({...v}); setModal(true) }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        await api.put(`/vendors/${editItem.id}`, form)
        toast.success('Vendor diupdate')
      } else {
        await api.post('/vendors', form)
        toast.success('Vendor ditambahkan')
      }
      setModal(false); load()
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!confirm('Hapus vendor ini?')) return
    await api.delete(`/vendors/${id}`)
    toast.success('Vendor dihapus'); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Vendor</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola daftar vendor / supplier bahan baku</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16}/> Tambah Vendor
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading
            ? <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"/>
              </div>
            : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3 font-medium">Nama Vendor</th>
                  <th className="text-left px-4 py-3 font-medium">Contact Person</th>
                  <th className="text-left px-4 py-3 font-medium">Telepon</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-center px-4 py-3 font-medium">Lead Time</th>
                  <th className="text-center px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vendors.length === 0
                  ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                      <Building2 size={40} className="mx-auto mb-2 opacity-30"/>
                      Belum ada vendor
                    </td></tr>
                  : vendors.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{v.name}</td>
                      <td className="px-4 py-3 text-gray-600">{v.contact_person||'-'}</td>
                      <td className="px-4 py-3 text-gray-600">{v.phone||'-'}</td>
                      <td className="px-4 py-3 text-gray-600">{v.email||'-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="badge-pending">{v.lead_time_days} hari</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(v)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Pencil size={14}/>
                          </button>
                          <button onClick={() => handleDelete(v.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editItem ? 'Edit Vendor' : 'Tambah Vendor'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Vendor *
            </label>
            <input className="input-field" required value={form.name} onChange={f('name')}
              placeholder="PT. Lautan Jaya Dentalindo"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input className="input-field" value={form.contact_person}
                onChange={f('contact_person')} placeholder="Nama PIC"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Telepon
              </label>
              <input className="input-field" value={form.phone}
                onChange={f('phone')} placeholder="021-xxxxxxxx"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className="input-field" type="email" value={form.email}
                onChange={f('email')} placeholder="vendor@email.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Time (hari)
              </label>
              <input className="input-field" type="number" min="0"
                value={form.lead_time_days} onChange={f('lead_time_days')}/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea className="input-field" rows={2} value={form.address}
              onChange={f('address')} placeholder="Alamat lengkap vendor"/>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="btn-secondary">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}