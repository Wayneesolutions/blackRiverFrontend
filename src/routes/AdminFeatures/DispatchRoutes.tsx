import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/dispatch/Layout";
import Loading from "../../components/common/Loading";

const DispatchDashboard = lazy(() => import("../../pages/admin/dispatch/operations/index"));
const ServiceRate = lazy(() => import("../../pages/admin/dispatch/operations/service rate/index"))
const Dispatch = lazy(() => import("../../pages/admin/dispatch/operations/dispatch/index"))
const Scheduler = lazy(() => import("../../pages/admin/dispatch/operations/schedular/index"))
const OrderConfig = lazy(() => import("../../pages/admin/dispatch/operations/orderConfig/index"))
const DriversPage = lazy(() => import("../../pages/admin/dispatch/resources/drivers"))
const Vehicle = lazy(() => import("../../pages/admin/dispatch/resources/vehicles/index"))

function DispatchRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          {/* Dashboard route - handles both /admin/dispatch and /admin/dispatch/dashboard */}
          <Route index element={<DispatchDashboard />} />
          <Route path="operations/dashboard" element={<DispatchDashboard />} />
          <Route path="operations/service-rates" element={<ServiceRate />} />
          <Route path="operations/dispatch" element={<Dispatch />} />
          <Route path="operations/scheduler" element={<Scheduler />} />
          <Route path="operations/order-config" element={<OrderConfig />} />

          <Route path="resources/drivers" element={<DriversPage />} />
           <Route path="resources/vehicles" element={<Vehicle />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default DispatchRoutes;