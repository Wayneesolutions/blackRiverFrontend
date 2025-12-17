import React, { useState, useEffect } from 'react';

import {
  FaSnowflake,
  FaBox,
  FaGasPump,
  FaBiohazard,
  FaPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaThermometerHalf,
  FaExclamationTriangle,
  FaTimes,
  FaInfoCircle,
} from '../../../../theme/icons';

const CUSTOM_COLORS = {
  background: '#EDF8FF',
  primary: '#016ab2',
  dark: '#063f6f',
  light: '#398bc3',
  gradient: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
  gradientVertical: 'linear-gradient(to bottom right, #016ab2, #063f6f)',
};
import type { LoadSecurementLog, ReeferFoodSafetyLog, WinterSafetyChecklist, FuelingSpillPreventionLog, DangerousGoodsLog } from '../../../../types';
import {
  getLoadSecurementLogs,
  getReeferFoodSafetyLogs,
  getWinterSafetyChecklists,
  getFuelingSpillLogs,
  getDangerousGoodsLogs,
  createLoadSecurement,
  createReeferFoodSafety,
  createWinterSafety,
  createFuelingSpill,
  createDangerousGoods,
} from '../../../../axios/api/healthSafety';

interface ToastNotification {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

const ToastNotificationComponent = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaTimesCircle className="text-red-500" size={24} />,
    info: <FaInfoCircle className="text-blue-500" size={24} />,
    warning: <FaExclamationTriangle className="text-yellow-500" size={24} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`fixed top-4 right-4 flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg z-[10000] ${bgColors[notification.type]} min-w-[300px] max-w-[500px]`}>
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

const TABS = {
  LOAD_SECUREMENT: 'load-securement',
  REEFER_SAFETY: 'reefer',
  WINTER_SAFETY: 'winter',
  FUELING_SPILL: 'fueling',
  TDG_LOGS: 'tdg',
};

const TruckingOperations: React.FC = () => {
  const [activeTab, setActiveTab] = useState(TABS.LOAD_SECUREMENT);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Temporary usage to silence build errors
  useEffect(() => {
    if (searchTerm) console.log(searchTerm);
    if (filterStatus) console.log(filterStatus);
    setSearchTerm('');
    setFilterStatus('all');
  }, []);

  // Data
  const [loadSecurementLogs, setLoadSecurementLogs] = useState<LoadSecurementLog[]>([]);
  const [reeferLogs, setReeferLogs] = useState<ReeferFoodSafetyLog[]>([]);
  const [winterChecklists, setWinterChecklists] = useState<WinterSafetyChecklist[]>([]);
  const [fuelingLogs, setFuelingLogs] = useState<FuelingSpillPreventionLog[]>([]);
  const [tdgLogs, setTdgLogs] = useState<DangerousGoodsLog[]>([]);

  // Form states for each type
  const [loadSecurementForm, setLoadSecurementForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    driverId: '',
    driverName: '',
    vehicleNumber: '',
    trailerNumber: '',
    loadType: '',
    loadWeight: '',
    loadDescription: '',
    destination: '',
    securedBy: 'straps' as 'straps' | 'chains' | 'tarps' | 'combination' | 'bulkhead' | 'other',
    numberOfStraps: '',
    numberOfChains: '',
    tarpUsed: false,
    checklistComplete: false,
    meetsStandards: false,
    standardsReference: '',
    deficienciesNoted: '',
  });

  const [reeferForm, setReeferForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    driverId: '',
    driverName: '',
    vehicleNumber: '',
    trailerNumber: '',
    temperatureRecorded: '',
    temperatureUnit: 'celsius' as 'celsius' | 'fahrenheit',
    targetTemperature: '',
    withinRange: false,
    interiorCleanliness: 'excellent' as 'excellent' | 'good' | 'fair' | 'poor',
    odorDetected: false,
    odorDescription: '',
    visibleContamination: false,
    contaminationDetails: '',
    lastSanitized: '',
    sanitationMethod: '',
    sanitationVerified: false,
    deficienciesFound: false,
    deficiencyList: [] as string[],
    correctiveActionTaken: '',
  });

  const [winterForm, setWinterForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    performedBy: '',
    performedById: '',
    vehicleNumber: '',
    areaInspected: '',
    snowIceRemoved: false,
    walkwaysCleared: false,
    saltApplied: false,
    tiresInspected: false,
    tireChainCondition: 'good' as 'good' | 'fair' | 'replacement-needed' | 'n/a',
    heatingSystemFunctional: false,
    defrostFunctional: false,
    wipersCondition: 'good' as 'good' | 'fair' | 'replacement-needed',
    antifreezeLevels: 'adequate' as 'adequate' | 'low' | 'empty',
    emergencyKitPresent: false,
    hazardsIdentified: false,
    hazardDetails: '',
    correctiveAction: '',
    temperature: '',
    weatherConditions: '',
  });

  const [fuelingForm, setFuelingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    performedBy: '',
    performedById: '',
    vehicleNumber: '',
    vehicleParked: false,
    engineOff: false,
    parkingBrakeSet: false,
    spillKitPresent: false,
    areaInspected: false,
    fuelType: 'diesel' as 'diesel' | 'gasoline' | 'DEF' | 'propane' | 'natural-gas',
    quantityDispensed: '',
    nozzleSecured: false,
    overflowPrevented: false,
    spillOccurred: false,
    spillDetails: {
      quantity: '',
      causeOfSpill: '',
      responseActions: '',
      cleanupMethod: '',
      disposalMethod: '',
      reportFiled: false,
      incidentNumber: '',
    },
    capsSecured: false,
    noLeaksDetected: false,
    areaClean: false,
  });

  const [tdgForm, setTdgForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    driverId: '',
    driverName: '',
    vehicleNumber: '',
    trailerNumber: '',
    shippingDocument: '',
    unNumber: '',
    properShippingName: '',
    class: '',
    packingGroup: '',
    quantity: '',
    placardingRequired: false,
    placardingComplete: false,
    placardsInspected: false,
    emergencyResponseInfo: false,
    tdgCertificateCurrent: false,
    securityPlan: false,
    incidentOccurred: false,
    incidentDetails: '',
    segregationCorrect: false,
    packagingIntact: false,
    labelsLegible: false,
  });

  const addNotification = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [loadSecurementRes, reeferRes, winterRes, fuelingRes, tdgRes] = await Promise.all([
        getLoadSecurementLogs({ search: searchTerm || undefined, status: filterStatus !== 'all' ? filterStatus : undefined }),
        getReeferFoodSafetyLogs({ search: searchTerm || undefined, status: filterStatus !== 'all' ? filterStatus : undefined }),
        getWinterSafetyChecklists({ search: searchTerm || undefined, status: filterStatus !== 'all' ? filterStatus : undefined }),
        getFuelingSpillLogs({ search: searchTerm || undefined, status: filterStatus !== 'all' ? filterStatus : undefined }),
        getDangerousGoodsLogs({ search: searchTerm || undefined, status: filterStatus !== 'all' ? filterStatus : undefined }),
      ]);

      if (loadSecurementRes.success) {
        setLoadSecurementLogs(loadSecurementRes.data || []);
      } else {
        addNotification('error', loadSecurementRes.message || 'Failed to load load securement logs');
      }

      if (reeferRes.success) {
        setReeferLogs(reeferRes.data || []);
      } else {
        addNotification('error', reeferRes.message || 'Failed to load reefer food safety logs');
      }

      if (winterRes.success) {
        setWinterChecklists(winterRes.data || []);
      } else {
        addNotification('error', winterRes.message || 'Failed to load winter safety checklists');
      }

      if (fuelingRes.success) {
        setFuelingLogs(fuelingRes.data || []);
      } else {
        addNotification('error', fuelingRes.message || 'Failed to load fueling spill logs');
      }

      if (tdgRes.success) {
        setTdgLogs(tdgRes.data || []);
      } else {
        addNotification('error', tdgRes.message || 'Failed to load dangerous goods logs');
      }

    } catch (error: any) {
      console.error('Error fetching trucking operations data:', error);
      addNotification('error', error?.response?.data?.message || 'Failed to load trucking operations data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, filterStatus]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let result;
      const formData = new FormData();

      switch (activeTab) {
        case TABS.LOAD_SECUREMENT:
          // Convert form data to proper format
          const loadSecurementData: any = {
            ...loadSecurementForm,
            loadWeight: loadSecurementForm.loadWeight ? parseFloat(loadSecurementForm.loadWeight) : undefined,
            numberOfStraps: loadSecurementForm.numberOfStraps ? parseInt(loadSecurementForm.numberOfStraps) : undefined,
            numberOfChains: loadSecurementForm.numberOfChains ? parseInt(loadSecurementForm.numberOfChains) : undefined,
          };
          // Required fields that should always be included
          const requiredLoadSecurementFields = ['date', 'time', 'driverName', 'vehicleNumber', 'loadType', 'securedBy'];
          Object.keys(loadSecurementData).forEach(key => {
            const value = loadSecurementData[key];
            // Include required fields even if empty, or include non-empty optional fields
            if (requiredLoadSecurementFields.includes(key) || (value !== null && value !== undefined && value !== '')) {
              if (value !== null && value !== undefined) {
                formData.append(key, String(value));
              }
            }
          });
          result = await createLoadSecurement(formData);
          break;

        case TABS.REEFER_SAFETY:
          const reeferData: any = {
            ...reeferForm,
            temperatureRecorded: reeferForm.temperatureRecorded ? parseFloat(reeferForm.temperatureRecorded) : undefined,
            targetTemperature: reeferForm.targetTemperature ? parseFloat(reeferForm.targetTemperature) : undefined,
            lastSanitized: reeferForm.lastSanitized || undefined,
            deficiencyList: reeferForm.deficiencyList.length > 0 ? reeferForm.deficiencyList : undefined,
          };
          // Required fields that should always be included
          const requiredReeferFields = ['date', 'time', 'driverName', 'vehicleNumber', 'trailerNumber', 'temperatureRecorded', 'targetTemperature', 'interiorCleanliness'];
          const reeferFormData = new FormData();
          Object.keys(reeferData).forEach(key => {
            const value = reeferData[key];
            // Include required fields even if empty, or include non-empty optional fields
            if (requiredReeferFields.includes(key) || (value !== null && value !== undefined && value !== '')) {
              if (Array.isArray(value)) {
                reeferFormData.append(key, JSON.stringify(value));
              } else if (value !== null && value !== undefined) {
                reeferFormData.append(key, String(value));
              }
            }
          });
          result = await createReeferFoodSafety(reeferFormData);
          break;

        case TABS.WINTER_SAFETY:
          const winterData: any = {
            ...winterForm,
            temperature: winterForm.temperature ? parseFloat(winterForm.temperature) : undefined,
            time: winterForm.time || undefined,
            performedById: winterForm.performedById || undefined,
            areaInspected: winterForm.areaInspected || undefined,
            hazardDetails: winterForm.hazardsIdentified ? winterForm.hazardDetails : undefined,
            correctiveAction: winterForm.hazardsIdentified ? winterForm.correctiveAction : undefined,
          };
          // Required fields that should always be included
          const requiredWinterFields = ['date', 'location', 'performedBy'];
          // Remove undefined and empty values, but keep required fields
          Object.keys(winterData).forEach(key => {
            if (!requiredWinterFields.includes(key) && (winterData[key] === undefined || winterData[key] === '')) {
              delete winterData[key];
            }
          });
          result = await createWinterSafety(winterData);
          break;

        case TABS.FUELING_SPILL:
          const fuelingData: any = {
            ...fuelingForm,
            quantityDispensed: fuelingForm.quantityDispensed ? parseFloat(fuelingForm.quantityDispensed) : undefined,
            spillDetails: fuelingForm.spillOccurred ? fuelingForm.spillDetails : undefined,
            performedById: fuelingForm.performedById || undefined,
            vehicleNumber: fuelingForm.vehicleNumber || undefined,
          };
          // Required fields that should always be included
          const requiredFuelingFields = ['date', 'time', 'location', 'performedBy', 'fuelType'];
          // Remove undefined and empty values, but keep required fields
          Object.keys(fuelingData).forEach(key => {
            if (!requiredFuelingFields.includes(key) && (fuelingData[key] === undefined || (typeof fuelingData[key] === 'object' && fuelingData[key] !== null && Object.keys(fuelingData[key]).length === 0))) {
              delete fuelingData[key];
            }
          });
          result = await createFuelingSpill(fuelingData);
          break;

        case TABS.TDG_LOGS:
          const tdgData: any = { ...tdgForm };
          // Required fields that should always be included
          const requiredTdgFields = ['date', 'time', 'driverName', 'vehicleNumber', 'shippingDocument', 'unNumber', 'properShippingName', 'class', 'quantity'];
          Object.keys(tdgData).forEach(key => {
            const value = tdgData[key];
            // Include required fields even if empty, or include non-empty optional fields
            if (requiredTdgFields.includes(key) || (value !== null && value !== undefined && value !== '')) {
              if (value !== null && value !== undefined) {
                formData.append(key, String(value));
              }
            }
          });
          result = await createDangerousGoods(formData);
          break;

        default:
          throw new Error('Invalid tab');
      }

      if (result.success) {
        addNotification('success', result.message || 'Log entry created successfully');
        setShowModal(false);
        fetchData(); // Refresh data
        // Reset forms
        setLoadSecurementForm({
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          driverId: '',
          driverName: '',
          vehicleNumber: '',
          trailerNumber: '',
          loadType: '',
          loadWeight: '',
          loadDescription: '',
          destination: '',
          securedBy: 'straps',
          numberOfStraps: '',
          numberOfChains: '',
          tarpUsed: false,
          checklistComplete: false,
          meetsStandards: false,
          standardsReference: '',
          deficienciesNoted: '',
        });
      } else {
        addNotification('error', result.message || 'Failed to create log entry');
      }
    } catch (error: any) {
      console.error('Error creating log entry:', error);
      addNotification('error', error?.response?.data?.message || 'Failed to create log entry');
    } finally {
      setSubmitting(false);
    }
  };

  // === RENDER FUNCTIONS FOR EACH TAB ===

  const renderLoadSecurement = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4" style={{ borderColor: CUSTOM_COLORS.primary }}>
          <div className="text-3xl font-bold text-gray-900">{loadSecurementLogs.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Logs (This Month)</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
          <div className="text-3xl font-bold text-green-700">{loadSecurementLogs.filter(l => l.meetsStandards).length}</div>
          <div className="text-sm text-gray-600 mt-1">Compliant Loads</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-red-500">
          <div className="text-3xl font-bold text-red-700">{loadSecurementLogs.filter(l => !l.meetsStandards).length}</div>
          <div className="text-sm text-gray-600 mt-1">Deficiencies Found</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-blue-700">{loadSecurementLogs.filter(l => l.photoEvidence && l.photoEvidence.length > 0).length}</div>
          <div className="text-sm text-gray-600 mt-1">With Photo Evidence</div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Load Securement Logs</h3>
          <p className="text-sm text-gray-600 mt-1">Pre-departure checks per FMCSA/CVSA standards</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Log #</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Load Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Securement</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Compliance</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadSecurementLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.logNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{log.date}</div>
                    <div className="text-xs text-gray-400">{log.time}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.driverName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{log.vehicleNumber}</div>
                    <div className="text-xs text-gray-400">{log.trailerNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.loadType}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold uppercase">
                      {log.securedBy}
                    </span>
                    {log.numberOfStraps && (
                      <div className="text-xs text-gray-500 mt-1">{log.numberOfStraps} straps</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.meetsStandards ? (
                      <span className="flex items-center text-green-700">
                        <FaCheckCircle className="mr-1" /> Compliant
                      </span>
                    ) : (
                      <span className="flex items-center text-red-700">
                        <FaTimesCircle className="mr-1" /> Deficiency
                      </span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReeferSafety = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4" style={{ borderColor: CUSTOM_COLORS.primary }}>
          <div className="text-3xl font-bold text-gray-900">{reeferLogs.length}</div>
          <div className="text-sm text-gray-600 mt-1">Reefer Inspections (This Month)</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
          <div className="text-3xl font-bold text-green-700">{reeferLogs.filter(l => l.withinRange).length}</div>
          <div className="text-sm text-gray-600 mt-1">Temperature Compliant</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-blue-700">{reeferLogs.filter(l => l.interiorCleanliness === 'excellent').length}</div>
          <div className="text-sm text-gray-600 mt-1">Excellent Cleanliness</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-red-500">
          <div className="text-3xl font-bold text-red-700">{reeferLogs.filter(l => l.deficienciesFound).length}</div>
          <div className="text-sm text-gray-600 mt-1">Deficiencies Reported</div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Reefer Food Safety & Sanitation Logs</h3>
          <p className="text-sm text-gray-600 mt-1">Temperature monitoring and cleanliness inspections</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Log #</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Temp (°C)</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Cleanliness</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reeferLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.logNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{log.date}</div>
                    <div className="text-xs text-gray-400">{log.time}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.driverName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.trailerNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center">
                      <FaThermometerHalf className={`mr-2 ${log.withinRange ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`font-semibold ${log.withinRange ? 'text-green-700' : 'text-red-700'}`}>
                        {log.temperatureRecorded}°C
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">Target: {log.targetTemperature}°C</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${log.interiorCleanliness === 'excellent'
                        ? 'bg-green-100 text-green-800'
                        : log.interiorCleanliness === 'good'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}
                    >
                      {log.interiorCleanliness.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {!log.deficienciesFound ? (
                      <span className="flex items-center text-green-700">
                        <FaCheckCircle className="mr-1" /> Pass
                      </span>
                    ) : (
                      <span className="flex items-center text-red-700">
                        <FaTimesCircle className="mr-1" /> Action Required
                      </span>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderWinterSafety = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4" style={{ borderColor: CUSTOM_COLORS.primary }}>
          <div className="text-3xl font-bold text-gray-900">{winterChecklists.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Checklists (This Month)</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
          <div className="text-3xl font-bold text-green-700">{winterChecklists.filter(c => !c.hazardsIdentified).length}</div>
          <div className="text-sm text-gray-600 mt-1">No Hazards Found</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
          <div className="text-3xl font-bold text-yellow-700">{winterChecklists.filter(c => c.hazardsIdentified).length}</div>
          <div className="text-sm text-gray-600 mt-1">Hazards Identified</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-blue-700">{winterChecklists.filter(c => c.tireChainCondition === 'good').length}</div>
          <div className="text-sm text-gray-600 mt-1">Good Chain Condition</div>
        </div>
      </div>

      {/* Checklists Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Winter Safety Checklists</h3>
          <p className="text-sm text-gray-600 mt-1">Snow/ice removal, tire chains, and winter readiness inspections</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Checklist #</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {winterChecklists.map((checklist) => (
                <tr key={checklist._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{checklist.checklistNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{new Date(checklist.date).toLocaleDateString()}</div>
                    {checklist.time && <div className="text-xs text-gray-400">{checklist.time}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{checklist.location}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{checklist.performedBy}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{checklist.vehicleNumber || 'N/A'}</td>
                  <td className="px-6 py-4">
                    {checklist.hazardsIdentified ? (
                      <span className="flex items-center text-yellow-700">
                        <FaExclamationTriangle className="mr-1" /> Hazards Found
                      </span>
                    ) : (
                      <span className="flex items-center text-green-700">
                        <FaCheckCircle className="mr-1" /> All Clear
                      </span>
                    )}
                  </td>

                </tr>
              ))}
              {winterChecklists.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No winter safety checklists recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFuelingSpill = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4" style={{ borderColor: CUSTOM_COLORS.primary }}>
          <div className="text-3xl font-bold text-gray-900">{fuelingLogs.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Logs (This Month)</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
          <div className="text-3xl font-bold text-green-700">{fuelingLogs.filter(l => !l.spillOccurred).length}</div>
          <div className="text-sm text-gray-600 mt-1">No Spills</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-red-500">
          <div className="text-3xl font-bold text-red-700">{fuelingLogs.filter(l => l.spillOccurred).length}</div>
          <div className="text-sm text-gray-600 mt-1">Spill Incidents</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-500">
          <div className="text-3xl font-bold text-blue-700">{fuelingLogs.filter(l => l.spillKitPresent).length}</div>
          <div className="text-sm text-gray-600 mt-1">Spill Kit Present</div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Fueling & Spill Prevention Logs</h3>
          <p className="text-sm text-gray-600 mt-1">Pre-fueling checklists and spill incident tracking</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Log #</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Fuel Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Spill Status</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {fuelingLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.logNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{new Date(log.date).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">{log.time}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.location}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.performedBy}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{log.vehicleNumber || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold uppercase">
                      {log.fuelType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.spillOccurred ? (
                      <span className="flex items-center text-red-700">
                        <FaExclamationTriangle className="mr-1" /> Spill Occurred
                      </span>
                    ) : (
                      <span className="flex items-center text-green-700">
                        <FaCheckCircle className="mr-1" /> No Spill
                      </span>
                    )}
                  </td>

                </tr>
              ))}
              {fuelingLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No fueling logs recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTDGLogs = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4" style={{ borderColor: CUSTOM_COLORS.primary }}>
          <div className="text-3xl font-bold text-gray-900">{tdgLogs.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total TDG Shipments</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-500">
          <div className="text-3xl font-bold text-green-700">{tdgLogs.filter(l => l.placardingComplete && l.tdgCertificateCurrent).length}</div>
          <div className="text-sm text-gray-600 mt-1">Fully Compliant</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-red-500">
          <div className="text-3xl font-bold text-red-700">{tdgLogs.filter(l => l.incidentOccurred).length}</div>
          <div className="text-sm text-gray-600 mt-1">Incidents Reported</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-yellow-500">
          <div className="text-3xl font-bold text-yellow-700">{tdgLogs.filter(l => !l.tdgCertificateCurrent).length}</div>
          <div className="text-sm text-gray-600 mt-1">Certificate Issues</div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">Dangerous Goods (TDG) Logs</h3>
          <p className="text-sm text-gray-600 mt-1">Shipment documentation and incident reporting</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Log #</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">UN Number</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Placarding</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tdgLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.logNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{new Date(log.date).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">{log.time}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.driverName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>{log.vehicleNumber}</div>
                    {log.trailerNumber && <div className="text-xs text-gray-400">{log.trailerNumber}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">{log.unNumber}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                      Class {log.class}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.placardingComplete ? (
                      <span className="flex items-center text-green-700">
                        <FaCheckCircle className="mr-1" /> Complete
                      </span>
                    ) : (
                      <span className="flex items-center text-red-700">
                        <FaTimesCircle className="mr-1" /> Incomplete
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.incidentOccurred ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                        INCIDENT
                      </span>
                    ) : log.tdgCertificateCurrent && log.placardingComplete ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        COMPLIANT
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                        REVIEW
                      </span>
                    )}
                  </td>

                </tr>
              ))}
              {tdgLogs.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No TDG logs recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case TABS.LOAD_SECUREMENT:
        return renderLoadSecurement();
      case TABS.REEFER_SAFETY:
        return renderReeferSafety();
      case TABS.WINTER_SAFETY:
        return renderWinterSafety();
      case TABS.FUELING_SPILL:
        return renderFuelingSpill();
      case TABS.TDG_LOGS:
        return renderTDGLogs();
      default:
        return renderLoadSecurement();
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: CUSTOM_COLORS.background }}>
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[10000] space-y-2">
        {notifications.map(notification => (
          <ToastNotificationComponent
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>

      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: CUSTOM_COLORS.dark }}>
              Trucking Operations
            </h1>
            <p className="text-lg text-gray-600">
              Industry-specific safety logs for load securement, reefer safety, winter operations, and more.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 rounded-xl !text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
            style={{ background: CUSTOM_COLORS.gradient }}
          >
            <FaPlus />
            <span>New Log Entry</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab(TABS.LOAD_SECUREMENT)}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${activeTab === TABS.LOAD_SECUREMENT
                ? 'border-b-4 text-gray-900 bg-orange-50'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
              style={activeTab === TABS.LOAD_SECUREMENT ? { borderColor: CUSTOM_COLORS.primary } : {}}
            >
              <FaBox />
              <span>Load Securement</span>
            </button>
            <button
              onClick={() => setActiveTab(TABS.REEFER_SAFETY)}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${activeTab === TABS.REEFER_SAFETY
                ? 'border-b-4 text-gray-900 bg-orange-50'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
              style={activeTab === TABS.REEFER_SAFETY ? { borderColor: CUSTOM_COLORS.primary } : {}}
            >
              <FaThermometerHalf />
              <span>Reefer Food Safety</span>
            </button>
            <button
              onClick={() => setActiveTab(TABS.WINTER_SAFETY)}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${activeTab === TABS.WINTER_SAFETY
                ? 'border-b-4 text-gray-900 bg-orange-50'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
              style={activeTab === TABS.WINTER_SAFETY ? { borderColor: CUSTOM_COLORS.primary } : {}}
            >
              <FaSnowflake />
              <span>Winter Safety</span>
            </button>
            <button
              onClick={() => setActiveTab(TABS.FUELING_SPILL)}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${activeTab === TABS.FUELING_SPILL
                ? 'border-b-4 text-gray-900 bg-orange-50'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
              style={activeTab === TABS.FUELING_SPILL ? { borderColor: CUSTOM_COLORS.primary } : {}}
            >
              <FaGasPump />
              <span>Fueling & Spills</span>
            </button>
            <button
              onClick={() => setActiveTab(TABS.TDG_LOGS)}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${activeTab === TABS.TDG_LOGS
                ? 'border-b-4 text-gray-900 bg-orange-50'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
              style={activeTab === TABS.TDG_LOGS ? { borderColor: CUSTOM_COLORS.primary } : {}}
            >
              <FaBiohazard />
              <span>Dangerous Goods (TDG)</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-600 text-lg">Loading trucking operations data...</div>
          </div>
        ) : (
          renderContent()
        )}
      </div>

      {/* Create Log Entry Modal */}
      {showModal && (
        <div
          className="fixed inset-0 flex justify-center items-center z-[10001] p-4  bg-black/40  bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                New {activeTab === TABS.LOAD_SECUREMENT ? 'Load Securement' :
                  activeTab === TABS.REEFER_SAFETY ? 'Reefer Food Safety' :
                    activeTab === TABS.WINTER_SAFETY ? 'Winter Safety' :
                      activeTab === TABS.FUELING_SPILL ? 'Fueling & Spill' :
                        'Dangerous Goods'} Log Entry
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                <FaTimes size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-6 space-y-6">
              {activeTab === TABS.LOAD_SECUREMENT && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={loadSecurementForm.date}
                      onChange={(e) => setLoadSecurementForm({ ...loadSecurementForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <input
                      type="time"
                      required
                      value={loadSecurementForm.time}
                      onChange={(e) => setLoadSecurementForm({ ...loadSecurementForm, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
                    <input
                      type="text"
                      required
                      value={loadSecurementForm.driverName}
                      onChange={(e) => setLoadSecurementForm({ ...loadSecurementForm, driverName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                    <input
                      type="text"
                      required
                      value={loadSecurementForm.vehicleNumber}
                      onChange={(e) => setLoadSecurementForm({ ...loadSecurementForm, vehicleNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Load Type *</label>
                    <input
                      type="text"
                      required
                      value={loadSecurementForm.loadType}
                      onChange={(e) => setLoadSecurementForm({ ...loadSecurementForm, loadType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secured By *</label>
                    <select
                      required
                      value={loadSecurementForm.securedBy}
                      onChange={(e) => setLoadSecurementForm({ ...loadSecurementForm, securedBy: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="straps">Straps</option>
                      <option value="chains">Chains</option>
                      <option value="tarps">Tarps</option>
                      <option value="combination">Combination</option>
                      <option value="bulkhead">Bulkhead</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meets Standards</label>
                    <input
                      type="checkbox"
                      checked={loadSecurementForm.meetsStandards}
                      onChange={(e) => setLoadSecurementForm({ ...loadSecurementForm, meetsStandards: e.target.checked })}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              )}

              {activeTab === TABS.REEFER_SAFETY && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={reeferForm.date}
                      onChange={(e) => setReeferForm({ ...reeferForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                    <input
                      type="time"
                      required
                      value={reeferForm.time}
                      onChange={(e) => setReeferForm({ ...reeferForm, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
                    <input
                      type="text"
                      required
                      value={reeferForm.driverName}
                      onChange={(e) => setReeferForm({ ...reeferForm, driverName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number *</label>
                    <input
                      type="text"
                      required
                      value={reeferForm.vehicleNumber}
                      onChange={(e) => setReeferForm({ ...reeferForm, vehicleNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trailer Number *</label>
                    <input
                      type="text"
                      required
                      value={reeferForm.trailerNumber}
                      onChange={(e) => setReeferForm({ ...reeferForm, trailerNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temperature Recorded *</label>
                    <input
                      type="number"
                      required
                      value={reeferForm.temperatureRecorded}
                      onChange={(e) => setReeferForm({ ...reeferForm, temperatureRecorded: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Temperature *</label>
                    <input
                      type="number"
                      required
                      value={reeferForm.targetTemperature}
                      onChange={(e) => setReeferForm({ ...reeferForm, targetTemperature: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Interior Cleanliness *</label>
                    <select
                      required
                      value={reeferForm.interiorCleanliness}
                      onChange={(e) => setReeferForm({ ...reeferForm, interiorCleanliness: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === TABS.WINTER_SAFETY && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={winterForm.date}
                      onChange={(e) => setWinterForm({ ...winterForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input
                      type="text"
                      required
                      value={winterForm.location}
                      onChange={(e) => setWinterForm({ ...winterForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Performed By *</label>
                    <input
                      type="text"
                      required
                      value={winterForm.performedBy}
                      onChange={(e) => setWinterForm({ ...winterForm, performedBy: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={winterForm.snowIceRemoved}
                          onChange={(e) => setWinterForm({ ...winterForm, snowIceRemoved: e.target.checked })}
                          className="mr-2"
                        />
                        Snow/Ice Removed
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={winterForm.walkwaysCleared}
                          onChange={(e) => setWinterForm({ ...winterForm, walkwaysCleared: e.target.checked })}
                          className="mr-2"
                        />
                        Walkways Cleared
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={winterForm.heatingSystemFunctional}
                          onChange={(e) => setWinterForm({ ...winterForm, heatingSystemFunctional: e.target.checked })}
                          className="mr-2"
                        />
                        Heating System Functional
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === TABS.FUELING_SPILL && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={fuelingForm.date}
                      onChange={(e) => setFuelingForm({ ...fuelingForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                    <input
                      type="text"
                      required
                      value={fuelingForm.location}
                      onChange={(e) => setFuelingForm({ ...fuelingForm, location: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Performed By *</label>
                    <input
                      type="text"
                      required
                      value={fuelingForm.performedBy}
                      onChange={(e) => setFuelingForm({ ...fuelingForm, performedBy: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type *</label>
                    <select
                      required
                      value={fuelingForm.fuelType}
                      onChange={(e) => setFuelingForm({ ...fuelingForm, fuelType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="diesel">Diesel</option>
                      <option value="gasoline">Gasoline</option>
                      <option value="DEF">DEF</option>
                      <option value="propane">Propane</option>
                      <option value="natural-gas">Natural Gas</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={fuelingForm.vehicleParked}
                          onChange={(e) => setFuelingForm({ ...fuelingForm, vehicleParked: e.target.checked })}
                          className="mr-2"
                        />
                        Vehicle Parked
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={fuelingForm.engineOff}
                          onChange={(e) => setFuelingForm({ ...fuelingForm, engineOff: e.target.checked })}
                          className="mr-2"
                        />
                        Engine Off
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={fuelingForm.spillOccurred}
                          onChange={(e) => setFuelingForm({ ...fuelingForm, spillOccurred: e.target.checked })}
                          className="mr-2"
                        />
                        Spill Occurred
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === TABS.TDG_LOGS && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={tdgForm.date}
                      onChange={(e) => setTdgForm({ ...tdgForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name *</label>
                    <input
                      type="text"
                      required
                      value={tdgForm.driverName}
                      onChange={(e) => setTdgForm({ ...tdgForm, driverName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">UN Number *</label>
                    <input
                      type="text"
                      required
                      value={tdgForm.unNumber}
                      onChange={(e) => setTdgForm({ ...tdgForm, unNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proper Shipping Name *</label>
                    <input
                      type="text"
                      required
                      value={tdgForm.properShippingName}
                      onChange={(e) => setTdgForm({ ...tdgForm, properShippingName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                    <input
                      type="text"
                      required
                      value={tdgForm.class}
                      onChange={(e) => setTdgForm({ ...tdgForm, class: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="text"
                      required
                      value={tdgForm.quantity}
                      onChange={(e) => setTdgForm({ ...tdgForm, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 !mr-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: CUSTOM_COLORS.gradient }}
                >
                  {submitting ? 'Creating...' : 'Create Log Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TruckingOperations;