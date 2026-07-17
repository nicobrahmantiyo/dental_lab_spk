// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import api from "../api/axios";
import {
  Package,
  AlertTriangle,
  TrendingDown,
  CheckCircle,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { fmtQty } from "../utils/format";

export default function Dashboard() {
  const { user, isRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [topMats, setTopMats] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/materials/stats"),
      api.get("/materials?low_stock=true"),
      api.get("/stocks/transactions?limit=5"),
      api.get("/usage/top-materials?limit=10"),
      api.get("/usage/monthly-trend"),
    ])
      .then(([s, l, t, top, tr]) => {
        setStats(s.data.data);
        setLowStock(l.data.data.slice(0, 5));
        setRecentTx(t.data.data);
        setTopMats(
          top.data.data.map((m) => ({
            ...m,
            // Potong nama agar tidak terlalu panjang di grafik
            short_name: m.kode_barang,
            full_name: m.nama_barang,
            total_usage: fmtQty(m.total_usage),
          }))
        );
        setTrend(
          tr.data.data.map((d) => ({
            ...d,
            total_usage: fmtQty(d.total_usage),
            net_usage: fmtQty(d.net_usage),
          }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );

  const cards = [
    {
      label: "Total Material",
      value: stats?.total,
      icon: Package,
      bg: "bg-blue-50",
      ic: "text-blue-500",
    },
    {
      label: "Stok Menipis",
      value: stats?.low_stock,
      icon: AlertTriangle,
      bg: "bg-yellow-50",
      ic: "text-yellow-500",
    },
    {
      label: "Stok Habis",
      value: stats?.out_stock,
      icon: TrendingDown,
      bg: "bg-red-50",
      ic: "text-red-500",
    },
    {
      label: "Stok Normal",
      value:
        (stats?.total || 0) - (stats?.low_stock || 0) - (stats?.out_stock || 0),
      icon: CheckCircle,
      bg: "bg-green-50",
      ic: "text-green-500",
    },
  ];

  // Tooltip custom untuk bar chart
  const CustomBarTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs">
        <p className="font-semibold text-gray-800 mb-1">{d.full_name}</p>
        <p className="text-gray-500">{d.kode_barang}</p>
        <p className="text-blue-600 font-bold mt-1">
          Total pakai: {d.total_usage} {d.unit}
        </p>
        <p className="text-gray-500">Transaksi: {d.total_transaksi}x</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Selamat datang, {user?.full_name} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {user?.role_label} · Dental Lab Inventory
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card flex items-center gap-4">
            <div
              className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
            >
              <c.icon className={c.ic} size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {c.value ?? "-"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── GRAFIK 1: Top 10 Material Terbanyak Dipakai ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Top 10 Material Terbanyak Dipakai
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Berdasarkan total qty pemakaian semua waktu
            </p>
          </div>
          <Link
            to="/usage"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            Lihat semua <ArrowRight size={12} />
          </Link>
        </div>
        {topMats.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            Belum ada data pemakaian
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={topMats}
              margin={{ top: 5, right: 20, left: 10, bottom: 60 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                vertical={false}
              />
              <XAxis
                dataKey="short_name"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v) => fmtQty(v)}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar
                dataKey="total_usage"
                name="Total Pemakaian"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── GRAFIK 2: Tren Pemakaian per Bulan ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">
              Tren Pemakaian Material per Bulan
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              12 bulan terakhir · Total pemakaian vs net pemakaian (setelah
              return)
            </p>
          </div>
        </div>
        {trend.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">
            Belum ada data tren
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={trend}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month_label"
                tick={{ fontSize: 10, fill: "#6b7280" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickFormatter={(v) => fmtQty(v)}
              />
              <Tooltip
                formatter={(val, name) => [
                  fmtQty(val),
                  name === "total_usage" ? "Total Pemakaian" : "Net Pemakaian",
                ]}
              />
              <Legend
                formatter={(val) =>
                  val === "total_usage" ? "Total Pemakaian" : "Net Pemakaian"
                }
              />
              <Line
                type="monotone"
                dataKey="total_usage"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="net_usage"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 4, fill: "#10b981" }}
                activeDot={{ r: 6 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Baris bawah: Stok kritis + Transaksi terbaru ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Stok menipis */}
        {lowStock.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-500" />
                Material Stok Kritis
              </h2>
              <Link
                to="/stocks/report"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Lihat semua <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {lowStock.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {m.nama_barang}
                    </p>
                    <p className="text-xs text-gray-500">
                      {m.kode_barang} · {m.brand_name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-bold
                      ${
                        parseFloat(m.current_stock) === 0
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {fmtQty(m.current_stock)} {m.unit}
                    </p>
                    <p className="text-xs text-gray-400">
                      min: {fmtQty(m.min_stock)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaksi terbaru */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Transaksi Stok Terbaru
            </h2>
            <Link
              to="/stocks/report"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentTx.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Belum ada transaksi
              </p>
            ) : (
              recentTx.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${
                      t.transaction_type === "IN"
                        ? "bg-green-100"
                        : "bg-red-100"
                    }`}
                  >
                    {t.transaction_type === "IN" ? (
                      <ArrowDownCircle size={16} className="text-green-600" />
                    ) : (
                      <ArrowUpCircle size={16} className="text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {t.nama_barang}
                    </p>
                    <p className="text-xs text-gray-500">{t.kode_barang}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-bold
                      ${
                        t.transaction_type === "IN"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {t.transaction_type === "IN" ? "+" : "-"}
                      {fmtQty(t.quantity)}
                    </p>
                    <p className="text-xs text-gray-400">{t.unit}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Akses Cepat</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/materials" className="btn-secondary text-sm">
            📦 Data Material
          </Link>
          {isRole("admin", "technician") && (
            <Link to="/usage/new" className="btn-secondary text-sm">
              ➕ Input Pemakaian
            </Link>
          )}
          {isRole("admin") && (
            <>
              <Link to="/stocks/in" className="btn-secondary text-sm">
                ⬇️ Stok Masuk
              </Link>
              <Link to="/stocks/out" className="btn-secondary text-sm">
                ⬆️ Stok Keluar
              </Link>
            </>
          )}
          {isRole("admin", "manager") && (
            <Link to="/topsis" className="btn-secondary text-sm">
              📊 Analisis TOPSIS
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
