// frontend/src/pages/admin/Users.jsx
import { useState, useEffect } from 'react'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { Plus, Pencil, UserX } from 'lucide-react'

const EMPTY = { role_id:'', username:'', full_name:'', email:'', password:'', is_active:1 }
const ROLES  = [
  { id:1, label:'Admin Inventori' },
  { id:2, label:'Teknisi' },
  { id:3, label:'Manager' },
]

export default function Users() {
  const [users,    setUsers]    = useState([])
  const [modal,    setModal]    = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)

  const load = async () => {
    const { data } = await api.get('/users')
    setUsers(data.data)
  }

  useEffect(() => { load() }, [])

  const f = p => e => setForm(prev => ({...prev, [p]: e.target.value}))
  const openCreate = () => { setEditItem(null); setForm(EMPTY); setModal(true) }
  const openEdit   = u  => { setEditItem(u); setForm({...u, password:''}); setModal(true) }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        const { password, ...rest } = form
        await api.put(`/users/${editItem.id}`, rest)
        toast.success('User diupdate')
      } else {
        await api.post('/users', form)
        toast.success('User dibuat')
      }
      setModal(false); load()
    } finally { setSaving(false) }
  }

  const handleDeactivate = async id => {
    if (!confirm('Nonaktifkan user ini?')) return
    await api.delete(`/users/${id}`)
    toast.success('User dinonaktifkan'); load()
  }

  const roleColor = {
    admin:       'bg-blue-100 text-blue-700',
    technician:  'bg-green-100 text-green-700',
    manager:     'bg-orange-100 text-orange-700',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola User</h1>
          <p className="text-sm text-gray-500 mt-1">Manajemen akun pengguna sistem</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16}/> Tambah User
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs text-gray-500 uppercase">
                {['Nama','Username','Email','Role','Status','Login Terakhir','Aksi'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.full_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{u.username}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${roleColor[u.role]||'bg-gray-100 text-gray-600'}`}>
                      {u.role_label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? <span className="badge-ok">Aktif</span> : <span className="badge-out">Nonaktif</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={14}/></button>
                      {u.is_active && <button onClick={() => handleDeactivate(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><UserX size={14}/></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editItem?'Edit User':'Tambah User'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
            <input className="input-field" required value={form.full_name} onChange={f('full_name')}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
              <input className="input-field" required value={form.username} disabled={!!editItem} onChange={f('username')}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select className="input-field" required value={form.role_id} onChange={f('role_id')}>
                <option value="">-- Pilih Role --</option>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input className="input-field" type="email" required value={form.email} onChange={f('email')}/>
          </div>
          {!editItem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input className="input-field" type="password" required minLength={6} value={form.password} onChange={f('password')}/>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Menyimpan...' : editItem ? 'Simpan' : 'Buat User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}