import  { useState, useEffect } from "react";

// Example invoices data (replace with API call)
const sampleInvoices = [
  {
    _id: "1",
    clientName: "John Doe",
    clientEmail: "john@example.com",
    clientCompany: "ABC Corp",
    amount: 500,
    currency: "USD",
    status: "paid",
    invoiceDate: "2025-09-01",
    dueDate: "2025-09-10",
    paymentDate: "2025-09-08",
  },
  {
    _id: "2",
    clientName: "Jane Smith",
    clientEmail: "jane@example.com",
    clientCompany: "XYZ Ltd",
    amount: 700,
    currency: "USD",
    status: "pending",
    invoiceDate: "2025-09-05",
    dueDate: "2025-09-12",
    paymentDate: null,
  },
];

const InvoiceList = () => {
  const [invoices, setInvoices] = useState(sampleInvoices);
  const [filteredInvoices, setFilteredInvoices] = useState(sampleInvoices);
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("");

  useEffect(() => {
    let filtered = invoices;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    // Filter by client name
    if (clientFilter.trim() !== "") {
      filtered = filtered.filter((inv) =>
        inv.clientName.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  }, [statusFilter, clientFilter, invoices]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Invoices</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-md flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <input
          type="text"
          placeholder="🔍 Search by Client Name"
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="border rounded-xl p-3 w-full md:w-1/3 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-xl p-3 w-full md:w-1/4 focus:ring-2 focus:ring-blue-500 outline-none transition"
        >
          <option value="all">All Status</option>
          <option value="paid">✅ Paid</option>
          <option value="pending">⏳ Pending</option>
        </select>
      </div>

      {/* Invoice Table */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow-md">
        <table className="w-full text-sm text-left">
          <thead className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <tr>
              <th className="p-4">Client</th>
              <th className="p-4">Company</th>
              <th className="p-4">Email</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Invoice Date</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Payment Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((inv) => (
                <tr
                  key={inv._id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="p-4 font-medium text-gray-700">
                    {inv.clientName}
                  </td>
                  <td className="p-4 text-gray-600">{inv.clientCompany}</td>
                  <td className="p-4 text-gray-500">{inv.clientEmail}</td>
                  <td className="p-4 font-semibold text-gray-800">
                    {inv.currency} {inv.amount}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        inv.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(inv.invoiceDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-500">
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-500">
                    {inv.paymentDate
                      ? new Date(inv.paymentDate).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={8}>
                  🚫 No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceList;
