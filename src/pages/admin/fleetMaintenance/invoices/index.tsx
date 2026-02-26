import { useState, useMemo } from 'react';
import {
  FaFileInvoice,
  FaPlus,
  FaTimes,
  FaCheckCircle,
  FaEdit,
  FaPrint,
  FaTrash,
} from 'react-icons/fa';

/** Static customer options for dropdown */
const STATIC_CUSTOMERS = [
  { id: '1', name: 'Black River Logistics Ltd', email: 'Accounting@blackriverlogistics.com', billingAddress: '123 Main St, Winnipeg, MB R3C 1A1, Canada' },
  { id: '2', name: 'Acme Transport Inc', email: 'billing@acmetransport.com', billingAddress: '456 Industrial Blvd, Winnipeg, MB R2X 2B2, Canada' },
  { id: '3', name: 'Northern Freight Co', email: 'accounts@northernfreight.ca', billingAddress: '789 Highway 1, Brandon, MB R7A 0A1, Canada' },
];

const TERMS_OPTIONS = [
  { value: 'Net 15', days: 15 },
  { value: 'Net 30', days: 30 },
  { value: 'Net 45', days: 45 },
  { value: 'Net 60', days: 60 },
];

const PRODUCT_SERVICE_OPTIONS = [
  'SERVICE: Service A Truck Inspection',
  'SERVICE: Oil Change',
  'SERVICE: Brake Inspection',
  'PART: Air Filter',
  'PART: Oil Filter',
];

/** Tax: name + percentage. id used for selection (predefined or custom-xxx). */
interface TaxOption {
  id: string;
  name: string;
  percent: number;
}

const DEFAULT_TAXES: TaxOption[] = [
  { id: 'gst', name: 'GST', percent: 5 },
  { id: 'pst', name: 'PST', percent: 7 },
  { id: 'hst', name: 'HST', percent: 13 },
  { id: 'none', name: 'No Tax', percent: 0 },
];

/** One line item in the invoice form */
interface LineItem {
  id: string;
  serviceDate: string;
  productService: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
  salesTax: string;
}

/** Invoice row for the table (static list) */
interface InvoiceRow {
  id: string;
  date: string;
  no: string;
  customer: string;
  amount: number;
  status: 'paid' | 'overdue';
}

/** Static invoice list for table */
const STATIC_INVOICES: InvoiceRow[] = [
  { id: '1', date: '21/5/25', no: 'BRL0005', customer: 'Black River Logistics Ltd', amount: 94.5, status: 'paid' },
  { id: '2', date: '20/5/25', no: 'BRL0004', customer: 'Acme Transport Inc', amount: 250.0, status: 'overdue' },
  { id: '3', date: '19/5/25', no: 'BRL0003', customer: 'Northern Freight Co', amount: 175.25, status: 'paid' },
];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Format YYYY-MM-DD to DD/MM/YY for display */
function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '—';
  try {
    const [y, m, d] = isoDate.split('-');
    if (!y || !m || !d) return isoDate;
    const yy = y.length === 4 ? y.slice(-2) : y;
    return `${d}/${m}/${yy}`;
  } catch {
    return isoDate;
  }
}

const FleetInvoicesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceRow[]>(STATIC_INVOICES);

  // Step 1: Header
  const [customerId, setCustomerId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [terms, setTerms] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');

  // Step 2: Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', serviceDate: '', productService: '', description: '', qty: 1, rate: 0, amount: 0, salesTax: 'gst' },
  ]);

  const [customTaxes, setCustomTaxes] = useState<TaxOption[]>([]);
  const [addingTaxForLineId, setAddingTaxForLineId] = useState<string | null>(null);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxPercent, setNewTaxPercent] = useState<number>(5);

  const allTaxes = useMemo(() => [...DEFAULT_TAXES, ...customTaxes], [customTaxes]);

  const addCustomTax = (lineId: string) => {
    const name = newTaxName.trim();
    if (!name || newTaxPercent < 0 || newTaxPercent > 100) return;
    const id = `custom-${Date.now()}`;
    setCustomTaxes((prev) => [...prev, { id, name, percent: newTaxPercent }]);
    updateLineItem(lineId, { salesTax: id });
    setAddingTaxForLineId(null);
    setNewTaxName('');
    setNewTaxPercent(5);
  };

  const removeCustomTax = (taxId: string) => {
    setCustomTaxes((prev) => prev.filter((t) => t.id !== taxId));
    setLineItems((prev) =>
      prev.map((item) => (item.salesTax === taxId ? { ...item, salesTax: 'gst' as const } : item))
    );
  };

  const [messageOnInvoice, setMessageOnInvoice] = useState('');

  const selectedCustomer = STATIC_CUSTOMERS.find((c) => c.id === customerId);

  // When customer changes, auto-fill email and billing address
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const c = STATIC_CUSTOMERS.find((x) => x.id === id);
    if (c) {
      setCustomerEmail(c.email);
      setBillingAddress(c.billingAddress);
    } else {
      setCustomerEmail('');
      setBillingAddress('');
    }
  };

  // When terms or invoice date changes, recalc due date
  const handleTermsChange = (value: string) => {
    setTerms(value);
    const opt = TERMS_OPTIONS.find((o) => o.value === value);
    if (opt && invoiceDate) setDueDate(addDays(invoiceDate, opt.days));
  };

  const handleInvoiceDateChange = (value: string) => {
    setInvoiceDate(value);
    const opt = TERMS_OPTIONS.find((o) => o.value === terms);
    if (opt && value) setDueDate(addDays(value, opt.days));
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...updates };
        if ('qty' in updates || 'rate' in updates)
          next.amount = (next.qty ?? item.qty) * (next.rate ?? item.rate);
        return next;
      })
    );
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      { id: String(Date.now()), serviceDate: '', productService: '', description: '', qty: 1, rate: 0, amount: 0, salesTax: 'gst' },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  const subtotal = useMemo(() => lineItems.reduce((sum, i) => sum + i.amount, 0), [lineItems]);
  const totalTax = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const tax = allTaxes.find((t) => t.id === item.salesTax);
      const rate = tax ? tax.percent / 100 : 0;
      return sum + item.amount * rate;
    }, 0);
  }, [lineItems, allTaxes]);
  const totalBalance = subtotal + totalTax;

  const handleSaveAndClose = () => {
    const newInvoice: InvoiceRow = {
      id: String(Date.now()),
      date: formatDisplayDate(invoiceDate),
      no: invoiceNo || `BRL${String(invoices.length + 1).padStart(4, '0')}`,
      customer: selectedCustomer?.name || 'Unknown',
      amount: totalBalance,
      status: 'paid',
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    setSidebarOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setCustomerId('');
    setCustomerEmail('');
    setBillingAddress('');
    setTerms('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setInvoiceNo('');
    setLineItems([{ id: '1', serviceDate: '', productService: '', description: '', qty: 1, rate: 0, amount: 0, salesTax: 'gst' }]);
    setMessageOnInvoice('');
    setCustomTaxes([]);
    setAddingTaxForLineId(null);
  };

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FaFileInvoice className="text-blue-600" size={28} />
              Fleet Invoices
            </h1>
            <p className="text-gray-600 mt-1">Create and view invoices (static)</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
          >
            <FaPlus size={14} /> New Invoice
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold tracking-wide">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">No.</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No invoices yet. Create one using &quot;New Invoice&quot;.
                    </td>
                  </tr>
                ) : (
                  invoices.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-blue-50/30 ${row.status === 'overdue' ? 'border-t-4 border-t-orange-500 bg-orange-50/20' : ''}`}
                    >
                      <td className="px-6 py-4 text-gray-900">{row.date}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{row.no}</td>
                      <td className="px-6 py-4 text-gray-700">{row.customer}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">${row.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {row.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 text-green-700 font-medium">
                            <FaCheckCircle size={16} className="text-green-600" /> Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">Overdue</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button type="button" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View/Edit">
                            <FaEdit size={14} />
                          </button>
                          <button type="button" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Print">
                            <FaPrint size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar form modal */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
          <div className="fixed top-0 right-0 h-full w-full max-w-4xl bg-white shadow-xl z-50 flex flex-col">
            <div className="flex-shrink-0 px-8 py-5 border-b border-gray-200 flex items-center justify-between bg-white">
              <h2 className="text-xl font-semibold text-gray-900">New Invoice</h2>
              <button type="button" onClick={() => setSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
                <FaTimes size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
              {/* Header Information */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Bill To &amp; Dates</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                      <select
                        value={customerId}
                        onChange={(e) => handleCustomerChange(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      >
                        <option value="">Select client...</option>
                        {STATIC_CUSTOMERS.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. Accounting@blackriverlogistics.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                    <textarea
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="From customer profile"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Terms</label>
                      <select
                        value={terms}
                        onChange={(e) => handleTermsChange(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Payment window...</option>
                        {TERMS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.value}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
                      <input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => handleInvoiceDateChange(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="text"
                        readOnly
                        value={dueDate ? formatDisplayDate(dueDate) : '—'}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                      />
                      <p className="text-xs text-gray-500 mt-0.5">Calculated from Terms</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Invoice No.</label>
                      <input
                        type="text"
                        value={invoiceNo}
                        onChange={(e) => setInvoiceNo(e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g. RTTR777"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Line Item Details */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Line Items</h3>
                <div className="space-y-4">
                  {lineItems.map((item) => (
                    <div key={item.id} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Service Date</label>
                          <input
                            type="date"
                            value={item.serviceDate}
                            onChange={(e) => updateLineItem(item.id, { serviceDate: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product / Service</label>
                          <select
                            value={item.productService}
                            onChange={(e) => updateLineItem(item.id, { productService: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            <option value="">Select...</option>
                            {PRODUCT_SERVICE_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                          placeholder="e.g. Checked lights, brakes, steering..."
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-4 items-end">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">QTY</label>
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => updateLineItem(item.id, { qty: Number(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Rate</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.rate || ''}
                            onChange={(e) => updateLineItem(item.id, { rate: Number(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                          <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700">${item.amount.toFixed(2)}</div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
                          <select
                            value={item.salesTax}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (v === '__add__') setAddingTaxForLineId(item.id);
                              else updateLineItem(item.id, { salesTax: v });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            {allTaxes.map((t) => (
                              <option key={t.id} value={t.id}>{t.name} ({t.percent}%)</option>
                            ))}
                            <option value="__add__">+ Add custom tax...</option>
                          </select>
                        </div>
                      </div>
                      {lineItems.length > 1 && (
                        <button type="button" onClick={() => removeLineItem(item.id)} className="text-sm text-red-600 hover:text-red-700 font-medium">
                          Remove line
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addLineItem} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    + Add line item
                  </button>
                </div>
              </section>

              {/* Custom taxes: add form + list with delete */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Custom taxes</h3>
                {addingTaxForLineId && (
                  <div className="mb-4 p-4 rounded-lg border border-blue-200 bg-blue-50/50">
                    <p className="text-xs font-medium text-gray-700 mb-3">Add custom tax (percentage) — will apply to current line</p>
                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="w-40">
                        <label className="block text-xs text-gray-600 mb-1">Tax name</label>
                        <input
                          type="text"
                          value={newTaxName}
                          onChange={(e) => setNewTaxName(e.target.value)}
                          placeholder="e.g. VAT"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-600 mb-1">%</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={newTaxPercent}
                          onChange={(e) => setNewTaxPercent(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => addCustomTax(addingTaxForLineId)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddingTaxForLineId(null); setNewTaxName(''); setNewTaxPercent(5); }}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {customTaxes.length > 0 && (
                  <ul className="space-y-2">
                    {customTaxes.map((t) => (
                      <li key={t.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-200 bg-white">
                        <span className="text-sm font-medium text-gray-800">{t.name} ({t.percent}%)</span>
                        <button
                          type="button"
                          onClick={() => removeCustomTax(t.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete this tax"
                        >
                          <FaTrash size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {customTaxes.length === 0 && !addingTaxForLineId && (
                  <p className="text-sm text-gray-500">No custom taxes. Use “+ Add custom tax...” in a line item above.</p>
                )}
              </section>

              {/* Message & Totals */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Message &amp; Totals</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message on Invoice</label>
                    <textarea
                      value={messageOnInvoice}
                      onChange={(e) => setMessageOnInvoice(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      placeholder="e.g. UNIT, VIN NO, CURRENT KM/HOURS"
                    />
                  </div>
                  <div className="max-w-xs ml-auto rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax</span>
                      <span className="font-medium text-gray-900">${totalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-semibold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                      <span>Total Balance Due</span>
                      <span>${totalBalance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            <div className="flex-shrink-0 px-8 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setSidebarOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSaveAndClose} className="px-5 py-2.5 text-sm font-medium !text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                Save and close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FleetInvoicesPage;
