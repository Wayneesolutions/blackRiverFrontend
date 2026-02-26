import { useState, useCallback } from 'react';
import { FaMapMarkerAlt, FaStickyNote,FaPlus, FaCreditCard, FaInfoCircle, FaTimes, FaEdit, FaEye } from 'react-icons/fa';

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

interface AddressFields {
  streetAddress1: string;
  streetAddress2: string;
  city: string;
  provinceState: string;
  postalZip: string;
  country: string;
}

/** Static customer list for table (no API) */
interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  billingCity: string;
  billingProvinceState: string;
  country: string;
  customerType: string;
  terms: string;
  paymentMethod: string;
}

const STATIC_CUSTOMERS: CustomerRow[] = [
  { id: '1', name: 'ABC Transport Ltd', email: 'billing@abctransport.com', phone: '+1 416-555-0100', billingCity: 'Toronto', billingProvinceState: 'ON', country: 'Canada', customerType: 'Wholesale', terms: 'Net 30', paymentMethod: 'Credit Card' },
  { id: '2', name: 'Metro Freight Inc', email: 'accounts@metrofreight.com', phone: '+1 905-555-0200', billingCity: 'Mississauga', billingProvinceState: 'ON', country: 'Canada', customerType: 'Retail', terms: 'Due on Receipt', paymentMethod: 'Check' },
  { id: '3', name: 'Northern Logistics Co', email: 'ap@northernlogistics.ca', phone: '+1 403-555-0300', billingCity: 'Calgary', billingProvinceState: 'AB', country: 'Canada', customerType: 'Wholesale', terms: 'Net 45', paymentMethod: 'Bank Transfer' },
  { id: '4', name: 'Pacific Haulers', email: 'billing@pacifichaulers.com', phone: '+1 604-555-0400', billingCity: 'Vancouver', billingProvinceState: 'BC', country: 'Canada', customerType: 'Reseller', terms: 'Net 15', paymentMethod: 'Credit Card' },
  { id: '5', name: 'Eastern Distribution', email: 'finance@easterndist.com', phone: '+1 514-555-0500', billingCity: 'Montreal', billingProvinceState: 'QC', country: 'Canada', customerType: 'Wholesale', terms: 'Net 30', paymentMethod: 'Cash' },
];

const FleetMaintenanceCustomers = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>(STATIC_CUSTOMERS);
  const [addCustomerSidebarOpen, setAddCustomerSidebarOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [billing, setBilling] = useState<AddressFields>({
    streetAddress1: '',
    streetAddress2: '',
    city: '',
    provinceState: '',
    postalZip: '',
    country: '',
  });
  const [shipping, setShipping] = useState<AddressFields>({
    streetAddress1: '',
    streetAddress2: '',
    city: '',
    provinceState: '',
    postalZip: '',
    country: '',
  });
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [primaryPaymentMethod, setPrimaryPaymentMethod] = useState('');
  const [terms, setTerms] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [assignDefaultTaxCode, setAssignDefaultTaxCode] = useState(false);
  const [openingBalanceAmount, setOpeningBalanceAmount] = useState('');
  const [openingBalanceAsOf, setOpeningBalanceAsOf] = useState('');

  const paymentMethods = ['Credit Card', 'Cash', 'Check', 'Bank Transfer', 'Other'];
  const termsOptions = ['Due on Receipt', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];
  const customerTypes = ['Wholesale', 'Retail', 'Reseller', 'Government', 'Other'];

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleBillingChange = (field: keyof AddressFields, value: string) => {
    setBilling((prev) => ({ ...prev, [field]: value }));
    if (sameAsBilling) setShipping((prev) => ({ ...prev, [field]: value }));
  };

  const handleShippingChange = (field: keyof AddressFields, value: string) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    const valid = files.filter((f) => f.size <= MAX_FILE_BYTES);
    setAttachments((prev) => [...prev, ...valid]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const valid = files.filter((f) => f.size <= MAX_FILE_BYTES);
    setAttachments((prev) => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setCustomerName('');
    setEmail('');
    setPhone('');
    setContactPerson('');
    setErrors({});
    setBilling({ streetAddress1: '', streetAddress2: '', city: '', provinceState: '', postalZip: '', country: '' });
    setShipping({ streetAddress1: '', streetAddress2: '', city: '', provinceState: '', postalZip: '', country: '' });
    setSameAsBilling(true);
    setNotes('');
    setAttachments([]);
    setPrimaryPaymentMethod('');
    setTerms('');
    setCustomerType('');
    setBusinessNumber('');
    setAssignDefaultTaxCode(false);
    setOpeningBalanceAmount('');
    setOpeningBalanceAsOf('');
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const name = customerName.trim();
    if (!name) next.customerName = 'Customer name is required';
    const emailTrim = email.trim();
    if (!emailTrim) next.email = 'Email is required';
    else if (!isValidEmail(emailTrim)) next.email = 'Enter a valid email address';
    if (!billing.streetAddress1.trim()) next.streetAddress1 = 'Street address is required';
    if (!billing.city.trim()) next.city = 'City is required';
    if (!billing.provinceState.trim()) next.provinceState = 'Province / State is required';
    if (!billing.postalZip.trim()) next.postalZip = 'Postal / ZIP code is required';
    if (!billing.country.trim()) next.country = 'Country is required';
    if (!terms) next.terms = 'Payment terms are required';
    if (!primaryPaymentMethod) next.primaryPaymentMethod = 'Primary payment method is required';
    if (!customerType) next.customerType = 'Customer type is required';
    if (openingBalanceAmount.trim()) {
      const n = parseFloat(openingBalanceAmount.trim());
      if (Number.isNaN(n)) next.openingBalanceAmount = 'Enter a valid number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const id = String(customers.length + 1);
    setCustomers((prev) => [
      ...prev,
      {
        id,
        name: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        billingCity: billing.city.trim(),
        billingProvinceState: billing.provinceState.trim(),
        country: billing.country.trim(),
        customerType,
        terms,
        paymentMethod: primaryPaymentMethod,
      },
    ]);
    resetForm();
    setAddCustomerSidebarOpen(false);
    alert('Customer saved successfully.');
  };

  const handleCloseSidebar = () => {
    setAddCustomerSidebarOpen(false);
    setErrors({});
  };

  const renderAddressFields = (
    fields: AddressFields,
    onChange: (field: keyof AddressFields, value: string) => void,
    options?: { errors?: Record<string, string> }
  ) => {
    const err = options?.errors ?? {};
    return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address 1</label>
        <input
          type="text"
          value={fields.streetAddress1}
          onChange={(e) => onChange('streetAddress1', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${err.streetAddress1 ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Street address"
        />
        {err.streetAddress1 && <p className="text-red-500 text-xs mt-1">{err.streetAddress1}</p>}
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address 2</label>
        <input
          type="text"
          value={fields.streetAddress2}
          onChange={(e) => onChange('streetAddress2', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Apt, suite, unit, etc. (optional)"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
        <input
          type="text"
          value={fields.city}
          onChange={(e) => onChange('city', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${err.city ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="City"
        />
        {err.city && <p className="text-red-500 text-xs mt-1">{err.city}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Province / State</label>
        <input
          type="text"
          value={fields.provinceState}
          onChange={(e) => onChange('provinceState', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${err.provinceState ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Province or State"
        />
        {err.provinceState && <p className="text-red-500 text-xs mt-1">{err.provinceState}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Postal / ZIP Code</label>
        <input
          type="text"
          value={fields.postalZip}
          onChange={(e) => onChange('postalZip', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${err.postalZip ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Postal or ZIP code"
        />
        {err.postalZip && <p className="text-red-500 text-xs mt-1">{err.postalZip}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
        <input
          type="text"
          value={fields.country}
          onChange={(e) => onChange('country', e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${err.country ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Country"
        />
        {err.country && <p className="text-red-500 text-xs mt-1">{err.country}</p>}
      </div>
    </div>
  );
  };

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#EDF8FF' }}>
      <div className="relative w-full mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customers</h1>
      <p className="text-gray-600 mb-8">Manage customer addresses, notes, payments, and additional info.</p>

      {/* All Customers Table (static) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Customers</h2>
            <p className="text-sm text-gray-500 mt-0.5">Add new customers via the sidebar.</p>
          </div>
          <button
            type="button"
            onClick={() => setAddCustomerSidebarOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 !text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <FaPlus size={14} /> Add Customer
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Billing City</th>
                <th className="px-6 py-4">Province / State</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Customer Type</th>
                <th className="px-6 py-4">Terms</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                  <td className="px-6 py-4 text-gray-600">{row.email || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{row.phone || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{row.billingCity}</td>
                  <td className="px-6 py-4 text-gray-600">{row.billingProvinceState}</td>
                  <td className="px-6 py-4 text-gray-600">{row.country}</td>
                  <td className="px-6 py-4 text-gray-600">{row.customerType}</td>
                  <td className="px-6 py-4 text-gray-600">{row.terms}</td>
                  <td className="px-6 py-4 text-gray-600">{row.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button type="button" className="text-blue-600 hover:text-blue-800 p-1" title="View">
                        <FaEye size={14} />
                      </button>
                      <button type="button" className="text-gray-600 hover:text-gray-800 p-1" title="Edit">
                        <FaEdit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sidebar modal: Add new customer */}
      {addCustomerSidebarOpen && (
        <>
            <div
              className="fixed inset-0 bg-black/40 z-40"
              onClick={handleCloseSidebar}
              aria-hidden="true"
            />
          <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-xl z-50 flex flex-col">
            <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add new customer</h2>
              <button
                type="button"
                onClick={handleCloseSidebar}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                aria-label="Close"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Customer Name (required) */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.customerName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Company or contact name"
                />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
              </div>
              {/* Contact info: Email, Phone, Contact Person */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Contact & main info</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder="billing@company.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Name of main contact (optional)"
                    />
                  </div>
                </div>
              </div>
              {/* 1. Addresses */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-blue-600" />
                  Addresses
                </h3>
        <p className="text-sm text-gray-600 mb-4">
          Billing and shipping addresses for where the customer lives or works and where they receive goods.
        </p>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-800 mb-3">Billing Address</h3>
            {renderAddressFields(billing, handleBillingChange, { errors })}
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sameAsBilling}
                onChange={(e) => setSameAsBilling(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Same as billing address</span>
            </label>
          </div>
          {!sameAsBilling && (
            <div>
              <h3 className="text-sm font-medium text-gray-800 mb-3">Shipping Address</h3>
              {renderAddressFields(shipping, handleShippingChange)}
            </div>
          )}
        </div>
      </div>

              {/* 2. Notes and Attachments */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FaStickyNote className="text-blue-600" />
          Notes and Attachments
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Internal comments (e.g., Customer prefers afternoon deliveries)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            <p className="text-xs text-gray-500 mb-2">Contracts, tax-exempt certificates, or photos. Max {MAX_FILE_SIZE_MB} MB per file.</p>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
            >
              <input
                type="file"
                id="attachments"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="attachments" className="cursor-pointer">
                <p className="text-gray-600 mb-1">Click to select files or drag and drop</p>
                <p className="text-sm text-gray-500">PDF, images, documents (max {MAX_FILE_SIZE_MB} MB)</p>
              </label>
            </div>
            {attachments.length > 0 && (
              <ul className="mt-3 space-y-1">
                {attachments.map((file, i) => (
                  <li key={i} className="flex items-center justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      <FaTimes size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

              {/* 3. Payments */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FaCreditCard className="text-blue-600" />
          Payments
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          How you get paid and how the customer receives invoices.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Payment Method <span className="text-red-500">*</span></label>
            <p className="text-xs text-gray-500 mb-1">How this customer usually pays (e.g. Credit Card, Check).</p>
            <select
              value={primaryPaymentMethod}
              onChange={(e) => setPrimaryPaymentMethod(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.primaryPaymentMethod ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select...</option>
              {paymentMethods.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.primaryPaymentMethod && <p className="text-red-500 text-xs mt-1">{errors.primaryPaymentMethod}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terms <span className="text-red-500">*</span></label>
            <p className="text-xs text-gray-500 mb-1">When payment is due (e.g. Net 30 = due in 30 days).</p>
            <select
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.terms ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select...</option>
              {termsOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.terms && <p className="text-red-500 text-xs mt-1">{errors.terms}</p>}
          </div>
        </div>
      </div>

              {/* 4. Additional Info */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FaInfoCircle className="text-blue-600" />
          Additional Info
        </h3>
        <p className="text-sm text-gray-600 mb-3">Tax and accounting data.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type <span className="text-red-500">*</span></label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.customerType ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select...</option>
              {customerTypes.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.customerType && <p className="text-red-500 text-xs mt-1">{errors.customerType}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taxes – Business Number</label>
            <input
              type="text"
              value={businessNumber}
              onChange={(e) => setBusinessNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Business number"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={assignDefaultTaxCode}
              onChange={(e) => setAssignDefaultTaxCode(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Assign default tax code</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance – Amount</label>
              <p className="text-xs text-gray-500 mb-1">Optional – use when customer has an existing balance at onboarding.</p>
              <input
                type="text"
                value={openingBalanceAmount}
                onChange={(e) => setOpeningBalanceAmount(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.openingBalanceAmount ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="0.00"
              />
              {errors.openingBalanceAmount && <p className="text-red-500 text-xs mt-1">{errors.openingBalanceAmount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance – As of Date</label>
              <p className="text-xs text-gray-500 mb-1">Date of the opening balance (if used).</p>
              <input
                type="date"
                value={openingBalanceAsOf}
                onChange={(e) => setOpeningBalanceAsOf(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

            </div>
            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseSidebar}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium !text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save Customer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
    </div>
  );
};

export default FleetMaintenanceCustomers;
