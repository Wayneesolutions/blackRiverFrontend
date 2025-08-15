import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import App from "../components/superadmin/Layout";
import Loading from "../components/common/Loading";



const Dashboard = lazy(() => import("../pages/superadmin/dashboard/index"));
const Viewalladmins = lazy(() => import("../pages/superadmin/adminAccount/ViewAllAccounts"))
const Billing = lazy(() => import("../pages/superadmin/billing/index"))
const SystemSetting = lazy(() => import("../pages/superadmin/setting/index"))
const Revenue = lazy(() => import("../pages/superadmin/revenue/index"))


function SuperAdminRoute() {
    return (
        <Suspense fallback={
            <Loading />
        }>
            <Routes>

                <Route element={<App />}>
                    {/* <Route index element={<Dashboard />} /> */}
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="viewalladmins" element={<Viewalladmins />} />
                    <Route path="revenue" element={<Revenue />} />
                    <Route path="billing" element={<Billing />} />
                    <Route path="systemsetting" element={<SystemSetting />} />

                </Route>
            </Routes>
        </Suspense>
    )
}

export default SuperAdminRoute;