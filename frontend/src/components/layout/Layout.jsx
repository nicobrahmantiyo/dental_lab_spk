// frontend/src/components/layout/Layout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 print:h-auto print:block">
      <div className="no-print contents">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden md:ml-64 print:ml-0 print:overflow-visible">
        <div className="no-print">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto p-6 print-area print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
