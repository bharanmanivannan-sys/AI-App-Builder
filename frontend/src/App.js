import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { Spinner } from "./components/ui";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Competitors from "./pages/Competitors";
import Compare from "./pages/Compare";
import Insights from "./pages/Insights";
import Swot from "./pages/Swot";
import Settings from "./pages/Settings";

function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <DataProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto"><Outlet /></main>
        </div>
      </div>
    </DataProvider>
  );
}

function Gate() {
  const { user } = useAuth();
  if (user === null) return <div className="flex items-center justify-center h-screen"><Spinner className="w-8 h-8 text-brand" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Shell />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster theme="dark" position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Gate />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/competitors" element={<Competitors />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/swot" element={<Swot />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
