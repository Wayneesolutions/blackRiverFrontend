import React, { useState, useEffect } from 'react';
import { COLORS } from '../../../../theme/colors';
import {
  FaAmbulance,
  FaFire,
  FaFlask,
  FaCar,
  FaPhone,
  FaEnvelope,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaPrint,
  FaDownload,
  FaChevronDown,
  FaChevronRight,
  FaExclamationTriangle,
  FaFileAlt,
  FaMapMarkerAlt,
  FaClipboardList,
  FaEye,
} from 'react-icons/fa';

interface EmergencyContact {
  _id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  department: string;
  isPrimary: boolean;
  available24_7?: boolean;
  alternatePhone?: string;
}

interface EmergencyProcedure {
  _id: string;
  title: string;
  type: 'medical' | 'fire' | 'spill' | 'collision' | 'breakdown' | 'violence' | 'other';
  procedure: string;
  lastUpdated: string;
  quickReferenceSteps?: string[];
  documentUrl?: string;
  documents?: Array<{
    fileUrl: string;
    fileName: string;
    fileType: 'image' | 'video' | 'document';
    uploadedAt: string;
    uploadedBy: string;
  }>;
}

interface FirstAidLog {
  _id: string;
  date: string;
  time: string;
  location: string;
  injuredPerson: string;
  injuryDescription: string;
  firstAidProvided: string;
  treatedBy: string;
  followUpRequired: boolean;
  relatedIncident?: string;
}

const EmergencyProcedures: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [procedures, setProcedures] = useState<EmergencyProcedure[]>([]);
  const [firstAidLogs, setFirstAidLogs] = useState<FirstAidLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'contacts' | 'procedures' | 'firstaid'>('contacts');
  const [expandedProcedure, setExpandedProcedure] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showProcedureForm, setShowProcedureForm] = useState(false);
  const [showFirstAidForm, setShowFirstAidForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [editingProcedure, setEditingProcedure] = useState<EmergencyProcedure | null>(null);

  const [newContact, setNewContact] = useState({
    name: '',
    role: '',
    phone: '',
    email: '',
    department: '',
    isPrimary: false,
    available24_7: false,
    alternatePhone: '',
  });

  const [newProcedure, setNewProcedure] = useState({
    title: '',
    type: 'medical' as EmergencyProcedure['type'],
    procedure: '',
    quickReferenceSteps: [''],
  });

  const [newFirstAidLog, setNewFirstAidLog] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    injuredPerson: '',
    injuryDescription: '',
    firstAidProvided: '',
    treatedBy: '',
    followUpRequired: false,
    relatedIncident: '',
  });

  useEffect(() => {
    // Mock data
    setContacts([
      {
        _id: '1',
        name: 'Emergency Services',
        role: 'Emergency Response',
        phone: '911',
        department: 'External',
        isPrimary: true,
        available24_7: true,
      },
      {
        _id: '2',
        name: 'Safety Manager - David Chen',
        role: 'Safety Manager',
        phone: '+1-555-0100',
        email: 'safety@company.com',
        department: 'Safety',
        isPrimary: false,
        available24_7: false,
        alternatePhone: '+1-555-0101',
      },
      {
        _id: '3',
        name: 'Operations Manager - Sarah Lee',
        role: 'Operations Manager',
        phone: '+1-555-0200',
        email: 'ops@company.com',
        department: 'Operations',
        isPrimary: false,
      },
    ]);

    setProcedures([
      {
        _id: '1',
        title: 'Medical Emergency Response',
        type: 'medical',
        procedure: '1. Assess the situation and ensure scene safety\n2. Call 911 immediately\n3. Provide first aid if trained\n4. Do not move injured person unless in immediate danger\n5. Notify safety manager\n6. Document incident',
        lastUpdated: '2025-01-01',
        quickReferenceSteps: ['Assess', 'Call 911', 'First Aid', 'Notify', 'Document'],
      },
      {
        _id: '2',
        title: 'Fire Response & Evacuation',
        type: 'fire',
        procedure: '1. Sound the fire alarm\n2. Evacuate building immediately\n3. Close doors behind you\n4. Proceed to assembly point\n5. Do not use elevators\n6. Account for all personnel',
        lastUpdated: '2025-01-01',
        quickReferenceSteps: ['Alarm', 'Evacuate', 'Close Doors', 'Assembly Point', 'Head Count'],
      },
      {
        _id: '3',
        title: 'Hazardous Material Spill',
        type: 'spill',
        procedure: '1. Evacuate area\n2. Contain spill if safe to do so\n3. Call CANUTEC 1-888-226-8832\n4. Contact local authorities\n5. Use spill kit for small spills\n6. Document incident',
        lastUpdated: '2025-01-01',
        quickReferenceSteps: ['Evacuate', 'Contain', 'Call CANUTEC', 'Authorities', 'Document'],
      },
      {
        _id: '4',
        title: 'Vehicle Collision Response',
        type: 'collision',
        procedure: '1. Ensure safety of all persons\n2. Call emergency services if injuries\n3. Document scene with photos\n4. Exchange information with other parties\n5. Notify dispatch immediately\n6. Complete incident report within 24 hours',
        lastUpdated: '2025-01-01',
        quickReferenceSteps: ['Safety First', 'Call 911', 'Document', 'Exchange Info', 'Notify Dispatch', 'Report'],
      },
      {
        _id: '5',
        title: 'Roadside Breakdown Procedure',
        type: 'breakdown',
        procedure: '1. Move vehicle to safe location if possible\n2. Activate hazard lights\n3. Set up warning triangles/flares\n4. Call dispatch for assistance\n5. Stay with vehicle if safe\n6. Document breakdown details',
        lastUpdated: '2025-01-01',
        quickReferenceSteps: ['Safe Location', 'Hazard Lights', 'Warning Devices', 'Call Dispatch', 'Stay Safe'],
      },
      {
        _id: '6',
        title: 'Workplace Violence Response',
        type: 'violence',
        procedure: '1. Remove yourself from immediate danger\n2. Call 911 if threat is active\n3. Notify security/supervisor\n4. Document incident\n5. Provide support to affected employees\n6. Follow company violence prevention policy',
        lastUpdated: '2025-01-01',
        quickReferenceSteps: ['Remove from Danger', 'Call 911', 'Notify Security', 'Document', 'Support', 'Follow Policy'],
      },
    ]);

    setFirstAidLogs([
      {
        _id: '1',
        date: '2025-12-08',
        time: '14:35',
        location: 'Warehouse A',
        injuredPerson: 'Mike Johnson',
        injuryDescription: 'Cut on hand from sharp edge',
        firstAidProvided: 'Cleaned wound, applied antiseptic, bandaged',
        treatedBy: 'Jane Smith (First Aid Certified)',
        followUpRequired: false,
      },
      {
        _id: '2',
        date: '2025-12-05',
        time: '10:20',
        location: 'Office',
        injuredPerson: 'Sarah Lee',
        injuryDescription: 'Minor burn from coffee',
        firstAidProvided: 'Cold water applied, burn gel',
        treatedBy: 'Bob Wilson',
        followUpRequired: false,
      },
    ]);

    setLoading(false);
  }, []);

  const getProcedureIcon = (type: EmergencyProcedure['type']) => {
    switch (type) {
      case 'medical':
        return <FaAmbulance className="text-red-600" size={24} />;
      case 'fire':
        return <FaFire className="text-orange-600" size={24} />;
      case 'spill':
        return <FaFlask className="text-yellow-600" size={24} />;
      case 'collision':
        return <FaCar className="text-blue-600" size={24} />;
      case 'breakdown':
        return <FaCar className="text-gray-600" size={24} />;
      case 'violence':
        return <FaExclamationTriangle className="text-red-600" size={24} />;
      default:
        return <FaFileAlt className="text-gray-600" size={24} />;
    }
  };

  const renderEmergencyContacts = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FaPhone className="text-red-600" />
            Emergency Contacts
          </h2>
          <button
            onClick={() => {
              setEditingContact(null);
              setNewContact({
                name: '',
                role: '',
                phone: '',
                email: '',
                department: '',
                isPrimary: false,
                available24_7: false,
                alternatePhone: '',
              });
              setShowContactForm(true);
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Add Contact
          </button>
        </div>

        {showContactForm && (
          <div className="mb-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              {editingContact ? 'Edit Emergency Contact' : 'Add New Emergency Contact'}
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingContact) {
                  setContacts(contacts.map(c => (c._id === editingContact._id ? { ...editingContact, ...newContact } : c)));
                } else {
                  setContacts([...contacts, { 
                    ...newContact, 
                    email: newContact.email || '',
                    alternatePhone: newContact.alternatePhone || '',
                    _id: String(contacts.length + 1) 
                  }]);
                }
                setShowContactForm(false);
                setEditingContact(null);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                    placeholder="Contact Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role *</label>
                  <input
                    type="text"
                    required
                    value={newContact.role}
                    onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                    placeholder="Safety Manager, Operations Manager, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                    placeholder="+1-555-0100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Alternate Phone</label>
                  <input
                    type="tel"
                    value={newContact.alternatePhone}
                    onChange={(e) => setNewContact({ ...newContact, alternatePhone: e.target.value })}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                    placeholder="+1-555-0101"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                    placeholder="contact@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department *</label>
                  <input
                    type="text"
                    required
                    value={newContact.department}
                    onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                    className="w-full border-2 border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-red-500"
                    placeholder="Safety, Operations, External, etc."
                  />
                </div>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newContact.isPrimary}
                    onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                    className="w-5 h-5 text-red-600 focus:ring-red-500 rounded"
                  />
                  <span className="font-medium text-gray-700">Primary Contact</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newContact.available24_7}
                    onChange={(e) => setNewContact({ ...newContact, available24_7: e.target.checked })}
                    className="w-5 h-5 text-red-600 focus:ring-red-500 rounded"
                  />
                  <span className="font-medium text-gray-700">Available 24/7</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactForm(false);
                    setEditingContact(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 flex items-center gap-2"
                >
                  <FaSave /> {editingContact ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact) => (
            <div
              key={contact._id}
              className={`p-5 rounded-xl border-2 ${
                contact.isPrimary
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{contact.name}</h3>
                  {contact.isPrimary && (
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full mt-1 inline-block">
                      PRIMARY
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingContact(contact);
                      setNewContact({ 
                        name: contact.name,
                        role: contact.role,
                        phone: contact.phone,
                        email: contact.email || '',
                        department: contact.department,
                        isPrimary: contact.isPrimary,
                        available24_7: contact.available24_7 || false,
                        alternatePhone: contact.alternatePhone || '',
                      });
                      setShowContactForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Contact"
                  >
                    <FaEdit size={14} />
                  </button>
                  <button
                    onClick={() => setContacts(contacts.filter(c => c._id !== contact._id))}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Contact"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{contact.role}</p>
              <p className="text-sm text-gray-500 mb-2">{contact.department}</p>
              <div className="flex items-center gap-2 mb-1">
                <FaPhone className="text-blue-600" size={14} />
                <a href={`tel:${contact.phone}`} className="text-lg font-semibold text-blue-600 hover:underline">
                  {contact.phone}
                </a>
              </div>
              {contact.alternatePhone && (
                <div className="flex items-center gap-2 mb-1">
                  <FaPhone className="text-gray-400" size={12} />
                  <span className="text-sm text-gray-500">Alt: {contact.alternatePhone}</span>
                </div>
              )}
              {contact.email && (
                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-gray-400" size={12} />
                  <a href={`mailto:${contact.email}`} className="text-sm text-gray-600 hover:underline">
                    {contact.email}
                  </a>
                </div>
              )}
              {contact.available24_7 && (
                <span className="mt-2 inline-block text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                  24/7 Available
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2">
            <FaPrint /> Print Emergency Contact List
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmergencyProcedures = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FaClipboardList className="text-orange-600" />
            Emergency Response Procedures
          </h2>
          <button
            onClick={() => {
              setEditingProcedure(null);
              setNewProcedure({
                title: '',
                type: 'medical',
                procedure: '',
                quickReferenceSteps: [''],
              });
              setShowProcedureForm(true);
            }}
            className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Add Procedure
          </button>
        </div>

        <div className="space-y-4">
          {procedures.map((proc) => (
            <div
              key={proc._id}
              className="border-2 border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedProcedure(expandedProcedure === proc._id ? null : proc._id)
                }
                className="w-full p-5 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  {getProcedureIcon(proc.type)}
                  <div className="text-left">
                    <h3 className="font-bold text-gray-900 text-lg">{proc.title}</h3>
                    <p className="text-xs text-gray-500">
                      Last Updated: {new Date(proc.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProcedure(proc);
                      setNewProcedure({
                        title: proc.title,
                        type: proc.type,
                        procedure: proc.procedure,
                        quickReferenceSteps: proc.quickReferenceSteps || [''],
                      });
                      setShowProcedureForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Procedure"
                  >
                    <FaEdit size={14} />
                  </button>
                  {expandedProcedure === proc._id ? (
                    <FaChevronDown className="text-gray-600" />
                  ) : (
                    <FaChevronRight className="text-gray-600" />
                  )}
                </div>
              </button>

              {expandedProcedure === proc._id && (
                <div className="p-6 bg-white border-t-2 border-gray-200">
                  {proc.quickReferenceSteps && proc.quickReferenceSteps.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-bold text-gray-900 mb-2">Quick Reference Steps:</h4>
                      <div className="flex flex-wrap gap-2">
                        {proc.quickReferenceSteps.map((step, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold"
                          >
                            {idx + 1}. {step}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Detailed Procedure:</h4>
                    <div className="whitespace-pre-line text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {proc.procedure}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                      <FaDownload /> Download PDF
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2">
                      <FaPrint /> Print
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFirstAidLogs = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FaAmbulance className="text-red-600" />
            First Aid Logs
          </h2>
          <button
            onClick={() => setShowFirstAidForm(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FaPlus /> New First Aid Log
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date / Time</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Injured Person</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Injury Description</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">First Aid Provided</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Treated By</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Follow-up</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {firstAidLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{new Date(log.date).toLocaleDateString()}</div>
                    <div className="text-gray-500 text-xs">{log.time}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <FaMapMarkerAlt className="text-gray-400" size={12} />
                      {log.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.injuredPerson}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.injuryDescription}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.firstAidProvided}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{log.treatedBy}</td>
                  <td className="px-6 py-4">
                    {log.followUpRequired ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                        Required
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                        None
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Details">
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.background.secondary }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.text.primary }}>
            <FaAmbulance className="inline mr-3" style={{ color: COLORS.status.danger }} />
            Emergency Procedures & Response
          </h1>
          <p className="text-lg text-gray-600">
            Manage emergency contacts, response procedures, and first aid logs for quick access during emergencies.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'contacts'
                  ? 'border-b-2 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'contacts' ? { borderColor: COLORS.status.danger } : {}}
            >
              <FaPhone className="inline mr-2" />
              Emergency Contacts
            </button>
            <button
              onClick={() => setActiveTab('procedures')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'procedures'
                  ? 'border-b-2 text-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'procedures' ? { borderColor: '#f97316' } : {}}
            >
              <FaClipboardList className="inline mr-2" />
              Response Procedures
            </button>
            <button
              onClick={() => setActiveTab('firstaid')}
              className={`flex-1 px-6 py-4 font-semibold transition ${
                activeTab === 'firstaid'
                  ? 'border-b-2 text-red-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              style={activeTab === 'firstaid' ? { borderColor: COLORS.status.danger } : {}}
            >
              <FaAmbulance className="inline mr-2" />
              First Aid Logs
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'contacts' && renderEmergencyContacts()}
        {activeTab === 'procedures' && renderEmergencyProcedures()}
        {activeTab === 'firstaid' && renderFirstAidLogs()}

        {/* Info Panel */}
        <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
            <FaExclamationTriangle /> Emergency Procedures Compliance
          </h3>
          <ul className="text-sm text-red-800 space-y-1">
            <li>✅ All emergency contacts accessible 24/7</li>
            <li>✅ Response procedures documented and up-to-date</li>
            <li>✅ First aid logs maintained for audit compliance</li>
            <li>✅ Quick reference guides for rapid response</li>
            <li>✅ Mobile-friendly access for field employees</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmergencyProcedures;

