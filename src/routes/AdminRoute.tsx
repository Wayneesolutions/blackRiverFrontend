import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../components/admin/Layout";
import Loading from "../components/common/Loading";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import PublicRoute from "../components/auth/PublicRoute";


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

function AdminRoute() {
  return (
    <Suspense fallback={<Loading />}>
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
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="quick-stats" element={<QuickStats />} />
          <Route path="member" element={<Member />} />
          <Route path="slots" element={<Slots />} />
          <Route path="invoice" element={<Invoice />} />

          <Route path="users" element={<UserManage />} />
          <Route path="company" element={<CompanyManage />} />
          <Route path="integrations" element={<Integrations />} />
          <Route path="company-documents" element={<CompanyDocuments />} />
          <Route path="subscription" element={<Subscription />} />
        </Route>
        
        {/* Protected Feature Routes */}
        <Route 
          path="dispatch/*" 
          element={
            <ProtectedRoute>
              <DispatchRoutes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="gpsvehicle/*" 
          element={
            <ProtectedRoute>
              <GpsVehicleRoutes />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="Management/*" 
          element={
            <ProtectedRoute>
              <DriverManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="compliance/*" 
          element={
            <ProtectedRoute>
              <ComplianceRoute />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="accounts/*" 
          element={
            <ProtectedRoute>
              <AccountsRoute />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="fleetmaintenance/*" 
          element={
            <ProtectedRoute>
              <FleetMaintainRoute />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Suspense>
  );
}

export default AdminRoute;
