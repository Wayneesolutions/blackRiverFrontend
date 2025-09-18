import React, { type JSX } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from "recharts";

const sampleLoads = [
  { name: "Jan", value: 20 },
  { name: "Feb", value: 35 },
  { name: "Mar", value: 28 },
  { name: "Apr", value: 40 },
  { name: "May", value: 50 },
  { name: "Jun", value: 30 },
];

const sampleRevenue = [
  { name: "Jan", value: 1000 },
  { name: "Feb", value: 2000 },
  { name: "Mar", value: 1500 },
  { name: "Apr", value: 2500 },
  { name: "May", value: 3000 },
  { name: "Jun", value: 2200 },
];

const fuelData = [
  { name: "Avg Mileage", value: 15 },
  { name: "Total Fuel", value: 200 },
];

const COLORS = ["#8884d8", "#82ca9d"];

export default function QuickStatsUI(): JSX.Element {
  return (
    <div className="p-6 space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Vehicles" value={120} />
        <StatCard title="Drivers on Duty" value={45} />
        <StatCard title="Active Loads" value={30} />
        <StatCard title="Pending Work Orders" value={12} />
        <StatCard title="Pending Invoices" value={8} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Loads per Month</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={sampleLoads}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Loads" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-3">Revenue Trend</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={sampleRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#82ca9d" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold mb-3">Fuel Efficiency</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={fuelData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  label
                >
                  {fuelData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold mb-3">Recent Alerts</h3>

          <div className="space-y-4">
            <AlertSection title="Maintenance Due">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">KL-10-5678</div>
                  <div className="text-xs text-gray-500">Next service: 20/09/2025</div>
                </div>
              </div>
            </AlertSection>

            <AlertSection title="Document Expiry">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Driver License - John Doe</div>
                  <div className="text-xs text-gray-500">Expiry: 15/10/2025</div>
                </div>
              </div>
            </AlertSection>

            <AlertSection title="Delayed Loads">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">Load #1023</div>
                  <div className="text-xs text-gray-500">Delivery date: 18/09/2025</div>
                </div>
                <div className="text-xs text-orange-600">Delayed</div>
              </div>
            </AlertSection>
          </div>
        </Card>

        {/* Summary Card */}
        <Card>
          <h3 className="text-lg font-semibold mb-3">Summary</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>Total Vehicles: <span className="font-medium">120</span></li>
            <li>Active Loads: <span className="font-medium">30</span></li>
            <li>Drivers on Duty: <span className="font-medium">45</span></li>
            <li>Pending Invoices: <span className="font-medium">8</span></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ----------------- Helper Components ----------------- */

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}>{children}</div>;
}

function AlertSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
