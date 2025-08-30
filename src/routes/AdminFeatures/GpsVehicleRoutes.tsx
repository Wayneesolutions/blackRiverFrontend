import React from 'react'
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/gpsvehicle/Layout";
import Loading from "../../components/common/Loading";
const GpsDashboard = lazy(() => import("../../pages/admin/gpsvehicle/index"));

function GpsVehicleRoutes() {
  return (
    <Suspense fallback={<Loading />}>
        <Routes>
        <Route element={<Layout />}>
          <Route index element={<GpsDashboard />} />
          {/* <Route path="gpsvechile" element={<GpsDashboard />} /> */}
        </Route>
        </Routes>
    </Suspense>
  )
}

export default GpsVehicleRoutes