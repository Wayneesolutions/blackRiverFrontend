import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/dispatch/Layout";
import Loading from "../../components/common/Loading";

const DispatchDashboard = lazy(() => import("../../pages/admin/dispatch/index"));


function DispatchRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          {/* Dashboard route - handles both /admin/dispatch and /admin/dispatch/dashboard */}
          <Route index element={<DispatchDashboard />} />
          <Route path="dashboard" element={<DispatchDashboard />} />
          
          {/* Other dispatch routes */}
          {/* <Route path="goods" element={<DispatchGoods />} />
          <Route path="cargo" element={<DispatchCargo />} />
          <Route path="team" element={<DispatchTeam />} />
          <Route path="locate" element={<DispatchLocate />} />
          <Route path="drivers" element={<DispatchDrivers />} />
          <Route path="totaldispatch" element={<DispatchTotal />} />
          <Route path="invoice" element={<DispatchInvoice />} />
          <Route path="doc" element={<DispatchDoc />} /> */}
        </Route>
      </Routes>
    </Suspense>
  );
}

export default DispatchRoutes;