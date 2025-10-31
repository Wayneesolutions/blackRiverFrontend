import React, { useState, useEffect } from 'react';
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
  FaSort,
  FaSortUp,
  FaSortDown
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

// Types
interface Ticket {
  _id: string;
  ticketNumber: string;
  violationType: string;
  violationDescription: string;
  dateIssued: string;
  location: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'fight';
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
  officerName: string;
  dueDate: string;
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
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  fightAmount: number;
}


const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
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
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    fightAmount: 0
  });

  const [ticketForm, setTicketForm] = useState<Partial<Ticket>>({
    violationType: '',
    violationDescription: '',
    dateIssued: '',
    location: '',
    amount: 0,
    status: 'unpaid',
    driver: '',
    vehicle: '',
    officerName: '',
    dueDate: '',
    notes: '',
    lawyerDetails: undefined
  });

  // Fetch vehicles and drivers
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

    fetchVehicles();
    fetchDrivers();
  }, []);

  // Function to refresh tickets and stats
  const refreshData = async (useFilters = true) => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        getTickets({ 
          status: useFilters && statusFilter !== 'all' ? statusFilter : undefined, 
          search: useFilters && searchQuery ? searchQuery : undefined 
        }),
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

  // Fetch tickets and stats
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await refreshData(true);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery]);

  // Filter and sort tickets (client-side for sorting)
  useEffect(() => {
    let filtered = [...tickets];

    // Sort tickets
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof Ticket];
      let bValue: any = b[sortField as keyof Ticket];

      if (sortField === 'dateIssued' || sortField === 'dueDate') {
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
  }, [tickets, sortField, sortDirection]);

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
      violationType: '',
      violationDescription: '',
      dateIssued: '',
      location: '',
      amount: 0,
      status: 'unpaid',
      driver: '',
      vehicle: '',
      officerName: '',
      dueDate: '',
      notes: '',
      lawyerDetails: undefined
    });
  };

  const handleAddTicket = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTicketForm({
      violationType: ticket.violationType,
      violationDescription: ticket.violationDescription,
      dateIssued: ticket.dateIssued ? new Date(ticket.dateIssued).toISOString().split('T')[0] : '',
      location: ticket.location,
      amount: ticket.amount,
      status: ticket.status,
      driver: typeof ticket.driver === 'string' ? ticket.driver : ticket.driver?._id || '',
      vehicle: typeof ticket.vehicle === 'string' ? ticket.vehicle : ticket.vehicle?._id || '',
      officerName: ticket.officerName,
      dueDate: ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : '',
      notes: ticket.notes || '',
      lawyerDetails: ticket.lawyerDetails ? { ...ticket.lawyerDetails } : undefined
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
    
    return basicValid;
  };

  const saveNewTicket = async () => {
    if (!validateForm()) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        violationType: ticketForm.violationType,
        violationDescription: ticketForm.violationDescription,
        dateIssued: ticketForm.dateIssued,
        location: ticketForm.location,
        amount: ticketForm.amount,
        status: ticketForm.status,
        driver: ticketForm.driver,
        vehicle: ticketForm.vehicle,
        officerName: ticketForm.officerName,
        dueDate: ticketForm.dueDate,
        notes: ticketForm.notes || ''
      };

      if (ticketForm.status === 'fight' && ticketForm.lawyerDetails) {
        payload.lawyerDetails = ticketForm.lawyerDetails;
      }

      const res = await createTicket(payload);
      if (res?.success) {
        await refreshData(true);
    setShowAddModal(false);
    resetForm();
      } else {
        alert(res?.message || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const updateTicketData = async () => {
    if (!selectedTicket) return;
    if (!validateForm()) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        violationType: ticketForm.violationType,
        violationDescription: ticketForm.violationDescription,
        dateIssued: ticketForm.dateIssued,
        location: ticketForm.location,
        amount: ticketForm.amount,
        status: ticketForm.status,
        driver: ticketForm.driver,
        vehicle: ticketForm.vehicle,
        officerName: ticketForm.officerName,
        dueDate: ticketForm.dueDate,
        notes: ticketForm.notes || ''
      };

      if (ticketForm.status === 'fight' && ticketForm.lawyerDetails) {
        payload.lawyerDetails = ticketForm.lawyerDetails;
      }

      const res = await updateTicket(selectedTicket._id, payload);
      if (res?.success) {
        await refreshData(true);
        setShowEditModal(false);
        setSelectedTicket(null);
        resetForm();
      } else {
        alert(res?.message || 'Failed to update ticket');
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      alert('Failed to update ticket');
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
        await refreshData(true);
    setShowDeleteModal(false);
    setTicketToDelete(null);
      } else {
        alert(res?.message || 'Failed to delete ticket');
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket');
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Tickets (Fines & Penalties)</h1>
          <p className="text-gray-600 mt-1">Manage traffic violations and legal disputes</p>
        </div>
        <button
          onClick={handleAddTicket}
          className="flex items-center gap-2 px-5 py-3 bg-[#9793E4] !text-white rounded-lg hover:bg-[#8783D4] shadow-lg hover:shadow-xl transition-all font-medium"
        >
          <FaPlus /> Add Ticket
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
          title="Fight"
          value={stats.fight}
          color="bg-orange-50 border-orange-200"
          icon={<FaGavel className="text-orange-600" size={24} />}
          subtitle={formatCurrency(stats.fightAmount)}
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
              <option value="fight">Fight</option>
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
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-bold text-lg">{formatCurrency(ticket.amount)}</div>
                        <div className="text-gray-600 text-xs">Due: {formatDate(ticket.dueDate)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className={`text-sm px-2 py-1 rounded-full font-medium border ${getStatusBadgeColor(ticket.status)}`}>
                          {ticket.status.toUpperCase()}
                        </span>
                      </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Location where violation occurred"
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
                    onChange={(e) => setTicketForm(prev => ({ ...prev, status: e.target.value as 'paid' | 'unpaid' | 'fight' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="fight">Fight</option>
                  </select>
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Location where violation occurred"
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
                    onChange={(e) => setTicketForm(prev => ({ ...prev, status: e.target.value as 'paid' | 'unpaid' | 'fight' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#9793E4] focus:border-transparent"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="fight">Fight</option>
                  </select>
                </div>
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
                    <label className="block text-sm font-medium text-gray-600 mb-1">Violation Type</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedTicket.violationType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Amount</label>
                    <p className="text-lg font-semibold text-gray-800">{formatCurrency(selectedTicket.amount)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedTicket.status)}
                      <span className={`text-sm px-3 py-1 rounded-full font-semibold border ${getStatusBadgeColor(selectedTicket.status)}`}>
                        {selectedTicket.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Date Issued</label>
                    <p className="text-lg font-semibold text-gray-800">{formatDate(selectedTicket.dateIssued)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
                    <p className="text-lg font-semibold text-gray-800">{formatDate(selectedTicket.dueDate)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Officer</label>
                    <p className="text-lg font-semibold text-gray-800">{selectedTicket.officerName}</p>
                  </div>
                </div>
              </div>

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
