
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/dispatch/Layout";
import Loading from "../../components/common/Loading";

const DispatchDashboard = lazy(() => import("../../pages/admin/dispatch/operations/index"));

const Dispatch = lazy(() => import("../../pages/admin/dispatch/operations/dispatch/index"))

const Scheduling = lazy(() => import("../../pages/admin/driverManagement/schedulePage/index"))

const BulkOrder = lazy(() => import("../../pages/admin/dispatch/operations/bulk-order/index"))
const Trips = lazy(() => import("../../pages/admin/dispatch/operations/tripsOrder"))

const DriversPage = lazy(() => import("../../pages/admin/dispatch/resources/drivers"))
const Fleets = lazy(() => import("../../pages/admin/dispatch/resources/fleet/index"))

const Contacts = lazy(() => import("../../pages/admin/dispatch/resources/contacts/index"))
const Profile = lazy(() => import("../../pages/admin/dashboard/Profile/index"))


function DispatchRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>

          <Route index element={<DispatchDashboard />} />
          <Route path="/dashboard" element={<DispatchDashboard />} />
          <Route path="/profile" element={<Profile />} />
          {/* <Route path="/order-list" element={<OrderList />} /> */}
          <Route path="/bulk-order" element={<BulkOrder />} />
          <Route path="/trips" element={<Trips />} />
   
          <Route path="/dispatch" element={<Dispatch />} />
     
       
          <Route path="/scheduling" element={<Scheduling />} />
      

          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/fleets" element={<Fleets />} />
          <Route path="/contacts" element={<Contacts />} />
       



        </Route>
      </Routes>
    </Suspense>
  );
}

export default DispatchRoutes;