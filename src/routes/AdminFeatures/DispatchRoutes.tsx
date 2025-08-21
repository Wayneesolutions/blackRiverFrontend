import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/dispatch/Layout";
import Loading from "../../components/common/Loading";

const DispatchDashboard = lazy(() => import("../../pages/admin/dispatch/operations/index"));
const ServiceRate = lazy(() => import("../../pages/admin/dispatch/operations/service rate/index"))
const Scheduler = lazy(() => import("../../pages/admin/dispatch/operations/schedular/index"))

function DispatchRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          {/* Dashboard route - handles both /admin/dispatch and /admin/dispatch/dashboard */}
          <Route index element={<DispatchDashboard />} />
          <Route path="operations/dashboard" element={<DispatchDashboard />} />
          <Route path="operations/service-rates" element={<ServiceRate />} />
          <Route path="operations/scheduler" element={<Scheduler />} />

        </Route>
      </Routes>
    </Suspense>
  );
}

export default DispatchRoutes;