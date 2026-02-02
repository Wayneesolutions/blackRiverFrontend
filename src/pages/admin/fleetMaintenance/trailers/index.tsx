import React, { useState, useEffect, useRef } from 'react';
import { Plus, Upload, ChevronUp, ChevronDown, HelpCircle, Clock, X, Image as ImageIcon, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { getAllTrailers, createTrailer, updateTrailer, deleteTrailer, getTrailerById } from '../../../../axios/api/trailer';
import { getAllDrivers, type Driver } from '../../../../axios/api/driver';
import { createVehicleDocument, updateVehicleDocument } from '../../../../axios/api/compilance.vehicledoc';
import { getAllYards, type Yard } from '../../../../axios/api/fleet.yards';
import apiClient from '../../../../axios/apiClient';
import ConfirmationModal from '../../../../components/common/ConfirmationModal';

interface Trailer {
    _id?: string;
    id?: string;
    trailerNumber?: string;
    trailer?: string;
    unitNumber?: string;
    plateNumber: string;
    type: string;
    ownership: string;
    lastDispatch?: string;
    lastDispatchDate?: string | Date;
    lastDropLocation?: string;
    notes?: string;
    note?: string;
    operatingStatus?: 'IN SERVICE' | 'OUT OF SERVICE' | 'MAINTENANCE';
    loadedStatus?: 'LOADED' | 'IDLE' | 'SCHEDULED';
    compliance?: 'COMPLIANT' | 'NON-COMPLIANT' | 'EXPIRING SOON';
    category?: 'MB' | 'AB' | 'TX' | 'External' | 'Unassigned';
    imageUrl?: string;
    trailerImageUrl?: string;
    make?: string;
    model?: string;
    year?: string;
    vinNumber?: string;
    status?: string;
    yard?: any;
}

// Trailer data will be fetched from API

const TrailersPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [complianceStatus, setComplianceStatus] = useState('All');
    const [operatingStatus, setOperatingStatus] = useState('All');
    
    // API state
    const [trailers, setTrailers] = useState<Trailer[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [yards, setYards] = useState<Yard[]>([]);
    const [yardCounts, setYardCounts] = useState<{ [key: string]: number }>({});
    const [assignedTrailerIds, setAssignedTrailerIds] = useState<Set<string>>(new Set());

    // Sidebar modal state
    const [showSidebar, setShowSidebar] = useState(false);
    const [activeStep, setActiveStep] = useState<'Details' | 'Inspections' | 'Documents' | 'Incidents' | 'Notes'>('Details');
    const [inspectionType, setInspectionType] = useState<'One Time' | 'Recurring'>('One Time');
    const [documentType, setDocumentType] = useState<'General' | 'Ownership' | 'Plate' | 'Safety' | 'Insurance'>('General');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Confirmation modal states
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // Form data
    const [formData, setFormData] = useState({
        unitNumber: '',
        vinNumber: '',
        plateNumber: '',
        make: '',
        model: '',
        year: '',
        weight: '0',
        registrationCountry: '',
        registrationProvince: '',
        type: '',
        uom: 'Kg',
        status: 'In Service',
        ownership: 'COMPANY ASSET' as 'COMPANY ASSET' | 'THIRD PARTY ASSET',
        subType: '' as '' | 'HIGHWAY USE' | 'CITY USE' | 'STORAGE USE' | 'RENTAL' | 'OTHER',
        yard: ''
    });

    // Store original trailer data for partial updates
    const [originalTrailerData, setOriginalTrailerData] = useState<any>(null);

    // Inspections data
    const [oneTimeInspections, setOneTimeInspections] = useState<Array<{
        id: string;
        expiryDate: string;
        description: string;
        ignoreExpiration: boolean;
        file?: File | null;
        fileUrl?: string | null;
        fileName?: string | null;
        isExisting?: boolean;
    }>>([]);

    const [recurringInspections, setRecurringInspections] = useState<Array<{
        id: string;
        scheduledOn: string;
        after: string;
        unit: string;
        description: string;
        ignoreExpiration: boolean;
        file?: File | null;
        fileUrl?: string | null;
        fileName?: string | null;
        isExisting?: boolean;
    }>>([]);

    const [inspectionForm, setInspectionForm] = useState({
        expiryDate: '',
        description: '',
        ignoreExpiration: false,
        scheduledOn: '',
        after: '',
        unit: '',
        file: null as File | null
    });

    const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null);
    const [editingInspectionType, setEditingInspectionType] = useState<'oneTime' | 'recurring' | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Documents data
    const [documents, setDocuments] = useState<Record<string, Array<{
        id: string;
        _id?: string;
        expiryDate: string;
        description: string;
        file: File | null;
        fileUrl?: string | null;
        fileName?: string;
        ignoreExpiration: boolean;
        isExisting?: boolean;
    }>>>({
        General: [],
        Ownership: [],
        Plate: [],
        Safety: [],
        Insurance: []
    });

    const [documentForm, setDocumentForm] = useState({
        expiryDate: '',
        description: '',
        file: null as File | null,
        ignoreExpiration: false
    });

    const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
    const [editingDocumentType, setEditingDocumentType] = useState<string | null>(null);
    const documentFileInputRef = useRef<HTMLInputElement>(null);

    // Incidents data
    const [incidents, setIncidents] = useState<Array<{
        id: string;
        accidentNumber: string;
        driver: string;
        coDriver: string;
        location: string;
        date: string;
        time: string;
        weather: string;
        policeReport: string;
        accidentReport: string;
        thirdPartyInfo: string;
        files: File[];
    }>>([]);

    const [incidentForm, setIncidentForm] = useState({
        accidentNumber: '',
        driver: '',
        coDriver: '',
        location: '',
        date: '',
        time: '',
        weather: '',
        policeReport: '',
        accidentReport: '',
        thirdPartyInfo: '',
        files: [] as File[]
    });

    const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);
    const incidentFileInputRef = useRef<HTMLInputElement>(null);

    // Notes data
    const [notes, setNotes] = useState<Array<{
        id: string;
        note: string;
        category: string;
    }>>([]);

    const [noteForm, setNoteForm] = useState({
        note: '',
        category: 'Category'
    });

    // Column filters
    const [filters, setFilters] = useState({
        trailerNumber: '',
        plateNumber: '',
        type: '',
        ownership: 'All',
        lastDispatch: '',
        lastDispatchDate: '',
        lastDropLocation: '',
        notes: '',
        operatingStatus: 'All',
        loadedStatus: 'All',
        compliance: 'All'
    });

    // Sort configuration
    const [sortConfig, setSortConfig] = useState<{ key: keyof Trailer | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc'
    });

    // Fetch active orders to determine trailer assignments (for Unassigned tab)
    useEffect(() => {
        const fetchActiveOrders = async () => {
            try {
                const response = await apiClient.get('dispatcher/order?status=IN_PROGRESS,dispatched,in-delivery,CONFIRMED&limit=1000');
                if (response.data?.success && response.data?.data) {
                    const trailerIds = new Set<string>();
                    response.data.data.forEach((order: any) => {
                        if (order.trailer?._id) {
                            trailerIds.add(order.trailer._id);
                        }
                    });
                    setAssignedTrailerIds(trailerIds);
                }
            } catch (error) {
                console.error('Error fetching active orders:', error);
            }
        };
        fetchActiveOrders();
    }, []);

    // Fetch trailers from API
    useEffect(() => {
        const fetchTrailers = async () => {
            setLoading(true);
            try {
                // Determine filter parameters based on activeTab (same logic as Trucks)
                let yardFilter: string | undefined = undefined;
                let ownershipFilter: string | undefined = undefined;
                
                if (activeTab === 'All') {
                    // No filters - fetch all
                } else if (activeTab === 'External') {
                    ownershipFilter = 'THIRD PARTY ASSET';
                } else if (activeTab === 'Unassigned') {
                    // For unassigned, fetch all and filter on frontend
                } else {
                    // Yard filter - activeTab is a yard ID
                    yardFilter = activeTab;
                }

                console.log('🔍 Fetching trailers with filters:', { activeTab, yardFilter, ownershipFilter });

                const response = await getAllTrailers(
                    1,
                    1000,
                    undefined, // search
                    undefined, // type
                    undefined, // status
                    undefined, // operationStatus
                    yardFilter, // yard
                    ownershipFilter // ownership
                );
                
                console.log('📥 Trailers API response:', response);
                
                if (response?.success && response?.data) {
                    // Transform backend data to match frontend interface
                    const transformedTrailers = response.data.map((trailer: any) => ({
                        _id: trailer._id,
                        id: trailer._id,
                        trailerNumber: trailer.trailer || trailer.unitNumber || trailer.trailerNumber || '',
                        trailer: trailer.trailer || trailer.unitNumber || '',
                        unitNumber: trailer.unitNumber || trailer.trailer || '',
                        plateNumber: trailer.plateNumber || '',
                        type: trailer.type || '',
                        ownership: trailer.ownership || trailer.ownerShip || 'COMPANY ASSET',
                        lastDispatch: trailer.lastDispatch || '',
                        lastDispatchDate: trailer.lastDispatchDate ? new Date(trailer.lastDispatchDate).toLocaleDateString() : '',
                        lastDropLocation: trailer.lastDropLocation || '',
                        notes: trailer.notes || trailer.note || '',
                        note: trailer.note || trailer.notes || '',
                        operatingStatus: (trailer.operationStatus || trailer.operatingStatus || 'IN SERVICE') as 'IN SERVICE' | 'OUT OF SERVICE' | 'MAINTENANCE',
                        loadedStatus: (trailer.loadedStatus || 'IDLE') as 'LOADED' | 'IDLE' | 'SCHEDULED',
                        compliance: (trailer.compliance || 'COMPLIANT') as 'COMPLIANT' | 'NON-COMPLIANT' | 'EXPIRING SOON',
                        category: trailer.category,
                        imageUrl: trailer.imageUrl || trailer.trailerImageUrl,
                        make: trailer.make,
                        model: trailer.model,
                        year: trailer.year,
                        vinNumber: trailer.vinNumber,
                        status: trailer.status,
                        yard: trailer.yard || null
                    }));
                    setTrailers(transformedTrailers);
                }
            } catch (error) {
                console.error('Error fetching trailers:', error);
                alert('Failed to fetch trailers. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchTrailers();
    }, [activeTab, assignedTrailerIds]);

    // Fetch drivers from API
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const response = await getAllDrivers(1, 1000, '', 'active');
                if (response?.success && response?.data) {
                    setDrivers(response.data);
                } else if (response?.data && Array.isArray(response.data)) {
                    setDrivers(response.data);
                }
            } catch (error) {
                console.error('Error fetching drivers:', error);
            }
        };
        fetchDrivers();

        const fetchYards = async () => {
            try {
                const response = await getAllYards();
                if (response.success) {
                    setYards(response.data || []);
                }
            } catch (error) {
                console.error('Error fetching yards:', error);
            }
        };
        fetchYards();
    }, []);

    // Track which counts have been fetched to avoid redundant API calls
    const [fetchedCounts, setFetchedCounts] = useState<Set<string>>(new Set(['All']));

    // Function to fetch count for a specific tab
    const fetchTabCount = async (tabId: string) => {
        // Skip if already fetched
        if (fetchedCounts.has(tabId)) {
            return;
        }

        try {
            let count = 0;
            
            if (tabId === 'All') {
                const response = await getAllTrailers(1, 1);
                count = response?.pagination?.total || 0;
            } else if (tabId === 'External') {
                const response = await getAllTrailers(1, 1, undefined, undefined, undefined, undefined, undefined, 'THIRD PARTY ASSET');
                count = response?.pagination?.total || 0;
            } else if (tabId === 'Unassigned') {
                // For unassigned, we need to fetch all and filter
                const response = await getAllTrailers(1, 1000);
                if (response?.success && response?.data) {
                    count = response.data.filter((trailer: any) => 
                        !assignedTrailerIds.has(trailer._id)
                    ).length;
                }
            } else {
                // Yard-specific count
                const response = await getAllTrailers(1, 1, undefined, undefined, undefined, undefined, tabId);
                count = response?.pagination?.total || 0;
            }
            
            setYardCounts(prev => ({ ...prev, [tabId]: count }));
            setFetchedCounts(prev => new Set([...prev, tabId]));
            
            console.log(`✅ Fetched count for tab "${tabId}":`, count);
        } catch (error) {
            console.error(`Error fetching count for tab "${tabId}":`, error);
        }
    };

    // Fetch only "All" count on initial load
    useEffect(() => {
        const fetchInitialCount = async () => {
            try {
                const allResponse = await getAllTrailers(1, 1);
                const allCount = allResponse?.pagination?.total || 0;
                setYardCounts({ 'All': allCount });
                console.log('✅ Initial "All" count fetched:', allCount);
            } catch (error) {
                console.error('Error fetching initial count:', error);
            }
        };

        if (yards.length > 0) {
            fetchInitialCount();
        }
    }, [yards]);

    // Inspection handlers
    const handleEditInspection = (inspection: any, type: 'oneTime' | 'recurring') => {
        setEditingInspectionId(inspection.id);
        setEditingInspectionType(type);
        
        if (type === 'oneTime') {
            setInspectionType('One Time');
            setInspectionForm({
                expiryDate: inspection.expiryDate,
                description: inspection.description,
                ignoreExpiration: inspection.ignoreExpiration,
                scheduledOn: '',
                after: '',
                unit: '',
                file: inspection.file || null
            });
        } else {
            setInspectionType('Recurring');
            setInspectionForm({
                expiryDate: '',
                description: inspection.description,
                ignoreExpiration: inspection.ignoreExpiration,
                scheduledOn: inspection.scheduledOn,
                after: inspection.after,
                unit: inspection.unit,
                file: inspection.file || null
            });
        }
    };

    const handleDeleteInspection = (id: string, type: 'oneTime' | 'recurring') => {
        if (type === 'oneTime') {
            setOneTimeInspections(oneTimeInspections.filter(insp => insp.id !== id));
        } else {
            setRecurringInspections(recurringInspections.filter(insp => insp.id !== id));
        }
        if (editingInspectionId === id) {
            setEditingInspectionId(null);
            setEditingInspectionType(null);
            setInspectionForm({
                expiryDate: '',
                description: '',
                ignoreExpiration: false,
                scheduledOn: '',
                after: '',
                unit: '',
                file: null
            });
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleCancelEditInspection = () => {
        setEditingInspectionId(null);
        setEditingInspectionType(null);
        setInspectionForm({
            expiryDate: '',
            description: '',
            ignoreExpiration: false,
            scheduledOn: '',
            after: '',
            unit: '',
            file: null
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Document handlers
    const handleEditDocument = (doc: any, docType: string) => {
        setEditingDocumentId(doc.id);
        setEditingDocumentType(docType);
        setDocumentForm({
            expiryDate: doc.expiryDate,
            description: doc.description,
            file: doc.file || null,
            ignoreExpiration: doc.ignoreExpiration
        });
    };

    const handleSaveDocument = () => {
        if (!documentForm.description) {
            alert('Please enter a description');
            return;
        }

        if (editingDocumentId && editingDocumentType) {
            // Update existing document
            setDocuments(prev => ({
                ...prev,
                [editingDocumentType]: prev[editingDocumentType].map(doc =>
                    doc.id === editingDocumentId
                        ? {
                            ...doc,
                            expiryDate: documentForm.expiryDate,
                            description: documentForm.description,
                            ignoreExpiration: documentForm.ignoreExpiration,
                            file: documentForm.file || doc.file,
                            fileName: documentForm.file?.name || doc.fileName
                        }
                        : doc
                )
            }));
            setEditingDocumentId(null);
            setEditingDocumentType(null);
        } else {
            // Add new document
            const newDoc = {
                id: Date.now().toString(),
                expiryDate: documentForm.expiryDate,
                description: documentForm.description,
                file: documentForm.file,
                fileName: documentForm.file?.name,
                ignoreExpiration: documentForm.ignoreExpiration,
                isExisting: false
            };
            setDocuments(prev => ({
                ...prev,
                [documentType]: [...prev[documentType], newDoc]
            }));
        }

        setDocumentForm({
            expiryDate: '',
            description: '',
            file: null,
            ignoreExpiration: false
        });
        if (documentFileInputRef.current) {
            documentFileInputRef.current.value = '';
        }
    };

    const handleDeleteDocument = (docId: string, docType: string) => {
        setDocuments(prev => ({
            ...prev,
            [docType]: prev[docType].filter(doc => doc.id !== docId)
        }));
        if (editingDocumentId === docId) {
            setEditingDocumentId(null);
            setEditingDocumentType(null);
            setDocumentForm({
                expiryDate: '',
                description: '',
                file: null,
                ignoreExpiration: false
            });
            if (documentFileInputRef.current) {
                documentFileInputRef.current.value = '';
            }
        }
    };

    const handleCancelEditDocument = () => {
        setEditingDocumentId(null);
        setEditingDocumentType(null);
        setDocumentForm({
            expiryDate: '',
            description: '',
            file: null,
            ignoreExpiration: false
        });
        if (documentFileInputRef.current) {
            documentFileInputRef.current.value = '';
        }
    };

    // Incident handlers
    const handleEditIncident = (incident: any) => {
        setEditingIncidentId(incident.id);
        setIncidentForm({
            accidentNumber: incident.accidentNumber,
            driver: incident.driver,
            coDriver: incident.coDriver,
            location: incident.location,
            date: incident.date,
            time: incident.time,
            weather: incident.weather,
            policeReport: incident.policeReport,
            accidentReport: incident.accidentReport,
            thirdPartyInfo: incident.thirdPartyInfo,
            files: incident.files || []
        });
    };

    const handleSaveIncident = () => {
        if (!incidentForm.accidentNumber || !incidentForm.location || !incidentForm.date) {
            alert('Please fill in required fields: Accident Number, Location, and Date');
            return;
        }

        if (editingIncidentId) {
            // Update existing incident
            setIncidents(prev => prev.map(inc =>
                inc.id === editingIncidentId
                    ? { ...inc, ...incidentForm }
                    : inc
            ));
            setEditingIncidentId(null);
        } else {
            // Add new incident
            setIncidents([...incidents, {
                id: Date.now().toString(),
                ...incidentForm
            }]);
        }

        setIncidentForm({
            accidentNumber: '',
            driver: '',
            coDriver: '',
            location: '',
            date: '',
            time: '',
            weather: '',
            policeReport: '',
            accidentReport: '',
            thirdPartyInfo: '',
            files: []
        });
        if (incidentFileInputRef.current) {
            incidentFileInputRef.current.value = '';
        }
    };

    const handleDeleteIncident = (incidentId: string) => {
        setIncidents(prev => prev.filter(inc => inc.id !== incidentId));
        if (editingIncidentId === incidentId) {
            setEditingIncidentId(null);
            setIncidentForm({
                accidentNumber: '',
                driver: '',
                coDriver: '',
                location: '',
                date: '',
                time: '',
                weather: '',
                policeReport: '',
                accidentReport: '',
                thirdPartyInfo: '',
                files: []
            });
            if (incidentFileInputRef.current) {
                incidentFileInputRef.current.value = '';
            }
        }
    };

    const handleCancelEditIncident = () => {
        setEditingIncidentId(null);
        setIncidentForm({
            accidentNumber: '',
            driver: '',
            coDriver: '',
            location: '',
            date: '',
            time: '',
            weather: '',
            policeReport: '',
            accidentReport: '',
            thirdPartyInfo: '',
            files: []
        });
        if (incidentFileInputRef.current) {
            incidentFileInputRef.current.value = '';
        }
    };

    // Handle create/update trailer
    // Validate required fields
    const validateTrailerForm = (): boolean => {
        const errors: string[] = [];
        
        if (!formData.unitNumber.trim()) errors.push('Unit # is required');
        if (!formData.plateNumber.trim()) errors.push('Plate # is required');
        if (!formData.vinNumber.trim()) errors.push('VIN is required');
        if (!formData.make.trim()) errors.push('Make is required');
        if (!formData.model.trim()) errors.push('Model is required');
        if (!formData.year.trim()) errors.push('Year is required');
        if (!formData.type.trim()) errors.push('Type is required');
        if (!formData.registrationCountry.trim()) errors.push('Registration Country is required');
        if (!formData.ownership.trim()) errors.push('Ownership is required');
        if (!formData.weight || formData.weight === '0') errors.push('Weight is required');
        
        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleSaveTrailer = async () => {
        // Validate before saving
        if (!validateTrailerForm()) {
            return;
        }

        setLoading(true);
        try {
            const formDataToSend = new FormData();
            
            if (editingId && originalTrailerData) {
                // Partial update - only send changed fields
                if (formData.unitNumber !== originalTrailerData.unitNumber) {
                    formDataToSend.append('unitNumber', formData.unitNumber);
                    formDataToSend.append('trailer', formData.unitNumber);
                }
                if (formData.vinNumber !== originalTrailerData.vinNumber) {
                    formDataToSend.append('vinNumber', formData.vinNumber);
                }
                if (formData.plateNumber !== originalTrailerData.plateNumber) {
                    formDataToSend.append('plateNumber', formData.plateNumber);
                }
                if (formData.make !== originalTrailerData.make) {
                    formDataToSend.append('make', formData.make || '');
                }
                if (formData.model !== originalTrailerData.model) {
                    formDataToSend.append('model', formData.model || '');
                }
                if (formData.year !== originalTrailerData.year) {
                    formDataToSend.append('year', formData.year || '');
                }
                if (formData.weight !== originalTrailerData.weight) {
                    formDataToSend.append('weight', formData.weight || '0');
                }
                if (formData.uom !== originalTrailerData.uom) {
                    formDataToSend.append('uom', formData.uom || 'Kg');
                }
                if (formData.registrationCountry !== originalTrailerData.registrationCountry) {
                    formDataToSend.append('registrationCountry', formData.registrationCountry || '');
                }
                if (formData.registrationProvince !== originalTrailerData.registrationProvince) {
                    formDataToSend.append('registrationProvince', formData.registrationProvince || '');
                }
                if (formData.type !== originalTrailerData.type) {
                    formDataToSend.append('type', formData.type || '');
                }
                if (formData.status !== originalTrailerData.status) {
                    formDataToSend.append('status', formData.status || 'In Service');
                    formDataToSend.append('operationStatus', formData.status === 'In Service' ? 'IN SERVICE' : formData.status === 'Out of Service' ? 'OUT OF SERVICE' : 'MAINTENANCE');
                }
                if (formData.ownership !== originalTrailerData.ownership) {
                    formDataToSend.append('ownership', formData.ownership || 'COMPANY ASSET');
                }
                if (formData.subType !== originalTrailerData.subType) {
                    formDataToSend.append('subType', formData.subType || '');
                }
                if (formData.yard !== originalTrailerData.yard) {
                    formDataToSend.append('yard', formData.yard || '');
                }
                
                if (selectedImageFile) {
                    formDataToSend.append('image', selectedImageFile);
                }
            } else {
                // Create new trailer - send all fields
                formDataToSend.append('unitNumber', formData.unitNumber);
                formDataToSend.append('trailer', formData.unitNumber);
                formDataToSend.append('vinNumber', formData.vinNumber);
                formDataToSend.append('plateNumber', formData.plateNumber);
                formDataToSend.append('make', formData.make || '');
                formDataToSend.append('model', formData.model || '');
                formDataToSend.append('year', formData.year || '');
                formDataToSend.append('weight', formData.weight || '0');
                formDataToSend.append('uom', formData.uom || 'Kg');
                formDataToSend.append('registrationCountry', formData.registrationCountry || '');
                formDataToSend.append('registrationProvince', formData.registrationProvince || '');
                formDataToSend.append('type', formData.type || '');
                formDataToSend.append('status', formData.status || 'In Service');
                formDataToSend.append('ownership', formData.ownership || 'COMPANY ASSET');
                formDataToSend.append('subType', formData.subType || '');
                formDataToSend.append('yard', formData.yard || '');
                formDataToSend.append('operationStatus', formData.status === 'In Service' ? 'IN SERVICE' : formData.status === 'Out of Service' ? 'OUT OF SERVICE' : 'MAINTENANCE');
                
                if (selectedImageFile) {
                    formDataToSend.append('image', selectedImageFile);
                }
            }

            // Append inspection files and data
            console.log('📋 [FRONTEND] Preparing inspections for save:', {
                oneTimeInspections: oneTimeInspections.length,
                recurringInspections: recurringInspections.length
            });

            // Process one-time inspections
            oneTimeInspections.forEach((inspection, index) => {
                if (inspection.file && inspection.file instanceof File) {
                    console.log(`📎 [FRONTEND] Appending oneTimeInspectionFile ${index}:`, inspection.file.name);
                    formDataToSend.append('oneTimeInspectionFiles', inspection.file);
                }
            });

            // Process recurring inspections
            recurringInspections.forEach((inspection, index) => {
                if (inspection.file && inspection.file instanceof File) {
                    console.log(`📎 [FRONTEND] Appending recurringInspectionFile ${index}:`, inspection.file.name);
                    formDataToSend.append('recurringInspectionFiles', inspection.file);
                }
            });

            // Append inspection metadata (without File objects)
            const oneTimeInspectionsData = oneTimeInspections.map((insp) => ({
                expiryDate: insp.expiryDate,
                description: insp.description,
                ignoreExpiration: insp.ignoreExpiration,
                fileName: insp.fileName,
                fileUrl: insp.fileUrl,
                hasFile: insp.file instanceof File ? true : false
            }));

            const recurringInspectionsData = recurringInspections.map((insp) => ({
                scheduledOn: insp.scheduledOn,
                after: insp.after,
                unit: insp.unit,
                description: insp.description,
                ignoreExpiration: insp.ignoreExpiration,
                fileName: insp.fileName,
                fileUrl: insp.fileUrl,
                hasFile: insp.file instanceof File ? true : false
            }));

            formDataToSend.append('oneTimeInspections', JSON.stringify(oneTimeInspectionsData));
            formDataToSend.append('recurringInspections', JSON.stringify(recurringInspectionsData));

            // Append incidents files and data
            incidents.forEach((incident, index) => {
                if (incident.files && incident.files.length > 0) {
                    incident.files.forEach((file) => {
                        formDataToSend.append(`incidentFiles_${index}`, file);
                    });
                }
            });

            const incidentsData = incidents.map((inc) => ({
                accidentNumber: inc.accidentNumber,
                driver: inc.driver || null,
                coDriver: inc.coDriver || null,
                location: inc.location,
                date: inc.date,
                time: inc.time,
                weather: inc.weather,
                policeReport: inc.policeReport,
                accidentReport: inc.accidentReport,
                thirdPartyInfo: inc.thirdPartyInfo,
                fileCount: inc.files?.length || 0,
                fileNames: inc.files?.map(f => f.name) || []
            }));

            formDataToSend.append('incidents', JSON.stringify(incidentsData));

            // Append notes
            const notesData = notes.map((note) => ({
                note: note.note,
                category: note.category
            }));
            formDataToSend.append('notesArray', JSON.stringify(notesData));

            console.log('📦 [FRONTEND] Sending to backend:', {
                oneTimeInspections: oneTimeInspectionsData,
                recurringInspections: recurringInspectionsData,
                incidents: incidentsData,
                notes: notesData
            });

            let response;
            if (editingId) {
                response = await updateTrailer(editingId, formDataToSend);
            } else {
                response = await createTrailer(formDataToSend);
            }

            if (response?.success) {
                // Get trailer ID - handle both create and update scenarios
                let trailerId = editingId;
                if (!trailerId) {
                    // For new trailers, get ID from response
                    trailerId = response.data?._id || response.data?._id || response.data?.id;
                }
                
                console.log('💾 Saving trailer, ID:', trailerId);
                
                // Save documents if trailer was created/updated successfully
                if (trailerId) {
                    // Separate new documents and existing documents that need updates
                    const newDocuments: Array<{ type: string; doc: any }> = [];
                    const updatedDocuments: Array<{ type: string; doc: any }> = [];
                    
                    Object.keys(documents).forEach((docType) => {
                        documents[docType].forEach((doc) => {
                            if (!doc.isExisting) {
                                // New documents - create them
                                newDocuments.push({ type: docType, doc });
                            } else if (doc._id) {
                                // Existing documents - update them if they have changes
                                updatedDocuments.push({ type: docType, doc });
                            }
                        });
                    });

                    console.log('📄 New documents to create:', newDocuments.length);
                    console.log('📄 Existing documents to update:', updatedDocuments.length);

                    // Create new documents
                    if (newDocuments.length > 0) {
                        try {
                            await Promise.all(newDocuments.map(async ({ type, doc }) => {
                                const docFormData = new FormData();
                                docFormData.append('trailerId', trailerId.toString());
                                docFormData.append('assetType', 'trailer');
                                docFormData.append('documentType', type);
                                docFormData.append('documentNumber', doc.description || '');
                                if (doc.expiryDate) {
                                    docFormData.append('expiryDate', doc.expiryDate);
                                }
                                if (doc.file) {
                                    docFormData.append('file', doc.file);
                                }
                                
                                console.log('📤 Creating document:', { type, description: doc.description, hasFile: !!doc.file });
                                const docResponse = await createVehicleDocument(docFormData);
                                if (!docResponse?.success) {
                                    console.error('❌ Error creating document:', docResponse);
                                } else {
                                    console.log('✅ Document created successfully');
                                }
                            }));
                        } catch (docError) {
                            console.error('❌ Error creating documents:', docError);
                        }
                    }

                    // Update existing documents
                    if (updatedDocuments.length > 0) {
                        try {
                            await Promise.all(updatedDocuments.map(async ({ type, doc }) => {
                                const docFormData = new FormData();
                                // Always include required fields for update
                                docFormData.append('trailerId', trailerId.toString());
                                docFormData.append('assetType', 'trailer');
                                docFormData.append('documentType', type);
                                docFormData.append('documentNumber', doc.description || '');
                                
                                // Include expiryDate if it exists
                                if (doc.expiryDate) {
                                    docFormData.append('expiryDate', doc.expiryDate);
                                } else {
                                    // If no expiry date, send empty string to clear it
                                    docFormData.append('expiryDate', '');
                                }
                                
                                // Only append file if a new file was selected (doc.file is a File object)
                                if (doc.file && doc.file instanceof File) {
                                    docFormData.append('file', doc.file);
                                    console.log('📎 Including new file in update:', doc.file.name);
                                }
                                
                                // Log FormData contents for debugging
                                const formDataEntries: string[] = [];
                                for (const [key, value] of docFormData.entries()) {
                                    if (value instanceof File) {
                                        formDataEntries.push(`${key}: File(${value.name}, ${value.size} bytes)`);
                                    } else {
                                        formDataEntries.push(`${key}: ${value}`);
                                    }
                                }
                                console.log('📤 Updating document payload:', { id: doc._id, type, entries: formDataEntries });
                                
                                const docResponse = await updateVehicleDocument(doc._id!, docFormData);
                                if (!docResponse?.success) {
                                    console.error('❌ Error updating document:', docResponse);
                                } else {
                                    console.log('✅ Document updated successfully');
                                }
                            }));
                        } catch (docError) {
                            console.error('❌ Error updating documents:', docError);
                        }
                    }
                }
                
                setShowSidebar(false);
                setEditingId(null);
                setFormData({
                    unitNumber: '',
                    vinNumber: '',
                    plateNumber: '',
                    make: '',
                    model: '',
                    year: '',
                    weight: '0',
                    registrationCountry: '',
                    registrationProvince: '',
                    type: '',
                    uom: 'Kg',
                    status: 'In Service',
                    ownership: 'COMPANY ASSET',
                    subType: '',
                    yard: ''
                });
                setSelectedImage(null);
                setSelectedImageFile(null);
                setOriginalTrailerData(null);
                setDocuments({
                    General: [],
                    Ownership: [],
                    Plate: [],
                    Safety: [],
                    Insurance: []
                });
                // Clear inspection state
                setOneTimeInspections([]);
                setRecurringInspections([]);
                setInspectionForm({
                    expiryDate: '',
                    description: '',
                    ignoreExpiration: false,
                    scheduledOn: '',
                    after: '',
                    unit: '',
                    file: null
                });
                setEditingInspectionId(null);
                setEditingInspectionType(null);
                // Refresh trailers list with current filter (same logic as fetchTrailers)
                let yardFilter: string | undefined = undefined;
                let ownershipFilter: string | undefined = undefined;
                if (activeTab === 'All') {
                    // No filters
                } else if (activeTab === 'External') {
                    ownershipFilter = 'THIRD PARTY ASSET';
                } else if (activeTab === 'Unassigned') {
                    // No filters, will filter on frontend
                } else {
                    // Yard filter - activeTab is a yard ID
                    yardFilter = activeTab;
                }
                const trailersResponse = await getAllTrailers(1, 1000, undefined, undefined, undefined, undefined, yardFilter, ownershipFilter);
                if (trailersResponse?.success && trailersResponse?.data) {
                    const transformedTrailers = trailersResponse.data.map((trailer: any) => ({
                        _id: trailer._id,
                        id: trailer._id,
                        trailerNumber: trailer.trailer || trailer.unitNumber || '',
                        trailer: trailer.trailer || trailer.unitNumber || '',
                        unitNumber: trailer.unitNumber || trailer.trailer || '',
                        plateNumber: trailer.plateNumber || '',
                        type: trailer.type || '',
                        ownership: trailer.ownership || trailer.ownerShip || 'COMPANY ASSET',
                        lastDispatch: trailer.lastDispatch || '',
                        lastDispatchDate: trailer.lastDispatchDate ? new Date(trailer.lastDispatchDate).toLocaleDateString() : '',
                        lastDropLocation: trailer.lastDropLocation || '',
                        notes: trailer.notes || trailer.note || '',
                        operatingStatus: trailer.operationStatus || 'IN SERVICE',
                        loadedStatus: trailer.loadedStatus || 'IDLE',
                        compliance: trailer.compliance || 'COMPLIANT',
                        category: trailer.category,
                        imageUrl: trailer.imageUrl || trailer.trailerImageUrl,
                        yard: trailer.yard || null
                    }));
                    setTrailers(transformedTrailers);
                    // Refresh count for current tab and All tab
                    setFetchedCounts(prev => {
                        const updated = new Set(prev);
                        updated.delete(activeTab);
                        updated.delete('All');
                        return updated;
                    });
                    fetchTabCount('All');
                    if (activeTab !== 'All') {
                        fetchTabCount(activeTab);
                    }
                }
            } else {
                alert(response?.message || 'Failed to save trailer. Please try again.');
            }
        } catch (error) {
            console.error('Error saving trailer:', error);
            alert('Failed to save trailer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle delete click - show confirmation modal
    const handleDeleteClick = (id: string) => {
        setDeleteTargetId(id);
        setShowDeleteConfirmation(true);
    };

    // Handle delete trailer after confirmation
    const handleDeleteTrailer = async () => {
        if (!deleteTargetId) return;
        
        setShowDeleteConfirmation(false);
        setLoading(true);
        try {
            const response = await deleteTrailer(deleteTargetId);
            if (response?.success) {
                setTrailers(trailers.filter(t => (t._id || t.id) !== deleteTargetId));
                // Refresh count for current tab and All tab
                setFetchedCounts(prev => {
                    const updated = new Set(prev);
                    updated.delete(activeTab);
                    updated.delete('All');
                    return updated;
                });
                fetchTabCount('All');
                if (activeTab !== 'All') {
                    fetchTabCount(activeTab);
                }
            } else {
                alert(response?.message || 'Failed to delete trailer. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting trailer:', error);
            alert('Failed to delete trailer. Please try again.');
        } finally {
            setLoading(false);
            setDeleteTargetId(null);
        }
    };

    // Handle edit trailer
    const handleEditTrailer = async (id: string) => {
        setLoading(true);
        try {
            const response = await getTrailerById(id);
            if (response?.success && response?.data) {
                const trailer = response.data;
                const trailerFormData = {
                    unitNumber: trailer.unitNumber || trailer.trailer || '',
                    vinNumber: trailer.vinNumber || '',
                    plateNumber: trailer.plateNumber || '',
                    make: trailer.make || '',
                    model: trailer.model || '',
                    year: trailer.year || '',
                    weight: trailer.weight || '0',
                    registrationCountry: trailer.registrationCountry || '',
                    registrationProvince: trailer.registrationProvince || '',
                    type: trailer.type || '',
                    uom: trailer.uom || 'Kg',
                    status: trailer.status || 'In Service',
                    ownership: trailer.ownership || trailer.ownerShip || 'COMPANY ASSET',
                    subType: trailer.subType || '',
                    yard: trailer.yard || ''
                };
                
                setFormData(trailerFormData);
                // Store original data for partial updates
                setOriginalTrailerData(trailerFormData);
                // Use signed URL from backend
                setSelectedImage(trailer.imageUrl || trailer.trailerImageUrl || null);
                // Reset selectedImageFile when loading existing trailer (so we only upload if user selects new image)
                setSelectedImageFile(null);
                setEditingId(id);
                
                // Load documents from trailer response (documents are now included in getTrailerById)
                try {
                    const trailerDocuments = trailer.documents || [];
                    console.log('📥 Documents from trailer response:', trailerDocuments.length);
                    
                    if (Array.isArray(trailerDocuments) && trailerDocuments.length > 0) {
                        const docsByType: Record<string, Array<any>> = {
                            General: [],
                            Ownership: [],
                            Plate: [],
                            Safety: [],
                            Insurance: []
                        };
                        
                        // Process documents with signed URLs (already signed by backend)
                        for (const doc of trailerDocuments) {
                            const docType = doc.documentType || 'General';
                            // Map document types to match frontend categories
                            const mappedType = docType === 'General' || docType === 'Ownership' || docType === 'Plate' || docType === 'Safety' || docType === 'Insurance' 
                                ? docType 
                                : 'General';
                            
                            if (mappedType in docsByType) {
                                // Get file URL - use signed URL from backend (already signed)
                                let fileUrl = doc.files?.[0]?.fileUrl || doc.documentLocation || null;
                                let fileName = doc.files?.[0]?.fileName || 'Document';
                                
                                docsByType[mappedType].push({
                                    id: doc._id || `existing-${doc._id}`,
                                    _id: doc._id,
                                    expiryDate: doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : '',
                                    description: doc.documentNumber || doc.documentType || doc.description || '',
                                    file: null, // No file object for existing documents
                                    fileUrl: fileUrl,
                                    fileName: fileName,
                                    ignoreExpiration: false,
                                    isExisting: true
                                });
                            }
                        }
                        
                        console.log('📋 Loaded documents by type:', docsByType);
                        console.log('📊 Document counts:', {
                            General: docsByType.General.length,
                            Ownership: docsByType.Ownership.length,
                            Plate: docsByType.Plate.length,
                            Safety: docsByType.Safety.length,
                            Insurance: docsByType.Insurance.length
                        });
                        setDocuments(docsByType);
                    } else {
                        console.log('⚠️ No documents found in trailer response');
                        // Reset documents if none found
                        setDocuments({
                            General: [],
                            Ownership: [],
                            Plate: [],
                            Safety: [],
                            Insurance: []
                        });
                    }
                } catch (docError) {
                    console.error('❌ Error loading documents:', docError);
                    // Reset documents on error
                    setDocuments({
                        General: [],
                        Ownership: [],
                        Plate: [],
                        Safety: [],
                        Insurance: []
                    });
                }
                
                // Load inspections from trailer response
                console.log('📋 [FRONTEND] Loading inspections from trailer:', {
                    oneTimeInspections: trailer.oneTimeInspections?.length || 0,
                    recurringInspections: trailer.recurringInspections?.length || 0
                });

                if (trailer.oneTimeInspections && Array.isArray(trailer.oneTimeInspections)) {
                    const loadedOneTimeInspections = trailer.oneTimeInspections.map((insp: any) => ({
                        id: insp._id || Date.now().toString(),
                        expiryDate: insp.expiryDate ? new Date(insp.expiryDate).toISOString().split('T')[0] : '',
                        description: insp.description || '',
                        ignoreExpiration: insp.ignoreExpiration || false,
                        file: null,
                        fileUrl: insp.fileUrl || null,
                        fileName: insp.fileName || null,
                        isExisting: true
                    }));
                    setOneTimeInspections(loadedOneTimeInspections);
                    console.log('✅ Loaded one-time inspections:', loadedOneTimeInspections);
                } else {
                    setOneTimeInspections([]);
                }

                if (trailer.recurringInspections && Array.isArray(trailer.recurringInspections)) {
                    const loadedRecurringInspections = trailer.recurringInspections.map((insp: any) => ({
                        id: insp._id || Date.now().toString(),
                        scheduledOn: insp.scheduledOn ? new Date(insp.scheduledOn).toISOString().split('T')[0] : '',
                        after: insp.after || '',
                        unit: insp.unit || '',
                        description: insp.description || '',
                        ignoreExpiration: insp.ignoreExpiration || false,
                        file: null,
                        fileUrl: insp.fileUrl || null,
                        fileName: insp.fileName || null,
                        isExisting: true
                    }));
                    setRecurringInspections(loadedRecurringInspections);
                    console.log('✅ Loaded recurring inspections:', loadedRecurringInspections);
                } else {
                    setRecurringInspections([]);
                }
                
                setShowSidebar(true);
                setActiveStep('Details');
            } else {
                alert('Failed to load trailer data. Please try again.');
            }
        } catch (error) {
            console.error('Error loading trailer:', error);
            alert('Failed to load trailer data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get filtered trailers
    const getFilteredTrailers = () => {
        let filtered = [...trailers];

        // Backend already handles yard and ownership filtering
        // Only apply client-side filtering for Unassigned
        if (activeTab === 'Unassigned') {
            // Filter trailers that are not assigned to any active order
            filtered = filtered.filter(trailer => !assignedTrailerIds.has(trailer._id || trailer.id || ''));
        }

        // Filter by search term (Unit #, Plate #, Make, VIN)
        if (searchTerm) {
            filtered = filtered.filter(trailer =>
                (trailer.trailerNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (trailer.plateNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by compliance status
        if (complianceStatus !== 'All') {
            filtered = filtered.filter(trailer => {
                if (complianceStatus === 'Compliant') return trailer.compliance === 'COMPLIANT';
                if (complianceStatus === 'Non-Compliant') return trailer.compliance === 'NON-COMPLIANT';
                if (complianceStatus === 'Expiring Soon') return trailer.compliance === 'EXPIRING SOON';
                return true;
            });
        }

        // Filter by operating status
        if (operatingStatus !== 'Active' && operatingStatus !== 'All') {
            filtered = filtered.filter(trailer => {
                if (operatingStatus === 'In Service') return trailer.operatingStatus === 'IN SERVICE';
                if (operatingStatus === 'Out of Service') return trailer.operatingStatus === 'OUT OF SERVICE';
                if (operatingStatus === 'Maintenance') return trailer.operatingStatus === 'MAINTENANCE';
                return true;
            });
        } else if (operatingStatus === 'Active') {
            filtered = filtered.filter(trailer => trailer.operatingStatus === 'IN SERVICE');
        }

        // Apply column filters
        if (filters.trailerNumber) {
            filtered = filtered.filter(t => (t.trailerNumber || '').toLowerCase().includes(filters.trailerNumber.toLowerCase()));
        }
        if (filters.plateNumber) {
            filtered = filtered.filter(t => (t.plateNumber || '').toLowerCase().includes(filters.plateNumber.toLowerCase()));
        }
        if (filters.type) {
            filtered = filtered.filter(t => (t.type || '').toLowerCase().includes(filters.type.toLowerCase()));
        }
        if (filters.ownership !== 'All') {
            filtered = filtered.filter(t => t.ownership === filters.ownership);
        }
        if (filters.lastDispatch) {
            filtered = filtered.filter(t => (t.lastDispatch || '').toLowerCase().includes(filters.lastDispatch.toLowerCase()));
        }
        if (filters.lastDispatchDate) {
            filtered = filtered.filter(t => {
                const dateStr = typeof t.lastDispatchDate === 'string' ? t.lastDispatchDate : (t.lastDispatchDate ? t.lastDispatchDate.toString() : '');
                return dateStr.toLowerCase().includes(filters.lastDispatchDate.toLowerCase());
            });
        }
        if (filters.lastDropLocation) {
            filtered = filtered.filter(t => (t.lastDropLocation || '').toLowerCase().includes(filters.lastDropLocation.toLowerCase()));
        }
        if (filters.notes) {
            filtered = filtered.filter(t => (t.notes || '').toLowerCase().includes(filters.notes.toLowerCase()));
        }
        if (filters.operatingStatus !== 'All') {
            filtered = filtered.filter(t => t.operatingStatus === filters.operatingStatus);
        }
        if (filters.loadedStatus !== 'All') {
            filtered = filtered.filter(t => t.loadedStatus === filters.loadedStatus);
        }
        if (filters.compliance !== 'All') {
            filtered = filtered.filter(t => t.compliance === filters.compliance);
        }

        // Sort
        if (sortConfig.key) {
            filtered = [...filtered].sort((a, b) => {
                const aValue = a[sortConfig.key!] ?? '';
                const bValue = b[sortConfig.key!] ?? '';

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    };

    const filteredTrailers = getFilteredTrailers();

    // Count trailers by category
    const getCountByCategory = (category: string) => {
        // For yard tabs, use the yardCounts
        if (yardCounts[category] !== undefined) {
            return yardCounts[category];
        }
        // For legacy category tabs (MB, AB, TX, etc.)
        if (category === 'All') return trailers.length;
        return trailers.filter(t => t.category === category).length;
    };

    const handleSort = (key: keyof Trailer) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key: keyof Trailer) => {
        if (sortConfig.key !== key) {
            return (
                <div className="flex flex-col">
                    <ChevronUp className="w-3 h-3 text-gray-400" />
                    <ChevronDown className="w-3 h-3 text-gray-400 -mt-1" />
                </div>
            );
        }
        return sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-gray-700" />
        ) : (
            <ChevronDown className="w-3 h-3 text-gray-700" />
        );
    };

    const getStatusBadgeColor = (status: string, type: 'operating' | 'loaded' | 'compliance') => {
        if (type === 'operating') {
            if (status === 'IN SERVICE') return 'bg-green-500 text-white';
            if (status === 'OUT OF SERVICE') return 'bg-red-500 text-white';
            if (status === 'MAINTENANCE') return 'bg-yellow-500 text-white';
        }
        if (type === 'loaded') {
            if (status === 'LOADED') return 'bg-green-500 text-white';
            if (status === 'IDLE') return 'bg-gray-500 text-white';
            if (status === 'SCHEDULED') return 'bg-orange-500 text-white';
        }
        if (type === 'compliance') {
            if (status === 'COMPLIANT') return 'bg-green-500 text-white';
            if (status === 'NON-COMPLIANT') return 'bg-red-500 text-white';
            if (status === 'EXPIRING SOON') return 'bg-yellow-500 text-white';
        }
        return 'bg-gray-500 text-white';
    };

    // Navigation helper functions for sidebar steps
    const steps: Array<'Details' | 'Inspections' | 'Documents' | 'Incidents' | 'Notes'> = ['Details', 'Inspections', 'Documents', 'Incidents', 'Notes'];
    
    const getNextStep = () => {
        const currentIndex = steps.indexOf(activeStep);
        if (currentIndex < steps.length - 1) {
            return steps[currentIndex + 1];
        }
        return null;
    };

    const getPreviousStep = () => {
        const currentIndex = steps.indexOf(activeStep);
        if (currentIndex > 0) {
            return steps[currentIndex - 1];
        }
        return null;
    };

    const handleNext = () => {
        const next = getNextStep();
        if (next) {
            setActiveStep(next);
        }
    };

    const handlePrevious = () => {
        const previous = getPreviousStep();
        if (previous) {
            setActiveStep(previous);
        }
    };

    return (
        <div className="min-h-screen bg-[#EDF8FF] p-6">
            <div className="max-w-full mx-auto">
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">Trailers</h1>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-bold text-gray-700">({filteredTrailers.length})</span>
                            <button className="text-gray-600 hover:text-gray-900 transition-colors">
                                <Upload className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({
                                        unitNumber: '',
                                        vinNumber: '',
                                        plateNumber: '',
                                        make: '',
                                        model: '',
                                        year: '',
                                        weight: '0',
                                        registrationCountry: '',
                                        registrationProvince: '',
                                        type: '',
                                        uom: 'Kg',
                                        status: 'In Service',
                                        ownership: 'COMPANY ASSET',
                                        subType: '',
                                        yard: ''
                                    });
                                    setSelectedImage(null);
                                    setSelectedImageFile(null);
                                    setShowSidebar(true);
                                    setActiveStep('Details');
                                }}
                                className="w-10 h-10 bg-[#42aeec] !text-white rounded-lg flex items-center justify-center hover:bg-[#1db5f5] transition-colors shadow-md"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="flex border-b border-gray-200 overflow-x-auto">
                        {/* All Tab */}
                        <button
                            onClick={() => {
                                setActiveTab('All');
                                fetchTabCount('All');
                            }}
                            className={`flex-shrink-0 px-6 py-4 text-center font-medium transition-colors relative ${activeTab === 'All'
                                ? 'text-[#42aeec] border-b-2 border-[#42aeec]'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <div className="font-semibold">
                                All ({getCountByCategory('All')})
                            </div>
                        </button>

                        {/* Dynamic Yard Tabs */}
                        {yards
                            .filter(yard => yard.status === 'active')
                            .map((yard) => (
                                <button
                                    key={yard._id}
                                    onClick={() => {
                                        setActiveTab(yard._id!);
                                        fetchTabCount(yard._id!);
                                    }}
                                    className={`flex-shrink-0 px-6 py-4 text-center font-medium transition-colors relative ${activeTab === yard._id
                                        ? 'text-[#42aeec] border-b-2 border-[#42aeec]'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <div>
                                        <div className="font-semibold">
                                            {yard.yardName} ({getCountByCategory(yard._id!)})
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {yard.yardCode}
                                        </div>
                                    </div>
                                </button>
                            ))}

                        {/* External Tab */}
                        <button
                            onClick={() => {
                                setActiveTab('External');
                                fetchTabCount('External');
                            }}
                            className={`flex-shrink-0 px-6 py-4 text-center font-medium transition-colors relative ${activeTab === 'External'
                                ? 'text-[#42aeec] border-b-2 border-[#42aeec]'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <div className="font-semibold">
                                External ({getCountByCategory('External')})
                            </div>
                        </button>

                        {/* Unassigned Tab */}
                        <button
                            onClick={() => {
                                setActiveTab('Unassigned');
                                fetchTabCount('Unassigned');
                            }}
                            className={`flex-shrink-0 px-6 py-4 text-center font-medium transition-colors relative ${activeTab === 'Unassigned'
                                ? 'text-[#42aeec] border-b-2 border-[#42aeec]'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <div className="font-semibold">
                                Unassigned ({getCountByCategory('Unassigned')})
                            </div>
                        </button>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search Input */}
                        <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Unit #, Plate #, Make, VIN:</label>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            />
                          
                        </div>

                        {/* Global Filters */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Sort By:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            >
                                <option value="">Select</option>
                                <option value="trailerNumber">Trailer #</option>
                                <option value="plateNumber">Plate #</option>
                                <option value="lastDispatchDate">Last Dispatch Date</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Compliance Status:</label>
                            <select
                                value={complianceStatus}
                                onChange={(e) => setComplianceStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            >
                                <option value="All">All</option>
                                <option value="Compliant">Compliant</option>
                                <option value="Non-Compliant">Non-Compliant</option>
                                <option value="Expiring Soon">Expiring Soon</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Operating Status:</label>
                            <select
                                value={operatingStatus}
                                onChange={(e) => setOperatingStatus(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] focus:border-transparent"
                            >
                                <option value="Active">Active</option>
                                <option value="All">All</option>
                                <option value="In Service">In Service</option>
                                <option value="Out of Service">Out of Service</option>
                                <option value="Maintenance">Maintenance</option>
                            </select>
                        </div>

                      
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {/* Trailer # */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Trailer #</span>
                                            <button onClick={() => handleSort('trailerNumber')} className="flex flex-col">
                                                {getSortIcon('trailerNumber')}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.trailerNumber}
                                            onChange={(e) => setFilters({ ...filters, trailerNumber: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                                        />
                                    </th>

                                    {/* Plate # */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Plate #</span>
                                            <button onClick={() => handleSort('plateNumber')} className="flex flex-col">
                                                {getSortIcon('plateNumber')}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.plateNumber}
                                            onChange={(e) => setFilters({ ...filters, plateNumber: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                                        />
                                    </th>

                                    {/* Type */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Type</span>
                                            <button onClick={() => handleSort('type')} className="flex flex-col">
                                                {getSortIcon('type')}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.type}
                                            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                                        />
                                    </th>

                                    {/* Ownership */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Ownership</span>
                                            <button onClick={() => handleSort('ownership')} className="flex flex-col">
                                                {getSortIcon('ownership')}
                                            </button>
                                        </div>
                                        <select
                                            value={filters.ownership}
                                            onChange={(e) => setFilters({ ...filters, ownership: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="COMPANY ASSET">Company Asset</option>
                                            <option value="LEASED">Leased</option>
                                        </select>
                                    </th>

                                    {/* Last Dispatch */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Last Dispatch</span>
                                            <button onClick={() => handleSort('lastDispatch')} className="flex flex-col">
                                                {getSortIcon('lastDispatch')}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.lastDispatch}
                                            onChange={(e) => setFilters({ ...filters, lastDispatch: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                                        />
                                    </th>

                                    {/* Last Dispatch Date */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Last Dispatch Date</span>
                                            <button onClick={() => handleSort('lastDispatchDate')} className="flex flex-col">
                                                {getSortIcon('lastDispatchDate')}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.lastDispatchDate}
                                            onChange={(e) => setFilters({ ...filters, lastDispatchDate: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                                        />
                                    </th>

                                    {/* Last Drop Location */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Last Drop Location</span>
                                            <button onClick={() => handleSort('lastDropLocation')} className="flex flex-col">
                                                {getSortIcon('lastDropLocation')}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.lastDropLocation}
                                            onChange={(e) => setFilters({ ...filters, lastDropLocation: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                                        />
                                    </th>

                                    {/* Notes */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Notes</span>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Filter..."
                                            value={filters.notes}
                                            onChange={(e) => setFilters({ ...filters, notes: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec]"
                                        />
                                    </th>

                                    {/* Operating Status */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Operating Status</span>
                                            <button onClick={() => handleSort('operatingStatus')} className="flex flex-col">
                                                {getSortIcon('operatingStatus')}
                                            </button>
                                        </div>
                                        <select
                                            value={filters.operatingStatus}
                                            onChange={(e) => setFilters({ ...filters, operatingStatus: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="IN SERVICE">In Service</option>
                                            <option value="OUT OF SERVICE">Out of Service</option>
                                            <option value="MAINTENANCE">Maintenance</option>
                                        </select>
                                    </th>

                                    {/* Loaded Status */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Loaded Status</span>
                                            <HelpCircle className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <select
                                            value={filters.loadedStatus}
                                            onChange={(e) => setFilters({ ...filters, loadedStatus: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="LOADED">Loaded</option>
                                            <option value="IDLE">Idle</option>
                                            <option value="SCHEDULED">Scheduled</option>
                                        </select>
                                    </th>

                                    {/* Compliance */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <div className="flex items-center gap-2">
                                            <span>Compliance</span>
                                        </div>
                                        <select
                                            value={filters.compliance}
                                            onChange={(e) => setFilters({ ...filters, compliance: e.target.value })}
                                            className="mt-2 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#42aeec] bg-white"
                                        >
                                            <option value="All">All</option>
                                            <option value="COMPLIANT">Compliant</option>
                                            <option value="NON-COMPLIANT">Non-Compliant</option>
                                            <option value="EXPIRING SOON">Expiring Soon</option>
                                        </select>
                                    </th>
                                    {/* Actions */}
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                                        <span>Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTrailers.length === 0 ? (
                                    <tr>
                                        <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                                            No trailers found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTrailers.map((trailer) => (
                                        <tr
                                        onClick={() => handleEditTrailer(trailer._id || trailer.id || '')}
                                        key={trailer._id || trailer.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-gray-900">{trailer.trailerNumber || trailer.trailer || trailer.unitNumber}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{trailer.plateNumber}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{trailer.type}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{trailer.ownership}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{trailer.lastDispatch || ''}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{typeof trailer.lastDispatchDate === 'string' ? trailer.lastDispatchDate : (trailer.lastDispatchDate ? trailer.lastDispatchDate.toString() : '')}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">{trailer.lastDropLocation || ''}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {trailer.notes ? (
                                                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                                                        <span className="text-xs">!</span>
                                                    </div>
                                                ) : (
                                                    ''
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {trailer.operatingStatus === 'IN SERVICE' ? (
                                                    <div className="inline-flex flex-col items-center px-2 py-1 bg-green-500 rounded-full">
                                                        <span className="text-[10px] font-bold text-white leading-tight">IN</span>
                                                        <span className="text-xs font-semibold text-white leading-tight">SERVICE</span>
                                                    </div>
                                                ) : (
                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(trailer.operatingStatus || '', 'operating')}`}>
                                                        {trailer.operatingStatus}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${getStatusBadgeColor(trailer.loadedStatus || '', 'loaded')}`}>
                                                    {trailer.loadedStatus === 'SCHEDULED' && <Clock className="w-3 h-3" />}
                                                    {trailer.loadedStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(trailer.compliance || '', 'compliance')}`}>
                                                    {trailer.compliance}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditTrailer(trailer._id || trailer.id || '')}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(trailer._id || trailer.id || '')}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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

            {/* New Trailer Sidebar Modal */}
            {showSidebar && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-all duration-300"
                        onClick={() => setShowSidebar(false)}
                    />
                    <div className="fixed top-0 right-0 h-full w-full sm:w-[90vw] lg:w-[85vw] xl:w-[80vw] bg-white shadow-2xl z-[101] flex overflow-hidden">
                        {/* Left Sidebar - Image Upload & Navigation */}
                        <div className="w-48 bg-white border-r border-gray-200 flex flex-col">
                            {/* Image Upload Section */}
                            <div className="p-3 border-b border-gray-200 bg-white">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-white"
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = 'image/*';
                                        input.onchange = (e: any) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setSelectedImageFile(file); // Store the file for upload
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    setSelectedImage(event.target?.result as string);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        };
                                        input.click();
                                    }}
                                >
                                    {selectedImage ? (
                                        <img src={selectedImage} alt="Trailer" className="w-full h-20 object-cover rounded" />
                                    ) : (
                                        <>
                                            <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                                            <span className="text-xs text-gray-500">Select Image</span>
                                        </>
                                    )}
                                </div>
                                <button className="w-full !mt-2 px-3 py-1.5 bg-gray-700 !text-white rounded-lg hover:bg-gray-800 transition-colors text-xs font-medium">
                                    UPLOAD
                                </button>
                            </div>


                            {/* Navigation Tabs */}
                            <div className="flex-1 overflow-y-auto p-2">
                                <nav className="flex flex-col gap-1.5">
                                    {(['Details', 'Inspections', 'Documents', 'Incidents', 'Notes'] as const).map((step) => (
                                        <button
                                            key={step}
                                            onClick={() => setActiveStep(step)}
                                            className={`w-full px-3 py-2 text-left text-xs font-medium rounded-lg transition-colors ${activeStep === step
                                                ? 'bg-[#42aeec] !text-white shadow-sm'
                                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                                }`}
                                        >
                                            {step}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                                <h2 className="text-xl font-bold text-gray-900">New Trailer</h2>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSaveTrailer}
                                        disabled={loading}
                                        className="px-4 py-1.5 bg-gray-700 !text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'SAVING...' : 'SAVE'}
                                    </button>
                                    <button
                                        onClick={() => setShowSidebar(false)}
                                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {/* Details Step */}
                                {activeStep === 'Details' && (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Basic Information</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unit #<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Unit #"
                                                    value={formData.unitNumber}
                                                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    VIN #<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="VIN #"
                                                    value={formData.vinNumber}
                                                    onChange={(e) => setFormData({ ...formData, vinNumber: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Plate #<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Plate #"
                                                    value={formData.plateNumber}
                                                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Registration Country<span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.registrationCountry}
                                                    onChange={(e) => setFormData({ ...formData, registrationCountry: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                >
                                                    <option value="">Select Registration Country</option>
                                                    <option value="CA">Canada</option>
                                                    <option value="US">United States</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Province</label>
                                                <select
                                                    value={formData.registrationProvince}
                                                    onChange={(e) => setFormData({ ...formData, registrationProvince: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                >
                                                    <option value="">Select Registration Province</option>
                                                    <option value="MB">Manitoba</option>
                                                    <option value="AB">Alberta</option>
                                                    <option value="ON">Ontario</option>
                                                    <option value="TX">Texas</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Make<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Make"
                                                    value={formData.make}
                                                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Model<span className="text-red-500">*</span></label>
                                                <input
                                                    type="text"
                                                    placeholder="Model"
                                                    value={formData.model}
                                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Year<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Year"
                                                    value={formData.year}
                                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Type<span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.type}
                                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                >
                                                    <option value="">Select Type</option>
                                                    <option value="RF">Reefer</option>
                                                    <option value="DV">Dry Van</option>
                                                    <option value="FB">Flatbed</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Weight<span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="0"
                                                    value={formData.weight}
                                                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    UoM<span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.uom}
                                                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                >
                                                    <option value="Kg">Kg</option>
                                                    <option value="Lbs">Lbs</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Status<span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                >
                                                    <option value="In Service">In Service</option>
                                                    <option value="Out of Service">Out of Service</option>
                                                    <option value="Maintenance">Maintenance</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <h3 className="text-base font-semibold text-gray-900 mb-2">Ownership Information</h3>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, ownership: 'COMPANY ASSET', subType: '' })}
                                                    className={`px-6 py-2 rounded-sm font-medium transition-colors ${formData.ownership === 'COMPANY ASSET'
                                                        ? 'bg-gray-700 !text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    COMPANY ASSET
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, ownership: 'THIRD PARTY ASSET', subType: '' })}
                                                    className={`px-6 py-2 rounded-sm font-medium transition-colors ${formData.ownership === 'THIRD PARTY ASSET'
                                                        ? 'bg-gray-700 !text-white'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    THIRD PARTY ASSET
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <h3 className="text-base font-semibold text-gray-900 mb-2">Yard</h3>
                                            <select
                                                value={formData.yard}
                                                onChange={(e) => setFormData({ ...formData, yard: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                            >
                                                <option value="">Select</option>
                                                {yards.filter(yard => yard.status === 'active').map((yard) => (
                                                    <option key={yard._id} value={yard._id}>
                                                        {yard.yardName} ({yard.yardCode})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {(formData.ownership === 'COMPANY ASSET' || formData.ownership === 'THIRD PARTY ASSET') && (
                                            <div className="mt-4">
                                                <h3 className="text-base font-semibold text-gray-900 mb-2">Sub-Type</h3>
                                                <div className="flex gap-2">
                                                    {formData.ownership === 'COMPANY ASSET' ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, subType: 'HIGHWAY USE' })}
                                                                className={`px-6 py-2 rounded-sm font-medium transition-colors ${formData.subType === 'HIGHWAY USE'
                                                                    ? 'bg-gray-700 !text-white'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                    }`}
                                                            >
                                                                HIGHWAY USE
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, subType: 'CITY USE' })}
                                                                className={`px-6 py-2 rounded-sm font-medium transition-colors ${formData.subType === 'CITY USE'
                                                                    ? 'bg-gray-700 !text-white'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                    }`}
                                                            >
                                                                CITY USE
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, subType: 'STORAGE USE' })}
                                                                className={`px-6 py-2 rounded-sm font-medium transition-colors ${formData.subType === 'STORAGE USE'
                                                                    ? 'bg-gray-700 !text-white'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                    }`}
                                                            >
                                                                STORAGE USE
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, subType: 'RENTAL' })}
                                                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${formData.subType === 'RENTAL'
                                                                    ? 'bg-gray-700 text-white'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                    }`}
                                                            >
                                                                RENTAL
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, subType: 'OTHER' })}
                                                                className={`px-6 py-2 rounded-lg font-medium transition-colors ${formData.subType === 'OTHER'
                                                                    ? 'bg-gray-700 text-white'
                                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                    }`}
                                                            >
                                                                OTHER
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Inspections Step */}
                                {activeStep === 'Inspections' && (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Trailer Inspections</h3>

                                        {/* Inspection Type Tabs */}
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setInspectionType('One Time')}
                                                className={`px-6 py-2 rounded-lg font-medium transition-colors border-2 ${inspectionType === 'One Time'
                                                    ? 'bg-white border-gray-700 text-gray-900'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                One Time
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setInspectionType('Recurring')}
                                                className={`px-6 py-2 rounded-lg font-medium transition-colors border-2 ${inspectionType === 'Recurring'
                                                    ? 'bg-white border-gray-700 text-gray-900'
                                                    : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                                                    }`}
                                            >
                                                Recurring
                                            </button>
                                        </div>

                                        {/* One Time Inspections */}
                                        {inspectionType === 'One Time' && (
                                            <div className="space-y-4">
                                                <div className="flex gap-2 items-end bg-gray-100 p-4 rounded-lg">
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                                            <input
                                                                type="date"
                                                                value={inspectionForm.expiryDate}
                                                                onChange={(e) => setInspectionForm({ ...inspectionForm, expiryDate: e.target.value })}
                                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Description"
                                                            value={inspectionForm.description}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, description: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setInspectionForm({ ...inspectionForm, file: e.target.files[0] });
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={inspectionForm.ignoreExpiration}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, ignoreExpiration: e.target.checked })}
                                                            className="w-4 h-4"
                                                        />
                                                        <label className="text-sm text-gray-700">Ignore Expiration</label>
                                                    </div>
                                                    {editingInspectionId && editingInspectionType === 'oneTime' ? (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    if (inspectionForm.expiryDate && inspectionForm.description) {
                                                                        setOneTimeInspections(oneTimeInspections.map(insp =>
                                                                            insp.id === editingInspectionId
                                                                                ? {
                                                                                    ...insp,
                                                                                    expiryDate: inspectionForm.expiryDate,
                                                                                    description: inspectionForm.description,
                                                                                    ignoreExpiration: inspectionForm.ignoreExpiration,
                                                                                    file: inspectionForm.file || insp.file,
                                                                                    fileName: inspectionForm.file?.name || insp.fileName
                                                                                }
                                                                                : insp
                                                                        ));
                                                                        handleCancelEditInspection();
                                                                    }
                                                                }}
                                                                className="w-10 h-10 bg-green-600 !text-white rounded-lg flex items-center justify-center hover:bg-green-700"
                                                                title="Save"
                                                            >
                                                                <Plus className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEditInspection}
                                                                className="w-10 h-10 bg-gray-500 !text-white rounded-lg flex items-center justify-center hover:bg-gray-600"
                                                                title="Cancel"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                if (inspectionForm.expiryDate && inspectionForm.description) {
                                                                    setOneTimeInspections([...oneTimeInspections, {
                                                                        id: Date.now().toString(),
                                                                        ...inspectionForm,
                                                                        fileName: inspectionForm.file?.name || null
                                                                    }]);
                                                                    setInspectionForm({ expiryDate: '', description: '', ignoreExpiration: false, scheduledOn: '', after: '', unit: '', file: null });
                                                                    if (fileInputRef.current) {
                                                                        fileInputRef.current.value = '';
                                                                    }
                                                                }
                                                            }}
                                                            className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800"
                                                            title="Add"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">Click row to edit • Drag to reorder</p>
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Expiry Date</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Description</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">File</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Ignore Expiration</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {oneTimeInspections.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No Data</td>
                                                                </tr>
                                                            ) : (
                                                                oneTimeInspections.map((inspection) => (
                                                                    <tr 
                                                                        key={inspection.id} 
                                                                        onClick={() => handleEditInspection(inspection, 'oneTime')}
                                                                        className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                                                                    >
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.expiryDate}</td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.description}</td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {inspection.fileName ? (
                                                                                inspection.fileUrl ? (
                                                                                    <a
                                                                                        href={inspection.fileUrl}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                                                                    >
                                                                                        <FileText className="w-4 h-4" />
                                                                                        {inspection.fileName.length > 20
                                                                                            ? inspection.fileName.substring(0, 20) + '...'
                                                                                            : inspection.fileName}
                                                                                    </a>
                                                                                ) : (
                                                                                    <span className="text-gray-600 flex items-center gap-1">
                                                                                        <FileText className="w-4 h-4" />
                                                                                        {inspection.fileName.length > 20
                                                                                            ? inspection.fileName.substring(0, 20) + '...'
                                                                                            : inspection.fileName}
                                                                                    </span>
                                                                                )
                                                                            ) : (
                                                                                <span className="text-gray-400">No file</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.ignoreExpiration ? 'Yes' : 'No'}</td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteInspection(inspection.id, 'oneTime');
                                                                                }}
                                                                                className="text-red-600 hover:text-red-800"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Recurring Inspections */}
                                        {inspectionType === 'Recurring' && (
                                            <div className="space-y-4">
                                                <div className="flex gap-2 items-end bg-gray-100 p-4 rounded-lg">
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled On</label>
                                                        <div className="relative">
                                                            <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                                            <input
                                                                type="date"
                                                                value={inspectionForm.scheduledOn}
                                                                onChange={(e) => setInspectionForm({ ...inspectionForm, scheduledOn: e.target.value })}
                                                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">After</label>
                                                        <input
                                                            type="text"
                                                            placeholder="After"
                                                            value={inspectionForm.after}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, after: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                                        <select
                                                            value={inspectionForm.unit}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, unit: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                        >
                                                            <option value="">Select Unit</option>
                                                            <option value="Days">Days</option>
                                                            <option value="Weeks">Weeks</option>
                                                            <option value="Months">Months</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Description"
                                                            value={inspectionForm.description}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, description: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                                                        <input
                                                            type="file"
                                                            onChange={(e) => {
                                                                if (e.target.files && e.target.files[0]) {
                                                                    setInspectionForm({ ...inspectionForm, file: e.target.files[0] });
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={inspectionForm.ignoreExpiration}
                                                            onChange={(e) => setInspectionForm({ ...inspectionForm, ignoreExpiration: e.target.checked })}
                                                            className="w-4 h-4"
                                                        />
                                                        <label className="text-sm text-gray-700">Ignore Expiration</label>
                                                    </div>
                                                    {editingInspectionId && editingInspectionType === 'recurring' ? (
                                                        <>
                                                            <button
                                                                onClick={() => {
                                                                    if (inspectionForm.scheduledOn && inspectionForm.description) {
                                                                        setRecurringInspections(recurringInspections.map(insp =>
                                                                            insp.id === editingInspectionId
                                                                                ? {
                                                                                    ...insp,
                                                                                    scheduledOn: inspectionForm.scheduledOn,
                                                                                    after: inspectionForm.after,
                                                                                    unit: inspectionForm.unit,
                                                                                    description: inspectionForm.description,
                                                                                    ignoreExpiration: inspectionForm.ignoreExpiration,
                                                                                    file: inspectionForm.file || insp.file,
                                                                                    fileName: inspectionForm.file?.name || insp.fileName
                                                                                }
                                                                                : insp
                                                                        ));
                                                                        handleCancelEditInspection();
                                                                    }
                                                                }}
                                                                className="w-10 h-10 bg-green-600 !text-white rounded-lg flex items-center justify-center hover:bg-green-700"
                                                                title="Save"
                                                            >
                                                                <Plus className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEditInspection}
                                                                className="w-10 h-10 bg-gray-500 !text-white rounded-lg flex items-center justify-center hover:bg-gray-600"
                                                                title="Cancel"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                if (inspectionForm.scheduledOn && inspectionForm.description) {
                                                                    setRecurringInspections([...recurringInspections, {
                                                                        id: Date.now().toString(),
                                                                        scheduledOn: inspectionForm.scheduledOn,
                                                                        after: inspectionForm.after,
                                                                        unit: inspectionForm.unit,
                                                                        description: inspectionForm.description,
                                                                        ignoreExpiration: inspectionForm.ignoreExpiration,
                                                                        file: inspectionForm.file,
                                                                        fileName: inspectionForm.file?.name || null
                                                                    }]);
                                                                    setInspectionForm({ expiryDate: '', description: '', ignoreExpiration: false, scheduledOn: '', after: '', unit: '', file: null });
                                                                    if (fileInputRef.current) {
                                                                        fileInputRef.current.value = '';
                                                                    }
                                                                }
                                                            }}
                                                            className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800"
                                                            title="Add"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Scheduled On</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">After</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Unit</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Description</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">File</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Ignore Expiration</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {recurringInspections.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No Data</td>
                                                                </tr>
                                                            ) : (
                                                                recurringInspections.map((inspection) => (
                                                                    <tr 
                                                                        key={inspection.id} 
                                                                        onClick={() => handleEditInspection(inspection, 'recurring')}
                                                                        className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                                                                    >
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.scheduledOn}</td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.after}</td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.unit}</td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.description}</td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            {inspection.fileName ? (
                                                                                inspection.fileUrl ? (
                                                                                    <a
                                                                                        href={inspection.fileUrl}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                                                                    >
                                                                                        <FileText className="w-4 h-4" />
                                                                                        {inspection.fileName.length > 20
                                                                                            ? inspection.fileName.substring(0, 20) + '...'
                                                                                            : inspection.fileName}
                                                                                    </a>
                                                                                ) : (
                                                                                    <span className="text-gray-600 flex items-center gap-1">
                                                                                        <FileText className="w-4 h-4" />
                                                                                        {inspection.fileName.length > 20
                                                                                            ? inspection.fileName.substring(0, 20) + '...'
                                                                                            : inspection.fileName}
                                                                                    </span>
                                                                                )
                                                                            ) : (
                                                                                <span className="text-gray-400">No file</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-4 py-2 text-sm text-gray-900">{inspection.ignoreExpiration ? 'Yes' : 'No'}</td>
                                                                        <td className="px-4 py-2 text-sm">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteInspection(inspection.id, 'recurring');
                                                                                }}
                                                                                className="text-red-600 hover:text-red-800"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Documents Step */}
                                {activeStep === 'Documents' && (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Documents</h3>

                                        {/* Document Type Tabs */}
                                        <div className="flex gap-2 border-b border-gray-200">
                                            {(['General', 'Ownership', 'Plate', 'Safety', 'Insurance'] as const).map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setDocumentType(type)}
                                                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${documentType === type
                                                        ? 'border-gray-700 text-gray-900'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Document Form */}
                                        <div className="flex gap-2 items-end bg-gray-100 p-4 rounded-lg">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                                    <input
                                                        type="date"
                                                        value={documentForm.expiryDate}
                                                        onChange={(e) => setDocumentForm({ ...documentForm, expiryDate: e.target.value })}
                                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    placeholder="Description"
                                                    value={documentForm.description}
                                                    onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                                                <input
                                                    ref={documentFileInputRef}
                                                    type="file"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            setDocumentForm({ ...documentForm, file: e.target.files[0] });
                                                        }
                                                    }}
                                                    className="hidden"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => documentFileInputRef.current?.click()}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    {documentForm.file?.name ? (
                                                        documentForm.file.name.length > 15 
                                                            ? documentForm.file.name.substring(0, 15) + '...' 
                                                            : documentForm.file.name
                                                    ) : 'Select File'}
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={documentForm.ignoreExpiration}
                                                    onChange={(e) => setDocumentForm({ ...documentForm, ignoreExpiration: e.target.checked })}
                                                    className="w-4 h-4"
                                                />
                                                <label className="text-sm text-gray-700">Ignore Expiration</label>
                                            </div>
                                            {editingDocumentId ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveDocument}
                                                        className="w-10 h-10 bg-green-600 !text-white rounded-lg flex items-center justify-center hover:bg-green-700"
                                                        title="Save"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelEditDocument}
                                                        className="w-10 h-10 bg-gray-500 !text-white rounded-lg flex items-center justify-center hover:bg-gray-600"
                                                        title="Cancel"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleSaveDocument}
                                                    className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800"
                                                    title="Add"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-500">Click row to edit • Drag to reorder</p>

                                        {/* Documents Table */}
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Expiry Date</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Description</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">File</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Ignore Expiration</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {documents[documentType].length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No Data</td>
                                                        </tr>
                                                    ) : (
                                                        documents[documentType].map((doc) => (
                                                            <tr 
                                                                key={doc.id} 
                                                                onClick={() => handleEditDocument(doc, documentType)}
                                                                className="border-t border-gray-200 hover:bg-gray-50 cursor-pointer"
                                                            >
                                                                <td className="px-4 py-2 text-sm text-gray-900">{doc.expiryDate}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{doc.description}</td>
                                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                                    {doc.fileUrl ? (
                                                                        <a
                                                                            href={doc.fileUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                                                        >
                                                                            <FileText className="w-4 h-4" />
                                                                            <span>{doc.fileName || 'View File'}</span>
                                                                        </a>
                                                                    ) : doc.file ? (
                                                                        <span className="flex items-center gap-2 text-gray-700">
                                                                            <FileText className="w-4 h-4" />
                                                                            <span>{doc.file.name}</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400">No file</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-2 text-sm text-gray-900">{doc.ignoreExpiration ? 'Yes' : 'No'}</td>
                                                                <td className="px-4 py-2 text-sm">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteDocument(doc.id, documentType);
                                                                        }}
                                                                        className="text-red-600 hover:text-red-800 p-1"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Incidents Step */}
                                {activeStep === 'Incidents' && (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Claims / Accidents</h3>

                                        {/* Incident Form */}
                                        <div className="bg-gray-100 p-4 rounded-lg">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Accident Number</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Accident Number"
                                                        value={incidentForm.accidentNumber}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, accidentNumber: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
                                                    <select
                                                        value={incidentForm.driver}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, driver: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm appearance-none pr-8"
                                                    >
                                                        <option value="">Select Driver</option>
                                                        {drivers.map((driver) => (
                                                            <option key={driver._id} value={driver._id}>
                                                                {driver.name} {driver.internalId ? `(${driver.internalId})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Co-Driver</label>
                                                    <select
                                                        value={incidentForm.coDriver}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, coDriver: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm appearance-none pr-8"
                                                    >
                                                        <option value="">Select Co-Driver</option>
                                                        {drivers.map((driver) => (
                                                            <option key={driver._id} value={driver._id}>
                                                                {driver.name} {driver.internalId ? `(${driver.internalId})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Location"
                                                        value={incidentForm.location}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                                        <input
                                                            type="date"
                                                            value={incidentForm.date}
                                                            onChange={(e) => setIncidentForm({ ...incidentForm, date: e.target.value })}
                                                            className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                                    <input
                                                        type="time"
                                                        value={incidentForm.time}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, time: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Weather</label>
                                                    <div className="relative">
                                                        <select
                                                            value={incidentForm.weather}
                                                            onChange={(e) => setIncidentForm({ ...incidentForm, weather: e.target.value })}
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm appearance-none pr-8"
                                                        >
                                                            <option value="">Select Weather</option>
                                                            <option value="Clear">Clear</option>
                                                            <option value="Rainy">Rainy</option>
                                                            <option value="Snowy">Snowy</option>
                                                            <option value="Foggy">Foggy</option>
                                                            <option value="Windy">Windy</option>
                                                        </select>
                                                        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Police Report #</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Police Report #"
                                                        value={incidentForm.policeReport}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, policeReport: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Accident Report #</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Accident Report #"
                                                        value={incidentForm.accidentReport}
                                                        onChange={(e) => setIncidentForm({ ...incidentForm, accidentReport: e.target.value })}
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Third Party Info</label>
                                                <textarea
                                                    placeholder="Third Party Info"
                                                    value={incidentForm.thirdPartyInfo}
                                                    onChange={(e) => setIncidentForm({ ...incidentForm, thirdPartyInfo: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] min-h-[100px] text-sm resize-none"
                                                />
                                            </div>
                                            <div className="flex items-end gap-4">
                                                <div className="flex-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Select files 
                                                        {incidentForm.files.length > 0 && (
                                                            <span className="ml-2 text-xs text-gray-500">
                                                                ({incidentForm.files.length} file{incidentForm.files.length > 1 ? 's' : ''} selected)
                                                            </span>
                                                        )}
                                                    </label>
                                                    <input
                                                        ref={incidentFileInputRef}
                                                        type="file"
                                                        multiple
                                                        onChange={(e) => {
                                                            const files = Array.from(e.target.files || []);
                                                            setIncidentForm({ ...incidentForm, files });
                                                        }}
                                                        className="hidden"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => incidentFileInputRef.current?.click()}
                                                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
                                                    >
                                                        <Upload className="w-4 h-4" />
                                                        {incidentForm.files.length > 0 ? (
                                                            <div className="flex-1 text-left truncate">
                                                                {incidentForm.files.map(f => f.name).join(', ')}
                                                            </div>
                                                        ) : (
                                                            'Select Files'
                                                        )}
                                                    </button>
                                                </div>
                                                {editingIncidentId ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={handleSaveIncident}
                                                            className="w-10 h-10 bg-green-600 !text-white rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors flex-shrink-0"
                                                            title="Save"
                                                        >
                                                            <Plus className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleCancelEditIncident}
                                                            className="w-10 h-10 bg-gray-500 !text-white rounded-lg flex items-center justify-center hover:bg-gray-600 transition-colors flex-shrink-0"
                                                            title="Cancel"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveIncident}
                                                        className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors flex-shrink-0"
                                                        title="Add"
                                                    >
                                                        <Plus className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-sm text-gray-500">Click row to edit • Drag to reorder</p>

                                        {/* Incidents Table */}
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
                                            <table className="w-full min-w-[1000px]">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Claim/Accident No.</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Driver/Co-Driver</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date Time</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Weather</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Files</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {incidents.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-sm">No Data</td>
                                                        </tr>
                                                    ) : (
                                                        incidents.map((incident) => (
                                                            <tr 
                                                                key={incident.id} 
                                                                onClick={() => handleEditIncident(incident)}
                                                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                            >
                                                                <td className="px-4 py-3 text-sm text-gray-900">{incident.accidentNumber}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                    {incident.driver || '-'}{incident.coDriver ? ` / ${incident.coDriver}` : ''}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{incident.location}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                    {incident.date ? `${incident.date}${incident.time ? ` ${incident.time}` : ''}` : '-'}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{incident.weather || '-'}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                                    {incident.files && incident.files.length > 0 ? (
                                                                        <div className="flex flex-col gap-1">
                                                                            {incident.files.map((file, idx) => (
                                                                                <span key={idx} className="flex items-center gap-1 text-gray-600">
                                                                                    <FileText className="w-3 h-3" />
                                                                                    <span className="text-xs">
                                                                                        {file.name.length > 20 
                                                                                            ? file.name.substring(0, 20) + '...' 
                                                                                            : file.name}
                                                                                    </span>
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-gray-400">No files</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteIncident(incident.id);
                                                                        }}
                                                                        className="text-red-600 hover:text-red-800 p-1"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Notes Step */}
                                {activeStep === 'Notes' && (
                                    <div className="space-y-4">
                                        <h3 className="text-base font-semibold text-gray-900">Notes</h3>

                                        {/* Note Form */}
                                        <div className="flex gap-4 items-end bg-gray-100 p-4 rounded-lg">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                                                <input
                                                    type="text"
                                                    placeholder="Note"
                                                    value={noteForm.note}
                                                    onChange={(e) => setNoteForm({ ...noteForm, note: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                                <div className="relative">
                                                    <select
                                                        value={noteForm.category}
                                                        onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                                                        className="px-3 py-2 pr-8 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42aeec] text-sm appearance-none min-w-[150px]"
                                                    >
                                                        <option value="Category">Category</option>
                                                        <option value="Safety">Safety</option>
                                                        <option value="Attitude">Attitude</option>
                                                        <option value="Ops">Ops</option>
                                                        <option value="General">General</option>
                                                        <option value="Maintenance">Maintenance</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (noteForm.note && noteForm.category !== 'Category') {
                                                        setNotes([...notes, {
                                                            id: Date.now().toString(),
                                                            note: noteForm.note,
                                                            category: noteForm.category
                                                        }]);
                                                        setNoteForm({ note: '', category: 'Category' });
                                                    }
                                                }}
                                                className="w-10 h-10 bg-gray-700 !text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors flex-shrink-0"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Notes Table */}
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Note</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Category</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {notes.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={2} className="px-4 py-12 text-center text-gray-500 text-sm">No Data</td>
                                                        </tr>
                                                    ) : (
                                                        notes.map((note) => (
                                                            <tr key={note.id} className="hover:bg-gray-50 transition-colors">
                                                                <td className="px-4 py-3 text-sm text-gray-900">{note.note}</td>
                                                                <td className="px-4 py-3 text-sm text-gray-900">{note.category}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Buttons */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between gap-3">
                                        <button
                                            onClick={handlePrevious}
                                            disabled={!getPreviousStep()}
                                            className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                getPreviousStep()
                                                    ? 'bg-gray-700 !text-white hover:bg-gray-800'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                            Previous
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            disabled={!getNextStep()}
                                            className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                getNextStep()
                                                    ? 'bg-gray-700 !text-white hover:bg-gray-800'
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            Next
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={showDeleteConfirmation}
                onClose={() => {
                    setShowDeleteConfirmation(false);
                    setDeleteTargetId(null);
                }}
                onConfirm={handleDeleteTrailer}
                title="Confirm Deletion"
                message="Are you sure you want to delete this trailer? This action cannot be undone and will permanently remove all trailer data including documents, inspections, and history."
                confirmText="Delete"
                type="danger"
                isLoading={loading}
            />

            {/* Validation Errors Display */}
            {validationErrors.length > 0 && (
                <div className="fixed bottom-4 right-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-lg max-w-md z-[10001]">
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
                            <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                        </div>
                        <button
                            onClick={() => setValidationErrors([])}
                            className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrailersPage;

