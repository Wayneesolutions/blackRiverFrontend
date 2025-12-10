import React, { useState, useEffect } from 'react';
import { COLORS, getStatusColor } from '../../../../theme/colors';
import {
  FaTruck,
  FaSnowflake,
  FaFire,
  FaBox,
  FaGasPump,
  FaBiohazard,
  FaPlus,
  FaEye,
  FaEdit,
  FaDownload,
  FaCheckCircle,
  FaTimesCircle,
  FaCamera,
  FaThermometerHalf,
  FaExclamationTriangle,
} from '../../../../theme/icons';
import type { LoadSecurementLog, ReeferFoodSafetyLog, WinterSafetyChecklist, FuelingSpillPreventionLog, DangerousGoodsLog } from '../../../../types';

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

  // Sample Data
  const [loadSecurementLogs, setLoadSecurementLogs] = useState<LoadSecurementLog[]>([]);
  const [reeferLogs, setReeferLogs] = useState<ReeferFoodSafetyLog[]>([]);
  const [winterChecklists, setWinterChecklists] = useState<WinterSafetyChecklist[]>([]);
  const [fuelingLogs, setFuelingLogs] = useState<FuelingSpillPreventionLog[]>([]);
  const [tdgLogs, setTdgLogs] = useState<DangerousGoodsLog[]>([]);

  useEffect(() => {
    // Mock data for Load Securement
    setLoadSecurementLogs([
      {
        _id: '1',
        logNumber: 'LS-2025-001',
        date: '2025-12-10',
        time: '08:30',
        driverId: 'D001',
        driverName: 'John Smith',
        vehicleNumber: 'TRK-101',
        trailerNumber: 'TRL-201',
        loadType: 'Palletized Freight',
        loadWeight: 18000,
        loadDescription: '20 pallets of electronics',
        destination: 'Vancouver, BC',
        securedBy: 'straps',
        numberOfStraps: 8,
        checklistComplete: true,
        meetsStandards: true,
        standardsReference: 'FMCSA/CVSA',
        driverSignature: 'signed',
        photoEvidence: [
          { fileUrl: '/photos/ls1.jpg', fileName: 'Load Front View', fileType: 'image', uploadedAt: '2025-12-10', uploadedBy: 'John Smith' },
        ],
      },
    ]);

    // Mock data for Reefer Safety
    setReeferLogs([
      {
        _id: '1',
        logNumber: 'RF-2025-001',
        date: '2025-12-10',
        time: '09:15',
        driverId: 'D002',
        driverName: 'Jane Doe',
        vehicleNumber: 'TRK-102',
        trailerNumber: 'REEFER-301',
        temperatureRecorded: -18,
        temperatureUnit: 'celsius',
        targetTemperature: -18,
        withinRange: true,
        interiorCleanliness: 'excellent',
        odorDetected: false,
        visibleContamination: false,
        lastSanitized: '2025-12-08',
        sanitationMethod: 'Chemical wash + UV treatment',
        sanitationVerified: true,
        deficienciesFound: false,
        driverSignature: 'signed',
      },
    ]);

    // Mock data for Winter Safety
    setWinterChecklists([
      {
        _id: '1',
        checklistNumber: 'WS-2025-001',
        date: '2025-12-10',
        time: '08:00',
        location: 'Yard - Parking Lot A',
        performedBy: 'Safety Manager',
        performedById: 'SM001',
        vehicleNumber: 'TRK-101',
        snowIceRemoved: true,
        walkwaysCleared: true,
        saltApplied: true,
        tiresInspected: true,
        tireChainCondition: 'good',
        heatingSystemFunctional: true,
        defrostFunctional: true,
        wipersCondition: 'good',
        antifreezeLevels: 'adequate',
        emergencyKitPresent: true,
        hazardsIdentified: false,
        temperature: -5,
        weatherConditions: 'Clear, cold',
        signature: 'signed',
      },
      {
        _id: '2',
        checklistNumber: 'WS-2025-002',
        date: '2025-12-08',
        time: '07:30',
        location: 'Shop - Vehicle Bay 3',
        performedBy: 'Yard Supervisor',
        performedById: 'YS001',
        vehicleNumber: 'TRK-205',
        snowIceRemoved: true,
        walkwaysCleared: true,
        saltApplied: false,
        tiresInspected: true,
        tireChainCondition: 'replacement-needed',
        heatingSystemFunctional: true,
        defrostFunctional: false,
        wipersCondition: 'fair',
        antifreezeLevels: 'low',
        emergencyKitPresent: true,
        hazardsIdentified: true,
        hazardDetails: 'Defrost not working, antifreeze low, tire chains need replacement',
        correctiveAction: 'Schedule maintenance for defrost system, top up antifreeze, order new tire chains',
        temperature: -8,
        weatherConditions: 'Snowing, icy',
        signature: 'signed',
      },
    ]);

    // Mock data for Fueling/Spill Prevention
    setFuelingLogs([
      {
        _id: '1',
        logNumber: 'FP-2025-001',
        date: '2025-12-10',
        time: '10:00',
        location: 'Yard Fuel Station',
        performedBy: 'John Smith',
        performedById: 'D001',
        vehicleNumber: 'TRK-101',
        vehicleParked: true,
        engineOff: true,
        parkingBrakeSet: true,
        spillKitPresent: true,
        areaInspected: true,
        fuelType: 'diesel',
        quantityDispensed: 200,
        nozzleSecured: true,
        overflowPrevented: true,
        spillOccurred: false,
        capsSecured: true,
        noLeaksDetected: true,
        areaClean: true,
        signature: 'signed',
      },
      {
        _id: '2',
        logNumber: 'FP-2025-002',
        date: '2025-12-08',
        time: '14:30',
        location: 'Yard Fuel Station - Pump 2',
        performedBy: 'Jane Driver',
        performedById: 'D002',
        vehicleNumber: 'TRK-102',
        vehicleParked: true,
        engineOff: true,
        parkingBrakeSet: true,
        spillKitPresent: true,
        areaInspected: true,
        fuelType: 'diesel',
        quantityDispensed: 150,
        nozzleSecured: true,
        overflowPrevented: true,
        spillOccurred: true,
        spillDetails: {
          quantity: 5,
          causeOfSpill: 'Nozzle drip after removal',
          responseActions: 'Immediately contained with spill kit, area cordoned off',
          cleanupMethod: 'Absorbent pads and spill kit materials',
          disposalMethod: 'Proper hazardous waste disposal',
          reportFiled: true,
          incidentNumber: 'INC-2025-045',
        },
        capsSecured: true,
        noLeaksDetected: true,
        areaClean: true,
        signature: 'signed',
      },
    ]);

    // Mock data for TDG/Dangerous Goods
    setTdgLogs([
      {
        _id: '1',
        logNumber: 'TDG-2025-001',
        date: '2025-12-10',
        time: '11:00',
        driverId: 'D003',
        driverName: 'Bob Wilson',
        vehicleNumber: 'TRK-103',
        trailerNumber: 'TRL-203',
        shippingDocument: 'SD-2025-12345',
        unNumber: 'UN1203',
        properShippingName: 'Gasoline',
        class: '3',
        packingGroup: 'II',
        quantity: '500 L',
        placardingRequired: true,
        placardingComplete: true,
        placardsInspected: true,
        emergencyResponseInfo: true,
        tdgCertificateCurrent: true,
        securityPlan: true,
        incidentOccurred: false,
        segregationCorrect: true,
        packagingIntact: true,
        labelsLegible: true,
        driverSignature: 'signed',
      },
      {
        _id: '2',
        logNumber: 'TDG-2025-002',
        date: '2025-12-05',
        time: '09:15',
        driverId: 'D004',
        driverName: 'Alice Martinez',
        vehicleNumber: 'TRK-104',
        trailerNumber: 'TRL-204',
        shippingDocument: 'SD-2025-12346',
        unNumber: 'UN1993',
        properShippingName: 'Flammable Liquid, N.O.S.',
        class: '3',
        packingGroup: 'III',
        quantity: '1000 L',
        placardingRequired: true,
        placardingComplete: true,
        placardsInspected: true,
        emergencyResponseInfo: true,
        tdgCertificateCurrent: true,
        securityPlan: true,
        incidentOccurred: false,
        segregationCorrect: true,
        packagingIntact: true,
        labelsLegible: true,
        driverSignature: 'signed',
      },
      {
        _id: '3',
        logNumber: 'TDG-2025-003',
        date: '2025-12-01',
        time: '13:20',
        driverId: 'D005',
        driverName: 'Charlie Brown',
        vehicleNumber: 'TRK-105',
        trailerNumber: 'TRL-205',
        shippingDocument: 'SD-2025-12347',
        unNumber: 'UN1075',
        properShippingName: 'Liquefied Petroleum Gas',
        class: '2.1',
        packingGroup: 'N/A',
        quantity: '2000 kg',
        placardingRequired: true,
        placardingComplete: true,
        placardsInspected: true,
        emergencyResponseInfo: true,
        tdgCertificateCurrent: false,
        securityPlan: true,
        incidentOccurred: false,
        segregationCorrect: true,
        packagingIntact: true,
        labelsLegible: true,
        driverSignature: 'signed',
      },
    ]);

    setLoading(false);
  }, []);

  // === RENDER FUNCTIONS FOR EACH TAB ===

  const renderLoadSecurement = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4" style={{ borderColor: COLORS.modules.trucking }}>
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
                        <FaEye />
                      </button>
                      {log.photoEvidence && log.photoEvidence.length > 0 && (
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="View Photos">
                          <FaCamera />
                        </button>
                      )}
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition" title="Download">
                        <FaDownload />
                      </button>
                    </div>
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
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4" style={{ borderColor: COLORS.modules.trucking }}>
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        log.interiorCleanliness === 'excellent'
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
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
                        <FaEye />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition" title="Download">
                        <FaDownload />
                      </button>
                    </div>
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
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4" style={{ borderColor: COLORS.modules.trucking }}>
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
                        <FaEye />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition" title="Download">
                        <FaDownload />
                      </button>
                    </div>
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
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4" style={{ borderColor: COLORS.modules.trucking }}>
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
                        <FaEye />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition" title="Download">
                        <FaDownload />
                      </button>
                    </div>
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
        <div className="bg-white rounded-xl p-6 shadow-md border-l-4" style={{ borderColor: COLORS.modules.trucking }}>
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
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
                        <FaEye />
                      </button>
                      {log.photoEvidence && log.photoEvidence.length > 0 && (
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition" title="View Photos">
                          <FaCamera />
                        </button>
                      )}
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition" title="Download">
                        <FaDownload />
                      </button>
                    </div>
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
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.background.secondary }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
              🚛 Trucking Operations
            </h1>
            <p className="text-lg text-gray-600">
              Industry-specific safety logs for load securement, reefer safety, winter operations, and more.
            </p>
          </div>
          <button
            className="px-6 py-3 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
            style={{ background: COLORS.gradients.trucking }}
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
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${
                activeTab === TABS.LOAD_SECUREMENT
                  ? 'border-b-4 text-gray-900 bg-orange-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === TABS.LOAD_SECUREMENT ? { borderColor: COLORS.modules.trucking } : {}}
            >
              <FaBox />
              <span>Load Securement</span>
            </button>
            <button
              onClick={() => setActiveTab(TABS.REEFER_SAFETY)}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${
                activeTab === TABS.REEFER_SAFETY
                  ? 'border-b-4 text-gray-900 bg-orange-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === TABS.REEFER_SAFETY ? { borderColor: COLORS.modules.trucking } : {}}
            >
              <FaThermometerHalf />
              <span>Reefer Food Safety</span>
            </button>
            <button
              onClick={() => setActiveTab(TABS.WINTER_SAFETY)}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${
                activeTab === TABS.WINTER_SAFETY
                  ? 'border-b-4 text-gray-900 bg-orange-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === TABS.WINTER_SAFETY ? { borderColor: COLORS.modules.trucking } : {}}
            >
              <FaSnowflake />
              <span>Winter Safety</span>
            </button>
            <button
              onClick={() => setActiveTab(TABS.FUELING_SPILL)}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${
                activeTab === TABS.FUELING_SPILL
                  ? 'border-b-4 text-gray-900 bg-orange-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === TABS.FUELING_SPILL ? { borderColor: COLORS.modules.trucking } : {}}
            >
              <FaGasPump />
              <span>Fueling & Spills</span>
            </button>
            <button
              onClick={() => setActiveTab(TABS.TDG_LOGS)}
              className={`flex-1 px-6 py-4 font-semibold transition-all flex items-center justify-center space-x-2 ${
                activeTab === TABS.TDG_LOGS
                  ? 'border-b-4 text-gray-900 bg-orange-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              style={activeTab === TABS.TDG_LOGS ? { borderColor: COLORS.modules.trucking } : {}}
            >
              <FaBiohazard />
              <span>Dangerous Goods (TDG)</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        {renderContent()}
      </div>
    </div>
  );
};

export default TruckingOperations;