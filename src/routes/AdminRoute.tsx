import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../components/admin/Layout";
import Loading from "../components/common/Loading";

const Dashboard = lazy(() => import("../pages/admin/dashboard/index"));
const Profile = lazy(() => import("../pages/admin/dashboard/Profile/index"));
const Slots = lazy(() => import("../pages/admin/dashboard/slot/index"));
const Member = lazy(() => import("../pages/admin/dashboard/member/index"));
const Invoice = lazy(() => import("../pages/admin/dashboard/invoice/index"));
const Setting = lazy(() => import("../pages/admin/dashboard/setting/index"));

const DispatchRoutes = lazy(() => import("./AdminFeatures/DispatchRoutes"));
const GpsVehicleRoutes = lazy(() => import("./AdminFeatures/GpsVehicleRoutes"))
function AdminRoute() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Feature Routes - These should come BEFORE the Layout routes */}
        <Route path="dispatch/*" element={<DispatchRoutes />} />
        <Route path="gpsvehicle/*" element={<GpsVehicleRoutes/>}/>
        {/* Add other feature routes here when ready */}
        {/* 
         <Route path="gps/*" element={<GPSRoutes />} />
        <Route path="driver/*" element={<DriverRoutes />} />
        <Route path="maintenance/*" element={<MaintenanceRoutes />} />
        <Route path="compliance/*" element={<ComplianceRoutes />} />
        <Route path="billing/*" element={<BillingRoutes />} />
        */}
        
        {/* Main Admin Layout Routes */}
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="member" element={<Member />} />
          <Route path="slots" element={<Slots />} />
          <Route path="invoice" element={<Invoice />} />
          <Route path="systemsetting" element={<Setting />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AdminRoute;
