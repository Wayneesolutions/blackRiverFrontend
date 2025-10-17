import React from 'react'
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/EmployeeManegement/Layout";
import Loading from "../../components/common/Loading";


const Dashboard = lazy(() => import("../../pages/admin/employee/index"));
const EmployeeList = lazy(() => import("../../pages/admin/employee/employees/index"))
const Documents = lazy(() => import("../../pages/admin/employee/document/index"))


function EmployeeRoute() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/employeelist" element={<EmployeeList />} />
                    <Route path="/documents" element={<Documents />} />
                </Route>
            </Routes>
        </Suspense>
    )
}

export default EmployeeRoute