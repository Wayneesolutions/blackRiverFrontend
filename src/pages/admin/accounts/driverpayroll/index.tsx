import { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, Users, Calendar, TrendingUp, X, AlertCircle, CheckCircle, Edit2, Trash2, Eye, MapPin, Package, Truck } from 'lucide-react';
import { createPayroll, listPayrolls, updatePayroll, deletePayroll, getDriverCompletedTrips, generateAIDriverPayroll, bulkAnalyzeAIDriverPayrolls, bulkCreateDriverPayrolls } from '../../../../axios/api/account.payroll';
import * as driverApi from '../../../../axios/api/driver';

// Type definitions
interface Driver {
  _id: string;
  name: string;
  role: string;
  details?: {
    salaryPerMile?: number;
    salaryPerMileSnow?: number;
    salaryPerMileHighTemp?: number;
    highTempThreshold?: number;
  };
}

interface Trip {
  _id: string;
  tripNumber?: string;
  startLocation?: {
    place?: string;
    latitude?: string;
    longitude?: string;
    placeId?: {
      name?: string;
      currentLocation?: {
        address?: string;
        latitude?: string;
        longitude?: string;
      };
    };
  };
  endLocation?: {
    place?: string;
    latitude?: string;
    longitude?: string;
    placeId?: {
      name?: string;
      currentLocation?: {
        address?: string;
        latitude?: string;
        longitude?: string;
      };
    };
  };
  actualEndDate?: string;
  distance?: number;
  distanceInMiles?: number | string;
  baseRate?: number;
  snowRate?: number;
  highTempRate?: number;
  weatherConditions?: {
    snow?: boolean;
    highTemperature?: boolean;
  };
  earnings?: string | number;
  truck?: {
    plateNumber?: string;
    licensePlate?: string;
    internalId?: string;
  };
  status?: string;
  selected?: boolean;
  driverRole?: 'driver' | 'coDriver' | 'unknown';
  driverDetails?: {
    _id: string;
    name: string;
    phone?: string;
  } | null;
  coDriverDetails?: {
    _id: string;
    name: string;
    phone?: string;
  } | null;
  route?: {
    totalDistance?: number;
    waypoints?: Array<{
      place?: string;
      latitude?: string;
      longitude?: string;
    }>;
  };
  orders?: Array<{
    _id?: string;
    orderNumber?: string;
    pickupLocation?: {
      place?: string;
      latitude?: string;
      longitude?: string;
      placeId?: {
        name?: string;
        currentLocation?: {
          address?: string;
          latitude?: string;
          longitude?: string;
        };
      };
    };
    deliveryLocation?: {
      place?: string;
      latitude?: string;
      longitude?: string;
      placeId?: {
        name?: string;
        currentLocation?: {
          address?: string;
          latitude?: string;
          longitude?: string;
        };
      };
    };
  }>;
}

interface TripSummary {
  totalTrips: number;
  totalDistanceKm: number;
  totalDistanceMiles: number;
  totalEarnings: number;
  ratePerMile: number;
  baseRate?: number;
  snowRate?: number;
  highTempRate?: number;
}

interface DriverPayroll {
  _id: string;
  userId: {
    _id: string;
    name: string;
    role: string;
  };
  baseSalary: number;
  bonus: number;
  deductions: number;
  totalSalary: number;
  payDate: string;
  startDate: string;
  endDate: string;
  totalMiles?: number;
  ratePerMile?: number;
  trips?: Trip[];
  // Tax fields
  country?: string;
  // Canada taxes
  federalIncomeTaxCA?: number;
  provincialIncomeTaxCA?: number;
  cpp?: number;
  ei?: number;
  provincialHealthTaxCA?: number;
  // USA taxes
  federalIncomeTaxUS?: number;
  stateIncomeTaxUS?: number;
  socialSecurityTax?: number;
  medicareTax?: number;
  stateDisabilityInsurance?: number;
  localTax?: number;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
}

interface FormData {
  userId: string;
  bonus: string;
  deductions: string;
  payDate: string;
  startDate: string;
  endDate: string;
  // Tax fields
  country: string;
  // Canada taxes
  federalIncomeTaxCA?: string;
  provincialIncomeTaxCA?: string;
  cpp?: string;
  ei?: string;
  provincialHealthTaxCA?: string;
  // USA taxes
  federalIncomeTaxUS?: string;
  stateIncomeTaxUS?: string;
  socialSecurityTax?: string;
  medicareTax?: string;
  stateDisabilityInsurance?: string;
  localTax?: string;
}

const DriverPayrollManagement = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [selectedPayroll, setSelectedPayroll] = useState<DriverPayroll | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payrollData, setPayrollData] = useState<DriverPayroll[]>([]);
  const [driverTrips, setDriverTrips] = useState<Trip[]>([]);
  const [driverPayrollSummary, setDriverPayrollSummary] = useState<TripSummary | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTrips, setLoadingTrips] = useState<boolean>(false);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [loadingBulkAI, setLoadingBulkAI] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [showBulkGenerateModal, setShowBulkGenerateModal] = useState<boolean>(false);
  const [showBulkSuggestionsModal, setShowBulkSuggestionsModal] = useState<boolean>(false);
  const [bulkGenerateResult, setBulkGenerateResult] = useState<any>(null);
  const [bulkPayrollSuggestions, setBulkPayrollSuggestions] = useState<any[]>([]);
  const [bulkDateRange, setBulkDateRange] = useState<{
    startDate: string;
    endDate: string;
    payDate: string;
  }>({
    startDate: '',
    endDate: '',
    payDate: new Date().toISOString().split('T')[0]
  });
  const [aiAnalysis, setAiAnalysis] = useState<{
    recommendedBonus: number;
    recommendedDeductions: number;
    performanceScore: number;
    recommendations: string[];
    performanceNotes: string;
    reasoning: string;
  } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    userId: '',
    bonus: '0',
    deductions: '0',
    payDate: '',
    startDate: '',
    endDate: '',
    country: 'USA',
    // Canada taxes
    federalIncomeTaxCA: '0',
    provincialIncomeTaxCA: '0',
    cpp: '0',
    ei: '0',
    provincialHealthTaxCA: '0',
    // USA taxes
    federalIncomeTaxUS: '0',
    stateIncomeTaxUS: '0',
    socialSecurityTax: '0',
    medicareTax: '0',
    stateDisabilityInsurance: '0',
    localTax: '0'
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const getLocalUserInfo = () => {
    const userInfoString = localStorage.getItem('userInfo');
    if (!userInfoString) return null;
    try {
      return JSON.parse(userInfoString);
    } catch (error) {
      console.error('Error parsing userInfo from localStorage:', error);
      return null;
    }
  };

  const fetchDrivers = async () => {
    try {
      const userInfo: any = getLocalUserInfo();
      const userRole = userInfo?.role || userInfo?.userData?.role;
      const userCompany = userInfo?.company || userInfo?.userData?.company;
      const isSuperadmin = userRole === 'superadmin';
      const isHR = userRole === 'hr';
      const hasCompany = Boolean(userCompany);

      if (!isSuperadmin && !isHR && !hasCompany) {
        setDrivers([]);
        return;
      }

      // Use driver API to get drivers with full details including salaryPerMile
      const response = await driverApi.getAllDrivers(1, 100);
      if (response?.success) {
        // Map driver data to include details - backend returns details object with salaryPerMile
        const driverList = (response.data || []).map((driver: any) => {
          // Backend returns driver with details object containing salaryPerMile fields
          // Check both nested details and direct properties (in case backend flattens it)
          const salaryPerMile = driver.details?.salaryPerMile ?? driver.salaryPerMile ?? 0;
          const salaryPerMileSnow = driver.details?.salaryPerMileSnow ?? driver.salaryPerMileSnow ?? 0;
          const salaryPerMileHighTemp = driver.details?.salaryPerMileHighTemp ?? driver.salaryPerMileHighTemp ?? 0;
          const highTempThreshold = driver.details?.highTempThreshold ?? driver.highTempThreshold ?? 35;

          console.log('Driver data:', {
            name: driver.name,
            details: driver.details,
            salaryPerMile: salaryPerMile
          });

          return {
            _id: driver._id,
            name: driver.name,
            role: driver.role || 'driver',
            details: {
              salaryPerMile: Number(salaryPerMile) || 0,
              salaryPerMileSnow: Number(salaryPerMileSnow) || 0,
              salaryPerMileHighTemp: Number(salaryPerMileHighTemp) || 0,
              highTempThreshold: Number(highTempThreshold) || 35
            }
          };
        });
        setDrivers(driverList);
      } else if (response?.message) {
        showNotification('error', response.message);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      showNotification('error', 'Error fetching drivers');
    }
  };

  const fetchPayrolls = async (searchQuery?: string) => {
    setLoading(true);
    try {
      const userInfo: any = getLocalUserInfo();
      const userRole = userInfo?.role || userInfo?.userData?.role;
      const userCompany = userInfo?.company || userInfo?.userData?.company;
      const isSuperadmin = userRole === 'superadmin';
      const isHR = userRole === 'hr';
      const hasCompany = Boolean(userCompany);

      if (!isSuperadmin && !isHR && !hasCompany) {
        setPayrollData([]);
        return;
      }

      const searchValue = searchQuery !== undefined ? searchQuery : searchTerm;
      const searchParam = searchValue ? `?search=${encodeURIComponent(searchValue)}` : '';
      const response = await listPayrolls(searchParam);

      if (response?.success) {
        // Filter to show only driver payrolls
        const driverPayrolls = (response.data || []).filter((payroll: DriverPayroll) =>
          payroll.userId && payroll.userId.role?.toLowerCase() === 'driver'
        );
        setPayrollData(driverPayrolls);
      } else {
        const message = response?.message || 'Failed to fetch driver payrolls';
        setPayrollData([]);
        showNotification('error', message);
      }
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      setPayrollData([]);
      showNotification('error', 'Error fetching driver payrolls');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverTrips = async (driverId: string, startDate: string, endDate: string) => {
    setLoadingTrips(true);
    try {
      const userInfo: any = getLocalUserInfo();
      const userRole = userInfo?.role || userInfo?.userData?.role;
      const userCompany = userInfo?.company || userInfo?.userData?.company;
      const isSuperadmin = userRole === 'superadmin';
      const isHR = userRole === 'hr';
      const isDispatcher = userRole === 'dispatcher';
      const hasCompany = Boolean(userCompany);

      if (!isSuperadmin && !isHR && !isDispatcher && !hasCompany) {
        setDriverTrips([]);
        setDriverPayrollSummary(null);
        setLoadingTrips(false);
        return;
      }

      const response = await getDriverCompletedTrips(driverId, startDate, endDate);

      if (response?.success) {
        const trips: Trip[] = (response.data || []).map((trip: any) => ({
          ...trip,
          selected: true // Auto-select all trips
        }));

        setDriverTrips(trips);

        if (response.summary) {
          setDriverPayrollSummary(response.summary);
        } else {
          // Fallback calculation if no summary provided
          const totalMiles = trips.reduce((sum, trip) => {
            const miles = typeof trip.distanceInMiles === 'string' ? parseFloat(trip.distanceInMiles) : (trip.distanceInMiles || 0);
            return sum + miles;
          }, 0);
          const totalEarnings = trips.reduce((sum, trip) => {
            const earnings = typeof trip.earnings === 'string' ? parseFloat(trip.earnings) : (typeof trip.earnings === 'number' ? trip.earnings : 0);
            return sum + earnings;
          }, 0);

          const fallbackSummary: TripSummary = {
            totalTrips: trips.length,
            totalDistanceKm: trips.reduce((sum, trip) => sum + (trip.distance || 0), 0),
            totalDistanceMiles: totalMiles,
            totalEarnings: totalEarnings,
            ratePerMile: trips[0]?.baseRate || 0,
            baseRate: trips[0]?.baseRate || 0,
            snowRate: trips[0]?.snowRate || 0,
            highTempRate: trips[0]?.highTempRate || 0
          };

          setDriverPayrollSummary(fallbackSummary);
        }
      } else {
        const errorMsg = response?.message || 'Failed to fetch driver trips';
        showNotification('error', errorMsg);
        setDriverTrips([]);
        setDriverPayrollSummary(null);
      }
    } catch (error: any) {
      console.error('Error fetching driver trips:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Error fetching driver trips';
      showNotification('error', errorMsg);
      setDriverTrips([]);
      setDriverPayrollSummary(null);
    } finally {
      setLoadingTrips(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchPayrolls();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPayrolls(searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'userId') {
      const selectedDrv = drivers.find(drv => drv._id === value);
      setSelectedDriver(selectedDrv || null);

      // Auto-fetch trips for current month
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      setFormData(prev => ({
        ...prev,
        [name]: value,
        startDate,
        endDate
      }));

      if (value) {
        fetchDriverTrips(value, startDate, endDate);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFormData(prev => ({
      ...prev,
      startDate,
      endDate
    }));

    if (selectedDriver && startDate && endDate) {
      fetchDriverTrips(selectedDriver._id, startDate, endDate);
    }
  };

  const toggleTripSelection = (tripId: string) => {
    setDriverTrips(prev => prev.map(trip =>
      trip._id === tripId ? { ...trip, selected: !trip.selected } : trip
    ));
  };

  const selectAllTrips = () => {
    setDriverTrips(prev => prev.map(trip => ({ ...trip, selected: true })));
  };

  const deselectAllTrips = () => {
    setDriverTrips(prev => prev.map(trip => ({ ...trip, selected: false })));
  };

  const getSelectedTripsTotals = () => {
    const selectedTrips = driverTrips.filter(trip => trip.selected);
    const totalMiles = selectedTrips.reduce((sum, trip) => {
      const miles = typeof trip.distanceInMiles === 'string' ? parseFloat(trip.distanceInMiles) : (trip.distanceInMiles || 0);
      return sum + miles;
    }, 0);
    const totalEarnings = selectedTrips.reduce((sum, trip) => {
      // Parse earnings - handle both string and number types
      let earnings = 0;
      if (trip.earnings !== undefined && trip.earnings !== null) {
        if (typeof trip.earnings === 'string') {
          earnings = parseFloat(trip.earnings) || 0;
        } else if (typeof trip.earnings === 'number') {
          earnings = trip.earnings;
        }
      }
      
      // If earnings is still 0, try to calculate from miles and rate
      if (earnings === 0 && trip.distanceInMiles) {
        const miles = typeof trip.distanceInMiles === 'string' ? parseFloat(trip.distanceInMiles) : (trip.distanceInMiles || 0);
        const rate = trip.baseRate || driverPayrollSummary?.baseRate || driverPayrollSummary?.ratePerMile || selectedDriver?.details?.salaryPerMile || 0;
        if (miles > 0 && rate > 0) {
          let calculatedEarnings = miles * rate;
          
          // Add snow premium if applicable
          if (trip.weatherConditions?.snow && trip.snowRate) {
            calculatedEarnings += miles * trip.snowRate;
          }
          
          // Add high temp premium if applicable
          if (trip.weatherConditions?.highTemperature && trip.highTempRate) {
            calculatedEarnings += miles * trip.highTempRate;
          }
          
          earnings = calculatedEarnings;
        }
      }
      
      return sum + earnings;
    }, 0);

    return {
      count: selectedTrips.length,
      totalMiles,
      totalEarnings
    };
  };

  const handleBulkAIGeneration = async () => {
    if (!bulkDateRange.startDate || !bulkDateRange.endDate) {
      showNotification('error', 'Please select start date and end date');
      return;
    }

    setLoadingBulkAI(true);
    setBulkPayrollSuggestions([]);

    try {
      const response = await bulkAnalyzeAIDriverPayrolls({
        startDate: bulkDateRange.startDate,
        endDate: bulkDateRange.endDate,
        payDate: bulkDateRange.payDate || new Date().toISOString().split('T')[0]
      });

      if (response?.success && response?.data?.suggestions) {
        setBulkPayrollSuggestions(response.data.suggestions);
        setBulkGenerateResult(response.data);
        setShowBulkGenerateModal(false);
        setShowBulkSuggestionsModal(true);
        showNotification('success', response.message || 'AI analysis completed! Review and edit the suggestions before creating.');
      } else {
        showNotification('error', response?.message || 'Failed to analyze payrolls');
        setBulkGenerateResult(response?.data || null);
      }
    } catch (error: any) {
      console.error('Error bulk analyzing payrolls:', error);
      showNotification('error', error?.response?.data?.message || error?.message || 'Error bulk analyzing payrolls');
    } finally {
      setLoadingBulkAI(false);
    }
  };

  const handleBulkCreatePayrolls = async () => {
    if (!bulkPayrollSuggestions || bulkPayrollSuggestions.length === 0) {
      showNotification('error', 'No payroll suggestions to create');
      return;
    }

    setLoadingBulkAI(true);

    try {
      const response = await bulkCreateDriverPayrolls({
        payrolls: bulkPayrollSuggestions,
        startDate: bulkDateRange.startDate,
        endDate: bulkDateRange.endDate,
        payDate: bulkDateRange.payDate || new Date().toISOString().split('T')[0]
      });

      if (response?.success) {
        showNotification('success', response.message || 'All payrolls created successfully!');
        setShowBulkSuggestionsModal(false);
        setBulkPayrollSuggestions([]);
        setBulkGenerateResult(null);
        fetchPayrolls();
      } else {
        showNotification('error', response?.message || 'Failed to create payrolls');
        if (response?.data) {
          setBulkGenerateResult(response.data);
        }
      }
    } catch (error: any) {
      console.error('Error bulk creating payrolls:', error);
      showNotification('error', error?.response?.data?.message || error?.message || 'Error bulk creating payrolls');
    } finally {
      setLoadingBulkAI(false);
    }
  };

  const updateBulkSuggestion = (index: number, field: string, value: any) => {
    setBulkPayrollSuggestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Recalculate totalSalary when relevant fields change
      if (['baseSalary', 'bonus', 'deductions', 'country', 'federalIncomeTaxCA', 'provincialIncomeTaxCA', 'cpp', 'ei', 'provincialHealthTaxCA', 'federalIncomeTaxUS', 'stateIncomeTaxUS', 'socialSecurityTax', 'medicareTax', 'stateDisabilityInsurance', 'localTax'].includes(field)) {
        const grossSalary = parseFloat(updated[index].baseSalary || 0) + parseFloat(updated[index].bonus || 0);
        const deductions = parseFloat(updated[index].deductions || 0);
        let totalTaxes = 0;
        if (updated[index].country === 'Canada') {
          totalTaxes = parseFloat(updated[index].federalIncomeTaxCA || 0) +
            parseFloat(updated[index].provincialIncomeTaxCA || 0) +
            parseFloat(updated[index].cpp || 0) +
            parseFloat(updated[index].ei || 0) +
            parseFloat(updated[index].provincialHealthTaxCA || 0);
        } else {
          totalTaxes = parseFloat(updated[index].federalIncomeTaxUS || 0) +
            parseFloat(updated[index].stateIncomeTaxUS || 0) +
            parseFloat(updated[index].socialSecurityTax || 0) +
            parseFloat(updated[index].medicareTax || 0) +
            parseFloat(updated[index].stateDisabilityInsurance || 0) +
            parseFloat(updated[index].localTax || 0);
        }
        updated[index].totalSalary = Math.round((grossSalary - deductions - totalTaxes) * 100) / 100;
      }
      return updated;
    });
  };

  const handleAICalculation = async () => {
    if (!formData.userId || !formData.startDate || !formData.endDate) {
      showNotification('error', 'Please select a driver and date range first');
      return;
    }

    setLoadingAI(true);
    setAiAnalysis(null);

    try {
      const response = await generateAIDriverPayroll({
        driverId: formData.userId,
        startDate: formData.startDate,
        endDate: formData.endDate
      });

      if (response?.success && response?.data) {
        const analysis = response.data;
        setAiAnalysis({
          recommendedBonus: analysis.recommendedBonus || 0,
          recommendedDeductions: analysis.recommendedDeductions || 0,
          performanceScore: analysis.performanceScore || 0,
          recommendations: analysis.recommendations || [],
          performanceNotes: analysis.performanceNotes || '',
          reasoning: analysis.reasoning || ''
        });

        // Update form fields with AI recommendations (bonus and deductions only, NOT taxes)
        // User will manually enter tax information
        setFormData(prev => ({
          ...prev,
          bonus: (analysis.recommendedBonus || 0).toString(),
          deductions: (analysis.recommendedDeductions || 0).toString()
          // Note: Taxes are NOT auto-populated - user must enter them manually
        }));

        showNotification('success', 'AI payroll analysis completed successfully! You can now review and enter tax information.');
      } else {
        showNotification('error', response?.message || 'Failed to generate AI analysis');
      }
    } catch (error: any) {
      console.error('Error generating AI analysis:', error);
      showNotification('error', error?.response?.data?.message || error?.message || 'Error generating AI analysis');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.userId || !formData.payDate || !formData.startDate || !formData.endDate) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    const selectedTrips = driverTrips.filter(t => t.selected);
    if (selectedTrips.length === 0) {
      showNotification('error', 'Please select at least one trip');
      return;
    }

    setLoading(true);

    try {
      const selectedTotals = getSelectedTripsTotals();
      
      console.log('📊 Creating payroll with:', {
        selectedTripsCount: selectedTrips.length,
        totalMiles: selectedTotals.totalMiles,
        totalEarnings: selectedTotals.totalEarnings,
        summaryTotalEarnings: driverPayrollSummary?.totalEarnings,
        summaryTotalTrips: driverPayrollSummary?.totalTrips,
        ratePerMile: driverPayrollSummary?.ratePerMile || driverPayrollSummary?.baseRate,
        tripsWithEarnings: selectedTrips.filter(t => {
          const earnings = typeof t.earnings === 'string' ? parseFloat(t.earnings) : (typeof t.earnings === 'number' ? t.earnings : 0);
          return earnings > 0;
        }).length
      });
      
      // Ensure we have earnings - use summary if trips don't have earnings
      let baseSalary = selectedTotals.totalEarnings;
      if (baseSalary === 0 && driverPayrollSummary?.totalEarnings) {
        // If selected trips don't have earnings, use the summary total (for all trips in date range)
        // But only if the selected trips count matches the summary count
        if (selectedTotals.count === driverPayrollSummary.totalTrips) {
          baseSalary = driverPayrollSummary.totalEarnings;
          console.log('✅ Using summary totalEarnings:', baseSalary);
        } else {
          // Recalculate based on selected trips using summary rate
          const rate = driverPayrollSummary.baseRate || driverPayrollSummary.ratePerMile || selectedDriver?.details?.salaryPerMile || 0;
          if (rate > 0 && selectedTotals.totalMiles > 0) {
            baseSalary = selectedTotals.totalMiles * rate;
            console.log('✅ Calculated baseSalary from miles and rate:', baseSalary);
          }
        }
      }
      
      // Final fallback: if still 0, calculate from miles and rate
      if (baseSalary === 0 && selectedTotals.totalMiles > 0) {
        const rate = driverPayrollSummary?.baseRate || driverPayrollSummary?.ratePerMile || selectedDriver?.details?.salaryPerMile || 0;
        if (rate > 0) {
          baseSalary = selectedTotals.totalMiles * rate;
          console.log('✅ Final fallback: Calculated baseSalary from miles and rate:', baseSalary);
        }
      }
      
      if (baseSalary === 0) {
        console.warn('⚠️ Warning: baseSalary is still 0!', {
          selectedTrips: selectedTrips.map(t => ({
            id: t._id,
            earnings: t.earnings,
            distanceInMiles: t.distanceInMiles,
            baseRate: t.baseRate
          }))
        });
      }

      // Create payload for driver payroll
      const payload: any = {
        userId: formData.userId,
        baseSalary: baseSalary,
        bonus: parseFloat(formData.bonus) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        payDate: formData.payDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
        tripIds: selectedTrips.map(trip => trip._id).filter(id => id),
        totalMiles: selectedTotals.totalMiles,
        ratePerMile: driverPayrollSummary?.ratePerMile || driverPayrollSummary?.baseRate || selectedDriver?.details?.salaryPerMile || 0,
        country: formData.country || 'USA',
        // Canada taxes
        federalIncomeTaxCA: parseFloat(formData.federalIncomeTaxCA || '0'),
        provincialIncomeTaxCA: parseFloat(formData.provincialIncomeTaxCA || '0'),
        cpp: parseFloat(formData.cpp || '0'),
        ei: parseFloat(formData.ei || '0'),
        provincialHealthTaxCA: parseFloat(formData.provincialHealthTaxCA || '0'),
        // USA taxes
        federalIncomeTaxUS: parseFloat(formData.federalIncomeTaxUS || '0'),
        stateIncomeTaxUS: parseFloat(formData.stateIncomeTaxUS || '0'),
        socialSecurityTax: parseFloat(formData.socialSecurityTax || '0'),
        medicareTax: parseFloat(formData.medicareTax || '0'),
        stateDisabilityInsurance: parseFloat(formData.stateDisabilityInsurance || '0'),
        localTax: parseFloat(formData.localTax || '0')
      };

      const response = await createPayroll(payload);

      if (response?.success) {
        showNotification('success', response.message || 'Driver payroll created successfully!');
        setShowCreateModal(false);
        setAiAnalysis(null); // Clear AI analysis after successful creation
        resetForm();
        fetchPayrolls();
      } else {
        const errorMsg = response?.message || response?.error || 'Failed to create driver payroll';
        showNotification('error', errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Error creating driver payroll';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPayroll) return;

    if (!formData.userId || !formData.payDate || !formData.startDate || !formData.endDate) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        userId: formData.userId,
        baseSalary: selectedPayroll.baseSalary, // Keep existing baseSalary
        bonus: parseFloat(formData.bonus) || 0,
        deductions: parseFloat(formData.deductions) || 0,
        payDate: formData.payDate,
        startDate: formData.startDate,
        endDate: formData.endDate,
        country: formData.country || 'USA',
        // Canada taxes
        federalIncomeTaxCA: parseFloat(formData.federalIncomeTaxCA || '0'),
        provincialIncomeTaxCA: parseFloat(formData.provincialIncomeTaxCA || '0'),
        cpp: parseFloat(formData.cpp || '0'),
        ei: parseFloat(formData.ei || '0'),
        provincialHealthTaxCA: parseFloat(formData.provincialHealthTaxCA || '0'),
        // USA taxes
        federalIncomeTaxUS: parseFloat(formData.federalIncomeTaxUS || '0'),
        stateIncomeTaxUS: parseFloat(formData.stateIncomeTaxUS || '0'),
        socialSecurityTax: parseFloat(formData.socialSecurityTax || '0'),
        medicareTax: parseFloat(formData.medicareTax || '0'),
        stateDisabilityInsurance: parseFloat(formData.stateDisabilityInsurance || '0'),
        localTax: parseFloat(formData.localTax || '0')
      };

      const response = await updatePayroll(selectedPayroll._id, payload);

      if (response?.success) {
        showNotification('success', response.message || 'Driver payroll updated successfully!');
        setShowEditModal(false);
        resetForm();
        setSelectedPayroll(null);
        fetchPayrolls();
      } else {
        const errorMsg = response?.message || response?.error || 'Failed to update driver payroll';
        showNotification('error', errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Error updating driver payroll';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPayroll) return;

    setLoading(true);

    try {
      const response = await deletePayroll(selectedPayroll._id);

      if (response?.success) {
        showNotification('success', response.message || 'Driver payroll deleted successfully!');
        setShowDeleteModal(false);
        setSelectedPayroll(null);
        fetchPayrolls();
      } else {
        const errorMsg = response?.message || response?.error || 'Failed to delete driver payroll';
        showNotification('error', errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || 'Error deleting driver payroll';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openViewModal = (payroll: DriverPayroll) => {
    setSelectedPayroll(payroll);
    setShowViewModal(true);
  };

  const openEditModal = (payroll: DriverPayroll) => {
    setSelectedPayroll(payroll);
    const payDateFormatted = payroll.payDate ? payroll.payDate.split('T')[0] : '';

    setFormData({
      userId: payroll.userId._id,
      bonus: payroll.bonus.toString(),
      deductions: payroll.deductions.toString(),
      payDate: payDateFormatted,
      startDate: payroll.startDate.split('T')[0],
      endDate: payroll.endDate.split('T')[0],
      country: payroll.country || 'USA',
      // Canada taxes
      federalIncomeTaxCA: (payroll.federalIncomeTaxCA || 0).toString(),
      provincialIncomeTaxCA: (payroll.provincialIncomeTaxCA || 0).toString(),
      cpp: (payroll.cpp || 0).toString(),
      ei: (payroll.ei || 0).toString(),
      provincialHealthTaxCA: (payroll.provincialHealthTaxCA || 0).toString(),
      // USA taxes
      federalIncomeTaxUS: (payroll.federalIncomeTaxUS || 0).toString(),
      stateIncomeTaxUS: (payroll.stateIncomeTaxUS || 0).toString(),
      socialSecurityTax: (payroll.socialSecurityTax || 0).toString(),
      medicareTax: (payroll.medicareTax || 0).toString(),
      stateDisabilityInsurance: (payroll.stateDisabilityInsurance || 0).toString(),
      localTax: (payroll.localTax || 0).toString()
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (payroll: DriverPayroll) => {
    setSelectedPayroll(payroll);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      bonus: '0',
      deductions: '0',
      payDate: '',
      startDate: '',
      endDate: '',
      country: 'USA',
      // Canada taxes
      federalIncomeTaxCA: '0',
      provincialIncomeTaxCA: '0',
      cpp: '0',
      ei: '0',
      provincialHealthTaxCA: '0',
      // USA taxes
      federalIncomeTaxUS: '0',
      stateIncomeTaxUS: '0',
      socialSecurityTax: '0',
      medicareTax: '0',
      stateDisabilityInsurance: '0',
      localTax: '0'
    });
    setSelectedDriver(null);
    setDriverTrips([]);
    setDriverPayrollSummary(null);
  };

  const filteredPayrolls = payrollData.filter(payroll => {
    const searchLower = searchTerm.toLowerCase();
    return searchTerm === '' ||
      payroll.userId.name?.toLowerCase().includes(searchLower);
  });

  const totalPayroll = payrollData.reduce((sum, payroll) => sum + payroll.totalSalary, 0);
  const totalMiles = payrollData.reduce((sum, payroll) => sum + (payroll.totalMiles || 0), 0);
  const avgPerMile = totalMiles > 0 ? totalPayroll / totalMiles : 0;

  return (
    <div className="min-h-screen bg-[#EDF8FF] px-6">
      <div className="py-8 w-full mx-auto">
        {notification && (
          <div className={`fixed top-4 right-4 z-[10000] flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}>
            {notification.type === 'success' ? (
              <CheckCircle size={20} />
            ) : (
              <AlertCircle size={20} />
            )}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}>
              <X size={20} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              <Truck className="text-[#42aeec]" size={36} />
              Driver Payroll
            </h1>
            <p className="text-gray-600 mt-2">Manage driver earnings based on trips and miles</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkGenerateModal(true)}
              className="px-4 py-2 !text-white rounded-lg transition-all font-medium flex items-center gap-2 hover:shadow-lg hover:scale-105 transform duration-200"
              style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              AI Generate All Drivers Payroll
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 !text-white rounded-lg transition-all font-medium flex items-center gap-2 hover:shadow-lg hover:scale-105 transform duration-200"
              style={{ background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)' }}
            >
              <Plus size={16} />
              Create Driver Payroll
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#E3F2FD] p-6 rounded-xl border-blue-100 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#063f6f]">Total Payroll</p>
                <p className="text-2xl font-bold text-[#016ab2] mt-1">${totalPayroll.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-white">
                <DollarSign className="text-[#42aeec]" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-[#E1F5FE] p-6 rounded-xl border-cyan-100 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#063f6f]">Active Drivers</p>
                <p className="text-2xl font-bold text-[#016ab2] mt-1">{payrollData.length}</p>
              </div>
              <div className="p-3 rounded-full bg-white">
                <Users className="text-[#42aeec]" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-[#E8F5E9] p-6 rounded-xl border-green-100 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#063f6f]">Total Miles</p>
                <p className="text-2xl font-bold text-[#016ab2] mt-1">{totalMiles.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-white">
                <TrendingUp className="text-[#42aeec]" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-[#F3E5F5] p-6 rounded-xl border-purple-100 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#063f6f]">Avg per Mile</p>
                <p className="text-2xl font-bold text-[#016ab2] mt-1">${avgPerMile.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-full bg-white">
                <Package className="text-[#42aeec]" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border-gray-200 shadow-sm border mb-6">
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border-gray-200 rounded-xl shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Driver Payroll Records</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : filteredPayrolls.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No driver payroll records found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trips</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Miles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate/Mile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip Earnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Pay</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayrolls.map((payroll) => (
                    <tr key={payroll._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium bg-green-500">
                            {payroll.userId.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{payroll.userId.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payroll.trips?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payroll.totalMiles?.toLocaleString() || 0} mi
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${payroll.ratePerMile || 0}/mi
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        ${payroll.baseSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        +${payroll.bonus.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        -${payroll.deductions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${payroll.totalSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(payroll.payDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openViewModal(payroll)}
                            className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => openEditModal(payroll)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => openDeleteModal(payroll)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center overflow-auto p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100">
                    <Truck className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">
                      {showCreateModal ? 'Create Driver Payroll' : 'Edit Driver Payroll'}
                    </h4>
                    <p className="text-sm text-gray-500">Based on completed trips and mileage</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setAiAnalysis(null); // Clear AI analysis when modal is closed
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {showCreateModal && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Driver <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="userId"
                        value={formData.userId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">Choose a driver...</option>
                        {drivers.map((driver) => (
                          <option key={driver._id} value={driver._id}>
                            {driver.name} - Base: ${driver.details?.salaryPerMile || 0}/mi
                            {driver.details?.salaryPerMileSnow ? ` | Snow: +$${driver.details.salaryPerMileSnow}/mi` : ''}
                            {driver.details?.salaryPerMileHighTemp ? ` | High Temp: +$${driver.details.salaryPerMileHighTemp}/mi` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar size={16} />
                        Trip Period
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={(e) => handleDateRangeChange(e.target.value, formData.endDate)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={(e) => handleDateRangeChange(formData.startDate, e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trip Summary */}
                    {driverPayrollSummary && (
                      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h5 className="text-lg font-bold flex items-center gap-2">
                              <TrendingUp size={20} />
                              Trip Summary for {selectedDriver?.name}
                            </h5>
                          </div>
                          <button
                            onClick={handleAICalculation}
                            disabled={loadingAI || !formData.userId || !formData.startDate || !formData.endDate}
                            className="px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                            title="Calculate bonus and deductions using AI"
                          >
                            {loadingAI ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                AI Calculate Salary
                              </>
                            )}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold">{driverPayrollSummary.totalTrips}</div>
                            <div className="text-sm text-green-100">Total Trips</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold">{driverPayrollSummary.totalDistanceMiles.toLocaleString()}</div>
                            <div className="text-sm text-green-100">Total Miles</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-bold">${driverPayrollSummary.baseRate || driverPayrollSummary.ratePerMile || 0}</div>
                            <div className="text-sm text-green-100">Base Rate/mi</div>
                          </div>
                          {(driverPayrollSummary.snowRate && driverPayrollSummary.snowRate > 0) && (
                            <div className="text-center">
                              <div className="text-2xl font-bold">+${driverPayrollSummary.snowRate}</div>
                              <div className="text-xs text-green-100">Snow Premium/mi</div>
                            </div>
                          )}
                          {(driverPayrollSummary.highTempRate && driverPayrollSummary.highTempRate > 0) && (
                            <div className="text-center">
                              <div className="text-2xl font-bold">+${driverPayrollSummary.highTempRate}</div>
                              <div className="text-xs text-green-100">High Temp Premium/mi</div>
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-3xl font-bold">${driverPayrollSummary.totalEarnings.toFixed(2)}</div>
                            <div className="text-sm text-green-100">Total Earnings</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Trip List */}
                    {driverTrips.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                          <h5 className="text-sm font-medium text-gray-700">Completed Trips ({driverTrips.length})</h5>
                          <div className="flex gap-2">
                            <button
                              onClick={selectAllTrips}
                              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                              Select All
                            </button>
                            <button
                              onClick={deselectAllTrips}
                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>
                        <div className="overflow-x-auto max-h-96">
                          <table className="w-full">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trip #</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Truck</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Miles</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {driverTrips.map((trip) => (
                                <tr key={trip._id} className={`hover:bg-gray-50 ${trip.selected ? 'bg-green-50' : ''}`}>
                                  <td className="px-3 py-2">
                                    <input
                                      type="checkbox"
                                      checked={trip.selected || false}
                                      onChange={() => toggleTripSelection(trip._id)}
                                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                    {trip.tripNumber || trip._id?.slice(-6).toUpperCase()}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                      <MapPin size={14} className="text-gray-400" />
                                      <span>
                                        {(() => {
                                          // Try to get location from trip, orders, or use Unknown
                                          if (trip.startLocation?.place && trip.startLocation.place !== 'Unknown') {
                                            return trip.startLocation.place;
                                          }
                                          if (trip.orders && trip.orders.length > 0) {
                                            const firstOrder = Array.isArray(trip.orders) ? trip.orders[0] : trip.orders;
                                            if (firstOrder?.pickupLocation?.place) {
                                              return firstOrder.pickupLocation.place;
                                            }
                                            if (firstOrder?.pickupLocation?.placeId?.name) {
                                              return firstOrder.pickupLocation.placeId.name;
                                            }
                                          }
                                          return 'Unknown';
                                        })()}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span>
                                        {(() => {
                                          // Try to get location from trip, orders, or use Unknown
                                          if (trip.endLocation?.place && trip.endLocation.place !== 'Unknown') {
                                            return trip.endLocation.place;
                                          }
                                          if (trip.orders && trip.orders.length > 0) {
                                            const orderArray = Array.isArray(trip.orders) ? trip.orders : [trip.orders];
                                            const lastOrder = orderArray[orderArray.length - 1];
                                            if (lastOrder?.deliveryLocation?.place) {
                                              return lastOrder.deliveryLocation.place;
                                            }
                                            if (lastOrder?.deliveryLocation?.placeId?.name) {
                                              return lastOrder.deliveryLocation.placeId.name;
                                            }
                                          }
                                          return 'Unknown';
                                        })()}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-sm">
                                    {trip.driverRole === 'coDriver' ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        Co-Driver
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Driver
                                      </span>
                                    )}
                                    {trip.coDriverDetails && trip.driverRole === 'driver' && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Co: {trip.coDriverDetails.name}
                                      </div>
                                    )}
                                    {trip.driverDetails && trip.driverRole === 'coDriver' && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Driver: {trip.driverDetails.name}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    {trip.actualEndDate ? new Date(trip.actualEndDate).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    {trip.truck?.plateNumber || trip.truck?.licensePlate || trip.truck?.internalId || 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                    {(() => {
                                      const miles = typeof trip.distanceInMiles === 'string' ? parseFloat(trip.distanceInMiles) : (trip.distanceInMiles || 0);
                                      return miles || 0;
                                    })()}
                                  </td>
                                  <td className="px-3 py-2 text-sm text-gray-600">
                                    ${trip.baseRate || 0}/mi
                                    {trip.weatherConditions?.snow && trip.snowRate ? ` + $${trip.snowRate} (snow)` : ''}
                                    {trip.weatherConditions?.highTemperature && trip.highTempRate ? ` + $${trip.highTempRate} (high temp)` : ''}
                                  </td>
                                  <td className="px-3 py-2 text-sm font-bold text-green-600">
                                    ${(() => {
                                      const earnings = typeof trip.earnings === 'string' ? parseFloat(trip.earnings) : (typeof trip.earnings === 'number' ? trip.earnings : 0);
                                      return earnings.toFixed(2);
                                    })()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-green-50 sticky bottom-0">
                              <tr>
                                <td colSpan={6} className="px-3 py-3 text-sm font-medium text-gray-900 text-right">
                                  Selected Totals:
                                </td>
                                <td className="px-3 py-3 text-sm font-bold text-gray-900">
                                  {getSelectedTripsTotals().totalMiles.toLocaleString()} mi
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-600">-</td>
                                <td className="px-3 py-3 text-sm font-bold text-green-600">
                                  ${getSelectedTripsTotals().totalEarnings.toFixed(2)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}

                    {loadingTrips && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                        <p className="text-sm text-green-600 font-medium mt-2">Loading trips...</p>
                      </div>
                    )}

                    {!loadingTrips && driverTrips.length === 0 && selectedDriver && formData.startDate && formData.endDate && (
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="text-yellow-600" size={18} />
                          <div className="text-sm font-medium text-yellow-800">No completed trips found</div>
                        </div>
                        <p className="text-xs text-yellow-700">
                          No trips found for {selectedDriver.name} between {formData.startDate} and {formData.endDate}.
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* AI Analysis Results */}
                {aiAnalysis && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <h5 className="text-lg font-bold text-gray-900">AI Payroll Analysis</h5>
                          <p className="text-sm text-gray-600">Performance Score: {aiAnalysis.performanceScore}/100</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setAiAnalysis(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="text-sm text-gray-600 mb-1">Recommended Bonus</div>
                        <div className="text-2xl font-bold text-green-600">${aiAnalysis.recommendedBonus.toFixed(2)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="text-sm text-gray-600 mb-1">Recommended Deductions</div>
                        <div className="text-2xl font-bold text-red-600">${aiAnalysis.recommendedDeductions.toFixed(2)}</div>
                      </div>
                    </div>

                    {aiAnalysis.reasoning && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">AI Reasoning:</div>
                        <p className="text-sm text-gray-600">{aiAnalysis.reasoning}</p>
                      </div>
                    )}

                    {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">Recommendations:</div>
                        <ul className="space-y-1">
                          {aiAnalysis.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiAnalysis.performanceNotes && (
                      <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">Performance Notes:</div>
                        <p className="text-sm text-gray-600">{aiAnalysis.performanceNotes}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bonus ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="number"
                        name="bonus"
                        value={formData.bonus}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deductions ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="number"
                        name="deductions"
                        value={formData.deductions}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Tax Section */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-purple-600" />
                    Tax Information
                  </h5>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white"
                    >
                      <option value="USA">United States</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>

                  {formData.country === 'Canada' && (
                    <div className="space-y-4">
                      <h6 className="text-sm font-semibold text-gray-700 mb-3">Canada Taxes</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Federal Income Tax ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="number"
                              name="federalIncomeTaxCA"
                              value={formData.federalIncomeTaxCA}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Provincial Income Tax ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="number"
                              name="provincialIncomeTaxCA"
                              value={formData.provincialIncomeTaxCA}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Canada Pension Plan (CPP) ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="number"
                              name="cpp"
                              value={formData.cpp}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Employment Insurance (EI) ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="number"
                              name="ei"
                              value={formData.ei}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Provincial Health Tax ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="number"
                              name="provincialHealthTaxCA"
                              value={formData.provincialHealthTaxCA}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.country === 'USA' && (
                    <div className="space-y-4">
                      <h6 className="text-sm font-semibold text-gray-700 mb-3">United States Taxes</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Federal Income Tax ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="number"
                              name="federalIncomeTaxUS"
                              value={formData.federalIncomeTaxUS}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State Income Tax ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="number"
                              name="stateIncomeTaxUS"
                              value={formData.stateIncomeTaxUS}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Social Security Tax (FICA) ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="number"
                              name="socialSecurityTax"
                              value={formData.socialSecurityTax}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Medicare Tax ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="number"
                              name="medicareTax"
                              value={formData.medicareTax}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State Disability Insurance (SDI) ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="number"
                              name="stateDisabilityInsurance"
                              value={formData.stateDisabilityInsurance}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Local Tax ($)
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                              type="number"
                              name="localTax"
                              value={formData.localTax}
                              onChange={handleInputChange}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tax Summary */}
                  {getSelectedTripsTotals().count > 0 && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-purple-300">
                      <h6 className="text-sm font-semibold text-gray-700 mb-2">Total Taxes</h6>
                      <div className="text-2xl font-bold text-purple-600">
                        ${(() => {
                          let totalTax = 0;
                          if (formData.country === 'Canada') {
                            totalTax =
                              parseFloat(formData.federalIncomeTaxCA || '0') +
                              parseFloat(formData.provincialIncomeTaxCA || '0') +
                              parseFloat(formData.cpp || '0') +
                              parseFloat(formData.ei || '0') +
                              parseFloat(formData.provincialHealthTaxCA || '0');
                          } else {
                            totalTax =
                              parseFloat(formData.federalIncomeTaxUS || '0') +
                              parseFloat(formData.stateIncomeTaxUS || '0') +
                              parseFloat(formData.socialSecurityTax || '0') +
                              parseFloat(formData.medicareTax || '0') +
                              parseFloat(formData.stateDisabilityInsurance || '0') +
                              parseFloat(formData.localTax || '0');
                          }
                          return totalTax.toFixed(2);
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="payDate"
                    value={formData.payDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {getSelectedTripsTotals().count > 0 && (
                  <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-green-100">Gross Earnings</p>
                        <p className="text-lg font-semibold">
                          ${(
                            getSelectedTripsTotals().totalEarnings +
                            parseFloat(formData.bonus || '0')
                          ).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-green-100">Deductions</p>
                        <p className="text-red-200">-${parseFloat(formData.deductions || '0').toFixed(2)}</p>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-green-100">Taxes</p>
                        <p className="text-red-200">
                          -${(() => {
                            let totalTax = 0;
                            if (formData.country === 'Canada') {
                              totalTax =
                                parseFloat(formData.federalIncomeTaxCA || '0') +
                                parseFloat(formData.provincialIncomeTaxCA || '0') +
                                parseFloat(formData.cpp || '0') +
                                parseFloat(formData.ei || '0') +
                                parseFloat(formData.provincialHealthTaxCA || '0');
                            } else {
                              totalTax =
                                parseFloat(formData.federalIncomeTaxUS || '0') +
                                parseFloat(formData.stateIncomeTaxUS || '0') +
                                parseFloat(formData.socialSecurityTax || '0') +
                                parseFloat(formData.medicareTax || '0') +
                                parseFloat(formData.stateDisabilityInsurance || '0') +
                                parseFloat(formData.localTax || '0');
                            }
                            return totalTax.toFixed(2);
                          })()}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-green-500 flex justify-between items-center">
                        <p className="text-sm font-bold text-green-100">Net Pay</p>
                        <p className="text-4xl font-bold mt-1">
                          ${(() => {
                            const gross = getSelectedTripsTotals().totalEarnings + parseFloat(formData.bonus || '0');
                            const deductions = parseFloat(formData.deductions || '0');
                            let totalTax = 0;
                            if (formData.country === 'Canada') {
                              totalTax =
                                parseFloat(formData.federalIncomeTaxCA || '0') +
                                parseFloat(formData.provincialIncomeTaxCA || '0') +
                                parseFloat(formData.cpp || '0') +
                                parseFloat(formData.ei || '0') +
                                parseFloat(formData.provincialHealthTaxCA || '0');
                            } else {
                              totalTax =
                                parseFloat(formData.federalIncomeTaxUS || '0') +
                                parseFloat(formData.stateIncomeTaxUS || '0') +
                                parseFloat(formData.socialSecurityTax || '0') +
                                parseFloat(formData.medicareTax || '0') +
                                parseFloat(formData.stateDisabilityInsurance || '0') +
                                parseFloat(formData.localTax || '0');
                            }
                            return (gross - deductions - totalTax).toFixed(2);
                          })()}
                        </p>
                      </div>
                      <div className="text-right mt-2">
                        <p className="text-xs text-green-100">Based on</p>
                        <p className="text-sm font-bold">{getSelectedTripsTotals().count} trips</p>
                        <p className="text-xs text-green-100">{getSelectedTripsTotals().totalMiles.toLocaleString()} miles</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setAiAnalysis(null); // Clear AI analysis when modal is closed
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center gap-2"
                    disabled={loading}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                  <button
                    onClick={showCreateModal ? handleCreate : handleUpdate}
                    style={{
                      background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)'
                    }}
                    className="px-4 py-2   !text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        {showCreateModal ? <Plus size={16} /> : <CheckCircle size={16} />}
                        {showCreateModal ? 'Create Payroll' : 'Update Payroll'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedPayroll && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center overflow-auto p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Eye className="text-green-600" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Driver Payroll Details</h4>
                    <p className="text-sm text-gray-500">{selectedPayroll.userId.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Driver Info */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
                  <h5 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Truck size={20} />
                    Driver Information
                  </h5>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-green-100">Driver Name</label>
                      <div className="text-xl font-bold mt-1">{selectedPayroll.userId.name}</div>
                    </div>
                    <div>
                      <label className="text-sm text-green-100">Total Trips</label>
                      <div className="text-xl font-bold mt-1">{selectedPayroll.trips?.length || 0}</div>
                    </div>
                    <div>
                      <label className="text-sm text-green-100">Pay Period</label>
                      <div className="text-sm font-medium mt-1">
                        {new Date(selectedPayroll.startDate).toLocaleDateString()} - {new Date(selectedPayroll.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                {selectedPayroll.trips && selectedPayroll.trips.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700">Trip Details ({selectedPayroll.trips.length})</h5>
                    </div>
                    <div className="overflow-x-auto max-h-80">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Trip #</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Miles</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedPayroll.trips.map((trip) => (
                            <tr key={trip._id} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                {trip.tripNumber || trip._id?.slice(-6).toUpperCase()}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <MapPin size={14} className="text-gray-400" />
                                  <span>
                                    {(() => {
                                      // Try to get location from trip, orders, or use Unknown
                                      if (trip.startLocation?.place && trip.startLocation.place !== 'Unknown') {
                                        return trip.startLocation.place;
                                      }
                                      if (trip.orders && trip.orders.length > 0) {
                                        const firstOrder = Array.isArray(trip.orders) ? trip.orders[0] : trip.orders;
                                        if (firstOrder?.pickupLocation?.place) {
                                          return firstOrder.pickupLocation.place;
                                        }
                                        if (firstOrder?.pickupLocation?.placeId?.name) {
                                          return firstOrder.pickupLocation.placeId.name;
                                        }
                                      }
                                      return 'Unknown';
                                    })()}
                                  </span>
                                  <span className="text-gray-400">→</span>
                                  <span>
                                    {(() => {
                                      // Try to get location from trip, orders, or use Unknown
                                      if (trip.endLocation?.place && trip.endLocation.place !== 'Unknown') {
                                        return trip.endLocation.place;
                                      }
                                      if (trip.orders && trip.orders.length > 0) {
                                        const orderArray = Array.isArray(trip.orders) ? trip.orders : [trip.orders];
                                        const lastOrder = orderArray[orderArray.length - 1];
                                        if (lastOrder?.deliveryLocation?.place) {
                                          return lastOrder.deliveryLocation.place;
                                        }
                                        if (lastOrder?.deliveryLocation?.placeId?.name) {
                                          return lastOrder.deliveryLocation.placeId.name;
                                        }
                                      }
                                      return 'Unknown';
                                    })()}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm">
                                {trip.driverRole === 'coDriver' ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Co-Driver
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Driver
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-600">
                                {trip.actualEndDate ? new Date(trip.actualEndDate).toLocaleDateString() : '-'}
                              </td>
                              <td className="px-3 py-2 text-sm font-medium text-gray-900">
                                {(() => {
                                  // Calculate miles from route or use stored value
                                  let miles: number = 0;
                                  if (trip.distanceInMiles) {
                                    miles = typeof trip.distanceInMiles === 'string' ? parseFloat(trip.distanceInMiles) : trip.distanceInMiles;
                                  } else if (trip.route && trip.route.totalDistance) {
                                    miles = parseFloat((trip.route.totalDistance * 0.621371).toFixed(2));
                                  }
                                  return miles || 0;
                                })()} mi
                              </td>
                              <td className="px-3 py-2 text-sm font-bold text-green-600">
                                {(() => {
                                  // Calculate earnings from miles and rate, or use stored value
                                  let earnings: number = 0;
                                  if (trip.earnings) {
                                    earnings = typeof trip.earnings === 'string' ? parseFloat(trip.earnings) : trip.earnings;
                                  }
                                  if (!earnings || earnings === 0) {
                                    let miles: number = 0;
                                    if (trip.distanceInMiles) {
                                      miles = typeof trip.distanceInMiles === 'string' ? parseFloat(trip.distanceInMiles) : trip.distanceInMiles;
                                    } else if (trip.route?.totalDistance) {
                                      miles = parseFloat((trip.route.totalDistance * 0.621371).toFixed(2));
                                    }
                                    const rate = selectedPayroll.ratePerMile || 0; // This comes from payroll record
                                    if (miles && rate) {
                                      earnings = parseFloat((miles * rate).toFixed(2));
                                    }
                                  }
                                  return `$${earnings.toFixed(2)}`;
                                })()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Earnings Breakdown */}
                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                  <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-green-600" />
                    Earnings Breakdown
                  </h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Trip Earnings ({selectedPayroll.totalMiles?.toLocaleString()} miles @ ${selectedPayroll.ratePerMile}/mi)</span>
                      <span className="text-lg font-bold text-gray-900">${selectedPayroll.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Bonus</span>
                      <span className="text-lg font-bold text-green-600">+${selectedPayroll.bonus.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Deductions</span>
                      <span className="text-lg font-bold text-red-600">-${selectedPayroll.deductions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Taxes</span>
                      <span className="text-lg font-bold text-red-600">
                        -${(() => {
                          let totalTax = 0;
                          const country = selectedPayroll.country || 'USA';
                          if (country === 'Canada') {
                            totalTax =
                              (selectedPayroll.federalIncomeTaxCA || 0) +
                              (selectedPayroll.provincialIncomeTaxCA || 0) +
                              (selectedPayroll.cpp || 0) +
                              (selectedPayroll.ei || 0) +
                              (selectedPayroll.provincialHealthTaxCA || 0);
                          } else {
                            totalTax =
                              (selectedPayroll.federalIncomeTaxUS || 0) +
                              (selectedPayroll.stateIncomeTaxUS || 0) +
                              (selectedPayroll.socialSecurityTax || 0) +
                              (selectedPayroll.medicareTax || 0) +
                              (selectedPayroll.stateDisabilityInsurance || 0) +
                              (selectedPayroll.localTax || 0);
                          }
                          return totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-600 to-green-700 rounded-lg">
                      <span className="text-sm font-medium text-white">Net Pay</span>
                      <span className="text-2xl font-bold text-white">${selectedPayroll.totalSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Information */}
                {(() => {
                  const country = selectedPayroll.country || 'USA';
                  const totalTaxes = country === 'Canada'
                    ? ((selectedPayroll.federalIncomeTaxCA || 0) +
                      (selectedPayroll.provincialIncomeTaxCA || 0) +
                      (selectedPayroll.cpp || 0) +
                      (selectedPayroll.ei || 0) +
                      (selectedPayroll.provincialHealthTaxCA || 0))
                    : ((selectedPayroll.federalIncomeTaxUS || 0) +
                      (selectedPayroll.stateIncomeTaxUS || 0) +
                      (selectedPayroll.socialSecurityTax || 0) +
                      (selectedPayroll.medicareTax || 0) +
                      (selectedPayroll.stateDisabilityInsurance || 0) +
                      (selectedPayroll.localTax || 0));

                  if (totalTaxes > 0) {
                    return (
                      <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                        <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <DollarSign size={20} className="text-purple-600" />
                          Tax Information ({country})
                        </h5>
                        {country === 'Canada' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Federal Income Tax:</span>
                              <span className="text-sm font-medium">${(selectedPayroll.federalIncomeTaxCA || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Provincial Income Tax:</span>
                              <span className="text-sm font-medium">${(selectedPayroll.provincialIncomeTaxCA || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">CPP:</span>
                              <span className="text-sm font-medium">${(selectedPayroll.cpp || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">EI:</span>
                              <span className="text-sm font-medium">${(selectedPayroll.ei || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Provincial Health Tax:</span>
                              <span className="text-sm font-medium">${(selectedPayroll.provincialHealthTaxCA || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Federal Income Tax:</span>
                              <span className="text-sm font-medium">${(selectedPayroll.federalIncomeTaxUS || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">State Income Tax:</span>
                              <span className="text-sm font-medium">${(selectedPayroll.stateIncomeTaxUS || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Social Security:</span>
                              <span className="text-sm font-medium">${(selectedPayroll.socialSecurityTax || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Medicare:</span>
                              <span className="text-sm font-medium">${(selectedPayroll.medicareTax || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">SDI:</span>
                              <span className="text-sm font-medium">${(selectedPayroll.stateDisabilityInsurance || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-white rounded">
                              <span className="text-sm text-gray-600">Local Tax:</span>
                              <span className="text-sm font-medium">${(selectedPayroll.localTax || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-purple-300 flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">Total Taxes:</span>
                          <span className="text-lg font-bold text-purple-600">${totalTaxes.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Payment Info */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-orange-600" />
                    Payment Information
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Payment Date</label>
                      <div className="mt-1 px-4 py-3 bg-white rounded-lg text-gray-900 font-medium">
                        {new Date(selectedPayroll.payDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">Pay Period</label>
                      <div className="mt-1 px-4 py-3 bg-white rounded-lg text-gray-900 font-medium">
                        {new Date(selectedPayroll.startDate).toLocaleDateString()} - {new Date(selectedPayroll.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedPayroll && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Delete Driver Payroll</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the payroll record for driver <strong>{selectedPayroll.userId.name}</strong>?
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedPayroll(null);
                  }}
                  className="px-4 py-2 text-gray-700 !mr-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 !text-white rounded-lg font-medium disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Generate AI Payroll Modal */}
        {showBulkGenerateModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center overflow-auto p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Generate Payroll for All Drivers
                </h2>
                <button
                  onClick={() => {
                    setShowBulkGenerateModal(false);
                    setBulkGenerateResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    This will automatically calculate and create payroll for <strong>all drivers</strong> who have completed trips in the selected date range using AI analysis.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={bulkDateRange.startDate}
                      onChange={(e) => setBulkDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={bulkDateRange.endDate}
                      onChange={(e) => setBulkDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pay Date
                  </label>
                  <input
                    type="date"
                    value={bulkDateRange.payDate}
                    onChange={(e) => setBulkDateRange(prev => ({ ...prev, payDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {loadingBulkAI && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-blue-800 font-medium">Processing all drivers...</p>
                    <p className="text-xs text-blue-600 mt-1">This may take a few minutes</p>
                  </div>
                )}

                {bulkGenerateResult && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Generation Results</h3>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{bulkGenerateResult.summary?.total || 0}</div>
                        <div className="text-xs text-gray-600">Total Drivers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{bulkGenerateResult.summary?.successful || 0}</div>
                        <div className="text-xs text-gray-600">Successful</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{bulkGenerateResult.summary?.failed || 0}</div>
                        <div className="text-xs text-gray-600">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{bulkGenerateResult.summary?.skipped || 0}</div>
                        <div className="text-xs text-gray-600">Skipped</div>
                      </div>
                    </div>

                    {bulkGenerateResult.successful && bulkGenerateResult.successful.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Successfully Created ({bulkGenerateResult.successful.length})</h4>
                        <div className="max-h-32 overflow-y-auto">
                          {bulkGenerateResult.successful.map((item: any, idx: number) => (
                            <div key={idx} className="text-xs text-gray-600 py-1 border-b border-gray-200">
                              {item.driverName}: ${item.totalSalary.toFixed(2)} ({item.totalTrips} trips, {item.totalMiles.toFixed(0)} mi)
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bulkGenerateResult.failed && bulkGenerateResult.failed.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-red-700 mb-2">Failed ({bulkGenerateResult.failed.length})</h4>
                        <div className="max-h-32 overflow-y-auto">
                          {bulkGenerateResult.failed.map((item: any, idx: number) => (
                            <div key={idx} className="text-xs text-red-600 py-1 border-b border-red-200">
                              {item.driverName || item.driverId}: {item.reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {bulkGenerateResult.skipped && bulkGenerateResult.skipped.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-yellow-700 mb-2">Skipped ({bulkGenerateResult.skipped.length})</h4>
                        <div className="max-h-32 overflow-y-auto">
                          {bulkGenerateResult.skipped.map((item: any, idx: number) => (
                            <div key={idx} className="text-xs text-yellow-600 py-1 border-b border-yellow-200">
                              {item.driverName || item.driverId}: {item.reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => {
                      setShowBulkGenerateModal(false);
                      setBulkGenerateResult(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    disabled={loadingBulkAI}
                  >
                    {bulkGenerateResult ? 'Close' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleBulkAIGeneration}
                    disabled={loadingBulkAI || !bulkDateRange.startDate || !bulkDateRange.endDate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingBulkAI ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Analyze All Drivers
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk AI Payroll Suggestions Modal */}
        {showBulkSuggestionsModal && bulkPayrollSuggestions.length > 0 && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex items-center justify-center overflow-auto p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Review AI Payroll Suggestions
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {bulkPayrollSuggestions.length} drivers found. Review and edit before creating payrolls.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowBulkSuggestionsModal(false);
                    setBulkPayrollSuggestions([]);
                    setBulkGenerateResult(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
                {bulkPayrollSuggestions.map((suggestion: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{suggestion.driverName}</h3>
                        <p className="text-sm text-gray-600">{suggestion.driverEmail || ''} • {suggestion.totalTrips} trips • {suggestion.totalMiles?.toFixed(0) || 0} miles</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total Salary</div>
                        <div className="text-xl font-bold text-green-600">${(suggestion.totalSalary || 0).toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Base Salary ($)</label>
                        <input
                          type="number"
                          value={suggestion.baseSalary || 0}
                          onChange={(e) => updateBulkSuggestion(index, 'baseSalary', e.target.value)}
                          step="0.01"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Bonus ($)</label>
                        <input
                          type="number"
                          value={suggestion.bonus || 0}
                          onChange={(e) => updateBulkSuggestion(index, 'bonus', e.target.value)}
                          step="0.01"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Deductions ($)</label>
                        <input
                          type="number"
                          value={suggestion.deductions || 0}
                          onChange={(e) => updateBulkSuggestion(index, 'deductions', e.target.value)}
                          step="0.01"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                      <select
                        value={suggestion.country || 'USA'}
                        onChange={(e) => updateBulkSuggestion(index, 'country', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="USA">United States</option>
                        <option value="Canada">Canada</option>
                      </select>
                    </div>

                    {suggestion.country === 'Canada' ? (
                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Federal Tax ($)</label>
                          <input
                            type="number"
                            value={suggestion.federalIncomeTaxCA || 0}
                            onChange={(e) => updateBulkSuggestion(index, 'federalIncomeTaxCA', e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Provincial Tax ($)</label>
                          <input
                            type="number"
                            value={suggestion.provincialIncomeTaxCA || 0}
                            onChange={(e) => updateBulkSuggestion(index, 'provincialIncomeTaxCA', e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">CPP ($)</label>
                          <input
                            type="number"
                            value={suggestion.cpp || 0}
                            onChange={(e) => updateBulkSuggestion(index, 'cpp', e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">EI ($)</label>
                          <input
                            type="number"
                            value={suggestion.ei || 0}
                            onChange={(e) => updateBulkSuggestion(index, 'ei', e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Health Tax ($)</label>
                          <input
                            type="number"
                            value={suggestion.provincialHealthTaxCA || 0}
                            onChange={(e) => updateBulkSuggestion(index, 'provincialHealthTaxCA', e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-6 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Federal Tax ($)</label>
                          <input
                            type="number"
                            value={suggestion.federalIncomeTaxUS || 0}
                            onChange={(e) => updateBulkSuggestion(index, 'federalIncomeTaxUS', e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">State Tax ($)</label>
                          <input
                            type="number"
                            value={suggestion.stateIncomeTaxUS || 0}
                            onChange={(e) => updateBulkSuggestion(index, 'stateIncomeTaxUS', e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Social Security ($)</label>
                          <input
                            type="number"
                            value={suggestion.socialSecurityTax || 0}
                            onChange={(e) => updateBulkSuggestion(index, 'socialSecurityTax', e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Medicare ($)</label>
                          <input
                            type="number"
                            value={suggestion.medicareTax || 0}
                            onChange={(e) => updateBulkSuggestion(index, 'medicareTax', e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">SDI ($)</label>
                          <input
                            type="number"
                            value={suggestion.stateDisabilityInsurance || 0}
                            onChange={(e) => updateBulkSuggestion(index, 'stateDisabilityInsurance', e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Local Tax ($)</label>
                          <input
                            type="number"
                            value={suggestion.localTax || 0}
                            onChange={(e) => updateBulkSuggestion(index, 'localTax', e.target.value)}
                            step="0.01"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowBulkSuggestionsModal(false);
                    setBulkPayrollSuggestions([]);
                    setBulkGenerateResult(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreatePayrolls}
                  disabled={loadingBulkAI}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingBulkAI ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Create All Payrolls ({bulkPayrollSuggestions.length})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverPayrollManagement;