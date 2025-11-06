import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import React from "react";
import Layout from "../components/admin/Layout";
import Loading from "../components/common/Loading";
import PublicRoute from "../components/auth/PublicRoute";
import ErrorBoundary from "../components/common/ErrorBoundary";


const Register = lazy(() => import("../pages/admin/auth/Register"));
const Login = lazy(() => import("../pages/admin/auth/Login"));

const Dashboard = lazy(() => import("../pages/admin/dashboard/index"));
const Profile = lazy(() => import("../pages/admin/dashboard/Profile/index"));
const QuickStats = lazy(() => import("../pages/admin/dashboard/quckstats/QuickStats"))
const Slots = lazy(() => import("../pages/admin/dashboard/slot/index"));
const Member = lazy(() => import("../pages/admin/dashboard/member/index"));
const Invoice = lazy(() => import("../pages/admin/dashboard/invoice/index"));

const Integrations = lazy(() => import("../pages/admin/dashboard/setting/Api"))
const UserManage = lazy(() => import("../pages/admin/dashboard/setting/Users"));
const CompanyManage = lazy(() => import("../pages/admin/dashboard/setting/Company"))
const CompanyDocuments = lazy(() => import("../pages/admin/dashboard/documents/index"));

const DispatchRoutes = lazy(() => import("./AdminFeatures/DispatchRoutes"));
const GpsVehicleRoutes = lazy(() => import("./AdminFeatures/GpsVehicleRoutes"))
const DriverManagement = lazy(() => import("./AdminFeatures/HRManagementRoutes"))
const ComplianceRoute = lazy(() => import('./AdminFeatures/CompilanceRoute'))
const FleetMaintainRoute = lazy(() => import("./AdminFeatures/FleetMaintainRoutes"))
const AccountsRoute = lazy(() => import("./AdminFeatures/AccountsRoutes"))
const Subscription = lazy(() => import("../pages/admin/subscription/index"))

// Debug wrapper to log route changes
const RouteDebugger = ({ children }: { children: React.ReactNode }) => {
  React.useEffect(() => {
    console.log('📍 Current route:', window.location.pathname);
  }, [window.location.pathname]);
  return <>{children}</>;
};

function AdminRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <RouteDebugger>
        <Routes>
        {/* Public Routes - Auth Pages */}
        <Route 
          path="register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route 
          path="login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes - Main Admin Layout Routes */}
        <Route 
          element={<Layout />}
        >
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="profile" element={<ErrorBoundary><Profile /></ErrorBoundary>} />
          <Route path="quick-stats" element={<ErrorBoundary><QuickStats /></ErrorBoundary>} />
          <Route path="member" element={<ErrorBoundary><Member /></ErrorBoundary>} />
          <Route path="slots" element={<ErrorBoundary><Slots /></ErrorBoundary>} />
          <Route path="invoice" element={<ErrorBoundary><Invoice /></ErrorBoundary>} />

          <Route path="users" element={<ErrorBoundary><UserManage /></ErrorBoundary>} />
          <Route path="company" element={<ErrorBoundary><CompanyManage /></ErrorBoundary>} />
          <Route path="integrations" element={<ErrorBoundary><Integrations /></ErrorBoundary>} />
          <Route path="company-documents" element={<ErrorBoundary><CompanyDocuments /></ErrorBoundary>} />
          <Route path="subscription" element={<ErrorBoundary><Subscription /></ErrorBoundary>} />
        </Route>
        
        {/* Protected Feature Routes */}
        <Route 
          path="dispatch/*" 
          element={<DispatchRoutes />} 
        />
        <Route 
          path="gpsvehicle/*" 
          element={<GpsVehicleRoutes />} 
        />
        <Route 
          path="Management/*" 
          element={<DriverManagement />} 
        />
        <Route 
          path="compliance/*" 
          element={<ComplianceRoute />} 
        />
        <Route 
          path="accounts/*" 
          element={<AccountsRoute />} 
        />
        <Route 
          path="fleetmaintenance/*" 
          element={<FleetMaintainRoute />} 
        />
      </Routes>
      </RouteDebugger>
    </Suspense>
  );
}

export default AdminRoute;
