import React, { useState, useEffect, useRef } from 'react';
import { 
  FaTicketAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaSearch, 
  FaFilter,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaGavel,
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaTimes
} from 'react-icons/fa';
import {
  getTickets,
  getTicketStats,
  createTicket,
  updateTicket,
  deleteTicket
} from '../../../../axios/api/admin';
import { listVehicle } from '../../../../axios/api/distapcher';
import { listDriver } from '../../../../axios/api/distapcher';
import { listTrailers } from '../../../../axios/api/distapcher';

// Types
interface Ticket {
  _id: string;
  ticketNumber: string;
  country: 'usa' | 'canada';
  violationType: string;
  violationDescription: string;
  dateIssued: string;
  location: string; // Province (Canada) or State (USA)
  amount: number; // Fine Amount
  finalAmount?: number; // Final amount after reduction
  status: 'paid' | 'unpaid' | 'fight' | 'dismissed' | 'reduced';
  outcome?: 'paid' | 'reduced' | 'dismissed' | 'on fight' | 'unpaid';
  driver: {
    _id: string;
    name?: string;
    email?: string;
  } | string;
  vehicle: {
    _id: string;
    internalId?: string;
    plateNumber?: string;
    make?: string;
    model?: string;
    year?: number;
  } | string;
  unitNumber?: string; // Unit number (separate from vehicle)
  trailerNumber?: string; // Trailer number
  officerName: string;
  dueDate: string;
  courtDate?: string;
  fightingBy?: 'company' | 'lawyer'; // Who is fighting the ticket
  lawyerDetails?: LawyerDetails;
  notes?: string;
  paidDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  createdAt: string;
}

interface Vehicle {
  _id: string;
  internalId: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
}

interface Driver {
  _id: string;
  name: string;
  email: string;
}

interface Trailer {
  _id: string;
  trailer: string;
  internalId?: string;
  plateNumber?: string;
}

interface LawyerDetails {
  name: string;
  firm: string;
  phone: string;
  email: string;
  address: string;
  caseNumber?: string;
  courtDate?: string;
  status: 'active' | 'closed' | 'pending';
}

interface TicketStats {
  total: number;
  paid: number;
  unpaid: number;
  fight: number;
  dismissed: number;
  reduced: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  fightAmount: number;
  dismissedAmount: number;
  reducedAmount: number;
  usaTotal?: number;
  canadaTotal?: number;
}

// Toast Notification Types
type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface ToastNotification {
  id: number;
  type: NotificationType;
  message: string;
}

// Toast Notification Component
const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  const icons = {
    success: <FaCheckCircle className="text-green-600" size={20} />,
    error: <FaExclamationCircle className="text-red-600" size={20} />,
    info: <FaInfoCircle className="text-blue-600" size={20} />,
    warning: <FaExclamationTriangle className="text-yellow-600" size={20} />
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[notification.type]}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-800">{notification.message}</p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <FaTimes size={16} />
      </button>
    </div>
  );
};

const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [activeTab, setActiveTab] = useState<'usa' | 'canada' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<string>('dateIssued');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    paid: 0,
    unpaid: 0,
    fight: 0,
    dismissed: 0,
    reduced: 0,
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    fightAmount: 0,
    dismissedAmount: 0,
    reducedAmount: 0,
    usaTotal: 0,
    canadaTotal: 0
  });

  const [ticketForm, setTicketForm] = useState<Partial<Ticket>>({
    country: 'usa',
    violationType: '',
    violationDescription: '',
    dateIssued: '',
    location: '',
    amount: 0,
    finalAmount: undefined,
    status: 'unpaid',
    outcome: 'unpaid',
    driver: '',
    vehicle: '',
    unitNumber: '',
    trailerNumber: '',
    officerName: '',
    dueDate: '',
    courtDate: '',
    fightingBy: undefined,
    notes: '',
    lawyerDetails: undefined,
    paidDate: '',
    paymentMethod: '',
    paymentReference: ''
  });
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const notificationIdRef = useRef(0);

  // Fetch vehicles, drivers, and trailers
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await listVehicle();
        if (res?.success && res?.data?.vehicles) {
          setVehicles(res.data.vehicles);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      }
    };

    const fetchDrivers = async () => {
      try {
        const res = await listDriver();
        if (res?.success && res?.data) {
          const driverList = Array.isArray(res.data) 
            ? res.data.filter((d: any) => d.role === 'driver')
            : (res.data?.drivers || []).filter((d: any) => d.role === 'driver');
          setDrivers(driverList);
        }
      } catch (error) {
        console.error('Error fetching drivers:', error);
      }
    };

    const fetchTrailers = async () => {
      try {
        const res = await listTrailers();
        if (res?.success && res?.data) {
          const trailerList = Array.isArray(res.data) ? res.data : (res.data?.trailers || []);
          setTrailers(trailerList);
        }
      } catch (error) {
        console.error('Error fetching trailers:', error);
      }
    };

    fetchVehicles();
    fetchDrivers();
    fetchTrailers();
  }, []);

  // Function to refresh tickets and stats
  const refreshData = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        getTickets(), // Fetch all tickets, filtering done client-side
        getTicketStats()
      ]);

      if (ticketsRes?.success) {
        setTickets(ticketsRes.data || []);
      }

      if (statsRes?.success) {
        setStats(statsRes.data || {
          total: 0,
          paid: 0,
          unpaid: 0,
          fight: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          fightAmount: 0
        });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Fetch tickets and stats on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await refreshData();
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter and sort tickets (client-side for filtering and sorting)
  useEffect(() => {
    let filtered = [...tickets];

    // Apply country filter (tab-based)
    if (activeTab !== 'all') {
      filtered = filtered.filter(ticket => ticket.country === activeTab);
    }

    // Apply status filter (client-side backup)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Apply search filter (client-side)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(ticket => {
        const ticketNumber = ticket.ticketNumber?.toLowerCase() || '';
        const violationType = ticket.violationType?.toLowerCase() || '';
        const violationDescription = ticket.violationDescription?.toLowerCase() || '';
        const location = ticket.location?.toLowerCase() || '';
        const officerName = ticket.officerName?.toLowerCase() || '';
        const driverName = getDriverName(ticket.driver).toLowerCase();
        const vehicleInfo = getVehicleInfo(ticket.vehicle).toLowerCase();
        const amount = ticket.amount?.toString() || '';
        const unitNumber = ticket.unitNumber?.toLowerCase() || '';
        const trailerNumber = ticket.trailerNumber?.toLowerCase() || '';
        
        return (
          ticketNumber.includes(query) ||
          violationType.includes(query) ||
          violationDescription.includes(query) ||
          location.includes(query) ||
          officerName.includes(query) ||
          driverName.includes(query) ||
          vehicleInfo.includes(query) ||
          amount.includes(query) ||
          unitNumber.includes(query) ||
          trailerNumber.includes(query)
        );
      });
    }

    // Sort tickets
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof Ticket];
      let bValue: any = b[sortField as keyof Ticket];

      if (sortField === 'dateIssued' || sortField === 'dueDate' || sortField === 'paidDate' || sortField === 'courtDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTickets(filtered);
  }, [tickets, sortField, sortDirection, statusFilter, searchQuery, activeTab, vehicles, drivers]);

  const getVehicleInfo = (vehicle: Ticket['vehicle']): string => {
    if (typeof vehicle === 'string') {
      const v = vehicles.find(v => v._id === vehicle);
      return v ? `${v.make} ${v.model} - ${v.plateNumber}` : '';
    }
    if (vehicle?.make && vehicle?.model && vehicle?.plateNumber) {
      return `${vehicle.make} ${vehicle.model} - ${vehicle.plateNumber}`;
    }
    return '';
  };

  const getDriverName = (driver: Ticket['driver']): string => {
    if (typeof driver === 'string') {
      const d = drivers.find(d => d._id === driver);
      return d ? d.name : '';
    }
    return driver?.name || '';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <FaCheckCircle className="text-green-600" size={20} />;
      case 'unpaid':
        return <FaTimesCircle className="text-red-600" size={20} />;
      case 'fight':
        return <FaGavel className="text-orange-600" size={20} />;
      case 'dismissed':
        return <FaCheckCircle className="text-blue-600" size={20} />;
      case 'reduced':
        return <FaExclamationTriangle className="text-yellow-600" size={20} />;
      default:
        return <FaTicketAlt className="text-gray-600" size={20} />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unpaid':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'fight':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'dismissed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reduced':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <FaSort className="text-gray-400" size={14} />;
    return sortDirection === 'asc' ? <FaSortUp className="text-gray-600" size={14} /> : <FaSortDown className="text-gray-600" size={14} />;
  };

  const resetForm = () => {
    setTicketForm({
      country: 'usa',
      violationType: '',
      violationDescription: '',
      dateIssued: '',
      location: '',
      amount: 0,
      finalAmount: undefined,
      status: 'unpaid',
      outcome: 'unpaid',
      driver: '',
      vehicle: '',
      unitNumber: '',
      trailerNumber: '',
      officerName: '',
      dueDate: '',
      courtDate: '',
      fightingBy: undefined,
      notes: '',
      lawyerDetails: undefined,
      paidDate: '',
      paymentMethod: '',
      paymentReference: ''
    });
  };

  const handleAddTicket = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketForm({
      country: ticket.country || 'usa',
      violationType: ticket.violationType,
      violationDescription: ticket.violationDescription,
      dateIssued: ticket.dateIssued ? new Date(ticket.dateIssued).toISOString().split('T')[0] : '',
      location: ticket.location,
      amount: ticket.amount,
      finalAmount: ticket.finalAmount,
      status: ticket.status,
      outcome: ticket.outcome || ticket.status === 'fight' ? 'on fight' : ticket.status,
      driver: typeof ticket.driver === 'string' ? ticket.driver : ticket.driver?._id || '',
      vehicle: typeof ticket.vehicle === 'string' ? ticket.vehicle : ticket.vehicle?._id || '',
      unitNumber: ticket.unitNumber || '',
      trailerNumber: ticket.trailerNumber || '',
      officerName: ticket.officerName,
      dueDate: ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '',
      courtDate: ticket.courtDate ? new Date(ticket.courtDate).toISOString().split('T')[0] : '',
      fightingBy: ticket.fightingBy,
      notes: ticket.notes || '',
      lawyerDetails: ticket.lawyerDetails ? { ...ticket.lawyerDetails } : undefined,
      paidDate: ticket.paidDate ? new Date(ticket.paidDate).toISOString().split('T')[0] : '',
      paymentMethod: ticket.paymentMethod || '',
      paymentReference: ticket.paymentReference || ''
    });
    setShowEditModal(true);
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowViewModal(true);
  };

  const handleDeleteTicket = (ticket: Ticket) => {
    setTicketToDelete(ticket);
    setShowDeleteModal(true);
  };

  const addNotification = (type: NotificationType, message: string) => {
    const id = ++notificationIdRef.current;
    setNotifications((prev) => [...prev, { id, type, message }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const validateForm = () => {
    const basicValid = !!ticketForm.violationType &&
      !!ticketForm.violationDescription &&
      !!ticketForm.dateIssued &&
      !!ticketForm.location &&
      !!ticketForm.amount &&
      !!ticketForm.driver &&
      !!ticketForm.vehicle &&
      !!ticketForm.officerName &&
      !!ticketForm.dueDate;
    
    // If status is 'fight', lawyer details must be provided
    if (ticketForm.status === 'fight') {
      return basicValid && !!ticketForm.lawyerDetails?.name &&
        !!ticketForm.lawyerDetails?.firm &&
        !!ticketForm.lawyerDetails?.phone &&
        !!ticketForm.lawyerDetails?.email &&
        !!ticketForm.lawyerDetails?.address;
    }
    
    // If status is 'paid', payment information should be provided (optional but recommended)
    // Note: We're not making it required, but it's best practice
    
    return basicValid;
  };

  const saveNewTicket = async () => {
    if (!validateForm()) {
      addNotification('error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        country: ticketForm.country || 'usa',
        violationType: ticketForm.violationType,
        violationDescription: ticketForm.violationDescription,
        dateIssued: ticketForm.dateIssued,
        location: ticketForm.location,
        amount: ticketForm.amount,
        status: ticketForm.status,
        outcome: ticketForm.outcome,
        driver: ticketForm.driver,
        vehicle: ticketForm.vehicle,
        unitNumber: ticketForm.unitNumber || '',
        trailerNumber: ticketForm.trailerNumber || '',
        officerName: ticketForm.officerName,
        dueDate: ticketForm.dueDate,
        courtDate: ticketForm.courtDate || '',
        fightingBy: ticketForm.fightingBy,
        notes: ticketForm.notes || ''
      };

      // Add final amount if status is reduced
      if (ticketForm.status === 'reduced' && ticketForm.finalAmount) {
        payload.finalAmount = ticketForm.finalAmount;
      }

      if (ticketForm.status === 'fight' && ticketForm.lawyerDetails) {
        payload.lawyerDetails = ticketForm.lawyerDetails;
      }

      // Add payment information if status is paid
      if (ticketForm.status === 'paid') {
        if (ticketForm.paidDate) payload.paidDate = ticketForm.paidDate;
        if (ticketForm.paymentMethod) payload.paymentMethod = ticketForm.paymentMethod;
        if (ticketForm.paymentReference) payload.paymentReference = ticketForm.paymentReference;
      }

      const res = await createTicket(payload);
      if (res?.success) {
        addNotification('success', res.message || 'Ticket created successfully');
        await refreshData();
        setShowAddModal(false);
        resetForm();
      } else {
        addNotification('error', res?.message || 'Failed to create ticket');
      }
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      addNotification('error', error?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketData = async () => {
    if (!selectedTicket) return;
    if (!validateForm()) {
      addNotification('error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        country: ticketForm.country || 'usa',
        violationType: ticketForm.violationType,
        violationDescription: ticketForm.violationDescription,
        dateIssued: ticketForm.dateIssued,
        location: ticketForm.location,
        amount: ticketForm.amount,
        status: ticketForm.status,
        outcome: ticketForm.outcome,
        driver: ticketForm.driver,
        vehicle: ticketForm.vehicle,
        unitNumber: ticketForm.unitNumber || '',
        trailerNumber: ticketForm.trailerNumber || '',
        officerName: ticketForm.officerName,
        dueDate: ticketForm.dueDate,
        courtDate: ticketForm.courtDate || '',
        fightingBy: ticketForm.fightingBy,
        notes: ticketForm.notes || ''
      };

      // Add final amount if status is reduced
      if (ticketForm.status === 'reduced' && ticketForm.finalAmount) {
        payload.finalAmount = ticketForm.finalAmount;
      } else {
        payload.finalAmount = undefined;
      }

      if (ticketForm.status === 'fight' && ticketForm.lawyerDetails) {
        payload.lawyerDetails = ticketForm.lawyerDetails;
      }

      // Add payment information if status is paid
      if (ticketForm.status === 'paid') {
        if (ticketForm.paidDate) payload.paidDate = ticketForm.paidDate;
        if (ticketForm.paymentMethod) payload.paymentMethod = ticketForm.paymentMethod;
        if (ticketForm.paymentReference) payload.paymentReference = ticketForm.paymentReference;
      } else {
        // Clear payment info if status is not paid
        payload.paidDate = undefined;
        payload.paymentMethod = undefined;
        payload.paymentReference = undefined;
      }

      const res = await updateTicket(selectedTicket._id, payload);
      if (res?.success) {
        addNotification('success', res.message || 'Ticket updated successfully');
        await refreshData();
        setShowEditModal(false);
        setSelectedTicket(null);
        resetForm();
      } else {
        addNotification('error', res?.message || 'Failed to update ticket');
      }
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      addNotification('error', error?.message || 'Failed to update ticket');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!ticketToDelete) return;

    setLoading(true);
    try {
      const res = await deleteTicket(ticketToDelete._id);
      if (res?.success) {
        addNotification('success', res.message || 'Ticket deleted successfully');
        await refreshData();
        setShowDeleteModal(false);
        setTicketToDelete(null);
      } else {
        addNotification('error', res?.message || 'Failed to delete ticket');
      }
    } catch (error: any) {
      console.error('Error deleting ticket:', error);
      addNotification('error', error?.message || 'Failed to delete ticket');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, color, icon, subtitle }: { 
    title: string; 
    value: number | string; 
    color: string; 
    icon: React.ReactNode; 
    subtitle?: string;
  }) => (
    <div className={`${color} p-4 rounded-xl border-2`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs opacity-70 mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Toast Notifications Container - High z-index to be above modal */}
      <div className="fixed top-4 right-4 z-[10002] flex flex-col gap-3 max-w-md">
        {notifications.map(notification => (
          <ToastNotification
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Tickets (Fines & Penalties)</h1>
            <p className="text-gray-600 mt-1">Manage traffic violations and legal disputes for USA & Canada</p>
          </div>
          <button
            onClick={handleAddTicket}
            className="flex items-center gap-2 px-5 py-3 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] shadow-lg hover:shadow-xl transition-all font-medium"
          >
            <FaPlus /> Add Ticket
          </button>
        </div>

        {/* Country Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'all'
                ? 'border-b-2 border-[#9793E4] text-[#9793E4]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All Tickets ({tickets.length})
          </button>
          <button
            onClick={() => setActiveTab('usa')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'usa'
                ? 'border-b-2 border-[#9793E4] text-[#9793E4]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            USA Tickets ({tickets.filter(t => t.country === 'usa').length})
          </button>
          <button
            onClick={() => setActiveTab('canada')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'canada'
                ? 'border-b-2 border-[#9793E4] text-[#9793E4]'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Canada Tickets ({tickets.filter(t => t.country === 'canada').length})
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          title="Total Tickets"
          value={stats.total}
          color="bg-blue-50 border-blue-200"
          icon={<FaTicketAlt className="text-blue-600" size={24} />}
        />
        <StatCard
          title="Paid"
          value={stats.paid}
          color="bg-green-50 border-green-200"
          icon={<FaCheckCircle className="text-green-600" size={24} />}
          subtitle={formatCurrency(stats.paidAmount)}
        />
        <StatCard
          title="Unpaid"
          value={stats.unpaid}
          color="bg-red-50 border-red-200"
          icon={<FaTimesCircle className="text-red-600" size={24} />}
          subtitle={formatCurrency(stats.unpaidAmount)}
        />
        <StatCard
          title="On Fight"
          value={stats.fight}
          color="bg-orange-50 border-orange-200"
          icon={<FaGavel className="text-orange-600" size={24} />}
          subtitle={formatCurrency(stats.fightAmount)}
        />
        <StatCard
          title="Dismissed"
          value={stats.dismissed}
          color="bg-blue-50 border-blue-200"
          icon={<FaCheckCircle className="text-blue-600" size={24} />}
          subtitle={formatCurrency(stats.dismissedAmount)}
        />
        <StatCard
          title="Reduced"
          value={stats.reduced}
          color="bg-yellow-50 border-yellow-200"
          icon={<FaExclamationTriangle className="text-yellow-600" size={24} />}
          subtitle={formatCurrency(stats.reducedAmount)}
        />
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="fight">On Fight</option>
              <option value="dismissed">Dismissed</option>
              <option value="reduced">Reduced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">
            Tickets ({filteredTickets.length})
          </h3>
        </div>
        
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9793E4] mx-auto mb-4"></div>
            <p className="text-xl font-semibold text-gray-500">Loading tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <FaTicketAlt size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-semibold text-gray-500">No tickets found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('ticketNumber')}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      Ticket #
                      {getSortIcon('ticketNumber')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('violationType')}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      Violation
                      {getSortIcon('violationType')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('dateIssued')}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      Date & Location
                      {getSortIcon('dateIssued')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver & Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('amount')}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      Amount
                      {getSortIcon('amount')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-2 hover:text-gray-700"
                    >
                      Status
                      {getSortIcon('status')}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lawyer Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.ticketNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.country === 'usa' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {ticket.country === 'usa' ? 'USA' : 'Canada'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{ticket.violationType}</div>
                        <div className="text-gray-600 text-xs">{ticket.violationDescription}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-gray-400" size={14} />
                          {formatDate(ticket.dateIssued)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <FaMapMarkerAlt className="text-gray-400" size={14} />
                          <span className="text-gray-600 text-xs">{ticket.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">{getDriverName(ticket.driver)}</div>
                        <div className="text-gray-600 text-xs">{getVehicleInfo(ticket.vehicle)}</div>
                        {ticket.unitNumber && (
                          <div className="text-gray-600 text-xs">Unit: {ticket.unitNumber}</div>
                        )}
                        {ticket.trailerNumber && (
                          <div className="text-gray-600 text-xs">Trailer: {ticket.trailerNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-bold text-lg">{formatCurrency(ticket.amount)}</div>
                        {ticket.finalAmount && ticket.finalAmount !== ticket.amount && (
                          <div className="text-green-600 text-xs">Final: {formatCurrency(ticket.finalAmount)}</div>
                        )}
                        <div className="text-gray-600 text-xs">Due: {formatDate(ticket.dueDate)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className={`text-sm px-2 py-1 rounded-full font-medium border ${getStatusBadgeColor(ticket.status)}`}>
                          {ticket.status === 'fight' ? 'ON FIGHT' : ticket.status.toUpperCase()}
                        </span>
                      </div>
                      {ticket.outcome && ticket.outcome !== ticket.status && (
                        <div className="text-xs text-gray-500 mt-1">Outcome: {ticket.outcome}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ticket.status === 'fight' && ticket.lawyerDetails ? (
                        <div className="text-sm text-gray-900">
                          <div className="font-medium text-orange-800">{ticket.lawyerDetails.name}</div>
                          <div className="text-gray-600 text-xs">{ticket.lawyerDetails.firm}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <FaPhone className="text-gray-400" size={10} />
                            <span className="text-xs text-gray-500">{ticket.lawyerDetails.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaEnvelope className="text-gray-400" size={10} />
                            <span className="text-xs text-gray-500">{ticket.lawyerDetails.email}</span>
                          </div>
                          {ticket.lawyerDetails.caseNumber && (
                            <div className="mt-1">
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                Case: {ticket.lawyerDetails.caseNumber}
                              </span>
                            </div>
                          )}
                          {ticket.lawyerDetails.courtDate && (
                            <div className="mt-1">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Court: {formatDate(ticket.lawyerDetails.courtDate)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 italic">
                          {ticket.status === 'fight' ? 'No lawyer assigned' : 'N/A'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewTicket(ticket)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FaEye size={16} />
                        </button>
                        <button
                          onClick={() => handleEditTicket(ticket)}
                          className="text-[#9793E4] hover:text-[#8783D4] p-2 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Ticket"
                        >
                          <FaEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket)}
                          className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Ticket"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Add New Ticket</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <FaTimesCircle className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                  <select
                    value={ticketForm.country || 'usa'}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, country: e.target.value as 'usa' | 'canada' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="usa">USA</option>
                    <option value="canada">Canada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Violation Type <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g., Speeding, Improper Lane Change"
                    value={ticketForm.violationType || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, violationType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={ticketForm.amount || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Violation Description <span className="text-red-500">*</span></label>
                  <textarea
                    placeholder="Detailed description of the violation"
                    value={ticketForm.violationDescription || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, violationDescription: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Issued <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={ticketForm.dateIssued || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, dateIssued: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={ticketForm.dueDate || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {ticketForm.country === 'canada' ? 'Province' : 'State'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={ticketForm.country === 'canada' ? 'Province (e.g., MB, AB, ON, BC, QC)' : 'State (e.g., California, Texas, New York)'}
                    value={ticketForm.location || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver <span className="text-red-500">*</span></label>
                  <select
                    value={typeof ticketForm.driver === 'string' ? ticketForm.driver : ticketForm.driver?._id || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, driver: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>{driver.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle <span className="text-red-500">*</span></label>
                  <select
                    value={typeof ticketForm.vehicle === 'string' ? ticketForm.vehicle : ticketForm.vehicle?._id || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, vehicle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                  <input
                    type="text"
                    placeholder="Unit number (e.g., 1001, 1002)"
                    value={ticketForm.unitNumber || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, unitNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trailer Number</label>
                  <select
                    value={ticketForm.trailerNumber || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, trailerNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Trailer</option>
                    {trailers.map((trailer) => (
                      <option key={trailer._id} value={trailer.trailer || trailer._id}>
                        {trailer.trailer || trailer.plateNumber || trailer.internalId || trailer._id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Officer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Issuing officer name"
                    value={ticketForm.officerName || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, officerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                  <select
                    value={ticketForm.status}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, status: e.target.value as 'paid' | 'unpaid' | 'fight' | 'dismissed' | 'reduced' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="fight">On Fight</option>
                    <option value="dismissed">Dismissed</option>
                    <option value="reduced">Reduced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                  <select
                    value={ticketForm.outcome || 'unpaid'}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, outcome: e.target.value as 'paid' | 'reduced' | 'dismissed' | 'on fight' | 'unpaid' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="reduced">Reduced</option>
                    <option value="dismissed">Dismissed</option>
                    <option value="on fight">On Fight</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court Date</label>
                  <input
                    type="date"
                    value={ticketForm.courtDate || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, courtDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fighting By</label>
                  <select
                    value={ticketForm.fightingBy || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, fightingBy: e.target.value as 'company' | 'lawyer' | undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Option</option>
                    <option value="company">Company</option>
                    <option value="lawyer">Lawyer</option>
                  </select>
                </div>
                {ticketForm.status === 'reduced' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Final Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Final amount after reduction"
                      value={ticketForm.finalAmount || ''}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, finalAmount: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    placeholder="Additional notes"
                    value={ticketForm.notes || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              {/* Payment Information Section - Only show if status is 'paid' */}
              {ticketForm.status === 'paid' && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" size={20} />
                    Payment Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Paid Date</label>
                      <input
                        type="date"
                        value={ticketForm.paidDate || ''}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, paidDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select
                        value={ticketForm.paymentMethod || ''}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      >
                        <option value="">Select Payment Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Check">Check</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Online Payment">Online Payment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
                      <input
                        type="text"
                        placeholder="Transaction ID, check number, or reference number"
                        value={ticketForm.paymentReference || ''}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Lawyer Details Section - Only show if status is 'fight' */}
              {ticketForm.status === 'fight' && (
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaGavel className="text-orange-600" size={20} />
                    Lawyer Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lawyer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                        placeholder="Lawyer name"
                        value={ticketForm.lawyerDetails?.name || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            name: e.target.value,
                            firm: prev.lawyerDetails?.firm || '',
                            phone: prev.lawyerDetails?.phone || '',
                            email: prev.lawyerDetails?.email || '',
                            address: prev.lawyerDetails?.address || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Firm <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Law firm name"
                        value={ticketForm.lawyerDetails?.firm || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            firm: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            phone: prev.lawyerDetails?.phone || '',
                            email: prev.lawyerDetails?.email || '',
                            address: prev.lawyerDetails?.address || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={ticketForm.lawyerDetails?.phone || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            phone: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            firm: prev.lawyerDetails?.firm || '',
                            email: prev.lawyerDetails?.email || '',
                            address: prev.lawyerDetails?.address || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        placeholder="Email address"
                        value={ticketForm.lawyerDetails?.email || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            email: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            firm: prev.lawyerDetails?.firm || '',
                            phone: prev.lawyerDetails?.phone || '',
                            address: prev.lawyerDetails?.address || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                      <textarea
                        placeholder="Law firm address"
                        value={ticketForm.lawyerDetails?.address || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            address: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            firm: prev.lawyerDetails?.firm || '',
                            phone: prev.lawyerDetails?.phone || '',
                            email: prev.lawyerDetails?.email || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Case Number</label>
                      <input
                        type="text"
                        placeholder="Case number"
                        value={ticketForm.lawyerDetails?.caseNumber || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            caseNumber: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            firm: prev.lawyerDetails?.firm || '',
                            phone: prev.lawyerDetails?.phone || '',
                            email: prev.lawyerDetails?.email || '',
                            address: prev.lawyerDetails?.address || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Court Date</label>
                      <input
                        type="date"
                        value={ticketForm.lawyerDetails?.courtDate || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            courtDate: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            firm: prev.lawyerDetails?.firm || '',
                            phone: prev.lawyerDetails?.phone || '',
                            email: prev.lawyerDetails?.email || '',
                            address: prev.lawyerDetails?.address || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors" disabled={loading}>Cancel</button>
              <button onClick={saveNewTicket} className="px-6 py-2.5 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] font-medium transition-colors disabled:opacity-60" disabled={!validateForm() || loading}>
                {loading ? 'Saving...' : 'Save Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ticket Modal */}
      {showEditModal && selectedTicket && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Edit Ticket: {selectedTicket.ticketNumber}</h3>
                <button onClick={() => { setShowEditModal(false); setSelectedTicket(null); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <FaTimesCircle className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country <span className="text-red-500">*</span></label>
                  <select
                    value={ticketForm.country || 'usa'}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, country: e.target.value as 'usa' | 'canada' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="usa">USA</option>
                    <option value="canada">Canada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Violation Type <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g., Speeding, Improper Lane Change"
                    value={ticketForm.violationType || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, violationType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={ticketForm.amount || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Violation Description <span className="text-red-500">*</span></label>
                  <textarea
                    placeholder="Detailed description of the violation"
                    value={ticketForm.violationDescription || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, violationDescription: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Issued <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={ticketForm.dateIssued || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, dateIssued: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={ticketForm.dueDate || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {ticketForm.country === 'canada' ? 'Province' : 'State'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={ticketForm.country === 'canada' ? 'Province (e.g., MB, AB, ON, BC, QC)' : 'State (e.g., California, Texas, New York)'}
                    value={ticketForm.location || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver <span className="text-red-500">*</span></label>
                  <select
                    value={typeof ticketForm.driver === 'string' ? ticketForm.driver : ticketForm.driver?._id || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, driver: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>{driver.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle <span className="text-red-500">*</span></label>
                  <select
                    value={typeof ticketForm.vehicle === 'string' ? ticketForm.vehicle : ticketForm.vehicle?._id || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, vehicle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                  <input
                    type="text"
                    placeholder="Unit number (e.g., 1001, 1002)"
                    value={ticketForm.unitNumber || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, unitNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trailer Number</label>
                  <select
                    value={ticketForm.trailerNumber || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, trailerNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Trailer</option>
                    {trailers.map((trailer) => (
                      <option key={trailer._id} value={trailer.trailer || trailer._id}>
                        {trailer.trailer || trailer.plateNumber || trailer.internalId || trailer._id}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Officer Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Issuing officer name"
                    value={ticketForm.officerName || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, officerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                  <select
                    value={ticketForm.status}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, status: e.target.value as 'paid' | 'unpaid' | 'fight' | 'dismissed' | 'reduced' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="fight">On Fight</option>
                    <option value="dismissed">Dismissed</option>
                    <option value="reduced">Reduced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
                  <select
                    value={ticketForm.outcome || 'unpaid'}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, outcome: e.target.value as 'paid' | 'reduced' | 'dismissed' | 'on fight' | 'unpaid' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="reduced">Reduced</option>
                    <option value="dismissed">Dismissed</option>
                    <option value="on fight">On Fight</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Court Date</label>
                  <input
                    type="date"
                    value={ticketForm.courtDate || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, courtDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fighting By</label>
                  <select
                    value={ticketForm.fightingBy || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, fightingBy: e.target.value as 'company' | 'lawyer' | undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="">Select Option</option>
                    <option value="company">Company</option>
                    <option value="lawyer">Lawyer</option>
                  </select>
                </div>
                {ticketForm.status === 'reduced' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Final Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Final amount after reduction"
                      value={ticketForm.finalAmount || ''}
                      onChange={(e) => setTicketForm(prev => ({ ...prev, finalAmount: parseFloat(e.target.value) || undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    placeholder="Additional notes"
                    value={ticketForm.notes || ''}
                    onChange={(e) => setTicketForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              {/* Payment Information Section - Only show if status is 'paid' */}
              {ticketForm.status === 'paid' && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" size={20} />
                    Payment Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Paid Date</label>
                      <input
                        type="date"
                        value={ticketForm.paidDate || ''}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, paidDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select
                        value={ticketForm.paymentMethod || ''}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      >
                        <option value="">Select Payment Method</option>
                        <option value="Cash">Cash</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Check">Check</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Online Payment">Online Payment</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
                      <input
                        type="text"
                        placeholder="Transaction ID, check number, or reference number"
                        value={ticketForm.paymentReference || ''}
                        onChange={(e) => setTicketForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Lawyer Details Section - Only show if status is 'fight' */}
              {ticketForm.status === 'fight' && (
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaGavel className="text-orange-600" size={20} />
                    Lawyer Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lawyer Name <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Lawyer name"
                        value={ticketForm.lawyerDetails?.name || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            name: e.target.value,
                            firm: prev.lawyerDetails?.firm || '',
                            phone: prev.lawyerDetails?.phone || '',
                            email: prev.lawyerDetails?.email || '',
                            address: prev.lawyerDetails?.address || '',
                            caseNumber: prev.lawyerDetails?.caseNumber || '',
                            courtDate: prev.lawyerDetails?.courtDate || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Firm <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Law firm name"
                        value={ticketForm.lawyerDetails?.firm || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            firm: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            phone: prev.lawyerDetails?.phone || '',
                            email: prev.lawyerDetails?.email || '',
                            address: prev.lawyerDetails?.address || '',
                            caseNumber: prev.lawyerDetails?.caseNumber || '',
                            courtDate: prev.lawyerDetails?.courtDate || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={ticketForm.lawyerDetails?.phone || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            phone: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            firm: prev.lawyerDetails?.firm || '',
                            email: prev.lawyerDetails?.email || '',
                            address: prev.lawyerDetails?.address || '',
                            caseNumber: prev.lawyerDetails?.caseNumber || '',
                            courtDate: prev.lawyerDetails?.courtDate || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                      <input
                        type="email"
                        placeholder="Email address"
                        value={ticketForm.lawyerDetails?.email || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            email: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            firm: prev.lawyerDetails?.firm || '',
                            phone: prev.lawyerDetails?.phone || '',
                            address: prev.lawyerDetails?.address || '',
                            caseNumber: prev.lawyerDetails?.caseNumber || '',
                            courtDate: prev.lawyerDetails?.courtDate || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
                      <textarea
                        placeholder="Law firm address"
                        value={ticketForm.lawyerDetails?.address || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            address: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            firm: prev.lawyerDetails?.firm || '',
                            phone: prev.lawyerDetails?.phone || '',
                            email: prev.lawyerDetails?.email || '',
                            caseNumber: prev.lawyerDetails?.caseNumber || '',
                            courtDate: prev.lawyerDetails?.courtDate || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Case Number</label>
                      <input
                        type="text"
                        placeholder="Case number"
                        value={ticketForm.lawyerDetails?.caseNumber || ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            caseNumber: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            firm: prev.lawyerDetails?.firm || '',
                            phone: prev.lawyerDetails?.phone || '',
                            email: prev.lawyerDetails?.email || '',
                            address: prev.lawyerDetails?.address || '',
                            courtDate: prev.lawyerDetails?.courtDate || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Court Date</label>
                      <input
                        type="date"
                        value={ticketForm.lawyerDetails?.courtDate ? new Date(ticketForm.lawyerDetails.courtDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setTicketForm(prev => ({ 
                          ...prev, 
                          lawyerDetails: { 
                            ...prev.lawyerDetails, 
                            courtDate: e.target.value,
                            name: prev.lawyerDetails?.name || '',
                            firm: prev.lawyerDetails?.firm || '',
                            phone: prev.lawyerDetails?.phone || '',
                            email: prev.lawyerDetails?.email || '',
                            address: prev.lawyerDetails?.address || '',
                            caseNumber: prev.lawyerDetails?.caseNumber || '',
                            status: prev.lawyerDetails?.status || 'active'
                          } 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
              <button onClick={() => { setShowEditModal(false); setSelectedTicket(null); resetForm(); }} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors" disabled={loading}>Cancel</button>
              <button onClick={updateTicketData} className="px-6 py-2.5 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] font-medium transition-colors disabled:opacity-60" disabled={!validateForm() || loading}>
                {loading ? 'Updating...' : 'Update Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Ticket Modal */}
      {showViewModal && selectedTicket && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Ticket Details: {selectedTicket.ticketNumber}
                </h3>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <FaTimesCircle className="text-gray-500" size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Ticket Overview */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Ticket Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Ticket Number</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedTicket.ticketNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTicket.country === 'usa' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTicket.country === 'usa' ? 'USA' : 'Canada'}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Violation Type</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedTicket.violationType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Amount</label>
                    <p className="text-lg font-semibold text-gray-800">
                      {formatCurrency(selectedTicket.amount)}
                      {selectedTicket.finalAmount && selectedTicket.finalAmount !== selectedTicket.amount && (
                        <span className="text-green-600 text-sm ml-2">(Final: {formatCurrency(selectedTicket.finalAmount)})</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedTicket.status)}
                      <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${getStatusBadgeColor(selectedTicket.status)}`}>
                        {selectedTicket.status === 'fight' ? 'ON FIGHT' : selectedTicket.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {selectedTicket.outcome && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Outcome</label>
                      <p className="text-lg font-semibold text-gray-800 capitalize">{selectedTicket.outcome}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date Issued</label>
                    <p className="text-lg font-semibold text-gray-800">{formatDate(selectedTicket.dateIssued)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
                    <p className="text-lg font-semibold text-gray-800">{formatDate(selectedTicket.dueDate)}</p>
                  </div>
                  {selectedTicket.courtDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Court Date</label>
                      <p className="text-lg font-semibold text-gray-800">{formatDate(selectedTicket.courtDate)}</p>
                    </div>
                  )}
                  {selectedTicket.fightingBy && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Fighting By</label>
                      <p className="text-lg font-semibold text-gray-800 capitalize">{selectedTicket.fightingBy}</p>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    {selectedTicket.country === 'canada' ? 'Province' : 'State'}
                  </label>
                  <p className="text-lg font-semibold text-gray-800">{selectedTicket.location}</p>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Violation Description</label>
                  <p className="text-gray-800">{selectedTicket.violationDescription}</p>
                </div>
              </div>

              {/* Driver & Vehicle Info */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">Driver & Vehicle Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Driver</label>
                    <p className="text-lg font-semibold text-gray-800">{getDriverName(selectedTicket.driver)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Vehicle</label>
                    <p className="text-lg font-semibold text-gray-800">{getVehicleInfo(selectedTicket.vehicle)}</p>
                  </div>
                  {selectedTicket.unitNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Unit Number</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedTicket.unitNumber}</p>
                    </div>
                  )}
                  {selectedTicket.trailerNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Trailer Number</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedTicket.trailerNumber}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Officer</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedTicket.officerName}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information - Only show if status is 'paid' */}
              {selectedTicket.status === 'paid' && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaCheckCircle className="text-green-600" size={20} />
                    Payment Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedTicket.paidDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Paid Date</label>
                        <p className="text-lg font-semibold text-gray-800">{formatDate(selectedTicket.paidDate)}</p>
                      </div>
                    )}
                    {selectedTicket.paymentMethod && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                        <p className="text-lg font-semibold text-gray-800">{selectedTicket.paymentMethod}</p>
                      </div>
                    )}
                    {selectedTicket.paymentReference && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Payment Reference</label>
                        <p className="text-lg font-semibold text-gray-800">{selectedTicket.paymentReference}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Lawyer Details - Only show if status is 'fight' */}
              {selectedTicket.status === 'fight' && selectedTicket.lawyerDetails && (
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FaGavel className="text-orange-600" size={20} />
                    Lawyer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Lawyer Name</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedTicket.lawyerDetails.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Firm</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedTicket.lawyerDetails.firm}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedTicket.lawyerDetails.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedTicket.lawyerDetails.email}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                      <p className="text-lg font-semibold text-gray-800">{selectedTicket.lawyerDetails.address}</p>
                    </div>
                    {selectedTicket.lawyerDetails.caseNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Case Number</label>
                        <p className="text-lg font-semibold text-gray-800">{selectedTicket.lawyerDetails.caseNumber}</p>
                      </div>
                    )}
                    {selectedTicket.lawyerDetails.courtDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Court Date</label>
                        <p className="text-lg font-semibold text-gray-800">{formatDate(selectedTicket.lawyerDetails.courtDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTicket.notes && (
                <div className="bg-yellow-50 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Notes</h4>
                  <p className="text-gray-800">{selectedTicket.notes}</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t rounded-b-2xl">
              <button onClick={() => setShowViewModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ticketToDelete && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <FaTimesCircle className="text-red-600" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Delete Ticket</h3>
              </div>
              <p className="text-gray-600 mb-6">Are you sure you want to delete ticket <span className="font-semibold">{ticketToDelete.ticketNumber}</span>? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowDeleteModal(false); setTicketToDelete(null); }} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors" disabled={loading}>Cancel</button>
                <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 !text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-60" disabled={loading}>
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
