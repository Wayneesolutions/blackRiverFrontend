import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import MechanicsLayout from "../../components/mechanics/MechanicsLayout";
import Loading from "../../components/common/Loading";

const Orders = lazy(() => import("../../pages/admin/mechanics/Orders"));

interface MechanicsRoutesProps {
  basePath?: string; // "/mechanics" for mechanics user, "/admin/mechanics" for admin
}

function MechanicsRoutes({ basePath = "/admin/mechanics" }: MechanicsRoutesProps) {
  const ordersPath = `${basePath}/orders`;
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<MechanicsLayout basePath={basePath} />}>
          <Route index element={<Navigate to={ordersPath} replace />} />
          <Route path="orders" element={<Orders />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default MechanicsRoutes;

