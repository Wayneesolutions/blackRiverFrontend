import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../components/admin/Layout";
import Loading from "../components/common/Loading";


const Register = lazy(() => import("../pages/admin/auth/Register"));
const Login = lazy(() => import("../pages/admin/auth/Login"));

const Dashboard = lazy(() => import("../pages/admin/dashboard/index"));
// const Profile = lazy(() => import("../pages/admin/dashboard/Profile/index"));
const QuickStats = lazy(() => import("../pages/admin/dashboard/quckstats/QuickStats"))
const Slots = lazy(() => import("../pages/admin/dashboard/slot/index"));
const Member = lazy(() => import("../pages/admin/dashboard/member/index"));
const Invoice = lazy(() => import("../pages/admin/dashboard/invoice/index"));

const Integrations = lazy(() => import("../pages/admin/dashboard/setting/Api"))
const UserManage = lazy(() => import("../pages/admin/dashboard/setting/Users"));
const CompanyManage = lazy(() => import("../pages/admin/dashboard/setting/Company"))

const DispatchRoutes = lazy(() => import("./AdminFeatures/DispatchRoutes"));
const GpsVehicleRoutes = lazy(() => import("./AdminFeatures/GpsVehicleRoutes"))
const DriverManagement = lazy(() => import("./AdminFeatures/HRManagementRoutes"))
const ComplianceRoute = lazy(() => import('./AdminFeatures/CompilanceRoute'))
const FleetMaintainRoute = lazy(() => import("./AdminFeatures/FleetMaintainRoutes"))
const AccountsRoute = lazy(() => import("./AdminFeatures/AccountsRoutes"))

function AdminRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Feature Routes - These should come BEFORE the Layout routes */}
        <Route path="dispatch/*" element={<DispatchRoutes />} />
        <Route path="gpsvehicle/*" element={<GpsVehicleRoutes />} />
        <Route path="Management/*" element={<DriverManagement />} />
        <Route path="compliance/*" element={<ComplianceRoute />} />
        <Route path="accounts/*" element={<AccountsRoute />} />
        <Route path="fleetmaintenance/*" element={<FleetMaintainRoute />} />
        {/* Add other feature routes here when ready */}
        {/* 
         <Route path="gps/*" element={<GPSRoutes />} />
        <Route path="driver/*" element={<DriverRoutes />} />
        <Route path="maintenance/*" element={<MaintenanceRoutes />} />
        // <Route path="compliance/*" element={<ComplianceRoutes />} />
        <Route path="billing/*" element={<BillingRoutes />} />
        */}
        <Route path="register" element={<Register />} />
        <Route path="login" element={<Login />} />
        {/* Main Admin Layout Routes */}
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="quick-stats" element={<QuickStats />} />
          <Route path="member" element={<Member />} />
          <Route path="slots" element={<Slots />} />
          <Route path="invoice" element={<Invoice />} />

          <Route path="users" element={<UserManage />} />
          <Route path="company" element={<CompanyManage />} />
          <Route path="integrations" element={<Integrations />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AdminRoute;
