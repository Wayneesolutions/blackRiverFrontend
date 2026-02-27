import { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import {
  FaFileInvoice,
  FaPlus,
  FaTimes,
  FaCheckCircle,
  FaEdit,
  FaPrint,
  FaTrash,
  FaEnvelope,
  FaClock,
  FaMoneyBillWave,
} from 'react-icons/fa';

import { getFleetCustomers, type FleetCustomer } from '../../../../axios/api/fleet.customers';
import { listVehicleServices, type VehicleServiceResponse } from '../../../../axios/api/vehicleService';
import { listGeneralRepairs, type GeneralRepairDto } from '../../../../axios/api/generalRepairs';
import { getCompany } from '../../../../axios/api/admin';
import {
  getFleetInvoices,
  getFleetInvoiceSummary,
  createFleetInvoice,
  updateFleetInvoice,
  deleteFleetInvoice,
  getFleetInvoiceById,
  emailFleetInvoice,
  updateFleetInvoiceStatus,
} from '../../../../axios/api/fleet.invoices';

const TERMS_OPTIONS = [
  { value: 'Net 15', days: 15 },
  { value: 'Net 30', days: 30 },
  { value: 'Net 45', days: 45 },
  { value: 'Net 60', days: 60 },
];

// Helper: convert service name to kebab-case key (same logic as Scheduled Services Log)
const nameToServiceType = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

interface CustomServiceDef {
  name: string;
}

// Map serviceType key (e.g. "oil-change") to human label using company custom services if available
const getServiceTypeLabel = (value: string, customServices?: CustomServiceDef[]) => {
  if (customServices && customServices.length) {
    const customMatch = customServices.find((service) => nameToServiceType(service.name) === value);
    if (customMatch) return customMatch.name;
  }

  const formatted = value.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  return formatted;
};

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
  productService: string; // stores option id (e.g. "service:<id>" or "repair:<id>")
  description: string;
  qty: number;
  rate: number;
  amount: number;
  salesTax: string;
}

interface ProductOption {
  id: string; // unique key used in <select> value
  label: string; // display label
  defaultDescription?: string;
  defaultRate?: number;
  defaultQty?: number;
  defaultServiceDate?: string; // YYYY-MM-DD
}

/** Invoice row for the table */
interface InvoiceRow {
  _id: string;
  invoiceDate: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';
  dueDate?: string;
  customerEmail?: string;
}

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
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    paidAmount: number;
    paidCount: number;
    unpaidAmount: number;
    unpaidCount: number;
    overdueAmount: number;
    overdueCount: number;
    totalAmount: number;
    totalCount: number;
  } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [printingPdfId, setPrintingPdfId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const INVOICE_STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const [customers, setCustomers] = useState<FleetCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);

  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [productOptionsLoading, setProductOptionsLoading] = useState(false);

  const [customServices, setCustomServices] = useState<CustomServiceDef[]>([]);

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

  // Labour charges (outside line items)
  const [labourHours, setLabourHours] = useState<number>(0);
  const [labourRate, setLabourRate] = useState<number>(0);
  const [labourTax, setLabourTax] = useState<string>('gst');

  const selectedCustomer = customers.find((c) => c._id === customerId);

  const formatBillingAddress = (cust?: FleetCustomer | null) => {
    if (!cust || !cust.billing) return '';
    const parts = [
      cust.billing.streetAddress1,
      cust.billing.streetAddress2,
      cust.billing.city,
      cust.billing.provinceState,
      cust.billing.postalZip,
      cust.billing.country,
    ]
      .map((x) => x?.trim())
      .filter(Boolean);
    return parts.join(', ');
  };

  useEffect(() => {
    const loadCustomers = async () => {
      setCustomersLoading(true);
      setCustomersError(null);
      try {
        const res = await getFleetCustomers();
        if (res?.success && Array.isArray(res.data)) {
          setCustomers(res.data);
        } else {
          setCustomers([]);
          setCustomersError(res?.message || 'Unable to load customers.');
        }
      } catch (err: any) {
        console.error('Failed to load fleet customers', err);
        setCustomers([]);
        setCustomersError(err?.response?.data?.message || err?.message || 'Unable to load customers.');
      } finally {
        setCustomersLoading(false);
      }
    };

    const loadProductOptions = async () => {
      setProductOptionsLoading(true);
      try {
        const [companyRes, servicesRes, repairsRes] = await Promise.all([
          getCompany(),
          listVehicleServices({ status: 'completed' }),
          listGeneralRepairs(),
        ]);

        const companyCustomServices: CustomServiceDef[] =
          companyRes?.success && companyRes?.data?.maintenancePolicies?.customServices
            ? companyRes.data.maintenancePolicies.customServices
            : [];
        setCustomServices(companyCustomServices);

        const completedServices: VehicleServiceResponse[] =
          servicesRes?.success && Array.isArray(servicesRes.data)
            ? (servicesRes.data as VehicleServiceResponse[]).filter((s) => s.status === 'completed')
            : [];

        const allRepairs: GeneralRepairDto[] =
          repairsRes?.success && Array.isArray(repairsRes.data)
            ? repairsRes.data
            : [];

        const verifiedRepairs = allRepairs.filter(
          (r: any) => r.status === 'completed' && r.verificationStatus === 'verified',
        );

        const serviceOptions: ProductOption[] = completedServices.map((s) => {
          const labelBase = getServiceTypeLabel(String(s.serviceType), companyCustomServices);
          const unit = s.unitNumber || s.vehicleId?.internalId || s.vehicleId?.plateNumber || '';
          const dateStr = (s.serviceDate || s.dueDate || '').split('T')[0] || '';
          const labelParts = ['Service:', labelBase];
          if (unit) {
            labelParts.push(`(Unit ${unit}${dateStr ? `, ${dateStr}` : ''})`);
          }
          const label = labelParts.join(' ');

          const defaultDescriptionParts: string[] = [];
          if (unit) defaultDescriptionParts.push(`Unit ${unit}`);
          defaultDescriptionParts.push(labelBase);
          if (s.notes) defaultDescriptionParts.push(String(s.notes));

          return {
            id: `service:${s._id}`,
            label,
            defaultDescription: defaultDescriptionParts.join(' - '),
            defaultRate: s.amount ?? undefined,
            defaultQty: 1,
            defaultServiceDate: dateStr,
          };
        });

        const repairOptions: ProductOption[] = verifiedRepairs.map((r: any) => {
          const details: string =
            r.repairDetails || r.description || 'Verified maintenance order';
          const shortDetails =
            details.length > 80 ? `${details.slice(0, 77)}...` : details;
          const unit = r.unitNumber || '';
          const dateStr = (r.completionDate || r.serviceDate || '').split('T')[0] || '';
          const label = `Maintenance: ${shortDetails}`;

          const defaultDescriptionParts: string[] = [];
          if (unit) defaultDescriptionParts.push(`Unit ${unit}`);
          defaultDescriptionParts.push(details);

          return {
            id: `repair:${r._id}`,
            label,
            defaultDescription: defaultDescriptionParts.join(' - '),
            defaultRate: (r as any).completionTotalAmount ?? undefined,
            defaultQty: 1,
            defaultServiceDate: dateStr,
          };
        });

        setProductOptions([...serviceOptions, ...repairOptions]);
      } catch (err) {
        console.error('Failed to load invoice product/service options', err);
      } finally {
        setProductOptionsLoading(false);
      }
    };

    loadCustomers();
    loadProductOptions();
    loadInvoices();
    loadSummary();
  }, []);

  // Load invoices from API
  const loadInvoices = async () => {
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      const response = await getFleetInvoices();
      if (response?.success && Array.isArray(response.data)) {
        setInvoices(response.data);
      } else {
        setInvoices([]);
        setInvoicesError(response?.message || 'Failed to load invoices');
      }
    } catch (err: any) {
      setInvoices([]);
      setInvoicesError(err?.response?.data?.message || err?.message || 'Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  };

  // Load invoice summary
  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await getFleetInvoiceSummary();
      if (response?.success && response.data) {
        setSummary(response.data);
      } else {
        setSummary(null);
      }
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Auto-hide notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // When customer changes, auto-fill email and billing address
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const c = customers.find((x) => x._id === id);
    if (c) {
      setCustomerEmail(c.email || '');
      setBillingAddress(formatBillingAddress(c));
      if (!terms && c.terms) {
        setTerms(c.terms);
      }
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

        // If product/service changed, always update description, rate, qty, and service date
        if (updates.productService !== undefined) {
          if (updates.productService === '') {
            // If cleared, reset to defaults
            next.description = '';
            next.rate = 0;
            next.qty = 1;
            next.serviceDate = '';
          } else {
            const selectedOption = productOptions.find((opt) => opt.id === updates.productService);
            if (selectedOption) {
              // Always update all fields when a product/service is selected
              if (selectedOption.defaultDescription) {
                next.description = selectedOption.defaultDescription;
              }
              if (selectedOption.defaultRate !== undefined) {
                next.rate = selectedOption.defaultRate;
              }
              if (selectedOption.defaultQty !== undefined) {
                next.qty = selectedOption.defaultQty;
              }
              if (selectedOption.defaultServiceDate) {
                next.serviceDate = selectedOption.defaultServiceDate;
              }
            }
          }
        }

        // Always recalculate amount when qty or rate changes (including auto-filled values)
        if ('qty' in updates || 'rate' in updates || updates.productService !== undefined) {
          next.amount = (next.qty ?? 1) * (next.rate ?? 0);
        }
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

  // Calculate items subtotal and tax
  const itemsSubtotal = useMemo(() => lineItems.reduce((sum, i) => sum + i.amount, 0), [lineItems]);
  const itemsTax = useMemo(() => {
    return lineItems.reduce((sum, item) => {
      const tax = allTaxes.find((t) => t.id === item.salesTax);
      const rate = tax ? tax.percent / 100 : 0;
      return sum + item.amount * rate;
    }, 0);
  }, [lineItems, allTaxes]);

  // Calculate labour amount and tax
  const labourAmount = useMemo(() => labourHours * labourRate, [labourHours, labourRate]);
  const labourTaxAmount = useMemo(() => {
    const tax = allTaxes.find((t) => t.id === labourTax);
    const rate = tax ? tax.percent / 100 : 0;
    return labourAmount * rate;
  }, [labourAmount, labourTax, allTaxes]);

  // Final totals
  const subtotal = itemsSubtotal + labourAmount; // Items + Labour
  const totalTax = itemsTax + labourTaxAmount; // Items tax + Labour tax
  const totalBalance = subtotal + totalTax;

  const handleSaveAndClose = async () => {
    // Validation
    if (!customerId || !selectedCustomer) {
      setNotification({ type: 'error', message: 'Please select a customer' });
      return;
    }
    if (lineItems.length === 0 || lineItems.some(item => !item.description || item.rate === 0)) {
      setNotification({ type: 'error', message: 'Please add at least one valid line item with description and rate' });
      return;
    }

    setSaving(true);
    try {
      // Build invoice items from line items
      const invoiceItems = lineItems.map((item) => {
        const tax = allTaxes.find((t) => t.id === item.salesTax);
        return {
          serviceDate: item.serviceDate || null,
          productService: item.productService || null,
          description: item.description,
          quantity: item.qty,
          unitPrice: item.rate,
          totalPrice: item.amount,
          taxId: tax?.id || null,
          taxName: tax?.name || null,
          taxPercent: tax?.percent || 0,
        };
      });

      // Build billing address from customer
      const billingAddrParts: string[] = [];
      if (selectedCustomer.billing) {
        const b = selectedCustomer.billing;
        if (b.streetAddress1) billingAddrParts.push(b.streetAddress1);
        if (b.streetAddress2) billingAddrParts.push(b.streetAddress2);
        const cityParts: string[] = [];
        if (b.city) cityParts.push(b.city);
        if (b.provinceState) cityParts.push(b.provinceState);
        if (b.postalZip) cityParts.push(b.postalZip);
        if (cityParts.length > 0) billingAddrParts.push(cityParts.join(', '));
        if (b.country) billingAddrParts.push(b.country);
      }
      const billingAddressStr = billingAddrParts.length > 0 ? billingAddrParts.join('\n') : billingAddress;

      // Get labour tax details
      const labourTaxOption = allTaxes.find((t) => t.id === labourTax);

      const invoiceData = {
        invoiceNumber: invoiceNo || undefined, // Let backend generate if empty
        invoiceDate: invoiceDate,
        customerName: selectedCustomer.name,
        customerEmail: customerEmail || selectedCustomer.email || null,
        customerPhone: selectedCustomer.phone || null,
        customerAddress: billingAddressStr || null,
        customerId: customerId,
        terms: terms || null,
        items: invoiceItems,
        labourHours: labourHours || 0,
        labourRate: labourRate || 0,
        labourTaxId: labourTaxOption?.id || null,
        labourTaxName: labourTaxOption?.name || null,
        labourTaxPercent: labourTaxOption?.percent || 0,
        dueDate: dueDate || invoiceDate, // Use dueDate if set, otherwise invoiceDate
        messageOnInvoice: messageOnInvoice || null,
        notes: null,
        status: 'draft',
      };

      let response;
      if (editingInvoiceId) {
        response = await updateFleetInvoice(editingInvoiceId, invoiceData);
      } else {
        response = await createFleetInvoice(invoiceData);
      }

      if (response?.success) {
        setNotification({ 
          type: 'success', 
          message: editingInvoiceId ? 'Invoice updated successfully' : 'Invoice created successfully' 
        });
        setSidebarOpen(false);
        resetForm();
        await Promise.all([loadInvoices(), loadSummary()]);
      } else {
        setNotification({ type: 'error', message: response?.message || 'Failed to save invoice' });
      }
    } catch (err: any) {
      setNotification({ 
        type: 'error', 
        message: err?.response?.data?.message || err?.message || 'Failed to save invoice' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      return;
    }

    setDeleting(invoiceId);
    try {
      const response = await deleteFleetInvoice(invoiceId);
      if (response?.success) {
        setNotification({ type: 'success', message: 'Invoice deleted successfully' });
        await Promise.all([loadInvoices(), loadSummary()]);
      } else {
        setNotification({ type: 'error', message: response?.message || 'Failed to delete invoice' });
      }
    } catch (err: any) {
      setNotification({ 
        type: 'error', 
        message: err?.response?.data?.message || err?.message || 'Failed to delete invoice' 
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleEditInvoice = async (invoiceId: string) => {
    try {
      const response = await getFleetInvoiceById(invoiceId);
      if (response?.success && response.data) {
        const invoice = response.data;
        setEditingInvoiceId(invoice._id);
        
        // Set customer
        const customerIdValue = invoice.customerId 
          ? (typeof invoice.customerId === 'object' && invoice.customerId._id 
              ? invoice.customerId._id 
              : invoice.customerId)
          : null;
        
        if (customerIdValue) {
          setCustomerId(customerIdValue);
          const customer = customers.find(c => c._id === customerIdValue);
          if (customer) {
            setCustomerEmail(customer.email || '');
            // Build billing address
            if (customer.billing) {
              const b = customer.billing;
              const parts: string[] = [];
              if (b.streetAddress1) parts.push(b.streetAddress1);
              if (b.streetAddress2) parts.push(b.streetAddress2);
              const cityParts: string[] = [];
              if (b.city) cityParts.push(b.city);
              if (b.provinceState) cityParts.push(b.provinceState);
              if (b.postalZip) cityParts.push(b.postalZip);
              if (cityParts.length > 0) parts.push(cityParts.join(', '));
              if (b.country) parts.push(b.country);
              setBillingAddress(parts.join('\n'));
            } else {
              setBillingAddress(invoice.customerAddress || '');
            }
          } else {
            // Customer not found in list, use invoice data
            setCustomerEmail(invoice.customerEmail || '');
            setBillingAddress(invoice.customerAddress || '');
          }
        } else {
          setCustomerId('');
          setCustomerEmail(invoice.customerEmail || '');
          setBillingAddress(invoice.customerAddress || '');
        }
        
        // Set dates and terms
        const invoiceDateStr = invoice.invoiceDate 
          ? (typeof invoice.invoiceDate === 'string' 
              ? invoice.invoiceDate.split('T')[0] 
              : new Date(invoice.invoiceDate).toISOString().split('T')[0])
          : new Date().toISOString().split('T')[0];
        const dueDateStr = invoice.dueDate 
          ? (typeof invoice.dueDate === 'string' 
              ? invoice.dueDate.split('T')[0] 
              : new Date(invoice.dueDate).toISOString().split('T')[0])
          : '';
        setInvoiceDate(invoiceDateStr);
        setDueDate(dueDateStr);
        setTerms(invoice.terms || '');
        setInvoiceNo(invoice.invoiceNumber || '');
        setMessageOnInvoice(invoice.messageOnInvoice || '');
        
        // Set line items
        if (Array.isArray(invoice.items) && invoice.items.length > 0) {
          const items: LineItem[] = invoice.items.map((item: any, idx: number) => {
            const taxId = item.taxId || 'gst';
            return {
              id: String(idx + 1),
              serviceDate: item.serviceDate || '',
              productService: item.productService || '',
              description: item.description || '',
              qty: item.quantity || 1,
              rate: item.unitPrice || 0,
              amount: item.totalPrice || 0,
              salesTax: taxId,
            };
          });
          setLineItems(items);
        } else {
          setLineItems([{ id: '1', serviceDate: '', productService: '', description: '', qty: 1, rate: 0, amount: 0, salesTax: 'gst' }]);
        }

        // Load labour charges
        setLabourHours(Number(invoice.labourHours) || 0);
        setLabourRate(Number(invoice.labourRate) || 0);
        if (invoice.labourTaxId) {
          setLabourTax(invoice.labourTaxId);
        } else {
          setLabourTax('gst');
        }
        
        setSidebarOpen(true);
      } else {
        setNotification({ type: 'error', message: 'Failed to load invoice details' });
      }
    } catch (err: any) {
      setNotification({ 
        type: 'error', 
        message: err?.response?.data?.message || err?.message || 'Failed to load invoice details' 
      });
    }
  };

  const handleSendInvoiceEmail = async (invoiceId: string) => {
    try {
      setEmailingId(invoiceId);
      const response = await emailFleetInvoice(invoiceId);
      if (response?.success) {
        setNotification({ type: 'success', message: 'Invoice email sent successfully' });
      } else {
        setNotification({
          type: 'error',
          message: response?.message || 'Failed to send invoice email',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to send invoice email',
      });
    } finally {
      setEmailingId(null);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    setUpdatingStatusId(invoiceId);
    try {
      const response = await updateFleetInvoiceStatus(invoiceId, newStatus);
      if (response?.success) {
        setNotification({ type: 'success', message: 'Invoice status updated successfully' });
        await Promise.all([loadInvoices(), loadSummary()]);
      } else {
        setNotification({
          type: 'error',
          message: response?.message || 'Failed to update invoice status',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err?.response?.data?.message || err?.message || 'Failed to update invoice status',
      });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDownloadInvoicePDF = async (invoiceId: string) => {
    setPrintingPdfId(invoiceId);
    try {
      const response = await getFleetInvoiceById(invoiceId);
      if (!response?.success || !response.data) {
        setNotification({ type: 'error', message: 'Failed to load invoice for PDF' });
        return;
      }
      const invoice = response.data;

      let companyData: { companyName?: string; address?: string; contactPhone?: string; contactEmail?: string; taxNumber?: string; logoUrl?: string } | null = null;
      try {
        const companyRes = await getCompany();
        if (companyRes?.success && companyRes?.data) {
          companyData = companyRes.data;
        }
      } catch {
        // Use defaults if company fetch fails
      }

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      const textColor: [number, number, number] = [31, 41, 55];
      const grayColor: [number, number, number] = [107, 114, 128];

      let yPos = margin;

      const checkPageBreak = (requiredHeight: number) => {
        if (yPos + requiredHeight > pageHeight - 25) {
          doc.addPage();
          yPos = margin;
        }
      };

      // Company logo
      if (companyData?.logoUrl) {
        try {
          const res = await fetch(companyData.logoUrl);
          const blob = await res.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          doc.addImage(base64, 'PNG', margin, yPos, 45, 25);
        } catch {
          // Skip logo on error
        }
      }

      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...textColor);
      doc.text('FLEET INVOICE', pageWidth - margin, yPos + 12, { align: 'right' });
      yPos += 35;

      const leftCol = margin;
      const rightCol = pageWidth / 2 + 10;
      const colWidth = (pageWidth - margin * 2) / 2 - 10;

      // From (Company)
      if (companyData) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(companyData.companyName || 'Company', leftCol, yPos);
        yPos += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        if (companyData.address) {
          const lines = doc.splitTextToSize(companyData.address, colWidth);
          doc.text(lines, leftCol, yPos);
          yPos += lines.length * 5;
        }
        if (companyData.contactPhone) {
          doc.text(`Phone: ${companyData.contactPhone}`, leftCol, yPos);
          yPos += 5;
        }
        if (companyData.contactEmail) {
          doc.text(`Email: ${companyData.contactEmail}`, leftCol, yPos);
          yPos += 5;
        }
        if (companyData.taxNumber) {
          doc.text(`GST No: ${companyData.taxNumber}`, leftCol, yPos);
          yPos += 5;
        }
        doc.setTextColor(...textColor);
      }

      // Bill To
      let rightY = 55;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', rightCol, rightY);
      rightY += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(invoice.customerName || '—', rightCol, rightY);
      rightY += 6;
      if (invoice.customerEmail) {
        doc.text(invoice.customerEmail, rightCol, rightY);
        rightY += 5;
      }
      if (invoice.customerAddress) {
        const addrLines = doc.splitTextToSize(invoice.customerAddress, colWidth);
        doc.text(addrLines, rightCol, rightY);
        rightY += addrLines.length * 5;
      }
      if (invoice.customerPhone) {
        doc.text(`Phone: ${invoice.customerPhone}`, rightCol, rightY);
        rightY += 5;
      }

      yPos = Math.max(yPos, rightY) + 12;

      // Invoice details
      doc.setFontSize(9);
      doc.setTextColor(...grayColor);
      const invDate = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
      const dueDateStr = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
      doc.text(`Invoice #: ${invoice.invoiceNumber || '—'}`, leftCol, yPos);
      doc.text(`Invoice Date: ${invDate}`, leftCol, yPos + 5);
      doc.text(`Due Date: ${dueDateStr}`, leftCol, yPos + 10);
      if (invoice.terms) {
        doc.text(`Terms: ${invoice.terms}`, leftCol, yPos + 15);
        yPos += 20;
      } else {
        yPos += 15;
      }
      doc.setTextColor(...textColor);

      // Message on invoice
      if (invoice.messageOnInvoice) {
        checkPageBreak(15);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...grayColor);
        const msgLines = doc.splitTextToSize(invoice.messageOnInvoice, contentWidth);
        doc.text(msgLines, leftCol, yPos);
        yPos += msgLines.length * 5 + 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textColor);
      }

      // Line items table - fixed column layout
      checkPageBreak(25);
      yPos += 5;
      const tableLeft = leftCol;
      const colDateLeft = tableLeft;
      const colDateWidth = 26;
      const colDescLeft = tableLeft + colDateWidth + 4;
      const colDescWidth = 82;
      const colQtyLeft = colDescLeft + colDescWidth + 4;
      const colQtyWidth = 12;
      const colRateLeft = colQtyLeft + colQtyWidth + 4;
      const colRateWidth = 22;
      const colAmountLeft = colRateLeft + colRateWidth + 4;
      const tableRight = pageWidth - margin;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', colDateLeft, yPos);
      doc.text('Description', colDescLeft, yPos);
      doc.text('QTY', colQtyLeft + colQtyWidth / 2, yPos, { align: 'center' });
      doc.text('Rate', colRateLeft + colRateWidth, yPos, { align: 'right' });
      doc.text('Amount', tableRight, yPos, { align: 'right' });
      doc.setDrawColor(200, 200, 200);
      doc.line(tableLeft, yPos + 3, tableRight, yPos + 3);
      yPos += 8;

      doc.setFont('helvetica', 'normal');
      const items = Array.isArray(invoice.items) ? invoice.items : [];
      const lineHeight = 6;
      for (const item of items) {
        const desc = (item.description || '—').toString().trim();
        const descLines = doc.splitTextToSize(desc, colDescWidth);
        const rowHeight = Math.max(descLines.length * lineHeight, 10);
        checkPageBreak(rowHeight);

        const svcDate = item.serviceDate ? new Date(item.serviceDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
        const qty = Number(item.quantity) || 1;
        const rate = Number(item.unitPrice) || 0;
        const amt = Number(item.totalPrice) || rate * qty;

        const rowYStart = yPos;
        doc.setFontSize(9);

        // Date - single line, left-aligned
        doc.text(svcDate, colDateLeft, rowYStart);

        // Description - can wrap to multiple lines
        doc.text(descLines, colDescLeft, rowYStart);

        // QTY, Rate, Amount - aligned with first line of description
        doc.text(String(qty), colQtyLeft + colQtyWidth / 2, rowYStart, { align: 'center' });
        doc.text(`$${rate.toFixed(2)}`, colRateLeft + colRateWidth, rowYStart, { align: 'right' });
        doc.text(`$${amt.toFixed(2)}`, tableRight, rowYStart, { align: 'right' });

        yPos += rowHeight;
      }

      // Labour Charges section (if applicable)
      const labourHours = Number(invoice.labourHours) || 0;
      const labourRate = Number(invoice.labourRate) || 0;
      const labourAmount = Number(invoice.labourAmount) || labourHours * labourRate;
      const labourTaxPercent = Number(invoice.labourTaxPercent) || 0;
      const labourTaxAmount = labourAmount * (labourTaxPercent / 100);

      if (labourAmount > 0) {
        yPos += 10;
        checkPageBreak(20);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Labour Charges', tableLeft, yPos);
        yPos += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Hours: ${labourHours.toFixed(1)}`, tableLeft, yPos);
        doc.text(`Hourly Rate: $${labourRate.toFixed(2)}`, colDescLeft, yPos);
        doc.text(`Labour Amount: $${labourAmount.toFixed(2)}`, tableRight, yPos, { align: 'right' });
        yPos += 6;

        if (labourTaxAmount > 0) {
          doc.text(`Labour Tax (${labourTaxPercent}%): $${labourTaxAmount.toFixed(2)}`, tableRight, yPos, { align: 'right' });
          yPos += 6;
        }
      }

      yPos += 10;
      checkPageBreak(35);

      // Calculate breakdown
      const itemsSubtotal = items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 1;
        const rate = Number(item.unitPrice) || 0;
        return sum + (qty * rate);
      }, 0);
      const itemsTax = items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 1;
        const rate = Number(item.unitPrice) || 0;
        const itemTotal = qty * rate;
        const taxPercent = Number(item.taxPercent) || 0;
        return sum + (itemTotal * taxPercent / 100);
      }, 0);

      // Totals
      const subtotal = Number(invoice.subtotal) || (itemsSubtotal + labourAmount);
      const taxAmount = Number(invoice.taxAmount) || (itemsTax + labourTaxAmount);
      const total = Number(invoice.total) || subtotal + taxAmount;

      // Show breakdown if both items and labour exist
      if (itemsSubtotal > 0 && labourAmount > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('Items Subtotal:', colRateLeft + colRateWidth, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.text(`$${itemsSubtotal.toFixed(2)}`, tableRight, yPos, { align: 'right' });
        yPos += 7;

        doc.setFont('helvetica', 'bold');
        doc.text('Labour Charges:', colRateLeft + colRateWidth, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.text(`$${labourAmount.toFixed(2)}`, tableRight, yPos, { align: 'right' });
        yPos += 7;
      }

      doc.setFont('helvetica', 'bold');
      doc.text('Subtotal:', colRateLeft + colRateWidth, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(`$${subtotal.toFixed(2)}`, tableRight, yPos, { align: 'right' });
      yPos += 7;

      // Show tax breakdown if both items tax and labour tax exist
      if (itemsTax > 0 && labourTaxAmount > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Items Tax: $${itemsTax.toFixed(2)}`, tableRight, yPos, { align: 'right' });
        yPos += 5;
        doc.text(`Labour Tax: $${labourTaxAmount.toFixed(2)}`, tableRight, yPos, { align: 'right' });
        yPos += 5;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Tax:', colRateLeft + colRateWidth, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(`$${taxAmount.toFixed(2)}`, tableRight, yPos, { align: 'right' });
      yPos += 12;

      doc.rect(margin, yPos, contentWidth, 18);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Balance Due', margin + 5, yPos + 12);
      doc.setFontSize(14);
      doc.text(`$${total.toFixed(2)}`, pageWidth - margin - 5, yPos + 12, { align: 'right' });
      yPos += 25;

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...grayColor);
      doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 15, { align: 'center' });

      const fileName = `Fleet_Invoice_${(invoice.invoiceNumber || invoiceId.slice(-8)).replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
      setNotification({ type: 'success', message: 'Invoice PDF downloaded successfully' });
    } catch (err: any) {
      console.error('Error generating invoice PDF:', err);
      setNotification({ type: 'error', message: err?.message || 'Failed to download invoice PDF' });
    } finally {
      setPrintingPdfId(null);
    }
  };

  const resetForm = () => {
    setEditingInvoiceId(null);
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
    setLabourHours(0);
    setLabourRate(0);
    setLabourTax('gst');
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
            <p className="text-gray-600 mt-1">Create and manage fleet invoices</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setSidebarOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-colors"
          >
            <FaPlus size={14} /> New Invoice
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Paid</p>
                {summaryLoading ? (
                  <p className="mt-1 text-xl font-bold text-gray-400">—</p>
                ) : (
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    ${(summary?.paidAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                )}
                {!summaryLoading && summary && (
                  <p className="mt-0.5 text-xs text-gray-500">{summary.paidCount} invoice{summary.paidCount !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <FaCheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Unpaid</p>
                {summaryLoading ? (
                  <p className="mt-1 text-xl font-bold text-gray-400">—</p>
                ) : (
                  <p className="mt-1 text-2xl font-bold text-amber-600">
                    ${(summary?.unpaidAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                )}
                {!summaryLoading && summary && (
                  <p className="mt-0.5 text-xs text-gray-500">{summary.unpaidCount} invoice{summary.unpaidCount !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <FaMoneyBillWave className="text-amber-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Overdue</p>
                {summaryLoading ? (
                  <p className="mt-1 text-xl font-bold text-gray-400">—</p>
                ) : (
                  <p className="mt-1 text-2xl font-bold text-orange-600">
                    ${(summary?.overdueAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                )}
                {!summaryLoading && summary && (
                  <p className="mt-0.5 text-xs text-gray-500">{summary.overdueCount} invoice{summary.overdueCount !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <FaClock className="text-orange-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total</p>
                {summaryLoading ? (
                  <p className="mt-1 text-xl font-bold text-gray-400">—</p>
                ) : (
                  <p className="mt-1 text-2xl font-bold text-blue-600">
                    ${(summary?.totalAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                )}
                {!summaryLoading && summary && (
                  <p className="mt-0.5 text-xs text-gray-500">{summary.totalCount} invoice{summary.totalCount !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <FaFileInvoice className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
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
                {invoicesLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Loading invoices...
                    </td>
                  </tr>
                ) : invoicesError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-red-600">
                      {invoicesError}
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No invoices yet. Create one using &quot;New Invoice&quot;.
                    </td>
                  </tr>
                ) : (
                  invoices.map((row) => {
                    const isOverdue = row.status === 'overdue' || 
                      (row.status !== 'paid' && row.dueDate && new Date(row.dueDate) < new Date());
                    const displayStatus = isOverdue ? 'overdue' : row.status;
                    
                    return (
                      <tr
                        key={row._id}
                        className={`hover:bg-blue-50/30 ${displayStatus === 'overdue' ? 'border-t-4 border-t-orange-500 bg-orange-50/20' : ''}`}
                      >
                        <td className="px-6 py-4 text-gray-900">
                          {row.invoiceDate 
                            ? formatDisplayDate(typeof row.invoiceDate === 'string' ? row.invoiceDate.split('T')[0] : new Date(row.invoiceDate).toISOString().split('T')[0])
                            : '—'}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{row.invoiceNumber || '—'}</td>
                        <td className="px-6 py-4 text-gray-700">{row.customerName || '—'}</td>
                        <td className="px-6 py-4 text-gray-700 font-medium">${(row.total || 0).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <select
                            value={INVOICE_STATUS_OPTIONS.some((o) => o.value === row.status) ? row.status : 'draft'}
                            onChange={(e) => handleStatusChange(row._id, e.target.value)}
                            disabled={updatingStatusId === row._id}
                            className={`min-w-[100px] px-2.5 py-1.5 text-sm font-medium rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-60 disabled:cursor-not-allowed ${
                              row.status === 'paid'
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : row.status === 'sent'
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : row.status === 'cancelled'
                                ? 'border-gray-200 bg-gray-50 text-gray-600'
                                : displayStatus === 'overdue'
                                ? 'border-orange-200 bg-orange-50 text-orange-600'
                                : 'border-gray-200 bg-gray-50 text-gray-600'
                            }`}
                          >
                            {INVOICE_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {updatingStatusId === row._id && (
                            <span className="ml-2 text-xs text-gray-500">Updating…</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button 
                              type="button" 
                              onClick={() => handleEditInvoice(row._id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                              title="View/Edit"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendInvoiceEmail(row._id)}
                              disabled={emailingId === row._id}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                              title={emailingId === row._id ? 'Sending…' : 'Send Email'}
                            >
                              <FaEnvelope size={14} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDeleteInvoice(row._id)}
                              disabled={deleting === row._id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" 
                              title="Delete"
                            >
                              <FaTrash size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoicePDF(row._id)}
                              disabled={printingPdfId === row._id}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                              title={printingPdfId === row._id ? 'Generating PDF…' : 'Download PDF'}
                            >
                              <FaPrint size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
              <h2 className="text-xl font-semibold text-gray-900">{editingInvoiceId ? 'Edit Invoice' : 'New Invoice'}</h2>
              <button type="button" onClick={() => setSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
                <FaTimes size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
              {notification && (
                <div className={`rounded-lg border px-4 py-3 ${
                  notification.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}>
                  {notification.message}
                </div>
              )}
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
                        {customers.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      {customersLoading && (
                        <p className="mt-1 text-xs text-gray-500">Loading customers...</p>
                      )}
                      {customersError && !customersLoading && (
                        <p className="mt-1 text-xs text-red-600">{customersError}</p>
                      )}
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
                            {productOptions.map((opt) => (
                              <option key={opt.id} value={opt.id}>{opt.label}</option>
                            ))}
                          </select>
                          {productOptionsLoading && (
                            <p className="mt-1 text-xs text-gray-500">Loading services and maintenance orders...</p>
                          )}
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

              {/* Labour Charges */}
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Labour Charges</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hours <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={labourHours || ''}
                      onChange={(e) => setLabourHours(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate ($) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={labourRate || ''}
                      onChange={(e) => setLabourRate(Number(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
                    <select
                      value={labourTax}
                      onChange={(e) => setLabourTax(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {allTaxes.map((tax) => (
                        <option key={tax.id} value={tax.id}>
                          {tax.name} {tax.percent > 0 ? `(${tax.percent}%)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {labourAmount > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Labour Amount:</span>
                      <span className="text-lg font-semibold text-blue-600">
                        ${labourAmount.toFixed(2)}
                      </span>
                    </div>
                    {labourTaxAmount > 0 && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-gray-600">Labour Tax:</span>
                        <span className="text-sm font-medium text-gray-700">
                          ${labourTaxAmount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
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
                    {itemsSubtotal > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Items Subtotal</span>
                        <span className="font-medium text-gray-900">${itemsSubtotal.toFixed(2)}</span>
                      </div>
                    )}
                    {labourAmount > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Labour Charges</span>
                        <span className="font-medium text-gray-900">${labourAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                    </div>
                    {itemsTax > 0 && labourTaxAmount > 0 && (
                      <>
                        <div className="flex justify-between text-xs text-gray-500 pl-2">
                          <span>Items Tax</span>
                          <span>${itemsTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 pl-2">
                          <span>Labour Tax</span>
                          <span>${labourTaxAmount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
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
              <button 
                type="button" 
                onClick={() => {
                  setSidebarOpen(false);
                  resetForm();
                }} 
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveAndClose}
                disabled={saving}
                className={`px-5 py-2.5 text-sm font-medium !text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Saving...' : editingInvoiceId ? 'Update Invoice' : 'Save and close'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FleetInvoicesPage;
