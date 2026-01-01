import { useState, useEffect } from 'react';
import {
    RefreshCw, ShieldCheck, 
    Download, Upload, FileText, X, FileCheck
} from 'lucide-react';
import { 
    getHOSEldData, 
    syncHOSFromGeotab, 
    submitHOSAudit,
    uploadELogFile,
    getELogs,
    deleteELog,
    downloadELog
} from '../../../../axios/api/compliance.hosEld';
import { getAllDrivers } from '../../../../axios/api/driver';


interface Driver {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ELogFile {
  _id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  driverId?: string;
  driverName?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

const VehicleEldMonitor = () => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'audit-form' | 'e-logs'>('tracker');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    totalDrivers: 0,
    compliantDrivers: 0,
    activeViolations: 0,
    uncertifiedLogs: 0
  });

  // HOS Audit Form State
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [auditFormData, setAuditFormData] = useState({
    driverId: '',
    auditDate: new Date().toISOString().split('T')[0],
    drivingHours: 0,
    onDutyHours: 0,
    offDutyHours: 0,
    violations: [] as string[],
    notes: '',
    auditorName: ''
  });
  const [submittingAudit, setSubmittingAudit] = useState(false);

  // E-Logs State
  const [eLogs, setELogs] = useState<ELogFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDriverForLog, setSelectedDriverForLog] = useState('');
  const [eLogsLoading, setELogsLoading] = useState(false);

  // Fetch HOS/ELD data
  const fetchHOSData = async () => {
    setLoading(true);
    try {
      const response = await getHOSEldData();
      if (response?.success && response?.data) {
        setAuditLogs(response.data.auditLogs || []);
        setSummary(response.data.summary || {
          totalVehicles: 0,
          activeVehicles: 0,
          totalDrivers: 0,
          compliantDrivers: 0,
          activeViolations: 0,
          uncertifiedLogs: 0
        });
      }
    } catch (error) {
      console.error('Error fetching HOS/ELD data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch drivers for audit form
  const fetchDrivers = async () => {
    try {
      const response = await getAllDrivers(1, 1000);
      if (response?.success && response?.data) {
        setDrivers(response.data.map((d: any) => ({
          _id: d._id,
          name: d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Unknown Driver',
          email: d.email,
          phone: d.phone || d.mobile
        })));
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  // Fetch E-Logs
  const fetchELogs = async () => {
    setELogsLoading(true);
    try {
      const response = await getELogs();
      if (response?.success && response?.data) {
        setELogs(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching E-Logs:', error);
    } finally {
      setELogsLoading(false);
    }
  };

  // Sync HOS data from Geotab
  const handleSyncHOS = async () => {
    setSyncing(true);
    try {
      const response = await syncHOSFromGeotab();
      if (response?.success) {
        await fetchHOSData();
        alert('HOS data synced successfully!');
      } else {
        alert(response?.message || 'Failed to sync HOS data');
      }
    } catch (error) {
      console.error('Error syncing HOS data:', error);
      alert('Error syncing HOS data');
    } finally {
      setSyncing(false);
    }
  };

  // Submit HOS Audit
  const handleSubmitAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditFormData.driverId) {
      alert('Please select a driver');
      return;
    }

    setSubmittingAudit(true);
    try {
      const response = await submitHOSAudit(auditFormData);
      if (response?.success) {
        alert('HOS Audit submitted successfully!');
        // Reset form
        setAuditFormData({
          driverId: '',
          auditDate: new Date().toISOString().split('T')[0],
          drivingHours: 0,
          onDutyHours: 0,
          offDutyHours: 0,
          violations: [],
          notes: '',
          auditorName: ''
        });
        // Refresh audit logs
        await fetchHOSData();
      } else {
        alert(response?.message || 'Failed to submit audit');
      }
    } catch (error) {
      console.error('Error submitting audit:', error);
      alert('Error submitting audit');
    } finally {
      setSubmittingAudit(false);
    }
  };

  // Handle file upload for E-Logs
  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (selectedDriverForLog) {
        formData.append('driverId', selectedDriverForLog);
      }

      const response = await uploadELogFile(formData);
      if (response?.success) {
        alert('E-Log file uploaded successfully!');
        setSelectedFile(null);
        setSelectedDriverForLog('');
        await fetchELogs();
      } else {
        alert(response?.message || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    } finally {
      setUploadingFile(false);
    }
  };

  // Delete E-Log
  const handleDeleteELog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this E-Log file?')) {
      return;
    }

    try {
      const response = await deleteELog(logId);
      if (response?.success) {
        alert('E-Log deleted successfully!');
        await fetchELogs();
      } else {
        alert(response?.message || 'Failed to delete E-Log');
      }
    } catch (error) {
      console.error('Error deleting E-Log:', error);
      alert('Error deleting E-Log');
    }
  };

  // Download E-Log
  const handleDownloadELog = async (logId: string, fileName: string) => {
    try {
      const blob = await downloadELog(logId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading E-Log:', error);
      alert('Error downloading E-Log');
    }
  };


  useEffect(() => {
    fetchHOSData();
    if (activeTab === 'audit-form') {
      fetchDrivers();
    }
    if (activeTab === 'e-logs') {
      fetchELogs();
      fetchDrivers();
    }
  }, [activeTab]);


  const violationOptions = [
    '11-Hour Driving Limit',
    '14-Hour On-Duty Limit',
    '70-Hour/8-Day Limit',
    '30-Minute Break Requirement',
    'Rest Break Violation',
    'Other'
  ];

  return (
      <div className="min-h-screen bg-[#EDF8FF] font-sans pb-12">
          {/* Header */}
          <div className="top-0 z-30 bg-white shadow-sm">
              <div className="px-8 py-5 flex justify-between items-center">
                  <div>
                      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                          <ShieldCheck size={28} className="text-blue-600" />
                          Compliance Portal
                      </h1>
                      <p className="text-sm text-gray-500 mt-1 ml-10">ELD Mandate Monitoring & HOS Audit Tracking</p>
                  </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-8 flex gap-6">
                  {[
                      { key: 'tracker', label: 'HOS Audit Tracker' },
                      { key: 'audit-form', label: 'HOS Audit Form' },
                      { key: 'e-logs', label: 'E-Logs' }
                  ].map((tab) => (
                      <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key as any)}
                          className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${
                              activeTab === tab.key 
                                  ? 'border-blue-500 text-blue-600' 
                                  : 'border-transparent text-gray-400 hover:text-gray-600'
                          }`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </div>
          </div>

          <div className="w-full mx-auto px-4 mt-8">
              {/* HOS Audit Tracker Tab */}
              {activeTab === 'tracker' && (
                  <div className="space-y-6">
                      {/* HOS Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-5 rounded-xl border-l-4 border-green-500 shadow-sm">
                              <p className="text-xs text-gray-500 font-bold uppercase">Fully Compliant</p>
                              <h3 className="text-2xl font-bold">{summary.compliantDrivers}%</h3>
                              <p className="text-xs text-gray-400 mt-1">{summary.totalDrivers} Drivers</p>
                          </div>
                          <div className="bg-white p-5 rounded-xl border-l-4 border-red-500 shadow-sm">
                              <p className="text-xs text-gray-500 font-bold uppercase">Active Violations</p>
                              <h3 className="text-2xl font-bold text-red-600">{summary.activeViolations}</h3>
                              <p className="text-xs text-gray-400 mt-1">Requires immediate audit</p>
                          </div>
                          <div className="bg-white p-5 rounded-xl border-l-4 border-amber-500 shadow-sm">
                              <p className="text-xs text-gray-500 font-bold uppercase">Uncertified Logs</p>
                              <h3 className="text-2xl font-bold text-amber-600">{summary.uncertifiedLogs}</h3>
                              <p className="text-xs text-gray-400 mt-1">Pending driver signature</p>
                          </div>
                      </div>

                      {/* Audit Table */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                              <h3 className="font-bold text-gray-800">Driver Log Audit (Last 7 Days)</h3>
                              <div className="flex gap-2">
                                  <button 
                                      onClick={handleSyncHOS}
                                      disabled={syncing}
                                      style={{
                                          background: syncing ? '#9CA3AF' : 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                                      }}
                                      className="flex items-center gap-2 text-sm font-semibold !text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                      <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> 
                                      {syncing ? 'Syncing...' : 'Sync from Geotab'}
                                  </button>
                                  <button 
                                     style={{
                                      background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                                    }}
                                  className="flex items-center gap-2 text-sm font-semibold !text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                      <Download size={16} /> Export HOS Report
                                  </button>
                              </div>
                          </div>

                          <table className="w-full text-sm text-left">
                              <thead className="bg-gray-100 text-gray-600 uppercase text-[11px] font-bold">
                                  <tr>
                                      <th className="px-6 py-4">Driver Name</th>
                                      <th className="px-6 py-4">Log Date</th>
                                      <th className="px-6 py-4">Driving Time</th>
                                      <th className="px-6 py-4">On-Duty Time</th>
                                      <th className="px-6 py-4">Violation Type</th>
                                      <th className="px-6 py-4">Status</th>
                                      <th className="px-6 py-4">Actions</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                  {loading ? (
                                      <tr>
                                          <td colSpan={7} className="px-6 py-8 text-center">
                                              <div className="flex items-center justify-center text-gray-500">
                                                  <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                                                  Loading HOS data...
                                              </div>
                                          </td>
                                      </tr>
                                  ) : auditLogs.length === 0 ? (
                                      <tr>
                                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                              No HOS logs found. Click "Sync from Geotab" to fetch data.
                                          </td>
                                      </tr>
                                  ) : (
                                      auditLogs.map((log) => (
                                          <tr key={log.id} className="hover:bg-blue-50/30">
                                              <td className="px-6 py-4 font-bold text-gray-900">{log.driver}</td>
                                              <td className="px-6 py-4 text-gray-600">{log.date}</td>
                                              <td className="px-6 py-4 font-mono text-gray-700">{log.driveUsed}</td>
                                              <td className="px-6 py-4 font-mono text-gray-700">{log.dutyUsed}</td>
                                              <td className="px-6 py-4">
                                                  <span className={`font-medium ${log.violation !== 'None' ? 'text-red-600' : 'text-gray-400'}`}>
                                                      {log.violation}
                                                  </span>
                                              </td>
                                              <td className="px-6 py-4">
                                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                      log.status === 'compliant' ? 'bg-green-100 text-green-700' :
                                                      log.status === 'violation' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                  }`}>
                                                      {log.status}
                                                  </span>
                                              </td>
                                              <td className="px-6 py-4">
                                                  <button className="text-blue-600 font-bold hover:underline">View Log</button>
                                              </td>
                                          </tr>
                                      ))
                                  )}
                              </tbody>
                          </table>
                      </div>
                  </div>
              )}

              {/* HOS Audit Form Tab */}
              {activeTab === 'audit-form' && (
                  <div className="space-y-6">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                              <FileCheck size={24} className="text-blue-600" />
                              HOS Audit Form
                          </h2>
                          
                          <form onSubmit={handleSubmitAudit} className="space-y-6">
                              {/* Driver Selection */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Driver <span className="text-red-500">*</span>
                                  </label>
                                  <select
                                      value={auditFormData.driverId}
                                      onChange={(e) => setAuditFormData({ ...auditFormData, driverId: e.target.value })}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      required
                                  >
                                      <option value="">Select a driver</option>
                                      {drivers.map((driver) => (
                                          <option key={driver._id} value={driver._id}>
                                              {driver.name}
                                          </option>
                                      ))}
                                  </select>
                              </div>

                              {/* Audit Date */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Audit Date <span className="text-red-500">*</span>
                                  </label>
                                  <input
                                      type="date"
                                      value={auditFormData.auditDate}
                                      onChange={(e) => setAuditFormData({ ...auditFormData, auditDate: e.target.value })}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      required
                                  />
                              </div>

                              {/* Hours Section */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Driving Hours <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          value={auditFormData.drivingHours}
                                          onChange={(e) => setAuditFormData({ ...auditFormData, drivingHours: parseFloat(e.target.value) || 0 })}
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          required
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                          On-Duty Hours <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          value={auditFormData.onDutyHours}
                                          onChange={(e) => setAuditFormData({ ...auditFormData, onDutyHours: parseFloat(e.target.value) || 0 })}
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          required
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Off-Duty Hours <span className="text-red-500">*</span>
                                      </label>
                                      <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          value={auditFormData.offDutyHours}
                                          onChange={(e) => setAuditFormData({ ...auditFormData, offDutyHours: parseFloat(e.target.value) || 0 })}
                                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          required
                                      />
                                  </div>
                              </div>

                              {/* Violations */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Violations (if any)
                                  </label>
                                  <div className="space-y-2">
                                      {violationOptions.map((violation) => (
                                          <label key={violation} className="flex items-center gap-2 cursor-pointer">
                                              <input
                                                  type="checkbox"
                                                  checked={auditFormData.violations.includes(violation)}
                                                  onChange={(e) => {
                                                      if (e.target.checked) {
                                                          setAuditFormData({
                                                              ...auditFormData,
                                                              violations: [...auditFormData.violations, violation]
                                                          });
                                                      } else {
                                                          setAuditFormData({
                                                              ...auditFormData,
                                                              violations: auditFormData.violations.filter(v => v !== violation)
                                                          });
                                                      }
                                                  }}
                                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                              />
                                              <span className="text-sm text-gray-700">{violation}</span>
                                          </label>
                                      ))}
                                  </div>
                              </div>

                              {/* Auditor Name */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Auditor Name
                                  </label>
                                  <input
                                      type="text"
                                      value={auditFormData.auditorName}
                                      onChange={(e) => setAuditFormData({ ...auditFormData, auditorName: e.target.value })}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Enter auditor name"
                                  />
                              </div>

                              {/* Notes */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Notes
                                  </label>
                                  <textarea
                                      value={auditFormData.notes}
                                      onChange={(e) => setAuditFormData({ ...auditFormData, notes: e.target.value })}
                                      rows={4}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Enter any additional notes or observations..."
                                  />
                              </div>

                              {/* Submit Button */}
                              <div className="flex justify-end gap-4">
                                  <button
                                      type="button"
                                      onClick={() => setAuditFormData({
                                          driverId: '',
                                          auditDate: new Date().toISOString().split('T')[0],
                                          drivingHours: 0,
                                          onDutyHours: 0,
                                          offDutyHours: 0,
                                          violations: [],
                                          notes: '',
                                          auditorName: ''
                                      })}
                                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                  >
                                      Reset
                                  </button>
                                  <button
                                      type="submit"
                                      disabled={submittingAudit}
                                      style={{
                                          background: submittingAudit ? '#9CA3AF' : 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                                      }}
                                      className="px-6 py-2 !text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                      {submittingAudit ? 'Submitting...' : 'Submit Audit'}
                                  </button>
                              </div>
                          </form>
                      </div>
                  </div>
              )}

              {/* E-Logs Tab */}
              {activeTab === 'e-logs' && (
                  <div className="space-y-6">
                      {/* Upload Section */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <Upload size={24} className="text-blue-600" />
                              Upload E-Log File
                          </h2>
                          
                          <div className="space-y-4">
                              {/* Driver Selection (Optional) */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Driver (Optional)
                                  </label>
                                  <select
                                      value={selectedDriverForLog}
                                      onChange={(e) => setSelectedDriverForLog(e.target.value)}
                                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                      <option value="">All Drivers</option>
                                      {drivers.map((driver) => (
                                          <option key={driver._id} value={driver._id}>
                                              {driver.name}
                                          </option>
                                      ))}
                                  </select>
                              </div>

                              {/* File Upload */}
                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                      Select E-Log File <span className="text-red-500">*</span>
                                  </label>
                                  <div className="flex items-center gap-4">
                                      <label className="flex-1 cursor-pointer">
                                          <input
                                              type="file"
                                              accept=".pdf,.txt,.csv,.xlsx,.xls"
                                              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                              className="hidden"
                                          />
                                          <div className="px-4 py-3 border border-gray-300 rounded-lg border-dashed hover:bg-gray-50 text-center">
                                              {selectedFile ? (
                                                  <div className="flex items-center justify-center gap-2 text-blue-600">
                                                      <FileText size={20} />
                                                      <span className="font-medium">{selectedFile.name}</span>
                                                      <button
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              setSelectedFile(null);
                                                          }}
                                                          className="ml-2 text-red-500 hover:text-red-700"
                                                      >
                                                          <X size={18} />
                                                      </button>
                                                  </div>
                                              ) : (
                                                  <div className="text-gray-500">
                                                      <Upload size={24} className="mx-auto mb-2" />
                                                      <span>Click to select file or drag and drop</span>
                                                      <p className="text-xs mt-1">PDF, TXT, CSV, XLSX (Max 20MB)</p>
                                                  </div>
                                              )}
                                          </div>
                                      </label>
                                  </div>
                              </div>

                              {/* Upload Button */}
                              <div className="flex justify-end">
                                  <button
                                      onClick={handleFileUpload}
                                      disabled={!selectedFile || uploadingFile}
                                      style={{
                                          background: (!selectedFile || uploadingFile) ? '#9CA3AF' : 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                                      }}
                                      className="px-6 py-2 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                  >
                                      {uploadingFile ? (
                                          <>
                                              <RefreshCw size={16} className="animate-spin" />
                                              Uploading...
                                          </>
                                      ) : (
                                          <>
                                              <Upload size={16} />
                                              Upload File
                                          </>
                                      )}
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* E-Logs List */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          <div className="px-6 py-4 border-b bg-gray-50">
                              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                  <FileText size={20} className="text-blue-600" />
                                  Uploaded E-Logs
                              </h3>
                          </div>

                          {eLogsLoading ? (
                              <div className="px-6 py-8 text-center">
                                  <RefreshCw className="animate-spin h-5 w-5 mx-auto text-gray-500" />
                              </div>
                          ) : eLogs.length === 0 ? (
                              <div className="px-6 py-8 text-center text-gray-500">
                                  No E-Log files uploaded yet.
                              </div>
                          ) : (
                              <div className="overflow-x-auto">
                                  <table className="w-full text-sm text-left">
                                      <thead className="bg-gray-100 text-gray-600 uppercase text-[11px] font-bold">
                                          <tr>
                                              <th className="px-6 py-4">File Name</th>
                                              <th className="px-6 py-4">Driver</th>
                                              <th className="px-6 py-4">File Size</th>
                                              <th className="px-6 py-4">Uploaded Date</th>
                                              <th className="px-6 py-4">Actions</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                          {eLogs.map((log) => (
                                              <tr key={log._id} className="hover:bg-blue-50/30">
                                                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                                      <FileText size={16} className="text-blue-500" />
                                                      {log.fileName}
                                                  </td>
                                                  <td className="px-6 py-4 text-gray-600">
                                                      {log.driverName || 'N/A'}
                                                  </td>
                                                  <td className="px-6 py-4 text-gray-600">
                                                      {(log.fileSize / 1024 / 1024).toFixed(2)} MB
                                                  </td>
                                                  <td className="px-6 py-4 text-gray-600">
                                                      {new Date(log.uploadedAt).toLocaleDateString()}
                                                  </td>
                                                  <td className="px-6 py-4">
                                                      <div className="flex items-center gap-2">
                                                          <button
                                                              onClick={() => handleDownloadELog(log._id, log.fileName)}
                                                              className="text-blue-600 hover:text-blue-800 font-medium"
                                                          >
                                                              <Download size={16} />
                                                          </button>
                                                          <button
                                                              onClick={() => handleDeleteELog(log._id)}
                                                              className="text-red-600 hover:text-red-800 font-medium"
                                                          >
                                                              <X size={16} />
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
                  </div>
              )}
          </div>
      </div>
  );
};

export default VehicleEldMonitor;
