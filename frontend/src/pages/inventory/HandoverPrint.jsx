// frontend/src/pages/inventory/HandoverPrint.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Printer, ArrowLeft } from "lucide-react";
import { fmtQty } from "../../utils/format";

export default function HandoverPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/stocks/handover/${id}`)
      .then((r) => setDoc(r.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );

  if (!doc)
    return (
      <p className="text-center text-gray-400 py-20">Dokumen tidak ditemukan</p>
    );

  return (
    <div>
      {/* Toolbar (hilang saat print) */}
      <div className="no-print mb-4 flex items-center justify-between">
        <button onClick={() => navigate("/handover")} className="btn-secondary">
          <ArrowLeft size={16} /> Kembali
        </button>
        <button onClick={() => window.print()} className="btn-primary">
          <Printer size={16} /> Cetak Dokumen
        </button>
      </div>

      {/* Kertas dokumen */}
      <div className="bg-white max-w-3xl mx-auto p-10 border border-gray-200 rounded-lg print:border-0 print:rounded-none print:shadow-none print:max-w-none print:p-8 print:mx-0">
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            <h1 className="text-lg font-bold tracking-wide">
              SURAT SERAH TERIMA BARANG
            </h1>
            <p className="text-xs text-gray-500">
              Dental Lab Inventory Management System
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="font-semibold text-gray-800">No: {doc.doc_number}</p>
            <p>
              {new Date(doc.doc_date).toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Dari:</p>
            <p className="font-semibold text-gray-900">{doc.from_location}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Kepada:</p>
            <p className="font-semibold text-gray-900">{doc.to_location}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6 border-collapse">
          <thead>
            <tr className="bg-gray-100 text-xs uppercase text-gray-600">
              <th className="text-left px-3 py-2 border border-gray-200 w-8">
                #
              </th>
              <th className="text-left px-3 py-2 border border-gray-200">
                Kode
              </th>
              <th className="text-left px-3 py-2 border border-gray-200">
                Nama Barang
              </th>
              <th className="text-left px-3 py-2 border border-gray-200">
                Pasien / Dokter
              </th>
              <th className="text-right px-3 py-2 border border-gray-200">
                Qty
              </th>
              <th className="text-left px-3 py-2 border border-gray-200">
                Satuan
              </th>
            </tr>
          </thead>
          <tbody>
            {doc.items.map((it, idx) => (
              <tr key={it.transaction_id}>
                <td className="px-3 py-2 border border-gray-200 text-xs">
                  {idx + 1}
                </td>
                <td className="px-3 py-2 border border-gray-200 text-xs">
                  {it.kode_barang}
                </td>
                <td className="px-3 py-2 border border-gray-200 text-xs">
                  {it.nama_barang}
                </td>
                <td className="px-3 py-2 border border-gray-200 text-xs">
                  {it.patient_name || "-"}
                  {it.doctor_name ? ` / drg. ${it.doctor_name}` : ""}
                </td>
                <td className="px-3 py-2 border border-gray-200 text-xs text-right">
                  {fmtQty(it.quantity)}
                </td>
                <td className="px-3 py-2 border border-gray-200 text-xs">
                  {it.unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {doc.notes && (
          <div className="mb-8 text-sm">
            <p className="text-xs text-gray-500 mb-1">Keterangan:</p>
            <p className="text-gray-800">{doc.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-6 text-center text-sm mt-16">
          <div>
            <p className="text-xs text-gray-500 mb-16">Dibuat oleh,</p>
            <p className="border-t border-gray-400 pt-1 font-medium">
              {doc.created_by_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-16">Disetujui oleh,</p>
            <p className="border-t border-gray-400 pt-1 font-medium text-gray-400">
              (...........................)
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-16">Diterima oleh,</p>
            <p className="border-t border-gray-400 pt-1 font-medium">
              {doc.received_by_name || "(...........................)"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
