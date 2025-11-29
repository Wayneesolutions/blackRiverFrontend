
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "../../components/dispatch/Layout";
import Loading from "../../components/common/Loading";

const DispatchDashboard = lazy(() => import("../../pages/admin/dispatch/operations/index"));
const ServiceRate = lazy(() => import("../../pages/admin/dispatch/operations/service rate/index"))
const Dispatch = lazy(() => import("../../pages/admin/dispatch/operations/dispatch/index"))
const AllDispatch = lazy(() => import("../../pages/admin/dispatch/operations/all-dispatch/index"))
const Delivery = lazy(() => import("../../pages/admin/dispatch/operations/delivery/index"))
const Scheduler = lazy(() => import("../../pages/admin/dispatch/operations/schedular/index"))
const OrderConfig = lazy(() => import("../../pages/admin/dispatch/operations/orderConfig/index"))
const OrderList = lazy(() => import("../../pages/admin/dispatch/operations/order-list/index"))
const BulkOrder = lazy(() => import("../../pages/admin/dispatch/operations/bulk-order/index"))
const Trips = lazy(() => import("../../pages/admin/dispatch/operations/trips/index"))

const DriversPage = lazy(() => import("../../pages/admin/dispatch/resources/drivers"))
const Vehicle = lazy(() => import("../../pages/admin/dispatch/resources/vehicles/index"))
const Trailers = lazy(() => import("../../pages/admin/dispatch/resources/trailers/index"))
const Fleets = lazy(() => import("../../pages/admin/dispatch/resources/fleet/index"))
const Vendors = lazy(() => import("../../pages/admin/dispatch/resources/vendors/index"))
const Contacts = lazy(() => import("../../pages/admin/dispatch/resources/contacts/index"))
const Places = lazy(() => import("../../pages/admin/dispatch/resources/places/index"))


function DispatchRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>

          <Route index element={<DispatchDashboard />} />
          <Route path="/dashboard" element={<DispatchDashboard />} />
          <Route path="/order-list" element={<OrderList />} />
          <Route path="/bulk-order" element={<BulkOrder />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/service-rates" element={<ServiceRate />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/all-dispatch" element={<AllDispatch />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/scheduler" element={<Scheduler />} />
          <Route path="/order-config" element={<OrderConfig />} />

          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/vehicles" element={<Vehicle />} />
          <Route path="/trailers" element={<Trailers />} />
          <Route path="/fleets" element={<Fleets />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/places" element={<Places />} />

        

        </Route>
      </Routes>
    </Suspense>
  );
}

export default DispatchRoutes;