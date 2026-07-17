// frontend/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.username, form.password);
      toast.success("Login berhasil!");
      navigate("/dashboard");
    } catch {}
  };

  const f = (p) => (e) => setForm((prev) => ({ ...prev, [p]: e.target.value }));

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1e40af 70%, #1d4ed8 100%)",
      }}
    >
      {/* ── Kiri: Form Login ── */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Logo kecil di atas form */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">DL</span>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                Dental Lab Inventory
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Login</h1>
            <p className="text-gray-500 mt-1 text-sm">Welcome Back! 👋</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">
                  👤
                </span>
                <input
                  type="text"
                  required
                  className="input-field pl-9"
                  placeholder="Masukkan username"
                  value={form.username}
                  onChange={f("username")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">
                  🔒
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  className="input-field pl-9 pr-10"
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={f("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white
                         font-semibold rounded-lg transition-colors mt-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Info akun demo */}
          <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-3">
              Akun Login:
            </p>
            <div className="space-y-2">
              {[
                {
                  username: "admin1",
                  password: "Admin@123",
                  role: "Admin Inventori",
                  color: "bg-blue-100 text-blue-800",
                },
                {
                  username: "teknisi1",
                  password: "Tek@123",
                  role: "Teknisi",
                  color: "bg-green-100 text-green-800",
                },
                {
                  username: "manager1",
                  password: "Man@123",
                  role: "Manager",
                  color: "bg-orange-100 text-orange-800",
                },
              ].map((a) => (
                <button
                  key={a.username}
                  type="button"
                  onClick={() =>
                    setForm({ username: a.username, password: a.password })
                  }
                  className="w-full flex items-center justify-between bg-white border
                             border-gray-200 rounded-lg px-3 py-2 hover:border-blue-400
                             transition-colors text-left"
                >
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      {a.username}
                    </p>
                    <p className="text-xs text-gray-400">{a.password}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.color}`}
                  >
                    {a.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Kanan: Panel dengan Logo Rata ── */}
      <div
        className="hidden md:flex w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1e40af 70%, #1d4ed8 100%)",
        }}
      >
        {/* Lingkaran dekoratif background */}
        <div
          className="absolute top-[-80px] right-[-80px] w-80 h-80 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #60a5fa, transparent)",
          }}
        />
        <div
          className="absolute bottom-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #93c5fd, transparent)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-40 h-40 rounded-full opacity-5"
          style={{
            background: "radial-gradient(circle, #bfdbfe, transparent)",
          }}
        />

        {/* Konten tengah */}
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          {/* Card putih berisi logo Rata */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 mb-8 w-72">
            {/* Logo Rata — SVG inline */}
            <svg
              viewBox="0 0 200 100"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full"
            >
              {/* Huruf R */}
              <text
                x="10"
                y="75"
                fontFamily="Georgia, serif"
                fontSize="80"
                fontWeight="bold"
                fill="#b91c1c"
              >
                Rata
              </text>
              {/* Garis senyum melengkung di bawah */}
              <path
                d="M 8 88 Q 100 115 192 88"
                stroke="#b91c1c"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Teks di bawah card */}
          <h2 className="text-white text-2xl font-bold mb-3">
            SISTEM PENGELOLAAN STOK MATERIAL
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            Platform Manajemen Bahan Baku Dental Laboratorium
          </p>

          {/* Badge fitur */}
        </div>

        {/* Titik-titik dekoratif */}
        <div className="absolute bottom-8 right-8 grid grid-cols-4 gap-2 opacity-20">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 bg-white rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
