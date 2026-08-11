
import GeoMap from "../../../shared/components/charts/geo-map";
import RecentOrdersTable from "../../../shared/components/charts/recent-orders";
import SalesChart from "../../../shared/components/charts/sales-chart";
import DeviceUsagePie from "../../../shared/components/charts/device-usage-pie";

export default function Dashboard() {
  return (
    // `col-span-2` on the single-column layout would create an implicit second
    // column and overflow, so the span only applies once there are two columns.
    <div className="grid min-h-screen w-full grid-cols-1 gap-6 p-6 text-white lg:grid-cols-2">
      <div className="lg:col-span-2">
        <SalesChart />
      </div>
      <DeviceUsagePie />
      <RecentOrdersTable />
      <div className="lg:col-span-2">
        <GeoMap />
      </div>
    </div>
  );
}