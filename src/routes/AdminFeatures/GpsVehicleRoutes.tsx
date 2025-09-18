import React from 'react'
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/gpsvehicle/Layout";
import Loading from "../../components/common/Loading";
const GpsDashboard = lazy(() => import("../../pages/admin/gpsvehicle/Dashboard"));
const Assets = lazy(() => import("../../pages/admin/gpsvehicle/assets/index"))
const LoadMap = lazy(() => import("../../pages/admin/gpsvehicle/loadMap/index"))
const TripHistory = lazy(() => import("../../pages/admin/gpsvehicle/productivity/TripHistory"))


const LiveTracking = lazy(() => import("../../pages/admin/gpsvehicle/livetracking/index"))
const Vehicles = lazy(() => import("../../pages/admin/gpsvehicle/vehicles/index"))
const Drivers = lazy(() => import("../../pages/admin/gpsvehicle/drivers/index"))

function GpsVehicleRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<GpsDashboard />} />
          {/* <Route path="gpsvechile" element={<GpsDashboard />} /> */}

          <Route path="/assets" element={<Assets />} />
          <Route path="/loadmap" element={<LoadMap />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/livetracking" element={<LiveTracking />} />
          <Route path="/triphistory" element={<TripHistory />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default GpsVehicleRoutes