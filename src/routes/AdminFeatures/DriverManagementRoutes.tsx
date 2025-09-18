import React from 'react'
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/driverManegement/Layout";
import Loading from "../../components/common/Loading";


const Dashboard = lazy(() => import("../../pages/admin/driverManagement/index"));
const Driver = lazy(() => import("../../pages/admin/driverManagement/driverslist/index"))
const Scheduling = lazy(() => import("../../pages/admin/driverManagement/schedulePage/index"))


function DriverManagementRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/drivers" element={<Driver />} />
                    <Route path="/scheduling" element={<Scheduling />} />
                </Route>
            </Routes>
        </Suspense>
    )
}

export default DriverManagementRoutes