import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import MechanicsLayout from "../../components/mechanics/MechanicsLayout";
import Loading from "../../components/common/Loading";

const Orders = lazy(() => import("../../pages/admin/mechanics/Orders"));

function MechanicsRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<MechanicsLayout />}>
          <Route index element={<Navigate to="/admin/mechanics/orders" replace />} />
          <Route path="orders" element={<Orders />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default MechanicsRoutes;

