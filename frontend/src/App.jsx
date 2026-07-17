// frontend/src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Materials from "./pages/inventory/Materials";
import StockIn from "./pages/inventory/StockIn";
import StockOut from "./pages/inventory/StockOut";
import StockReport from "./pages/inventory/StockReport";
import PurchaseRequest from "./pages/inventory/PurchaseRequest";
import HandoverList from "./pages/inventory/HandoverList";
import HandoverPrint from "./pages/inventory/HandoverPrint";
import UsageForm from "./pages/technician/UsageForm";
import UsageList from "./pages/technician/UsageList";
import TopsisAnalysis from "./pages/manager/TopsisAnalysis";
import TopsisHistory from "./pages/manager/TopsisHistory";
import PurchaseApproval from "./pages/manager/PurchaseApproval";
import Users from "./pages/admin/Users";
import Vendors from "./pages/admin/Vendors";
import VendorPrices from "./pages/admin/VendorPrices";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Semua role */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="materials" element={<Materials />} />
          <Route path="stocks/report" element={<StockReport />} />
          <Route path="usage" element={<UsageList />} />

          {/*Teknisi */}
          <Route
            path="usage/new"
            element={
              <ProtectedRoute roles={["technician"]}>
                <UsageForm />
              </ProtectedRoute>
            }
          />

          {/* Admin Inventori saja */}
          <Route
            path="stocks/in"
            element={
              <ProtectedRoute roles={["admin"]}>
                <StockIn />
              </ProtectedRoute>
            }
          />
          <Route
            path="stocks/out"
            element={
              <ProtectedRoute roles={["admin"]}>
                <StockOut />
              </ProtectedRoute>
            }
          />
          <Route
            path="handover"
            element={
              <ProtectedRoute roles={["admin"]}>
                <HandoverList />
              </ProtectedRoute>
            }
          />
          <Route
            path="handover/:id"
            element={
              <ProtectedRoute roles={["admin"]}>
                <HandoverPrint />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute roles={["admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          {/* Tambahkan setelah route users */}
          <Route
            path="vendors"
            element={
              <ProtectedRoute roles={["manager"]}>
                <Vendors />
              </ProtectedRoute>
            }
          />
          <Route
            path="vendor-prices"
            element={
              <ProtectedRoute roles={["manager"]}>
                <VendorPrices />
              </ProtectedRoute>
            }
          />
          {/* Pengajuan pembelian — admin inventori saja */}
          <Route
            path="purchase-requests"
            element={
              <ProtectedRoute roles={["admin"]}>
                <PurchaseRequest />
              </ProtectedRoute>
            }
          />
          {/* Admin & Manager */}
          <Route
            path="topsis"
            element={
              <ProtectedRoute roles={["manager"]}>
                <TopsisAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="topsis/history"
            element={
              <ProtectedRoute roles={["admin", "manager"]}>
                <TopsisHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="purchase-approvals"
            element={
              <ProtectedRoute roles={["manager"]}>
                <PurchaseApproval />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
