import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/driverManegement/Layout";
import Loading from "../../components/common/Loading";


const Dashboard = lazy(() => import("../../pages/admin/driverManagement/index"));
const Driver = lazy(() => import("../../pages/admin/driverManagement/driverslist/index"))
const Scheduling = lazy(() => import("../../pages/admin/driverManagement/schedulePage/index"))
const EmployeeList = lazy(() => import("../../pages/admin/driverManagement/employees/index"))
const Documents = lazy(() => import("../../pages/admin/driverManagement/document/index"))
const Attendence = lazy(() => import("../../pages/admin/driverManagement/Attendance/index"))
const Issues = lazy(() => import("../../pages/admin/dispatch/resources/issues/index"))


function DriverManagementRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/drivers" element={<Driver />} />
                    <Route path="/scheduling" element={<Scheduling />} />
                    <Route path="/employeelist" element={<EmployeeList />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/attendence" element={<Attendence />} />
                    <Route path="/issues" element={<Issues />} />
                </Route>
            </Routes>
        </Suspense>
    )
}

export default DriverManagementRoutes