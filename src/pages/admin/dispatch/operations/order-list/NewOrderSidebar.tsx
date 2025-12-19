import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Plus, ChevronDown, ChevronUp, Search, Pencil, Upload, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaFileAlt, FaUpload, FaCheck } from "react-icons/fa";
import { listCustomer, createOrder, updateOrder, getOrderSuggestions } from "../../../../../axios/api/distapcher";

// Color constants
const PRIMARY_GRADIENT = 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)';
const PRIMARY_COLOR = '#016ab2';
const PRIMARY_LIGHT_BG = 'rgba(66, 174, 236, 0.1)';

type NotificationType = 'success' | 'error' | 'warning';

interface ToastNotification {
    id: number;
    type: NotificationType;
    message: string;
}

const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
    const icons = {
        success: <FaCheckCircle className="text-green-500" size={24} />,
        error: <FaExclamationCircle className="text-red-500" size={24} />,
        warning: <FaExclamationCircle className="text-yellow-500" size={24} />,
    };

    const bgColors = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        warning: 'bg-yellow-50 border-yellow-200',
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(notification.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    return (
        <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in min-w-[300px] max-w-[500px]`}>
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

interface Customer {
    _id?: string;
    id?: string | number;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    customerDetails?: {
        address?: string;
        unit?: string;
        zipCode?: string;
        city?: string;
        state?: string;
        country?: string;
    };
}

interface NewOrderSidebarProps {
    order?: any;
    onClose: () => void;
    onSave: () => void;
}

const NewOrderSidebar = ({ order, onClose, onSave }: NewOrderSidebarProps) => {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);
    const [validationResults, setValidationResults] = useState<any>(null);

    const addNotification = useCallback((type: NotificationType, message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Form states
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [customerSearch, setCustomerSearch] = useState("");
    const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);

    // Shipper customer states
    const [selectedShipperCustomer, setSelectedShipperCustomer] = useState<Customer | null>(null);
    const [shipperCustomerSearch, setShipperCustomerSearch] = useState("");
    const [shipperCustomerDropdownOpen, setShipperCustomerDropdownOpen] = useState(false);

    // Receiver customer states
    const [selectedReceiverCustomer, setSelectedReceiverCustomer] = useState<Customer | null>(null);
    const [receiverCustomerSearch, setReceiverCustomerSearch] = useState("");
    const [receiverCustomerDropdownOpen, setReceiverCustomerDropdownOpen] = useState(false);

    // Pickup location states (now using customer address - read-only, single field)
    const [pickupLocationAddress, setPickupLocationAddress] = useState('');

    // Delivery location states (now using customer address - read-only, single field)
    const [deliveryLocationAddress, setDeliveryLocationAddress] = useState('');
    const [customerOrderNo, setCustomerOrderNo] = useState("");
    const [loadType, setLoadType] = useState("FTL");
    const [freightOn, setFreightOn] = useState("Order");
    const [selectedSalesman, setSelectedSalesman] = useState("");
    const [orderNotes, setOrderNotes] = useState("");
    const [commodity, setCommodity] = useState("");
    const [valueOfGoods, setValueOfGoods] = useState("");
    const [valueOfGoodsCurrency, setValueOfGoodsCurrency] = useState("");
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
    const [equipmentDropdownOpen, setEquipmentDropdownOpen] = useState(false);
    const [noOfPackages, setNoOfPackages] = useState("");
    const [noOfPackagesType, setNoOfPackagesType] = useState("");
    const [noOfPackagesSearch, setNoOfPackagesSearch] = useState("");
    const [noOfPackagesDropdownOpen, setNoOfPackagesDropdownOpen] = useState(false);
    const [weight, setWeight] = useState("");
    const [weightUnit, setWeightUnit] = useState("");
    const [temperature, setTemperature] = useState("");
    const [temperatureUnit, setTemperatureUnit] = useState("Celsius");
    const [weatherConditions, setWeatherConditions] = useState({
        snow: false,
        highTemperature: false
    });
    const [dimensionL, setDimensionL] = useState("");
    const [dimensionB, setDimensionB] = useState("");
    const [dimensionH, setDimensionH] = useState("");
    const [dimensionUnit, setDimensionUnit] = useState("");
    const [pickupRefNo, setPickupRefNo] = useState("");
    const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
    const [pickupTime, setPickupTime] = useState("12:00");
    const [pickupAppointment, setPickupAppointment] = useState("No");
    const [pickupNote, setPickupNote] = useState("");
    const [deliveryRefNo, setDeliveryRefNo] = useState("");
    const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryTime, setDeliveryTime] = useState("12:00");
    const [deliveryAppointment, setDeliveryAppointment] = useState("No");
    const [deliveryNote, setDeliveryNote] = useState("");
    const [distance, setDistance] = useState("");
    const [additionalInfo, setAdditionalInfo] = useState({
        CSA: false,
        CTPAT: false,
        PIP: false,
        HAZMAT: false,
        TARP: false,
        OverDimension: false
    });

    // Border Information states
    const [borderRequired, setBorderRequired] = useState(false);
    const [borderDirection, setBorderDirection] = useState("CA_TO_US");
    const [portOfEntry, setPortOfEntry] = useState("");
    const [cargoDescription, setCargoDescription] = useState("");
    const [hsCode, setHsCode] = useState("");
    const [brokerName, setBrokerName] = useState("");
    const [brokerPhone, setBrokerPhone] = useState("");
    const [brokerEmail, setBrokerEmail] = useState("");
    const [commercialValue, setCommercialValue] = useState("");
    const [countryOfOrigin, setCountryOfOrigin] = useState("");

    // Custom Brokers List (Mock for now as per "Pre-saved brokers")
    const BROKER_OPTIONS = ["Livingston International", "C.H. Robinson", "Hub Group", "XPO Logistics", "Delmar International", "Kuehne + Nagel"];
    const PORT_OPTIONS = ["Detroit", "Buffalo", "Windsor", "Port Huron", "Champlain", "Lewiston", "Sarnia", "Fort Erie", "International Falls", "Pembina"];


    // Multi-step form state
    const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Shipper, 3: Receiver, 4: Documents, 5: Review

    // Shipper Information states
    const [shipperName, setShipperName] = useState("");
    const [shipperPhone, setShipperPhone] = useState("");
    const [shipperEmail, setShipperEmail] = useState("");
    const [shipperAddress, setShipperAddress] = useState("");
    const [pickupAppointmentType, setPickupAppointmentType] = useState("FCFS"); // FCFS / Window / Strict Time
    const [pickupAppointmentDate, setPickupAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [pickupAppointmentTime, setPickupAppointmentTime] = useState("12:00");
    const [pickupSpecialInstructions, setPickupSpecialInstructions] = useState("");
    const [pickupGatePass, setPickupGatePass] = useState("");

    // Receiver Information states
    const [receiverName, setReceiverName] = useState("");
    const [receiverPhone, setReceiverPhone] = useState("");
    const [receiverAddress, setReceiverAddress] = useState("");
    const [deliveryAppointmentType, setDeliveryAppointmentType] = useState("Window"); // Window / Strict Time
    const [deliveryAppointmentDate, setDeliveryAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryAppointmentTime, setDeliveryAppointmentTime] = useState("12:00");
    const [deliveryUnloadingInstructions, setDeliveryUnloadingInstructions] = useState("");

    // Document states
    const [bolFile, setBolFile] = useState<File | null>(null);
    const [customsHazmatFiles, setCustomsHazmatFiles] = useState<File[]>([]);
    const [rateConfirmationFile, setRateConfirmationFile] = useState<File | null>(null);
    const [internalNotes, setInternalNotes] = useState("");
    const [customerNotes, setCustomerNotes] = useState("");

    const [loadSecurementFiles, setLoadSecurementFiles] = useState<File[]>([]);


    const [podFile, setPodFile] = useState<File | null>(null);
    const [stampedManifestFile, setStampedManifestFile] = useState<File | null>(null);
    const [loadConfirmationFile, setLoadConfirmationFile] = useState<File | null>(null);
    const [printedManifestFile, setPrintedManifestFile] = useState<File | null>(null);
    
    // Existing document URLs (from database when editing)
    const [existingDocuments, setExistingDocuments] = useState<{
        bol?: string | null;
        pod?: string | null;
        customsHazmat?: string[];
        rateConfirmation?: string | null;
        stampedManifest?: string | null;
        loadSecurement?: string[];
        printedManifest?: string | null;
    }>({});

    // Suggestions states
    const [commoditySuggestions, setCommoditySuggestions] = useState<string[]>([]);
    const [shipperNameSuggestions, setShipperNameSuggestions] = useState<string[]>([]);
    const [receiverNameSuggestions, setReceiverNameSuggestions] = useState<string[]>([]);
    const [showCommoditySuggestions, setShowCommoditySuggestions] = useState(false);
    const [showShipperNameSuggestions, setShowShipperNameSuggestions] = useState(false);
    const [showReceiverNameSuggestions, setShowReceiverNameSuggestions] = useState(false);


    // Fetch customers on component mount
    useEffect(() => {
        fetchCustomers();
    }, []);

    // Populate form fields when editing an order
    useEffect(() => {
        if (order) {
            // Customer
            if (order.customer) {
                const customerId = typeof order.customer === 'string' ? order.customer : order.customer._id;
                const foundCustomer = customers.find(c => c._id === customerId);
                if (foundCustomer) {
                    setSelectedCustomer(foundCustomer);
                    setCustomerSearch(foundCustomer.name || '');
                }
            }

            // Basic fields
            setCustomerOrderNo(order.customerOrderNo || '');
            setLoadType(order.orderType || 'FTL');
            setFreightOn(order.freightOn || 'Order');
            setSelectedSalesman(order.salesman || '');
            setOrderNotes(order.orderNotes || '');
            setCommodity(order.commodity || '');
            setValueOfGoods(order.valueOfGoods?.toString() || '');
            setValueOfGoodsCurrency(order.valueOfGoodsCurrency || 'CAD');

            // Equipment
            if (order.equipment && Array.isArray(order.equipment)) {
                setSelectedEquipment(order.equipment);
            }

            // Package details
            setNoOfPackages(order.noOfPackages?.toString() || '');
            setNoOfPackagesType(order.noOfPackagesType || '');
            setWeight(order.weight?.toString() || '');
            setWeightUnit(order.weightUnit || 'kg');
            setTemperature(order.temperature?.toString() || '');
            setTemperatureUnit(order.temperatureUnit || 'Celsius');
            setWeatherConditions({
                snow: order.weatherConditions?.snow || false,
                highTemperature: order.weatherConditions?.highTemperature || false
            });
            setDimensionL(order.dimensions?.length?.toString() || '');
            setDimensionB(order.dimensions?.width?.toString() || '');
            setDimensionH(order.dimensions?.height?.toString() || '');
            setDimensionUnit(order.dimensions?.unit || 'cm');
            setDistance(order.distance?.toString() || '');

            // Additional info
            if (order.additionalInfo) {
                setAdditionalInfo({
                    CSA: order.additionalInfo.CSA || false,
                    CTPAT: order.additionalInfo.CTPAT || false,
                    PIP: order.additionalInfo.PIP || false,
                    HAZMAT: order.additionalInfo.HAZMAT || false,
                    TARP: order.additionalInfo.TARP || false,
                    OverDimension: order.additionalInfo.OverDimension || false
                });
            }

            // Border Info
            if (order.borderInfo) {
                setPortOfEntry(order.borderInfo.portOfEntry || '');
                setCargoDescription(order.borderInfo.cargoDescription || '');
                setHsCode(order.borderInfo.hsCode || '');
                setBrokerName(order.borderInfo.brokerName || '');
                setBrokerPhone(order.borderInfo.brokerPhone || '');
                setBrokerEmail(order.borderInfo.brokerEmail || '');
                setCommercialValue(order.borderInfo.commercialValue || '');
                setCountryOfOrigin(order.borderInfo.countryOfOrigin || '');

                // direction and requirement are auto-calculated but we can set them as initial if needed
                if (order.borderInfo.direction) setBorderDirection(order.borderInfo.direction);
            }

            // Pickup location
            if (order.pickupLocation) {
                const pickupAddr = order.pickupLocation.address || order.pickupLocation.place || '';
                // Combine all address components into single string
                const parts = [
                    pickupAddr,
                    order.pickupLocation.city || '',
                    order.pickupLocation.state || '',
                    order.pickupLocation.country || '',
                    order.pickupLocation.zipCode || ''
                ].filter(Boolean);
                setPickupLocationAddress(parts.join(' '));
            }

            // Pickup details
            if (order.pickupDate) {
                const pickupDateObj = new Date(order.pickupDate);
                setPickupDate(pickupDateObj.toISOString().split('T')[0]);
            }
            setPickupTime(order.pickupTime || '12:00');
            setPickupAppointment(order.pickupAppointment ? 'Yes' : 'No');
            setPickupRefNo(order.pickupRefNo || '');
            setPickupNote(order.pickupNote || '');

            // Delivery location
            if (order.deliveryLocation) {
                const deliveryAddr = order.deliveryLocation.address || order.deliveryLocation.place || '';
                // Combine all address components into single string
                const parts = [
                    deliveryAddr,
                    order.deliveryLocation.city || '',
                    order.deliveryLocation.state || '',
                    order.deliveryLocation.country || '',
                    order.deliveryLocation.zipCode || ''
                ].filter(Boolean);
                setDeliveryLocationAddress(parts.join(' '));
            }

            // Delivery details
            if (order.deliveryDate) {
                const deliveryDateObj = new Date(order.deliveryDate);
                setDeliveryDate(deliveryDateObj.toISOString().split('T')[0]);
            }
            setDeliveryTime(order.deliveryTime || '12:00');
            setDeliveryAppointment(order.deliveryAppointment ? 'Yes' : 'No');
            setDeliveryRefNo(order.deliveryRefNo || '');
            setDeliveryNote(order.deliveryNote || '');

            // Shipper Information
            if (order.shipper) {
                setShipperName(order.shipper.name || '');
                setShipperPhone(order.shipper.phone || '');
                setShipperEmail(order.shipper.email || '');
                // Set shipper address from order data
                if (order.shipper.address) {
                    setShipperAddress(order.shipper.address);
                    // Update pickup location address if shipper address is provided
                    const shipperAddrParts = [
                        order.shipper.address || '',
                        order.shipper.city || '',
                        order.shipper.state || '',
                        order.shipper.country || '',
                        order.shipper.zipCode || ''
                    ].filter(Boolean);
                    if (shipperAddrParts.length > 0) {
                        setPickupLocationAddress(shipperAddrParts.join(' '));
                    }
                }
                
                // Try to find matching customer for shipper
                // Match by name, phone, or email
                if (order.shipper.name || order.shipper.phone || order.shipper.email) {
                    const matchingShipperCustomer = customers.find(customer => {
                        const nameMatch = order.shipper.name && customer.name && 
                            customer.name.toLowerCase().trim() === order.shipper.name.toLowerCase().trim();
                        const phoneMatch = order.shipper.phone && customer.phone && 
                            customer.phone.replace(/\D/g, '') === order.shipper.phone.replace(/\D/g, '');
                        const emailMatch = order.shipper.email && customer.email && 
                            customer.email.toLowerCase().trim() === order.shipper.email.toLowerCase().trim();
                        return nameMatch || phoneMatch || emailMatch;
                    });
                    
                    if (matchingShipperCustomer) {
                        setSelectedShipperCustomer(matchingShipperCustomer);
                        setShipperCustomerSearch(matchingShipperCustomer.name || '');
                    } else {
                        // If no match found, still show the shipper name in search field
                        setShipperCustomerSearch(order.shipper.name || '');
                    }
                }
            }

            // Pickup Appointment Details
            if (order.pickupAppointmentDetails) {
                setPickupAppointmentType(order.pickupAppointmentDetails.type || 'FCFS');
                if (order.pickupAppointmentDetails.date) {
                    const dateObj = new Date(order.pickupAppointmentDetails.date);
                    setPickupAppointmentDate(dateObj.toISOString().split('T')[0]);
                }
                setPickupAppointmentTime(order.pickupAppointmentDetails.time || '12:00');
                setPickupSpecialInstructions(order.pickupAppointmentDetails.specialInstructions || '');
                setPickupGatePass(order.pickupAppointmentDetails.gatePass || '');
            }

            // Receiver Information
            if (order.receiver) {
                setReceiverName(order.receiver.name || '');
                setReceiverPhone(order.receiver.phone || '');
                setReceiverAddress(order.receiver.address || '');
                
                // Try to find matching customer for receiver
                // Match by name, phone, or email
                if (order.receiver.name || order.receiver.phone || order.receiver.email) {
                    const matchingReceiverCustomer = customers.find(customer => {
                        const nameMatch = order.receiver.name && customer.name && 
                            customer.name.toLowerCase().trim() === order.receiver.name.toLowerCase().trim();
                        const phoneMatch = order.receiver.phone && customer.phone && 
                            customer.phone.replace(/\D/g, '') === order.receiver.phone.replace(/\D/g, '');
                        const emailMatch = order.receiver.email && customer.email && 
                            customer.email.toLowerCase().trim() === order.receiver.email.toLowerCase().trim();
                        return nameMatch || phoneMatch || emailMatch;
                    });
                    
                    if (matchingReceiverCustomer) {
                        setSelectedReceiverCustomer(matchingReceiverCustomer);
                        setReceiverCustomerSearch(matchingReceiverCustomer.name || '');
                    } else {
                        // If no match found, still show the receiver name in search field
                        setReceiverCustomerSearch(order.receiver.name || '');
                    }
                }
            }

            // Delivery Appointment Details
            if (order.deliveryAppointmentDetails) {
                setDeliveryAppointmentType(order.deliveryAppointmentDetails.type || 'Window');
                if (order.deliveryAppointmentDetails.date) {
                    const dateObj = new Date(order.deliveryAppointmentDetails.date);
                    setDeliveryAppointmentDate(dateObj.toISOString().split('T')[0]);
                }
                setDeliveryAppointmentTime(order.deliveryAppointmentDetails.time || '12:00');
                setDeliveryUnloadingInstructions(order.deliveryAppointmentDetails.unloadingInstructions || '');
            }

            // Documents and Notes
            setInternalNotes(order.internalNotes || '');
            setCustomerNotes(order.customerNotes || '');
            
            // Existing documents (URLs from database)
            if (order.documents) {
                setExistingDocuments({
                    bol: order.documents.bol || null,
                    pod: order.documents.pod || null,
                    customsHazmat: Array.isArray(order.documents.customsHazmat) ? order.documents.customsHazmat : [],
                    rateConfirmation: order.documents.rateConfirmation || null,
                    stampedManifest: order.documents.stampedManifest || null,
                    loadSecurement: Array.isArray(order.documents.loadSecurement) ? order.documents.loadSecurement : [],
                    printedManifest: order.documents.printedManifest || null
                });
            } else {
                setExistingDocuments({});
            }
        } else {
            // Reset all fields when creating new order
            setSelectedCustomer(null);
            setCustomerSearch('');
            setCustomerOrderNo('');
            setLoadType('FTL');
            setFreightOn('Order');
            setSelectedSalesman('');
            setOrderNotes('');
            setCommodity('');
            setValueOfGoods('');
            setValueOfGoodsCurrency('CAD');
            setSelectedEquipment([]);
            setNoOfPackages('');
            setNoOfPackagesType('');
            setWeight('');
            setWeightUnit('kg');
            setTemperature('');
            setTemperatureUnit('Celsius');
            setDimensionL('');
            setDimensionB('');
            setDimensionH('');
            setDimensionUnit('cm');
            setDistance('');
            setAdditionalInfo({
                CSA: false,
                CTPAT: false,
                PIP: false,
                HAZMAT: false,
                TARP: false,
                OverDimension: false
            });

            // Reset Border Info
            setBorderRequired(false);
            setBorderDirection("CA_TO_US");
            setPortOfEntry("");
            setCargoDescription("");
            setHsCode("");
            setBrokerName("");
            setBrokerPhone("");
            setBrokerEmail("");
            setCommercialValue("");
            setCountryOfOrigin("");

            setPickupLocationAddress('');
            setPickupDate(new Date().toISOString().split('T')[0]);
            setPickupTime('12:00');
            setPickupAppointment('No');
            setPickupRefNo('');
            setPickupNote('');
            setDeliveryLocationAddress('');
            setDeliveryDate(new Date().toISOString().split('T')[0]);
            setDeliveryTime('12:00');
            setDeliveryAppointment('No');
            setDeliveryRefNo('');
            setDeliveryNote('');

            // Reset new fields
            setSelectedShipperCustomer(null);
            setShipperCustomerSearch('');
            setShipperName('');
            setShipperPhone('');
            setShipperEmail('');
            setShipperAddress('');
            setPickupAppointmentType('FCFS');
            setPickupAppointmentDate(new Date().toISOString().split('T')[0]);
            setPickupAppointmentTime('12:00');
            setPickupSpecialInstructions('');
            setPickupGatePass('');
            setSelectedReceiverCustomer(null);
            setReceiverCustomerSearch('');
            setReceiverName('');
            setReceiverPhone('');
            setReceiverAddress('');
            setDeliveryAppointmentType('Window');
            setDeliveryAppointmentDate(new Date().toISOString().split('T')[0]);
            setDeliveryAppointmentTime('12:00');
            setDeliveryUnloadingInstructions('');
            setBolFile(null);
            setCustomsHazmatFiles([]);
            setRateConfirmationFile(null);
            setPodFile(null);
            setStampedManifestFile(null);
            setLoadSecurementFiles([]);
            setExistingDocuments({});
            setInternalNotes('');
            setCustomerNotes('');
            setCurrentStep(1);
        }
    }, [order, customers]);

    // Helper function to get customer address
    const getCustomerAddress = (customer: Customer | null): { address: string; city: string; state: string; country: string; zipCode: string } => {
        if (!customer) return { address: '', city: '', state: '', country: '', zipCode: '' };
        
        return {
            address: customer.customerDetails?.address || customer.address || '',
            city: customer.customerDetails?.city || customer.city || '',
            state: customer.customerDetails?.state || customer.state || '',
            country: customer.customerDetails?.country || customer.country || '',
            zipCode: customer.customerDetails?.zipCode || ''
        };
    };

    // Format full address as single string
    const formatFullAddress = (customer: Customer | null): string => {
        if (!customer) return '';
        const addr = getCustomerAddress(customer);
        const parts = [
            addr.address,
            addr.city,
            addr.state,
            addr.country,
            addr.zipCode
        ].filter(Boolean);
        return parts.join(' ');
    };

    // Effect to determine Border Requirement
    useEffect(() => {
        const shipperCountry = selectedShipperCustomer?.customerDetails?.country || selectedShipperCustomer?.country || '';

        // Auto-fill some fields if border is required and fields are empty
        if (borderRequired) {
            if (!cargoDescription && commodity) setCargoDescription(commodity);
            if (!commercialValue && valueOfGoods) setCommercialValue(valueOfGoods);
        }

    }, [selectedShipperCustomer, commodity, valueOfGoods, borderRequired]);

    const fetchCustomers = async () => {
        try {
            const response = await listCustomer();
            if (response?.success && response?.data) {
                setCustomers(response.data || []);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const packageTypes = ["Bag", "Bale", "Barrel", "Basket", "Bin", "Bing Chest", "Box", "Bucket", "Bundle", "Cage", "Carton", "Case", "Chest", "Container", "Crate", "Drum", "Envelope", "Package", "Pallet", "Parcel", "Piece", "Reel", "Roll", "Sack", "Skid", "Tank", "Tote", "Tray", "Tub", "Unit"];

    const equipmentTypes = ["Truck", "Van", "Trailer", "Container", "Flatbed", "Refrigerated"];
    const weightUnits = ["kg", "lbs", "tons"];
    const dimensionUnits = ["cm", "inch", "m", "ft"];
    const currencyOptions = [
        { value: "CAD", label: "CAD - Canadian Dollar" },
        { value: "INR", label: "INR - Indian Rupee" },
        { value: "USD", label: "USD - US Dollar" }
    ];

    const customerDropdownRef = useRef<HTMLDivElement>(null);
    const shipperCustomerDropdownRef = useRef<HTMLDivElement>(null);
    const receiverCustomerDropdownRef = useRef<HTMLDivElement>(null);
    const equipmentDropdownRef = useRef<HTMLDivElement>(null);
    const packagesDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (customerDropdownRef.current && target && !customerDropdownRef.current.contains(target)) {
                setCustomerDropdownOpen(false);
            }
            if (shipperCustomerDropdownRef.current && target && !shipperCustomerDropdownRef.current.contains(target)) {
                setShipperCustomerDropdownOpen(false);
            }
            if (receiverCustomerDropdownRef.current && target && !receiverCustomerDropdownRef.current.contains(target)) {
                setReceiverCustomerDropdownOpen(false);
            }
            if (equipmentDropdownRef.current && target && !equipmentDropdownRef.current.contains(target)) {
                setEquipmentDropdownOpen(false);
            }
            if (packagesDropdownRef.current && target && !packagesDropdownRef.current.contains(target)) {
                setNoOfPackagesDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCustomers = customers.filter(customer =>
        (customer.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
        (customer.address || '').toLowerCase().includes(customerSearch.toLowerCase())
    );

    // Filtered customers for shipper
    const filteredShipperOptions = useMemo(() => {
        const searchTerm = shipperCustomerSearch.toLowerCase();
        return customers.filter(customer =>
            (customer.name || '').toLowerCase().includes(searchTerm) ||
            (customer.customerDetails?.address || customer.address || '').toLowerCase().includes(searchTerm) ||
            (customer.email || '').toLowerCase().includes(searchTerm) ||
            (customer.customerDetails?.city || customer.city || '').toLowerCase().includes(searchTerm)
        );
    }, [customers, shipperCustomerSearch]);

    // Filtered customers for receiver
    const filteredReceiverOptions = useMemo(() => {
        const searchTerm = receiverCustomerSearch.toLowerCase();
        return customers.filter(customer =>
            (customer.name || '').toLowerCase().includes(searchTerm) ||
            (customer.customerDetails?.address || customer.address || '').toLowerCase().includes(searchTerm) ||
            (customer.email || '').toLowerCase().includes(searchTerm) ||
            (customer.customerDetails?.city || customer.city || '').toLowerCase().includes(searchTerm)
        );
    }, [customers, receiverCustomerSearch]);

    // Handler for shipper customer selection
    const handleShipperSelect = (customer: Customer) => {
        setSelectedShipperCustomer(customer);
        setShipperCustomerSearch("");
        setShipperCustomerDropdownOpen(false);
        
        // Auto-fill shipper fields from customer
        if (customer.name) setShipperName(customer.name);
        if (customer.phone) setShipperPhone(customer.phone);
        if (customer.email) setShipperEmail(customer.email);
        
        // Auto-fill pickup location address (full address as single string)
        const fullAddress = formatFullAddress(customer);
        setPickupLocationAddress(fullAddress);
        setShipperAddress(fullAddress);
    };

    // Handler for receiver customer selection
    const handleReceiverSelect = (customer: Customer) => {
        setSelectedReceiverCustomer(customer);
        setReceiverCustomerSearch("");
        setReceiverCustomerDropdownOpen(false);
        
        // Auto-fill receiver fields from customer
        if (customer.name) setReceiverName(customer.name);
        if (customer.phone) setReceiverPhone(customer.phone);
        
        // Auto-fill delivery location address (full address as single string)
        const fullAddress = formatFullAddress(customer);
        setDeliveryLocationAddress(fullAddress);
        setReceiverAddress(fullAddress);
    };

    const filteredPackages = packageTypes.filter(pkg =>
        pkg.toLowerCase().includes(noOfPackagesSearch.toLowerCase())
    );


    const handleEquipmentToggle = (equipment: string) => {
        setSelectedEquipment(prev =>
            prev.includes(equipment)
                ? prev.filter(e => e !== equipment)
                : [...prev, equipment]
        );
    };

    const handleAdditionalInfoToggle = (key: keyof typeof additionalInfo) => {
        setAdditionalInfo(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // File handling functions
    const handleFileUpload = (file: File, type: 'bol' | 'customs' | 'rate' | 'pod' | 'stampedManifest' | 'loadSecurement') => {
        if (type === 'bol') {
            setBolFile(file);
        } else if (type === 'customs') {
            setCustomsHazmatFiles(prev => [...prev, file]);
        } else if (type === 'rate') {
            setRateConfirmationFile(file);
        } else if (type === 'pod') {
            setPodFile(file);
        } else if (type === 'stampedManifest') {
            setStampedManifestFile(file);
        } else if (type === 'loadSecurement') {
            setLoadSecurementFiles(prev => [...prev, file]);
        }
    };

    const removeFile = (type: 'bol' | 'customs' | 'rate' | 'pod' | 'stampedManifest' | 'loadSecurement', index?: number) => {
        if (type === 'bol') {
            setBolFile(null);
        } else if (type === 'customs' && index !== undefined) {
            setCustomsHazmatFiles(prev => prev.filter((_, i) => i !== index));
        } else if (type === 'rate') {
            setRateConfirmationFile(null);
        } else if (type === 'pod') {
            setPodFile(null);
        } else if (type === 'stampedManifest') {
            setStampedManifestFile(null);
        } else if (type === 'loadSecurement' && index !== undefined) {
            setLoadSecurementFiles(prev => prev.filter((_, i) => i !== index));
        }
    };


    // Get suggestions as user types
    const fetchSuggestions = async (field: string, value: string) => {
        if (!value || value.trim().length < 2) {
            if (field === 'commodity') setCommoditySuggestions([]);
            if (field === 'shipperName') setShipperNameSuggestions([]);
            if (field === 'receiverName') setReceiverNameSuggestions([]);
            return;
        }

        try {
            const customerId = selectedCustomer?._id || selectedCustomer?.id;
            const customerIdStr = customerId ? String(customerId) : undefined;
            const response = await getOrderSuggestions(field, value, customerIdStr);

            if (response?.success && response?.data) {
                if (field === 'commodity') {
                    setCommoditySuggestions(response.data);
                    setShowCommoditySuggestions(true);
                } else if (field === 'shipperName') {
                    setShipperNameSuggestions(response.data);
                    setShowShipperNameSuggestions(true);
                } else if (field === 'receiverName') {
                    setReceiverNameSuggestions(response.data);
                    setShowReceiverNameSuggestions(true);
                }
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    // Debounce function for suggestions
    const debounce = (func: Function, wait: number) => {
        let timeout: NodeJS.Timeout;
        return function executedFunction(...args: any[]) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    const debouncedFetchSuggestions = useCallback(
        debounce((field: string, value: string) => fetchSuggestions(field, value), 300),
        [selectedCustomer]
    );

    // Step navigation
    const nextStep = () => {
        if (currentStep < 6) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Validation for each step
    const validateStep = (step: number): boolean => {
        if (step === 1) {
            if (!customerOrderNo) {
                addNotification('error', "Please enter customer order number");
                return false;
            }
            if (!commodity) {
                addNotification('error', "Please enter commodity");
                return false;
            }

            if (borderRequired) {
                if (!borderDirection) { addNotification('error', "Border Direction is required"); return false; }
                if (!portOfEntry) { addNotification('error', "Port of Entry is required"); return false; }
                if (!brokerName) { addNotification('error', "Broker Name is required"); return false; }
                if (!brokerPhone) { addNotification('error', "Broker Phone is required"); return false; }
                if (!cargoDescription) { addNotification('error', "Cargo Description is required"); return false; }
            }
        } else if (step === 2) {
            if (!selectedShipperCustomer) {
                addNotification('error', "Please select a shipper customer");
                return false;
            }
            if (!shipperName) {
                addNotification('error', "Please enter shipper name");
                return false;
            }
            if (!shipperPhone) {
                addNotification('error', "Please enter shipper phone");
                return false;
            }
            if (!pickupLocationAddress) {
                addNotification('error', "Please select a shipper customer to set pickup location");
                return false;
            }
        } else if (step === 3) {
            if (!receiverName) {
                addNotification('error', "Please enter receiver name");
                return false;
            }
            if (!receiverPhone) {
                addNotification('error', "Please enter receiver phone");
                return false;
            }
        } else if (step === 4) {
            // Documents step - no required validation
        }
        return true;
    };

    const handleNextStep = () => {
        if (validateStep(currentStep)) {
            nextStep();
        }
    };

    const handleSaveOrder = async () => {
        // Final validation
        // Use shipper customer as the order customer if available, otherwise use receiver customer
        const orderCustomer = selectedShipperCustomer || selectedReceiverCustomer || selectedCustomer;
        if (!orderCustomer) {
            addNotification('error', "Please select a shipper or receiver customer");
            return;
        }
        if (!selectedShipperCustomer) {
            addNotification('error', "Please select a shipper customer");
            return;
        }
        if (!pickupLocationAddress) {
            addNotification('error', "Please select a shipper customer to set pickup location");
            return;
        }
        if (!customerOrderNo) {
            addNotification('error', "Please enter customer order number");
            return;
        }
        if (!shipperName || !shipperPhone) {
            addNotification('error', "Please complete shipper information");
            return;
        }
        if (!receiverName || !receiverPhone) {
            addNotification('error', "Please complete receiver information");
            return;
        }

        setLoading(true);
        try {
            // Build pickup date - combine date and time
            const pickupDateTime = pickupDate && pickupTime
                ? new Date(`${pickupDate}T${pickupTime}`).toISOString()
                : pickupDate ? new Date(pickupDate).toISOString() : null;

            // Build delivery date - combine date and time
            const deliveryDateTime = deliveryDate && deliveryTime
                ? new Date(`${deliveryDate}T${deliveryTime}`).toISOString()
                : deliveryDate ? new Date(deliveryDate).toISOString() : null;

            // Create FormData for file uploads
            const formData = new FormData();

            // Append files
            if (bolFile) {
                formData.append('bol', bolFile);
            }
            if (podFile) {
                formData.append('pod', podFile);
            }
            if (stampedManifestFile) {
                formData.append('stampedManifest', stampedManifestFile);
            }
            if (rateConfirmationFile) {
                formData.append('rateConfirmation', rateConfirmationFile);
            }
            if (customsHazmatFiles && customsHazmatFiles.length > 0) {
                customsHazmatFiles.forEach((file) => {
                    formData.append('customsHazmat', file);
                });
            }
            if (loadSecurementFiles && loadSecurementFiles.length > 0) {
                loadSecurementFiles.forEach((file) => {
                    formData.append('loadSecurement', file);
                });
            }

            // Build order data as JSON string for FormData
            const orderData = {
                customerOrderNo: customerOrderNo,
                tripNo: '',
                orderType: loadType || 'Regular',
                freightOn: freightOn || 'Order',
                salesman: selectedSalesman || '',
                orderNotes: orderNotes || '',
                customer: orderCustomer._id || orderCustomer.id,
                pickupLocation: {
                    place: pickupLocationAddress || '',
                    latitude: '',
                    longitude: ''
                },
                pickupDate: pickupDateTime,
                pickupTime: pickupTime || '',
                pickupAppointment: pickupAppointment === "Yes",
                pickupRefNo: pickupRefNo || '',
                pickupNote: pickupNote || '',
                deliveryLocation: {
                    place: deliveryLocationAddress || receiverAddress || '',
                    latitude: '',
                    longitude: ''
                },
                deliveryDate: deliveryDateTime,
                deliveryTime: deliveryTime || '',
                deliveryAppointment: deliveryAppointment === "Yes",
                deliveryRefNo: deliveryRefNo || '',
                deliveryNote: deliveryNote || '',
                commodity: commodity || '',
                valueOfGoods: valueOfGoods ? parseFloat(valueOfGoods) : 0,
                valueOfGoodsCurrency: valueOfGoodsCurrency || 'CAD',
                equipment: selectedEquipment || [],
                noOfPackages: noOfPackages ? parseInt(noOfPackages) : 0,
                noOfPackagesType: noOfPackagesType || '',
                weight: weight ? parseFloat(weight) : 0,
                weightUnit: weightUnit || 'kg',
                temperature: temperature ? parseFloat(temperature) : null,
                temperatureUnit: temperatureUnit || 'Celsius',
                weatherConditions: {
                    snow: weatherConditions.snow,
                    highTemperature: weatherConditions.highTemperature
                },
                dimensions: {
                    length: dimensionL ? parseFloat(dimensionL) : 0,
                    width: dimensionB ? parseFloat(dimensionB) : 0,
                    height: dimensionH ? parseFloat(dimensionH) : 0,
                    unit: dimensionUnit || 'cm'
                },
                distance: distance ? parseFloat(distance) : 0,
                additionalInfo: additionalInfo,
                status: 'QUOTED',
                accountingStatus: 'pending',
                totalAmount: valueOfGoods ? parseFloat(valueOfGoods) : 0,
                currency: valueOfGoodsCurrency || 'CAD',

                // Border Information
                borderInfo: borderRequired ? {
                    detailsRequired: true,
                    direction: borderDirection,
                    portOfEntry: portOfEntry,
                    cargoDescription: cargoDescription,
                    hsCode: hsCode,
                    brokerName: brokerName,
                    brokerPhone: brokerPhone,
                    brokerEmail: brokerEmail,
                    commercialValue: commercialValue,
                    countryOfOrigin: countryOfOrigin
                } : null,

                // New fields
                shipper: {
                    name: shipperName,
                    phone: shipperPhone,
                    email: shipperEmail,
                    address: pickupLocationAddress || shipperAddress || ''
                },
                pickupAppointmentDetails: {
                    type: pickupAppointmentType,
                    date: pickupAppointmentDate,
                    time: pickupAppointmentTime,
                    specialInstructions: pickupSpecialInstructions,
                    gatePass: pickupGatePass
                },
                receiver: {
                    name: receiverName,
                    phone: receiverPhone,
                    address: deliveryLocationAddress || receiverAddress || ''
                },
                deliveryAppointmentDetails: {
                    type: deliveryAppointmentType,
                    date: deliveryAppointmentDate,
                    time: deliveryAppointmentTime,
                    unloadingInstructions: deliveryUnloadingInstructions
                },
                // Don't include documents object - files are sent separately via FormData
                internalNotes: internalNotes,
                customerNotes: customerNotes
            };

            // Append all order data fields to FormData
            // Note: FormData automatically handles strings, numbers, and booleans
            // For nested objects and arrays, we need to stringify them
            Object.keys(orderData).forEach((key) => {
                const value = orderData[key as keyof typeof orderData];
                if (value !== null && value !== undefined) {
                    if (key === 'pickupLocation' || key === 'deliveryLocation' || 
                        key === 'shipper' || key === 'receiver' || 
                        key === 'pickupAppointmentDetails' || key === 'deliveryAppointmentDetails' ||
                        key === 'borderInfo' || key === 'weatherConditions' || 
                        key === 'dimensions' || key === 'additionalInfo') {
                        // Stringify nested objects
                        formData.append(key, JSON.stringify(value));
                    } else if (Array.isArray(value)) {
                        // Stringify arrays (like equipment)
                        formData.append(key, JSON.stringify(value));
                    } else if (value instanceof Date) {
                        // Convert Date to ISO string
                        formData.append(key, value.toISOString());
                    } else {
                        // Primitive values (string, number, boolean)
                        formData.append(key, String(value));
                    }
                }
            });

            let response;
            if (order && order._id) {
                // Update existing order
                response = await updateOrder(order._id, formData);
                if (response?.success) {
                    let message = "Order updated successfully!";
                    
                    // Check for validation results
                    if (response?.validation) {
                        const validation = response.validation;
                        setValidationResults(validation); // Store validation results for display
                        
                        if (validation.errors && validation.errors.length > 0) {
                            const errorMessages = validation.errors.map((e: any) => 
                                `${e.document || 'Document'}: ${e.message}`
                            ).join('; ');
                            addNotification('error', `Order updated but document validation failed: ${errorMessages}`);
                        } else if (validation.warnings && validation.warnings.length > 0) {
                            const warningMessages = validation.warnings.map((w: any) => 
                                `${w.document || 'Document'}: ${w.message}`
                            ).join('; ');
                            addNotification('warning', `Order updated with warnings: ${warningMessages}`);
                            message += ` (${validation.warnings.length} document warning(s))`;
                        }
                        if (validation.missing && validation.missing.length > 0) {
                            const missingDocs = validation.missing.map((m: any) => m.type).join(', ');
                            addNotification('warning', `Missing required documents: ${missingDocs}`);
                        }
                    } else {
                        setValidationResults(null); // Clear validation results if none
                    }
                    
                    addNotification('success', message);
                    if (onSave) {
                        onSave();
                    }
                    if (onClose) {
                        onClose();
                    }
                } else {
                    // Check if it's a validation error
                    if (response?.validation && !response.validation.valid) {
                        const errorMessages = response.validation.errors?.map((e: any) => 
                            `${e.document || 'Document'}: ${e.message}`
                        ).join('; ') || response?.message || "Document validation failed";
                        addNotification('error', errorMessages);
                    } else {
                        addNotification('error', response?.message || "Failed to update order");
                    }
                }
            } else {
                // Create new order
                response = await createOrder(formData);
                if (response?.success) {
                    let message = "Order created successfully!";
                    
                    // Check for validation results
                    if (response?.validation) {
                        const validation = response.validation;
                        setValidationResults(validation); // Store validation results for display
                        
                        if (validation.errors && validation.errors.length > 0) {
                            // Validation errors should have blocked creation, but show them if present
                            const errorMessages = validation.errors.map((e: any) => 
                                `${e.document || 'Document'}: ${e.message}`
                            ).join('; ');
                            addNotification('error', `Order created but document validation failed: ${errorMessages}`);
                        } else if (validation.warnings && validation.warnings.length > 0) {
                            const warningMessages = validation.warnings.map((w: any) => 
                                `${w.document || 'Document'}: ${w.message}`
                            ).join('; ');
                            addNotification('warning', `Order created with warnings: ${warningMessages}`);
                            message += ` (${validation.warnings.length} document warning(s))`;
                        }
                        if (validation.missing && validation.missing.length > 0) {
                            const missingDocs = validation.missing.map((m: any) => m.type).join(', ');
                            addNotification('warning', `Missing required documents: ${missingDocs}`);
                        }
                    } else {
                        setValidationResults(null); // Clear validation results if none
                    }
                    
                    addNotification('success', message);
                    if (onSave) {
                        onSave();
                    }
                    if (onClose) {
                        onClose();
                    }
                } else {
                    // Check if it's a validation error
                    if (response?.validation && !response.validation.valid) {
                        const errorMessages = response.validation.errors?.map((e: any) => 
                            `${e.document || 'Document'}: ${e.message}`
                        ).join('; ') || response?.message || "Document validation failed";
                        addNotification('error', errorMessages);
                    } else {
                        addNotification('error', response?.message || "Failed to create order");
                    }
                }
            }
        } catch (error) {
            console.error(`Error ${order ? 'updating' : 'creating'} order:`, error);
            addNotification('error', `Failed to ${order ? 'update' : 'create'} order. Please try again.`);
        } finally {
            setLoading(false);
        }
    };


    // Calculate distance between shipper and receiver addresses
    const [calculatingDistance, setCalculatingDistance] = useState(false);
    const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);

    // Haversine formula to calculate distance between two coordinates
    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    };

    const calculateDistance = async () => {
        const originAddress = pickupLocationAddress || shipperAddress;
        const destinationAddress = deliveryLocationAddress || receiverAddress;

        if (!originAddress || !destinationAddress) {
            addNotification('warning', 'Please select both shipper and receiver addresses to calculate distance');
            return null;
        }

        setCalculatingDistance(true);
        try {
            // Use OpenCage Geocoding API to get coordinates
            const OPENCAGE_API_KEY = import.meta.env.VITE_OPENCAGE_API_KEY || '9854722a0d444bbf96fa61cec79790b6';
            
            // Geocode origin
            const originUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(originAddress)}&key=${OPENCAGE_API_KEY}`;
            const originRes = await fetch(originUrl);
            const originData = await originRes.json();
            
            if (originData.status?.code !== 200 || !originData.results || originData.results.length === 0) {
                throw new Error(`Could not geocode origin address: ${originData.status?.message || 'Unknown error'}`);
            }
            const origin = originData.results[0].geometry;
            const originLat = parseFloat(origin.lat);
            const originLng = parseFloat(origin.lng);

            // Geocode destination
            const destUrl = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(destinationAddress)}&key=${OPENCAGE_API_KEY}`;
            const destRes = await fetch(destUrl);
            const destData = await destRes.json();
            
            if (destData.status?.code !== 200 || !destData.results || destData.results.length === 0) {
                throw new Error(`Could not geocode destination address: ${destData.status?.message || 'Unknown error'}`);
            }
            const destination = destData.results[0].geometry;
            const destLat = parseFloat(destination.lat);
            const destLng = parseFloat(destination.lng);

            // Calculate distance using Haversine formula (straight-line distance)
            const distanceInKm = haversineDistance(originLat, originLng, destLat, destLng);
            const distanceInMiles = distanceInKm * 0.621371;
            
            setCalculatedDistance(distanceInMiles);
            setDistance(distanceInMiles.toFixed(2));
            addNotification('success', `Distance calculated: ${distanceInMiles.toFixed(2)} miles (${distanceInKm.toFixed(2)} km)`);
            return distanceInMiles;
        } catch (error: any) {
            console.error('Error calculating distance:', error);
            addNotification('error', `Failed to calculate distance: ${error.message || 'Unknown error'}`);
            return null;
        } finally {
            setCalculatingDistance(false);
        }
    };

    // Auto-calculate distance when both addresses are available
    useEffect(() => {
        const originAddress = pickupLocationAddress || shipperAddress;
        const destinationAddress = deliveryLocationAddress || receiverAddress;
        
        // Only auto-calculate if we're on the review step and both addresses are available
        if (currentStep === 6 && originAddress && destinationAddress && !calculatedDistance && !calculatingDistance) {
            calculateDistance();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, pickupLocationAddress, shipperAddress, deliveryLocationAddress, receiverAddress]);

    const stepNames = ["Details", "Shipper", "Receiver", "Documents", "Upload Load Securement Pictures", "Review"];

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-5 border-b-2 border-gray-200 bg-gradient-to-r from-white to-gray-50 flex-shrink-0 shadow-sm">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-bold text-gray-800">{order ? 'Edit Order' : 'Create New Order'}</h2>
                    </div>
                    {/* Step Indicator */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {stepNames.map((name, index) => (
                            <div key={index} className="flex items-center">
                                <div className={`flex items-center gap-2 ${index + 1 === currentStep ? 'text-white' : index + 1 < currentStep ? 'text-green-600' : 'text-gray-400'}`} style={index + 1 === currentStep ? { color: PRIMARY_COLOR } : {}}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all text-white ${index + 1 === currentStep ? 'shadow-md ring-2' :
                                        index + 1 < currentStep ? 'bg-green-600' :
                                            'bg-gray-200 text-gray-500'
                                        }`} style={index + 1 === currentStep ? { background: PRIMARY_GRADIENT, '--tw-ring-color': PRIMARY_LIGHT_BG } as React.CSSProperties & { '--tw-ring-color'?: string } : {}}>
                                        {index + 1 < currentStep ? '✓' : index + 1}
                                    </div>
                                    <span className="text-xs font-medium hidden sm:inline">{name}</span>
                                </div>
                                {index < stepNames.length - 1 && (
                                    <div className={`w-10 h-1 mx-2 rounded-full transition-colors ${index + 1 < currentStep ? 'bg-green-600' : 'bg-gray-200'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-4"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto px-4 py-4">
                <div className="w-full mx-auto space-y-6 min-w-0">
                    {/* Step 1: Details Section */}
                    {currentStep === 1 && (
                        <div className="border-b border-gray-200">
                            <div className="p-5 border-b border-gray-200" style={{ background: `linear-gradient(to right, ${PRIMARY_LIGHT_BG}, rgba(229, 231, 235, 0.5))` }}>
                                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold" style={{ background: PRIMARY_GRADIENT }}>1</span>
                                    Order Details
                                </h3>
                                <p className="text-xs text-gray-600 mt-1 ml-10">Enter basic order information and shipment details</p>
                            </div>
                            <div className="px-5 pt-5 pb-0 space-y-6">
                                {/* Customer Information */}
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Customer Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                        {/* Customer Order # */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Customer Order # *</label>
                                            <input
                                                type="text"
                                                value={customerOrderNo}
                                                onChange={(e) => setCustomerOrderNo(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                            />
                                        </div>

                                        {/* Order Type Toggle */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Order Type</label>
                                            <div className="flex border border-gray-300 rounded overflow-hidden">
                                                <button
                                                    onClick={() => setLoadType("FTL")}
                                                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${loadType === "FTL"
                                                        ? "!text-white"
                                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                                        }`}
                                                    style={loadType === "FTL" ? { background: PRIMARY_GRADIENT } : {}}
                                                >
                                                    FTL
                                                </button>
                                                <button
                                                    onClick={() => setLoadType("LTL")}
                                                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${loadType === "LTL"
                                                        ? "!text-white"
                                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                                        }`}
                                                    style={loadType === "LTL" ? { background: PRIMARY_GRADIENT } : {}}
                                                >
                                                    LTL
                                                </button>
                                            </div>
                                        </div>

                                        {/* Freight on Toggle */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Freight on</label>
                                            <div className="flex border border-gray-300 rounded overflow-hidden">
                                                <button
                                                    onClick={() => setFreightOn("Order")}
                                                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${freightOn === "Order"
                                                        ? "!text-white"
                                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    Order
                                                </button>
                                                <button
                                                    onClick={() => setFreightOn("Item")}
                                                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${freightOn === "Item"
                                                        ? "!text-white"
                                                        : "bg-white text-gray-700 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    Item
                                                </button>
                                            </div>
                                        </div>

                                        {/* Salesman */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Salesman</label>
                                            <div className="flex gap-1">
                                                <select
                                                    value={selectedSalesman}
                                                    onChange={(e) => setSelectedSalesman(e.target.value)}
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="john">John Doe</option>
                                                    <option value="jane">Jane Smith</option>
                                                </select>
                                                <button
                                                    className="px-2 rounded text-xl leading-none flex-shrink-0 transition-colors"
                                                    style={{ color: PRIMARY_COLOR }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_LIGHT_BG}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                                                >+</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">General Order Notes</label>
                                        <textarea
                                            rows={2}
                                            value={orderNotes}
                                            onChange={(e) => setOrderNotes(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2  text-sm"
                                            placeholder="Enter any additional notes for this order..."
                                        />
                                    </div>
                                </div>

                                {/* Shipment Section - Part of Step 1 */}
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                                        <h4 className="text-sm font-semibold text-gray-800">Shipment Details</h4>
                                    </div>
                                    {/* Top Fields */}
                                    <div className="space-y-4">
                                        {/* Commodity */}
                                        <div className="flex items-center relative">
                                            <label className="w-40 text-sm font-medium text-gray-700 flex-shrink-0">
                                                Commodity <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    value={commodity}
                                                    onChange={(e) => {
                                                        setCommodity(e.target.value);
                                                        debouncedFetchSuggestions('commodity', e.target.value);
                                                    }}
                                                    onFocus={() => {
                                                        if (commodity && commodity.length >= 2) {
                                                            fetchSuggestions('commodity', commodity);
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        setTimeout(() => setShowCommoditySuggestions(false), 200);
                                                    }}
                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    placeholder="Enter commodity"
                                                />
                                                {showCommoditySuggestions && commoditySuggestions.length > 0 && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {commoditySuggestions.map((suggestion, index) => (
                                                            <div
                                                                key={index}
                                                                onClick={() => {
                                                                    setCommodity(suggestion);
                                                                    setShowCommoditySuggestions(false);
                                                                }}
                                                                className="px-3 py-2 cursor-pointer text-sm"
                                                                style={{ '--hover-bg': PRIMARY_LIGHT_BG } as React.CSSProperties}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_LIGHT_BG}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                                                            >
                                                                {suggestion}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Value of goods - Input on left, Dropdown on right (like Weight) */}
                                        <div className="flex items-center">
                                            <label className="w-40 text-sm font-medium text-gray-700 flex-shrink-0">
                                                Value of goods
                                            </label>
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={valueOfGoods}
                                                    onChange={(e) => setValueOfGoods(e.target.value)}
                                                    placeholder="Enter value"
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                                <select
                                                    value={valueOfGoodsCurrency}
                                                    onChange={(e) => setValueOfGoodsCurrency(e.target.value)}
                                                    className="w-48 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm bg-white"
                                                >
                                                    <option value="">Select</option>
                                                    {currencyOptions.map(currency => (
                                                        <option key={currency.value} value={currency.value}>{currency.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Equipment */}
                                        <div className="flex items-start">
                                            <label className="w-40 text-sm font-medium text-gray-700 flex-shrink-0 pt-2">
                                                Equipment
                                            </label>
                                            <div className="flex-1 relative" ref={equipmentDropdownRef}>
                                                <div className="flex gap-2">
                                                    <div
                                                        onClick={() => setEquipmentDropdownOpen(!equipmentDropdownOpen)}
                                                        className="flex-1 p-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-opacity-75 focus-within:ring-2 focus-within:ring-blue-500 flex items-center justify-between"
                                                    >
                                                        <span className="text-sm text-gray-600">
                                                            {selectedEquipment.length > 0
                                                                ? `${selectedEquipment.length} selected`
                                                                : "Select equipment"
                                                            }
                                                        </span>
                                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${equipmentDropdownOpen ? 'rotate-180' : ''}`} />
                                                    </div>
                                                    <button
                                                        className="px-3 py-2 !text-white rounded hover:opacity-90 transition-opacity text-sm font-medium flex-shrink-0 shadow-md"
                                                        style={{ background: PRIMARY_GRADIENT }}
                                                        onClick={() => addNotification('warning', 'Add new equipment functionality coming soon')}
                                                    >
                                                        + Add
                                                    </button>
                                                </div>

                                                {equipmentDropdownOpen && (
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                                        {equipmentTypes.map((equipment) => (
                                                            <label
                                                                key={equipment}
                                                                className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                                                                style={{ '--hover-bg': PRIMARY_LIGHT_BG } as React.CSSProperties}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_LIGHT_BG}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedEquipment.includes(equipment)}
                                                                    onChange={() => handleEquipmentToggle(equipment)}
                                                                    className="w-4 h-4  rounded focus:ring-2"
                                                                />
                                                                <span className="text-sm text-gray-700">{equipment}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* No of Packages - Input on left, Dropdown on right (like Weight) */}
                                        <div className="flex items-center">
                                            <label className="w-40 text-sm font-medium text-gray-700 flex-shrink-0">
                                                No of Packages
                                            </label>
                                            <div className="flex-1 flex gap-2 relative" ref={packagesDropdownRef}>
                                                <input
                                                    type="text"
                                                    value={noOfPackages}
                                                    onChange={(e) => setNoOfPackages(e.target.value)}
                                                    placeholder="Enter number"
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                                <div className="relative w-48">
                                                    <div
                                                        onClick={() => setNoOfPackagesDropdownOpen(!noOfPackagesDropdownOpen)}
                                                        className="flex items-center justify-between p-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-opacity-75 focus-within:ring-2 focus-within:ring-blue-500"
                                                    >
                                                        <span className="text-sm text-gray-600 truncate">
                                                            {noOfPackagesType || "Select"}
                                                        </span>
                                                        {noOfPackagesType && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setNoOfPackagesType("");
                                                                }}
                                                                className="p-0.5 hover:bg-gray-100 rounded mr-1 flex-shrink-0"
                                                            >
                                                                <X className="w-3 h-3 text-gray-400" />
                                                            </button>
                                                        )}
                                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${noOfPackagesDropdownOpen ? 'rotate-180' : ''}`} />
                                                    </div>

                                                    {noOfPackagesDropdownOpen && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                            <div className="p-2 border-b border-gray-200">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                    <input
                                                                        type="text"
                                                                        value={noOfPackagesSearch}
                                                                        onChange={(e) => setNoOfPackagesSearch(e.target.value)}
                                                                        placeholder="Searching..."
                                                                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="overflow-y-auto max-h-48">
                                                                {filteredPackages.map((pkg) => (
                                                                    <div
                                                                        key={pkg}
                                                                        onClick={() => {
                                                                            setNoOfPackagesType(pkg);
                                                                            setNoOfPackagesSearch("");
                                                                            setNoOfPackagesDropdownOpen(false);
                                                                        }}
                                                                        className="px-3 py-2 cursor-pointer text-sm"
                                                                        style={{ '--hover-bg': PRIMARY_LIGHT_BG } as React.CSSProperties}
                                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = PRIMARY_LIGHT_BG}
                                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                                                                    >
                                                                        {pkg}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Weight */}
                                        <div className="flex items-center">
                                            <label className="w-40 text-sm font-medium text-gray-700 flex-shrink-0">
                                                Weight
                                            </label>
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={weight}
                                                    onChange={(e) => setWeight(e.target.value)}
                                                    placeholder="Enter weight"
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                                <select
                                                    value={weightUnit}
                                                    onChange={(e) => setWeightUnit(e.target.value)}
                                                    className="w-24 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm bg-white"
                                                >
                                                    <option value="">Unit</option>
                                                    {weightUnits.map(unit => (
                                                        <option key={unit} value={unit}>{unit}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Temperature */}
                                        <div className="flex items-center">
                                            <label className="w-40 text-sm font-medium text-gray-700 flex-shrink-0">
                                                Temperature
                                            </label>
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={temperature}
                                                    onChange={(e) => setTemperature(e.target.value)}
                                                    placeholder="Enter temperature"
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                                <select
                                                    value={temperatureUnit}
                                                    onChange={(e) => setTemperatureUnit(e.target.value)}
                                                    className="w-32 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm bg-white"
                                                >
                                                    <option value="Celsius">Celsius</option>
                                                    <option value="Fahrenheit">Fahrenheit</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Weather Conditions */}
                                        <div className="flex items-center">
                                            <label className="w-40 text-sm font-medium text-gray-700 flex-shrink-0">
                                                Weather Conditions
                                            </label>
                                            <div className="flex-1 flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={weatherConditions.snow}
                                                        onChange={(e) => setWeatherConditions(prev => ({ ...prev, snow: e.target.checked }))}
                                                        className="w-4 h-4  border-gray-300 rounded focus:ring-2"
                                                    />
                                                    <span className="text-sm text-gray-700">Snow Conditions</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={weatherConditions.highTemperature}
                                                        onChange={(e) => setWeatherConditions(prev => ({ ...prev, highTemperature: e.target.checked }))}
                                                        className="w-4 h-4  border-gray-300 rounded focus:ring-2"
                                                    />
                                                    <span className="text-sm text-gray-700">High Temperature</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Dimensions */}
                                        <div className="mb-4 mt-4">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Dimension (LxBxH)</label>
                                            <div className="flex gap-2 items-center flex-wrap">
                                                <input
                                                    type="text"
                                                    value={dimensionL}
                                                    onChange={(e) => setDimensionL(e.target.value)}
                                                    placeholder="L"
                                                    className="w-20 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                                <span className="text-gray-400 text-sm">×</span>
                                                <input
                                                    type="text"
                                                    value={dimensionB}
                                                    onChange={(e) => setDimensionB(e.target.value)}
                                                    placeholder="B"
                                                    className="w-20 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                                <span className="text-gray-400 text-sm">×</span>
                                                <input
                                                    type="text"
                                                    value={dimensionH}
                                                    onChange={(e) => setDimensionH(e.target.value)}
                                                    placeholder="H"
                                                    className="w-20 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                                <select
                                                    value={dimensionUnit}
                                                    onChange={(e) => setDimensionUnit(e.target.value)}
                                                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm min-w-[100px]"
                                                >
                                                    <option value="">Select</option>
                                                    {dimensionUnits.map(unit => (
                                                        <option key={unit} value={unit}>{unit}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>



                                        {/* Border Information Section - ONLY SHOW IF CROSS BORDER */}
                                        {borderRequired && (
                                            <div className="bg-white rounded-lg border-2 border-orange-200 p-4 mt-6 mb-4">
                                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-orange-200">
                                                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                        Border Information

                                                    </h4>
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Direction and Port */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Border Direction</label>
                                                            <select
                                                                value={borderDirection}
                                                                onChange={(e) => setBorderDirection(e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm bg-gray-50 font-medium text-gray-800"
                                                            >
                                                                <option value="CA_TO_US">CA → US (ACE)</option>
                                                                <option value="US_TO_CA">US → CA (ACI)</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Port of Entry</label>
                                                            <select
                                                                value={portOfEntry}
                                                                onChange={(e) => setPortOfEntry(e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm bg-white"
                                                            >
                                                                <option value="">Select Port</option>
                                                                {PORT_OPTIONS.map(port => (
                                                                    <option key={port} value={port}>{port}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Broker Information */}
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="md:col-span-1">
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Broker Name</label>
                                                            <div className="relative">
                                                                <input
                                                                    list="broker-options"
                                                                    type="text"
                                                                    value={brokerName}
                                                                    onChange={(e) => setBrokerName(e.target.value)}
                                                                    placeholder="Select or type broker"
                                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                                />
                                                                <datalist id="broker-options">
                                                                    {BROKER_OPTIONS.map(broker => (
                                                                        <option key={broker} value={broker} />
                                                                    ))}
                                                                </datalist>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Broker Phone</label>
                                                            <input
                                                                type="text"
                                                                value={brokerPhone}
                                                                onChange={(e) => setBrokerPhone(e.target.value)}
                                                                placeholder="For driver"
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Broker Email</label>
                                                            <input
                                                                type="email"
                                                                value={brokerEmail}
                                                                onChange={(e) => setBrokerEmail(e.target.value)}
                                                                placeholder="Optional"
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Cargo Details for Border */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Cargo Description</label>
                                                            <input
                                                                type="text"
                                                                value={cargoDescription}
                                                                onChange={(e) => setCargoDescription(e.target.value)}
                                                                placeholder="Plain English (CBP rule)"
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">HS Code</label>
                                                            <input
                                                                type="text"
                                                                value={hsCode}
                                                                onChange={(e) => setHsCode(e.target.value)}
                                                                placeholder="Recommend for faster clearance"
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Value/Country Origin */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Commercial Value</label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={commercialValue}
                                                                    onChange={(e) => setCommercialValue(e.target.value)}
                                                                    placeholder="Customs value"
                                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                                />
                                                                <div className="flex items-center px-3 bg-gray-50 border border-gray-300 rounded text-gray-500 text-sm">
                                                                    {valueOfGoodsCurrency || 'CAD'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Country of Origin</label>
                                                            <input
                                                                type="text"
                                                                value={countryOfOrigin}
                                                                onChange={(e) => setCountryOfOrigin(e.target.value)}
                                                                placeholder="Optional"
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        </div>
                    )}



                    {
                        currentStep === 2 && (
                            <div className="border-b border-gray-200">
                                <div className="p-5 border-b border-gray-200" style={{ background: `linear-gradient(to right, ${PRIMARY_LIGHT_BG}, rgba(229, 231, 235, 0.5))` }}>
                                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold" style={{ background: PRIMARY_GRADIENT }}>2</span>
                                        Shipper Information
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1 ml-10">Enter shipper contact details and pickup appointment information</p>
                                </div>
                                <div className="px-5 pt-5 pb-0 space-y-6">

                                    {/* Shipper Contact Information */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Contact Information</h4>
                                        <div className="space-y-4">
                                            {/* Select Shipper (Customers Only) */}
                                            <div className="relative" ref={shipperCustomerDropdownRef}>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Select Shipper *</label>
                                                <div className="relative">
                                                    <div
                                                        onClick={() => setShipperCustomerDropdownOpen(!shipperCustomerDropdownOpen)}
                                                        className="flex items-center gap-1 p-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-opacity-75"
                                                    >
                                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${shipperCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                                                        <input
                                                            type="text"
                                                            value={
                                                                selectedShipperCustomer 
                                                                    ? `${selectedShipperCustomer.name || ''} | ${formatFullAddress(selectedShipperCustomer) || selectedShipperCustomer.email || ''}`
                                                                    : shipperCustomerSearch
                                                            }
                                                            onChange={(e) => {
                                                                setShipperCustomerSearch(e.target.value);
                                                                setShipperCustomerDropdownOpen(true);
                                                            }}
                                                            onFocus={() => setShipperCustomerDropdownOpen(true)}
                                                            placeholder="Select shipper customer"
                                                            className="flex-1 outline-none text-sm min-w-0"
                                                            readOnly={!!selectedShipperCustomer}
                                                        />
                                                        {selectedShipperCustomer && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedShipperCustomer(null);
                                                                    setShipperCustomerSearch("");
                                                                    setShipperName("");
                                                                    setShipperPhone("");
                                                                    setShipperEmail("");
                                                                    setShipperAddress("");
                                                                    setPickupLocationAddress('');
                                                                }}
                                                                className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                                                            >
                                                                <X className="w-4 h-4 text-gray-400" />
                                                            </button>
                                                        )}
                                                        <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${shipperCustomerDropdownOpen ? '' : 'rotate-180 opacity-0'}`} />
                                                    </div>

                                                    {shipperCustomerDropdownOpen && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                            <div className="p-2 border-b border-gray-200">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                    <input
                                                                        type="text"
                                                                        value={shipperCustomerSearch}
                                                                        onChange={(e) => setShipperCustomerSearch(e.target.value)}
                                                                        placeholder="Search customers..."
                                                                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="overflow-y-auto max-h-48">
                                                                {filteredShipperOptions.length > 0 ? (
                                                                    <>
                                                                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 sticky top-0">
                                                                            Customers
                                                                        </div>
                                                                        {filteredShipperOptions.map((customer) => {
                                                                            const fullAddr = formatFullAddress(customer);
                                                                            return (
                                                                                <div
                                                                                    key={`customer-${customer._id || customer.id}`}
                                                                                    onClick={() => handleShipperSelect(customer)}
                                                                                    className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-50 ${
                                                                                        (selectedShipperCustomer?._id || selectedShipperCustomer?.id) === (customer._id || customer.id) ? 'bg-blue-50' : ''
                                                                                    }`}
                                                                                >
                                                                                    <div className="font-medium" style={{ color: PRIMARY_COLOR }}>{customer.name || 'Unnamed Customer'}</div>
                                                                                    <div className="text-xs text-gray-600">
                                                                                        {fullAddr || customer.email || customer.phone || ''}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </>
                                                                ) : (
                                                                    <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Shipper Name (Read-only, auto-populated) */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Shipper Name *</label>
                                                <input
                                                    type="text"
                                                    value={shipperName}
                                                    readOnly
                                                    className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm cursor-not-allowed"
                                                    placeholder="Auto-filled from selection"
                                                />
                                            </div>

                                            {/* Shipper Phone (Read-only, auto-populated) */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Shipper Phone *</label>
                                                <input
                                                    type="tel"
                                                    value={shipperPhone}
                                                    readOnly
                                                    className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm cursor-not-allowed"
                                                    placeholder="Auto-filled from selection"
                                                />
                                            </div>

                                            {/* Shipper Email (Read-only, auto-populated) */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Shipper Email (optional)</label>
                                                <input
                                                    type="email"
                                                    value={shipperEmail}
                                                    readOnly
                                                    className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm cursor-not-allowed"
                                                    placeholder="Auto-filled from selection"
                                                />
                                            </div>

                                            {/* Pickup Location Address (Read-only, auto-populated from customer) */}
                                            {selectedShipperCustomer && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Pickup Location Address *</label>
                                                    <input
                                                        type="text"
                                                        value={pickupLocationAddress}
                                                        readOnly
                                                        className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm cursor-not-allowed"
                                                        placeholder="Auto-filled from customer"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Pickup Appointment (Merged) */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                                Pickup Details & Appointment
                                            </h4>

                                            <div className="space-y-4">

                                                {/* Reference No */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Reference No.</label>
                                                    <input
                                                        type="text"
                                                        value={pickupRefNo}
                                                        onChange={(e) => setPickupRefNo(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>

                                                {/* Date & Time (Single source of truth) */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Pickup Date *</label>
                                                        <input
                                                            type="date"
                                                            value={pickupDate}
                                                            onChange={(e) => setPickupDate(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Time *</label>
                                                        <input
                                                            type="time"
                                                            value={pickupTime}
                                                            onChange={(e) => setPickupTime(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Appointment Yes / No */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-2">Appointment Required?</label>
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                value="Yes"
                                                                checked={pickupAppointment === "Yes"}
                                                                onChange={(e) => setPickupAppointment(e.target.value)}
                                                            />
                                                            <span className="text-sm">Yes</span>
                                                        </label>
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="radio"
                                                                value="No"
                                                                checked={pickupAppointment === "No"}
                                                                onChange={(e) => setPickupAppointment(e.target.value)}
                                                            />
                                                            <span className="text-sm">No</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                {/* Appointment Type (Only if Yes) */}
                                                {pickupAppointment === "Yes" && (
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-2">
                                                            Appointment Type *
                                                        </label>
                                                        <div className="flex gap-2">
                                                            {["FCFS", "Window", "Strict Time"].map((type) => (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => setPickupAppointmentType(type)}
                                                                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
                        ${pickupAppointmentType === type
                                                                            ? "bg-blue-50 text-blue-700 border border-blue-300"
                                                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
                                                                        }`}
                                                                >
                                                                    {type}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}


                                                {/* Special Instructions */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Special Instructions</label>
                                                    <textarea
                                                        rows={3}
                                                        value={pickupSpecialInstructions}
                                                        onChange={(e) => setPickupSpecialInstructions(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>

                                                {/* Gate Pass */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Gate Pass / Dock No.</label>
                                                    <input
                                                        type="text"
                                                        value={pickupGatePass}
                                                        onChange={(e) => setPickupGatePass(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>

                                                {/* Pickup Notes */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Pickup Notes</label>
                                                    <textarea
                                                        rows={3}
                                                        value={pickupNote}
                                                        onChange={(e) => setPickupNote(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                                    />
                                                </div>

                                            </div>
                                        </div>

                                    </div>

                                </div>
                            </div>
                        )
                    }

                    {/* Step 3: Receiver Information Section */}
                    {
                        currentStep === 3 && (
                            <div className="border-b border-gray-200">
                                <div className="p-5 bg-gradient-to-r from-green-50 to-gray-50 border-b border-gray-200">
                                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                                        Receiver Information
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1 ml-10">Enter receiver contact details and delivery appointment information</p>
                                </div>
                                <div className="px-5 pt-5 pb-0 space-y-6">

                                    {/* Receiver Contact Information */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Contact Information</h4>
                                        <div className="space-y-4">
                                            {/* Select Receiver (Customers Only) */}
                                            <div className="relative" ref={receiverCustomerDropdownRef}>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Select Receiver *</label>
                                                <div className="relative">
                                                    <div
                                                        onClick={() => setReceiverCustomerDropdownOpen(!receiverCustomerDropdownOpen)}
                                                        className="flex items-center gap-1 p-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-opacity-75"
                                                    >
                                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${receiverCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                                                        <input
                                                            type="text"
                                                            value={
                                                                selectedReceiverCustomer 
                                                                    ? `${selectedReceiverCustomer.name || ''} | ${formatFullAddress(selectedReceiverCustomer) || selectedReceiverCustomer.email || ''}`
                                                                    : receiverCustomerSearch
                                                            }
                                                            onChange={(e) => {
                                                                setReceiverCustomerSearch(e.target.value);
                                                                setReceiverCustomerDropdownOpen(true);
                                                            }}
                                                            onFocus={() => setReceiverCustomerDropdownOpen(true)}
                                                            placeholder="Select receiver customer"
                                                            className="flex-1 outline-none text-sm min-w-0"
                                                            readOnly={!!selectedReceiverCustomer}
                                                        />
                                                        {selectedReceiverCustomer && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedReceiverCustomer(null);
                                                                    setReceiverCustomerSearch("");
                                                                    setReceiverName("");
                                                                    setReceiverPhone("");
                                                                    setReceiverAddress("");
                                                                    setDeliveryLocationAddress('');
                                                                }}
                                                                className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                                                            >
                                                                <X className="w-4 h-4 text-gray-400" />
                                                            </button>
                                                        )}
                                                        <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${receiverCustomerDropdownOpen ? '' : 'rotate-180 opacity-0'}`} />
                                                    </div>

                                                    {receiverCustomerDropdownOpen && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                            <div className="p-2 border-b border-gray-200">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                    <input
                                                                        type="text"
                                                                        value={receiverCustomerSearch}
                                                                        onChange={(e) => setReceiverCustomerSearch(e.target.value)}
                                                                        placeholder="Search customers..."
                                                                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="overflow-y-auto max-h-48">
                                                                {filteredReceiverOptions.length > 0 ? (
                                                                    <>
                                                                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 sticky top-0">
                                                                            Customers
                                                                        </div>
                                                                        {filteredReceiverOptions.map((customer) => {
                                                                            const fullAddr = formatFullAddress(customer);
                                                                            return (
                                                                                <div
                                                                                    key={`customer-${customer._id || customer.id}`}
                                                                                    onClick={() => handleReceiverSelect(customer)}
                                                                                    className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-50 ${
                                                                                        (selectedReceiverCustomer?._id || selectedReceiverCustomer?.id) === (customer._id || customer.id) ? 'bg-blue-50' : ''
                                                                                    }`}
                                                                                >
                                                                                    <div className="font-medium" style={{ color: PRIMARY_COLOR }}>{customer.name || 'Unnamed Customer'}</div>
                                                                                    <div className="text-xs text-gray-600">
                                                                                        {fullAddr || customer.email || customer.phone || ''}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </>
                                                                ) : (
                                                                    <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Receiver Name (Read-only, auto-populated) */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Receiver Name *</label>
                                                <input
                                                    type="text"
                                                    value={receiverName}
                                                    readOnly
                                                    className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm cursor-not-allowed"
                                                    placeholder="Auto-filled from selection"
                                                />
                                            </div>

                                            {/* Receiver Phone (Read-only, auto-populated) */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Receiver Phone *</label>
                                                <input
                                                    type="tel"
                                                    value={receiverPhone}
                                                    readOnly
                                                    className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm cursor-not-allowed"
                                                    placeholder="Auto-filled from selection"
                                                />
                                            </div>

                                            {/* Delivery Location Address (Read-only, auto-populated from customer) */}
                                            {selectedReceiverCustomer && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Location Address *</label>
                                                    <input
                                                        type="text"
                                                        value={deliveryLocationAddress}
                                                        readOnly
                                                        className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm cursor-not-allowed"
                                                        placeholder="Auto-filled from customer"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* Delivery Details & Appointment (Merged) */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                                            Delivery Details & Appointment
                                        </h4>

                                        <div className="space-y-4">

                                            {/* Reference No */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Reference No.
                                                </label>
                                                <input
                                                    type="text"
                                                    value={deliveryRefNo}
                                                    onChange={(e) => setDeliveryRefNo(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                                />
                                            </div>

                                            {/* Appointment Yes / No */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                                    Appointment Required?
                                                </label>
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            value="Yes"
                                                            checked={deliveryAppointment === "Yes"}
                                                            onChange={(e) => setDeliveryAppointment(e.target.value)}
                                                        />
                                                        <span className="text-sm">Yes</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            value="No"
                                                            checked={deliveryAppointment === "No"}
                                                            onChange={(e) => setDeliveryAppointment(e.target.value)}
                                                        />
                                                        <span className="text-sm">No</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Appointment Type (Only if Yes) */}
                                            {deliveryAppointment === "Yes" && (
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-2">
                                                        Appointment Type *
                                                    </label>
                                                    <div className="flex gap-2">
                                                        {["Window", "Strict Time"].map((type) => (
                                                            <button
                                                                key={type}
                                                                onClick={() => setDeliveryAppointmentType(type)}
                                                                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors
                                ${deliveryAppointmentType === type
                                                                        ? "bg-blue-50 text-blue-700 border border-blue-300"
                                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
                                                                    }`}
                                                            >
                                                                {type}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unloading Instructions */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Unloading Instructions
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={deliveryUnloadingInstructions}
                                                    onChange={(e) => setDeliveryUnloadingInstructions(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                                    placeholder="Enter unloading instructions"
                                                />
                                            </div>

                                            {/* Delivery Notes */}
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                    Delivery Notes
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={deliveryNote}
                                                    onChange={(e) => setDeliveryNote(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                                />
                                            </div>

                                        </div>
                                    </div>

                                </div>
                            </div>

                        )
                    }

                    {/* Step 4: Document Area */}
                    {
                        currentStep === 4 && (
                            <div className="border-b border-gray-200">
                                <div className="p-5 bg-gradient-to-r from-purple-50 to-gray-50 border-b border-gray-200">
                                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">4</span>
                                        Documents & Notes
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1 ml-10">Upload documents and add internal or customer notes</p>
                                </div>
                                <div className="px-5 pt-5 pb-0 space-y-6">
                                    {/* Upload BOL */}
                                    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bolFile ? 'bg-green-100' : 'bg-blue-100'}`}>
                                                    <FaFileAlt className={`${bolFile ? 'text-green-600' : 'text-blue-600'}`} size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-gray-800">Bill of Lading (BOL)</h5>
                                                    <p className="text-sm text-gray-500">Optional document for shipment</p>
                                                </div>
                                            </div>
                                            {bolFile ? (
                                                <span className="flex items-center gap-2 text-green-600 font-medium">
                                                    <FaCheck /> Uploaded
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 text-sm font-medium">Optional</span>
                                            )}
                                        </div>
                                        <label className="block">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">
                                                <FaUpload className="text-blue-600" />
                                                <span className="text-blue-600 font-medium">Choose File</span>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        handleFileUpload(e.target.files[0], 'bol');
                                                    }
                                                }}
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            />
                                        </label>
                                        {bolFile && (
                                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FaFileAlt className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm text-green-700 font-medium">{bolFile.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => removeFile('bol')}
                                                    className="text-gray-800 hover:text-gray-900 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        {!bolFile && existingDocuments.bol && (
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FaFileAlt className="w-4 h-4 text-blue-600" />
                                                    <a
                                                        href={existingDocuments.bol}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-700 font-medium hover:underline"
                                                    >
                                                        View Existing BOL
                                                    </a>
                                                </div>
                                                <span className="text-xs text-gray-500">Existing document</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Upload Proof of Delivery */}
                                    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${podFile ? 'bg-green-100' : 'bg-purple-100'}`}>
                                                    <FaFileAlt className={`${podFile ? 'text-green-600' : 'text-purple-600'}`} size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-gray-800">Proof of Delivery (POD)</h5>
                                                    <p className="text-sm text-gray-500">Delivery confirmation document</p>
                                                </div>
                                            </div>
                                            {podFile ? (
                                                <span className="flex items-center gap-2 text-green-600 font-medium">
                                                    <FaCheck /> Uploaded
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 text-sm font-medium">Optional</span>
                                            )}
                                        </div>
                                        <label className="block">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg cursor-pointer transition-colors">
                                                <FaUpload className="text-purple-600" />
                                                <span className="text-purple-600 font-medium">Choose File</span>
                                            </div>
                                            <input
                                                key={podFile ? 'pod-reset' : 'pod-input'}
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        handleFileUpload(e.target.files[0], 'pod');
                                                    }
                                                }}
                                            />
                                        </label>
                                        {podFile && (
                                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FaFileAlt className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm text-green-700 font-medium">{podFile.name}</span>
                                                </div>
                                                <button onClick={() => removeFile('pod')} className="text-gray-800 hover:text-gray-900 transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        {!podFile && existingDocuments.pod && (
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FaFileAlt className="w-4 h-4 text-blue-600" />
                                                    <a
                                                        href={existingDocuments.pod}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-700 font-medium hover:underline"
                                                    >
                                                        View Existing POD
                                                    </a>
                                                </div>
                                                <span className="text-xs text-gray-500">Existing document</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* Upload Stamped Manifest */}
                                    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stampedManifestFile ? 'bg-green-100' : 'bg-green-100'}`}>
                                                    <FaFileAlt className={`${stampedManifestFile ? 'text-green-600' : 'text-green-600'}`} size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-gray-800">Stamped Manifest</h5>
                                                    <p className="text-sm text-gray-500">Stamped manifest document</p>
                                                </div>
                                            </div>
                                            {stampedManifestFile ? (
                                                <span className="flex items-center gap-2 text-green-600 font-medium">
                                                    <FaCheck /> Uploaded
                                                </span>
                                            ) : (
<span className="text-gray-500 text-sm font-medium">Optional</span>
                                            )}
                                        </div>
                                        <label className="block">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg cursor-pointer transition-colors">
                                                <FaUpload className="text-green-600" />
                                                <span className="text-green-600 font-medium">Choose File</span>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        handleFileUpload(e.target.files[0], 'stampedManifest');
                                                    }
                                                }}
                                            />
                                        </label>
                                        {stampedManifestFile && (
                                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FaFileAlt className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm text-green-700 font-medium">{stampedManifestFile.name}</span>
                                                </div>
                                                <button onClick={() => removeFile('stampedManifest')} className="text-gray-800 hover:text-gray-900 transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        {!stampedManifestFile && existingDocuments.stampedManifest && (
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FaFileAlt className="w-4 h-4 text-blue-600" />
                                                    <a
                                                        href={existingDocuments.stampedManifest}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-700 font-medium hover:underline"
                                                    >
                                                        View Existing Stamped Manifest
                                                    </a>
                                                </div>
                                                <span className="text-xs text-gray-500">Existing document</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Customs / HAZMAT docs */}
                                    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${customsHazmatFiles.length > 0 ? 'bg-green-100' : 'bg-orange-100'}`}>
                                                    <FaFileAlt className={`${customsHazmatFiles.length > 0 ? 'text-green-600' : 'text-orange-600'}`} size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-gray-800">Upload Customs / HAZMAT docs</h5>
                                                    <p className="text-sm text-gray-500">Customs and HAZMAT documentation</p>
                                                </div>
                                            </div>
                                            {customsHazmatFiles.length > 0 ? (
                                                <span className="flex items-center gap-2 text-green-600 font-medium">
                                                    <FaCheck /> Uploaded
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 text-sm font-medium">Optional</span>
                                            )}
                                        </div>
                                        <label className="block">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 rounded-lg cursor-pointer transition-colors">
                                                <FaUpload className="text-orange-600" />
                                                <span className="text-orange-600 font-medium">Choose File</span>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        handleFileUpload(e.target.files[0], 'customs');
                                                    }
                                                }}
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                multiple
                                            />
                                        </label>
                                        {customsHazmatFiles.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {customsHazmatFiles.map((file, index) => (
                                                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FaFileAlt className="w-4 h-4 text-green-600" />
                                                            <span className="text-sm text-green-700 font-medium">{file.name}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFile('customs', index)}
                                                            className="text-gray-800 hover:text-gray-900 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {customsHazmatFiles.length === 0 && existingDocuments.customsHazmat && existingDocuments.customsHazmat.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {existingDocuments.customsHazmat.map((url, index) => (
                                                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FaFileAlt className="w-4 h-4 text-blue-600" />
                                                            <a
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-700 font-medium hover:underline"
                                                            >
                                                                View Existing Customs/Hazmat {index + 1}
                                                            </a>
                                                        </div>
                                                        <span className="text-xs text-gray-500">Existing document</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Rate Confirmation */}
                                    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${rateConfirmationFile ? 'bg-green-100' : 'bg-indigo-100'}`}>
                                                    <FaFileAlt className={`${rateConfirmationFile ? 'text-green-600' : 'text-indigo-600'}`} size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-gray-800">Upload Rate Confirmation (for internal use)</h5>
                                                    <p className="text-sm text-gray-500">Internal rate confirmation document</p>
                                                </div>
                                            </div>
                                            {rateConfirmationFile ? (
                                                <span className="flex items-center gap-2 text-green-600 font-medium">
                                                    <FaCheck /> Uploaded
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 text-sm font-medium">Optional</span>
                                            )}
                                        </div>
                                        <label className="block">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition-colors">
                                                <FaUpload className="text-indigo-600" />
                                                <span className="text-indigo-600 font-medium">Choose File</span>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        handleFileUpload(e.target.files[0], 'rate');
                                                    }
                                                }}
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            />
                                        </label>
                                        {rateConfirmationFile && (
                                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FaFileAlt className="w-4 h-4 text-green-600" />
                                                    <span className="text-sm text-green-700 font-medium">{rateConfirmationFile.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => removeFile('rate')}
                                                    className="text-gray-800 hover:text-gray-900 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                        {!rateConfirmationFile && existingDocuments.rateConfirmation && (
                                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <FaFileAlt className="w-4 h-4 text-blue-600" />
                                                    <a
                                                        href={existingDocuments.rateConfirmation}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-blue-700 font-medium hover:underline"
                                                    >
                                                        View Existing Rate Confirmation
                                                    </a>
                                                </div>
                                                <span className="text-xs text-gray-500">Existing document</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Internal Notes */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">Internal Notes</label>
                                        <textarea
                                            rows={4}
                                            value={internalNotes}
                                            onChange={(e) => setInternalNotes(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                            placeholder="Enter internal notes for dispatcher"
                                        />
                                    </div>


                                    {/* Customer Notes */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">Customer Notes</label>
                                        <textarea
                                            rows={4}
                                            value={customerNotes}
                                            onChange={(e) => setCustomerNotes(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                                            placeholder="Enter notes visible to customer"
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    {
                        currentStep === 5 && (
                            <div className="border-b border-gray-200">
                                <div className="p-5 bg-gradient-to-r from-teal-50 to-gray-50 border-b border-gray-200">
                                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-sm font-bold">5</span>
                                        Upload Load Securement Pictures
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1 ml-10">Upload pictures of load securement</p>
                                </div>
                                <div className="px-5 pt-5 pb-0 space-y-6">
                                    <div className="border-2 border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${loadSecurementFiles.length > 0 ? 'bg-green-100' : 'bg-teal-100'}`}>
                                                    <FaFileAlt className={`${loadSecurementFiles.length > 0 ? 'text-green-600' : 'text-teal-600'}`} size={24} />
                                                </div>
                                                <div>
                                                    <h5 className="font-semibold text-gray-800">Upload Load Securement Pictures</h5>
                                                    <p className="text-sm text-gray-500">Pictures of load securement</p>
                                                </div>
                                            </div>
                                            {loadSecurementFiles.length > 0 ? (
                                                <span className="flex items-center gap-2 text-green-600 font-medium">
                                                    <FaCheck /> Uploaded
                                                </span>
                                            ) : (
                                                <span className="text-gray-500 text-sm font-medium">Optional</span>
                                            )}
                                        </div>
                                        <label className="block">
                                            <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 hover:bg-teal-100 rounded-lg cursor-pointer transition-colors">
                                                <FaUpload className="text-teal-600" />
                                                <span className="text-teal-600 font-medium">Choose File</span>
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                multiple
                                                accept=".jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    if (e.target.files) {
                                                        Array.from(e.target.files).forEach((file) =>
                                                            handleFileUpload(file, 'loadSecurement')
                                                        );
                                                    }
                                                }}
                                            />
                                        </label>
                                        {loadSecurementFiles.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {loadSecurementFiles.map((file, index) => (
                                                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FaFileAlt className="w-4 h-4 text-green-600" />
                                                            <span className="text-sm text-green-700 font-medium">{file.name}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFile('loadSecurement', index)}
                                                            className="text-gray-800 hover:text-gray-900 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {loadSecurementFiles.length === 0 && existingDocuments.loadSecurement && existingDocuments.loadSecurement.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                {existingDocuments.loadSecurement.map((url, index) => (
                                                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FaFileAlt className="w-4 h-4 text-blue-600" />
                                                            <a
                                                                href={url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-700 font-medium hover:underline"
                                                            >
                                                                View Existing Load Securement {index + 1}
                                                            </a>
                                                        </div>
                                                        <span className="text-xs text-gray-500">Existing document</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    }
                    {/* Step 5: Review Page */}
                    {
                        currentStep === 6 && (
                            <div className="border-b border-gray-200">
                                <div className="p-5 bg-gradient-to-r from-green-50 to-gray-50 border-b border-gray-200">
                                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">5</span>
                                        Review & Submit
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1 ml-10">Review all information before creating the order</p>
                                </div>
                                <div className="px-5 pt-5 pb-0 space-y-6">
                                    {/* Shipper Summary */}
                                    <div className="bg-white rounded-lg p-5 shadow-sm" style={{ border: `2px solid ${PRIMARY_LIGHT_BG.replace('0.1', '0.3')}` }}>
                                        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: PRIMARY_COLOR }}>
                                            <span className="w-6 h-6 rounded-full text-white flex items-center justify-center text-xs" style={{ background: PRIMARY_GRADIENT }}>1</span>
                                            Shipper Summary
                                        </h4>
                                        <div className="space-y-2.5 text-sm">
                                            <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Name:</span> <span className="text-gray-800">{shipperName || 'N/A'}</span></div>
                                            <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Phone:</span> <span className="text-gray-800">{shipperPhone || 'N/A'}</span></div>
                                            <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Email:</span> <span className="text-gray-800">{shipperEmail || 'N/A'}</span></div>
                                            <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Address:</span> <span className="text-gray-800">{
                                                pickupLocationAddress || shipperAddress || 'N/A'
                                            }</span></div>
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="font-semibold mb-3 text-gray-800">Pickup Appointment:</div>
                                                <div className="space-y-2 ml-4">
                                                    <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Type:</span> <span className="text-gray-800">{pickupAppointmentType}</span></div>
                                                    <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Date:</span> <span className="text-gray-800">{pickupAppointmentDate}</span></div>
                                                    <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Time:</span> <span className="text-gray-800">{pickupAppointmentTime}</span></div>
                                                    {pickupSpecialInstructions && <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Instructions:</span> <span className="text-gray-800">{pickupSpecialInstructions}</span></div>}
                                                    {pickupGatePass && <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Gate Pass/Dock:</span> <span className="text-gray-800">{pickupGatePass}</span></div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Receiver Summary */}
                                    <div className="bg-white border-2 border-green-100 rounded-lg p-5 shadow-sm">
                                        <h4 className="text-sm font-semibold text-green-700 mb-4 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs">2</span>
                                            Receiver Summary
                                        </h4>
                                        <div className="space-y-2.5 text-sm">
                                            <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Name:</span> <span className="text-gray-800">{receiverName || 'N/A'}</span></div>
                                            <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Phone:</span> <span className="text-gray-800">{receiverPhone || 'N/A'}</span></div>
                                            <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Address:</span> <span className="text-gray-800">{
                                                deliveryLocationAddress || receiverAddress || 'N/A'
                                            }</span></div>
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="font-semibold mb-3 text-gray-800">Delivery Appointment:</div>
                                                <div className="space-y-2 ml-4">
                                                    <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Type:</span> <span className="text-gray-800">{deliveryAppointmentType}</span></div>
                                                    <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Date:</span> <span className="text-gray-800">{deliveryAppointmentDate}</span></div>
                                                    <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Time:</span> <span className="text-gray-800">{deliveryAppointmentTime}</span></div>
                                                    {deliveryUnloadingInstructions && <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Unloading:</span> <span className="text-gray-800">{deliveryUnloadingInstructions}</span></div>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Commodity Details */}
                                    <div className="bg-white border-2 border-gray-200 rounded-lg p-5 shadow-sm">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-gray-600 text-white flex items-center justify-center text-xs">3</span>
                                            Commodity Details
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div><span className="font-medium">Commodity:</span> {commodity || 'N/A'}</div>
                                            <div><span className="font-medium">Temperature:</span> {temperature ? `${temperature}° ${temperatureUnit}` : 'N/A'}</div>
                                            <div><span className="font-medium">Weight:</span> {weight ? `${weight} ${weightUnit}` : 'N/A'}</div>
                                            <div><span className="font-medium">Packages:</span> {noOfPackages ? `${noOfPackages} ${noOfPackagesType}` : 'N/A'}</div>
                                            <div><span className="font-medium">Mileage:</span> {calculatedDistance ? `${calculatedDistance.toFixed(2)} miles` : (distance || 'N/A')}</div>
                                            <div><span className="font-medium">Value:</span> {valueOfGoods ? `${valueOfGoods} ${valueOfGoodsCurrency}` : 'N/A'}</div>
                                        </div>
                                    </div>

                                    {/* Document List */}
                                    <div className="bg-white border-2 border-purple-100 rounded-lg p-5 shadow-sm">
                                        <h4 className="text-sm font-semibold text-purple-700 mb-4 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">4</span>
                                            Documents
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                            {bolFile && <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> BOL: {bolFile.name}</div>}
                                            {customsHazmatFiles.length > 0 && (
                                                <div>
                                                    <div className="font-medium mb-1">Customs/HAZMAT:</div>
                                                    {customsHazmatFiles.map((file, index) => (
                                                        <div key={index} className="flex items-center gap-2 ml-4"><FileText className="w-4 h-4" /> {file.name}</div>
                                                    ))}
                                                </div>
                                            )}
                                            {rateConfirmationFile && <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Rate Confirmation: {rateConfirmationFile.name}</div>}
                                            {!bolFile && customsHazmatFiles.length === 0 && !rateConfirmationFile && <div className="text-gray-500">No documents uploaded</div>}
                                        </div>
                                    </div>

                                    {/* Instructions */}
                                    <div className="bg-white border-2 border-amber-100 rounded-lg p-5 shadow-sm">
                                        <h4 className="text-sm font-semibold text-amber-700 mb-4 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">6</span>
                                            All Instructions & Notes
                                        </h4>
                                        <div className="space-y-3 text-sm">
                                            {pickupSpecialInstructions && (
                                                <div>
                                                    <div className="font-medium">Pickup Instructions:</div>
                                                    <div className="text-gray-600">{pickupSpecialInstructions}</div>
                                                </div>
                                            )}
                                            {deliveryUnloadingInstructions && (
                                                <div>
                                                    <div className="font-medium">Delivery Instructions:</div>
                                                    <div className="text-gray-600">{deliveryUnloadingInstructions}</div>
                                                </div>
                                            )}
                                            {internalNotes && (
                                                <div>
                                                    <div className="font-medium">Internal Notes:</div>
                                                    <div className="text-gray-600">{internalNotes}</div>
                                                </div>
                                            )}
                                            {customerNotes && (
                                                <div>
                                                    <div className="font-medium">Customer Notes:</div>
                                                    <div className="text-gray-600">{customerNotes}</div>
                                                </div>
                                            )}
                                            {!pickupSpecialInstructions && !deliveryUnloadingInstructions && !internalNotes && !customerNotes && (
                                                <div className="text-gray-500">No instructions provided</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div >
            </div >
            
            {/* Validation Results Display */}
            {validationResults && (
                <div className="px-5 pb-4">
                    <ValidationDisplay validationResults={validationResults} />
                </div>
            )}
            
            {/* Fixed Footer */}
            < div className="border-t border-gray-200 p-4 bg-white flex-shrink-0 shadow-lg" >
                <div className="flex gap-3 justify-between">
                    <div className="flex gap-3">
                        {currentStep > 1 && (
                            <button
                                onClick={prevStep}
                                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Previous
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors shadow-sm"
                        >
                            Cancel
                        </button>
                        {currentStep < 6 ? (
                            <button
                                onClick={handleNextStep}
                                className="px-6 py-2.5 !text-white font-medium rounded-lg transition-opacity flex items-center gap-2 shadow-md hover:shadow-lg hover:opacity-90"
                                style={{ background: PRIMARY_GRADIENT }}
                            >
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSaveOrder}
                                disabled={loading}
                                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 !text-white font-medium rounded-lg transition-colors disabled:opacity-50 shadow-md hover:shadow-lg disabled:shadow-sm"
                            >
                                {loading ? "Creating..." : "Create Order"}
                            </button>
                        )}
                    </div>
                </div>
            </div >

            {/* Toast Notifications */}
            < div className="fixed top-4 right-4 z-[10002] flex flex-col gap-2" >
                {
                    notifications.map((notification) => (
                        <ToastNotification
                            key={notification.id}
                            notification={notification}
                            onClose={removeNotification}
                        />
                    ))
                }
            </div >

        </div >
    );
};

// Validation Display Component
const ValidationDisplay = ({ validationResults }: { validationResults: any }) => {
    if (!validationResults) return null;

    const { valid, errors, warnings, missing, documentDetails } = validationResults;

    const hasIssues = errors?.length > 0 || warnings?.length > 0 || missing?.length > 0;

    if (!hasIssues) {
        return (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-3">
                <FaCheckCircle size={20} />
                <p className="font-medium">All documents validated successfully!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FaExclamationCircle className={valid ? "text-yellow-500" : "text-red-500"} />
                Document Validation Summary
            </h3>

            {!valid && errors?.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
                    <p className="font-medium mb-2">Critical Errors Found:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {errors.map((err: any, i: number) => (
                            <li key={`err-${i}`}>
                                <strong>{err.document || err.type || 'Document'}:</strong> {err.message}
                                {err.issues && err.issues.length > 0 && (
                                    <ul className="list-disc list-inside ml-4 text-sm text-red-700">
                                        {err.issues.map((issue: string, j: number) => (
                                            <li key={`err-issue-${i}-${j}`}>{issue}</li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {warnings?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg">
                    <p className="font-medium mb-2">Warnings:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {warnings.map((warn: any, i: number) => (
                            <li key={`warn-${i}`}>
                                <strong>{warn.document || warn.type || 'Document'}:</strong> {warn.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {missing?.length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-lg">
                    <p className="font-medium mb-2">Missing Required Documents:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {missing.map((m: any, i: number) => (
                            <li key={`missing-${i}`}>
                                <strong>{m.type}:</strong> {m.message}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {documentDetails?.length > 0 && (
                <div className="space-y-3">
                    <p className="font-medium text-gray-700">Document Details:</p>
                    {documentDetails.map((doc: any, i: number) => (
                        <div key={`doc-detail-${i}`} className="border border-gray-200 rounded-lg p-3 bg-white">
                            <div className="flex items-center gap-2 mb-1">
                                {doc.status === 'valid' && <FaCheckCircle className="text-green-500" size={16} />}
                                {doc.status === 'error' && <FaExclamationCircle className="text-red-500" size={16} />}
                                {doc.status === 'warning' && <FaExclamationCircle className="text-yellow-500" size={16} />}
                                <p className="font-semibold text-gray-800">{doc.document} ({doc.type})</p>
                                {doc.actualType && doc.actualType !== doc.type && (
                                    <span className="text-xs text-red-600 font-medium">(Detected as: {doc.actualType})</span>
                                )}
                            </div>
                            {doc.status !== 'valid' && doc.issues && doc.issues.length > 0 && (
                                <ul className="list-disc list-inside ml-4 text-sm text-gray-600">
                                    {doc.issues.map((issue: string, j: number) => (
                                        <li key={`doc-issue-${i}-${j}`}>{issue}</li>
                                    ))}
                                </ul>
                            )}
                            {doc.expirationDate && (
                                <p className="text-sm text-gray-600 mt-1">Expires: {new Date(doc.expirationDate).toLocaleDateString()}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewOrderSidebar;