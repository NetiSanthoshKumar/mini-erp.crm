import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import CustomerDetail from "./pages/CustomerDetail";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Challans from "./pages/Challans";
import ChallanCreate from "./pages/ChallanCreate";
import ChallanDetail from "./pages/ChallanDetail";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />

        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />

        <Route path="/challans" element={<ProtectedRoute><Challans /></ProtectedRoute>} />
        <Route path="/challans/new" element={<ProtectedRoute><ChallanCreate /></ProtectedRoute>} />
        <Route path="/challans/:id" element={<ProtectedRoute><ChallanDetail /></ProtectedRoute>} />

        <Route path="*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}
