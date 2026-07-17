// frontend/src/pages/inventory/Materials.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'
import { fmtQty } from '../../utils/format'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'

const EMPTY = {
  category_id:'', brand_id:'', kode_barang:'', nama_barang:'',
  unit:'pcs', min_stock:'1', price_per_unit:'0',
}

export default function Materials() {
  const { isRole } = useAuth()
  const [materials,  setMaterials]  = useState([])
  const [categories, setCategories] = useState([])
  const [brands,     setBrands]     = useState([])
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('')
  const [loading,    setLoading]    = useState(true)
  const [modal,      setModal]      = useState(false)
  const [editItem,   setEditItem]   = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search)    params.search      = search
      if (catFilter) params.category_id = catFilter
      const { data } = await api.get('/materials', { params })
      setMaterials(data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    api.get('/materials/categories').then(r => setCategories(r.data.data))
    api.get('/materials/brands').then(r => setBrands(r.data.data))
  }, [])

  useEffect(() => { load() }, [search, catFilter])

  const f = p => e => setForm(prev => ({...prev, [p]: e.target.value}))
  const openCreate = () => { setEditItem(null); setForm(EMPTY); setModal(true) }
  const openEdit   = m  => { setEditItem(m); setForm({...m}); setModal(true) }

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editItem) {
        await api.put(`/materials/${editItem.id}`, form)
        toast.success('Material diupdate')
      } else {
        await api.post('/materials', form)
        toast.success('Material ditambahkan')
      }
      setModal(false)
      load()
    } finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!confirm('Hapus material ini?')) return
    await api.delete(`/materials/${id}`)
    toast.success('Material dihapus')
    load()
  }

  const canEdit = isRole('admin')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Material</h1>
          <p className="text-sm text-gray-500 mt-1">Master bahan baku dental lab</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16}/> Tambah Material
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card mb-4 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
          <input className="input-field pl-9" placeholder="Cari nama atau kode barang..."
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="input-field sm:w-52" value={catFilter}
          onChange={e => setCatFilter(e.target.value)}>
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Tabel */}
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
                  <th className="text-left px-4 py-3 font-medium">Kode</th>
                  <th className="text-left px-4 py-3 font-medium">Nama Barang</th>
                  <th className="text-left px-4 py-3 font-medium">Brand</th>
                  <th className="text-left px-4 py-3 font-medium">Kategori</th>
                  <th className="text-right px-4 py-3 font-medium">Stok</th>
                  <th className="text-right px-4 py-3 font-medium">Min Stok</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  {canEdit && <th className="text-center px-4 py-3 font-medium">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {materials.length === 0
                  ? <tr><td colSpan={canEdit?8:7} className="text-center py-12 text-gray-400">
                      <Package size={40} className="mx-auto mb-2 opacity-30"/>
                      Tidak ada material ditemukan
                    </td></tr>
                  : materials.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{m.kode_barang}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-xs">
                        <p className="truncate">{m.nama_barang}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.brand_name||'-'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.category_name||'-'}</td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span className={parseFloat(fmtQty(m.current_stock))<=parseFloat(fmtQty(m.min_stock))?'text-red-600':'text-gray-900'}>
                          {fmtQty(m.current_stock)}
                        </span>
                        <span className="text-gray-400 text-xs ml-1">{m.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">{fmtQty(m.min_stock)}</td>
                      <td className="px-4 py-3 text-center">
                        {parseFloat(fmtQty(m.current_stock))===0
                          ? <span className="badge-out">Habis</span>
                          : m.is_low_stock
                          ? <span className="badge-low">Menipis</span>
                          : <span className="badge-ok">Normal</span>
                        }
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEdit(m)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Pencil size={14}/>
                            </button>
                            <button onClick={() => handleDelete(m.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Form */}
      <Modal open={modal} onClose={() => setModal(false)}
        title={editItem ? 'Edit Material' : 'Tambah Material'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kode Barang *</label>
              <input className="input-field" required value={form.kode_barang}
                disabled={!!editItem} onChange={f('kode_barang')} placeholder="RMT-001"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Satuan *</label>
              <input className="input-field" required value={form.unit} onChange={f('unit')} placeholder="pcs"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang *</label>
            <input className="input-field" required value={form.nama_barang} onChange={f('nama_barang')}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
              <select className="input-field" value={form.brand_id} onChange={f('brand_id')}>
                <option value="">-- Pilih Brand --</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select className="input-field" value={form.category_id} onChange={f('category_id')}>
                <option value="">-- Pilih Kategori --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stok Minimum</label>
              <input className="input-field" type="number" min="0" value={form.min_stock} onChange={f('min_stock')}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga/Unit (Rp)</label>
              <input className="input-field" type="number" min="0" value={form.price_per_unit} onChange={f('price_per_unit')}/>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Menyimpan...' : editItem ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}