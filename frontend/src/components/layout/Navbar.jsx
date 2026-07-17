// frontend/src/components/layout/Navbar.jsx
import { useState, useEffect } from "react";
import { Menu, Bell, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);

  const fetchUnread = async () => {
    try {
      const { data } = await api.get("/notifications/unread-count");
      setUnread(data.count);
    } catch {}
  };

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifs(data.data);
    } catch {}
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const openNotif = () => {
    if (!showNotif) fetchNotifs();
    setShowNotif((v) => !v);
    setShowUser(false);
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/mark-all-read");
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnread(0);
      toast.success("Semua notifikasi dibaca");
    } catch {}
  };

  const notifBg = {
    LOW_STOCK: "bg-yellow-50 border-l-4 border-yellow-400",
    WARNING: "bg-red-50 border-l-4 border-red-400",
    REQUEST: "bg-blue-50 border-l-4 border-blue-400",
    INFO: "bg-gray-50",
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      {/* Notifikasi */}
      <div className="relative">
        <button
          onClick={openNotif}
          className="relative p-2 rounded-lg hover:bg-gray-100"
        >
          <Bell size={20} className="text-gray-600" />
          {unread > 0 && (
            <span
              className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white
                             text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {showNotif && (
          <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-sm">Notifikasi</p>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifs.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  Tidak ada notifikasi
                </p>
              ) : (
                notifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50
                      ${
                        !n.is_read
                          ? notifBg[n.type] || "bg-blue-50"
                          : "bg-white opacity-60"
                      }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                      <div className={!n.is_read ? "" : "pl-4"}>
                        <p className="text-xs font-semibold text-gray-800">
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {new Date(n.created_at).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => {
            setShowUser((v) => !v);
            setShowNotif(false);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.full_name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-tight">
              {user?.full_name}
            </p>
            <p className="text-xs text-gray-400">{user?.role_label}</p>
          </div>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {showUser && (
          <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-2">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} /> Keluar
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
