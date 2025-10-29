import React from 'react'
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/fleetMaintain/Layout";
import Loading from "../../components/common/Loading";


const Dashboard = lazy(() => import("../../pages/admin/fleetMaintenance/index"));
const WorkOrder = lazy(() => import("../../pages/admin/fleetMaintenance/workOrder/index"))
const Schedule = lazy(() => import("../../pages/admin/fleetMaintenance/scheduling/index"))
const SpareParts = lazy(() => import("../../pages/admin/fleetMaintenance/sparePart/index"))
const Invoices = lazy(() => import("../../pages/admin/fleetMaintenance/invoices/index"))
const CostReports = lazy(() => import("../../pages/admin/fleetMaintenance/costReport/index"))
const Trucks = lazy(()=>import('../../pages/admin/fleetMaintenance/trucks/Trucks'))
const Trailers = lazy(()=>import('../../pages/admin/fleetMaintenance/trailers/Trailers'))

function FleetMaintainRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/work-orders" element={<WorkOrder />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/spare-parts" element={<SpareParts />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/cost-reports" element={<CostReports />} />
                    <Route path="/trucks" element={<Trucks />} />
                    <Route path="/trailers" element={<Trailers />} />
                </Route>
            </Routes>
        </Suspense>
    )
}

export default FleetMaintainRoutes