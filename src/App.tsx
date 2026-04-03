import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { BreakTimeLock } from "@/components/BreakTimeLock";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import KPIs from "./pages/KPIs";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import Performance from "./pages/Performance";
import Team from "./pages/Team";
import Analytics from "./pages/Analytics";
import Departments from "./pages/Departments";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import ProductivityMonitoring from "./pages/ProductivityMonitoring";
import NotFound from "./pages/NotFound";
import Support from "./pages/Support";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BreakTimeLock />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/support" element={<Support />} />
            <Route path="/login" element={<Navigate to="/auth" replace />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/kpis" element={<ProtectedRoute><KPIs /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
            <Route path="/productivity" element={<ProtectedRoute><ProductivityMonitoring /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute allowedRoles={['officer', 'admin']}><Team /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute allowedRoles={['officer', 'admin']}><Analytics /></ProtectedRoute>} />
            <Route path="/departments" element={<ProtectedRoute allowedRoles={['officer', 'admin']}><Departments /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
