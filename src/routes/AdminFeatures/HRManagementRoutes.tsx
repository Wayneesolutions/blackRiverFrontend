import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/driverManegement/Layout";
import Loading from "../../components/common/Loading";


const Dashboard = lazy(() => import("../../pages/admin/driverManagement/index"));
const Driver = lazy(() => import("../../pages/admin/driverManagement/driverslist/index"))
const EmployeeList = lazy(() => import("../../pages/admin/driverManagement/employees/index"))
const Documents = lazy(() => import("../../pages/admin/driverManagement/document/index"))
const Attendence = lazy(() => import("../../pages/admin/driverManagement/Attendance/index"))
const Issues = lazy(() => import("../../pages/admin/dispatch/resources/issues/index"))
const CompanyDocuments = lazy(() => import("../../pages/admin/dashboard/documents/index"))
const VehicleDocuments = lazy(() => import("../../pages/admin/driverManagement/VehicleDocuments"))
const UserProfilesPortfolio = lazy(() => import("../../pages/admin/driverManagement/userProfiles/index"))
const DriverDocuments = lazy(() => import("../../pages/admin/driverManagement/driverdocument/index"))
const DriverProfiles = lazy(() => import("../../pages/admin/driverManagement/driverportfolio/index"))

function DriverManagementRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/drivers" element={<Driver />} />
                    {/* <Route path="/scheduling" element={<Scheduling />} /> */}
                    <Route path="/employeelist" element={<EmployeeList />} />
                    <Route path="/documents" element={<Documents />} />
                    <Route path="/company-documents" element={<CompanyDocuments />} />
                    <Route path="/vehicle-documents" element={<VehicleDocuments />} />
                    <Route path="/attendence" element={<Attendence />} />
                    <Route path="/issues" element={<Issues />} />
                    <Route path="/employee-profiles" element={<UserProfilesPortfolio />} />
                    <Route path="/driverdocuments" element={<DriverDocuments />} />
                    <Route path="/driver-profiles" element={<DriverProfiles />} />
                </Route>
            </Routes>
        </Suspense>
    )
}

export default DriverManagementRoutes