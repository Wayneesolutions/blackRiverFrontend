import React from 'react'
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/fleetMaintain/Layout";
import Loading from "../../components/common/Loading";


const Dashboard = lazy(() => import("../../pages/admin/fleetMaintenance/index"));
const WorkOrder = lazy(() => import("../../pages/admin/fleetMaintenance/workOrder/index"))
const Schedule = lazy(() => import("../../pages/admin/fleetMaintenance/scheduling/index"))
const SpareParts = lazy(() => import("../../pages/admin/fleetMaintenance/sparePart/index"))
const CostReports = lazy(() => import("../../pages/admin/fleetMaintenance/costReport/index"))


function FleetMaintainRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/work-orders" element={<WorkOrder />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/spare-parts" element={<SpareParts />} />
                    <Route path="/cost-reports" element={<CostReports />} />
                   
                </Route>
            </Routes>
        </Suspense>
    )
}

export default FleetMaintainRoutes