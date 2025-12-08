import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/accounts/Layout";
import Loading from "../../components/common/Loading";


const Dashboard = lazy(() => import("../../pages/admin/accounts/index"));
const Invoices = lazy(() => import("../../pages/admin/accounts/invoice/index"))
const Expenses = lazy(() => import("../../pages/admin/accounts/expenses/index"))
const Payroll = lazy(() => import("../../pages/admin/accounts/payroll/index"))
const MonthlySalaryReport = lazy(() => import("../../pages/admin/accounts/payroll/MonthlySalaryReport"))


function AccountsRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="/invoice" element={<Invoices />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/payroll" element={<Payroll />} />
                    <Route path="/payroll/monthly-report" element={<MonthlySalaryReport />} />
                </Route>
            </Routes>
        </Suspense>
    )
}

export default AccountsRoutes