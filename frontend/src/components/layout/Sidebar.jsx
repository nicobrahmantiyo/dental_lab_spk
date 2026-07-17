// frontend/src/components/layout/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  Users,
  BarChart3,
  History,
  FlaskConical,
  PlusCircle,
  Building2,
  DollarSign,
  ShoppingCart,
  ClipboardCheck,
  FileText,
} from "lucide-react";

const navItems = [
  // Semua role bisa akses
  {
    to: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    roles: ["admin", "technician", "manager"],
  },
  {
    to: "/materials",
    icon: Package,
    label: "Data Material",
    roles: ["admin", "technician", "manager"],
  },
  {
    to: "/stocks/report",
    icon: ClipboardList,
    label: "Laporan Stok",
    roles: ["admin", "technician", "manager"],
  },
  {
    to: "/usage",
    icon: FlaskConical,
    label: "Riwayat Pemakaian",
    roles: ["admin", "technician", "manager"],
  },

  // Admin Inventori saja
  {
    to: "/stocks/in",
    icon: ArrowDownCircle,
    label: "Stok Masuk",
    roles: ["admin"],
  },
  {
    to: "/stocks/out",
    icon: ArrowUpCircle,
    label: "Stok Keluar",
    roles: ["admin"],
  },
  {
    to: "/handover",
    icon: FileText,
    label: "Surat Serah Terima",
    roles: ["admin"],
  },
  { to: "/users", icon: Users, label: "Kelola User", roles: ["admin"] },
  { to: "/vendors", icon: Building2, label: "Data Vendor", roles: ["manager"] },
  {
    to: "/vendor-prices",
    icon: DollarSign,
    label: "Harga Vendor",
    roles: ["manager"],
  },
  {
    to: "/purchase-requests",
    icon: ShoppingCart,
    label: "Pengajuan Pembelian",
    roles: ["admin"],
  },
  //Teknisi saja
  {
    to: "/usage/new",
    icon: PlusCircle,
    label: "Input Pemakaian",
    roles: ["technician"],
  },

  // Admin & Manager
  {
    to: "/topsis",
    icon: BarChart3,
    label: "Analisis TOPSIS",
    roles: ["manager"],
  },
  {
    to: "/topsis/history",
    icon: History,
    label: "Riwayat TOPSIS",
    roles: ["admin", "manager"],
  },
  {
    to: "/purchase-approvals",
    icon: ClipboardCheck,
    label: "Persetujuan Pembelian",
    roles: ["manager"],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  const visible = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
        fixed top-0 left-0 h-full w-64 bg-blue-900 z-30 flex flex-col
        transform transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-blue-700">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">DL</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm">Dental Lab Inventory</p>
            <p className="text-blue-300 text-xs">
              Sistem Pengelolaan Stok Material
            </p>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-3 border-b border-blue-700">
          <p className="text-white text-sm font-medium truncate">
            {user?.full_name}
          </p>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${
              user?.role === "admin"
                ? "bg-blue-500 text-white"
                : user?.role === "technician"
                ? "bg-green-500 text-white"
                : user?.role === "manager"
                ? "bg-orange-500 text-white"
                : "bg-gray-500 text-white"
            }`}
          >
            {user?.role_label}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                 ${
                   isActive
                     ? "bg-blue-600 text-white font-medium"
                     : "text-blue-100 hover:bg-blue-700/60 hover:text-white"
                 }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-3 text-xs text-blue-400 border-t border-blue-700">
          v1.0.0 · Dental Lab SPK
        </div>
      </aside>
    </>
  );
}
