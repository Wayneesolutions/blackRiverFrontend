import { useState, useEffect, useRef, useCallback } from "react";
import { X, Plus, ChevronDown, ChevronUp, Search, Pencil, Upload, FileText, ArrowLeft, ArrowRight } from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from "react-icons/fa";
import { listPlace } from "../../../../../axios/api/dispatcher.places";
import { listCustomer, createOrder, updateOrder, autoExtractOrderData, getOrderSuggestions } from "../../../../../axios/api/distapcher";

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

interface Place {
    _id: string;
    name?: string;
    city?: string;
    state?: string;
    currentLocation?: {
        address?: string;
        latitude?: string | number;
        longitude?: string | number;
    };
}

interface Customer {
    _id?: string;
    id?: string | number;
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
}

interface NewOrderSidebarProps {
    order?: any;
    onClose: () => void;
    onSave: () => void;
}

const NewOrderSidebar = ({ order, onClose, onSave }: NewOrderSidebarProps) => {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);

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

    // Pickup location states
    const [pickupPlaces, setPickupPlaces] = useState<Place[]>([]);
    const [selectedPickupPlace, setSelectedPickupPlace] = useState<Place | null>(null);
    const [pickupSearch, setPickupSearch] = useState("");
    const [pickupDropdownOpen, setPickupDropdownOpen] = useState(false);

    // Delivery location states
    const [deliveryPlaces, setDeliveryPlaces] = useState<Place[]>([]);
    const [selectedDeliveryPlace, setSelectedDeliveryPlace] = useState<Place | null>(null);
    const [deliverySearch, setDeliverySearch] = useState("");
    const [deliveryDropdownOpen, setDeliveryDropdownOpen] = useState(false);
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

    // Multi-step form state
    const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Shipper, 3: Receiver, 4: Documents, 5: Review

    // Shipper Information states
    const [shipperName, setShipperName] = useState("");
    const [shipperPhone, setShipperPhone] = useState("");
    const [shipperEmail, setShipperEmail] = useState("");
    const [shipperAddressType, setShipperAddressType] = useState<"saved" | "manual">("saved");
    const [shipperSavedAddresses, setShipperSavedAddresses] = useState<Place[]>([]);
    const [selectedShipperAddress, setSelectedShipperAddress] = useState<Place | null>(null);
    const [shipperManualAddress, setShipperManualAddress] = useState("");
    const [shipperAddressSearch, setShipperAddressSearch] = useState("");
    const [shipperAddressDropdownOpen, setShipperAddressDropdownOpen] = useState(false);
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

    // Auto-entry states
    const [showAutoEntryModal, setShowAutoEntryModal] = useState(false);
    const [autoEntryFile, setAutoEntryFile] = useState<File | null>(null);
    const [autoEntryLoading, setAutoEntryLoading] = useState(false);
    
    // Suggestions states
    const [commoditySuggestions, setCommoditySuggestions] = useState<string[]>([]);
    const [shipperNameSuggestions, setShipperNameSuggestions] = useState<string[]>([]);
    const [receiverNameSuggestions, setReceiverNameSuggestions] = useState<string[]>([]);
    const [showCommoditySuggestions, setShowCommoditySuggestions] = useState(false);
    const [showShipperNameSuggestions, setShowShipperNameSuggestions] = useState(false);
    const [showReceiverNameSuggestions, setShowReceiverNameSuggestions] = useState(false);

    const shipperAddressDropdownRef = useRef<HTMLDivElement>(null);

    // Fetch places and customers on component mount
    useEffect(() => {
        fetchPlaces();
        fetchCustomers();
    }, []);

    // Fetch shipper saved addresses (using places as saved addresses)
    useEffect(() => {
        if (shipperAddressType === "saved") {
            setShipperSavedAddresses(pickupPlaces);
        }
    }, [shipperAddressType, pickupPlaces]);

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

            // Pickup location
            if (order.pickupLocation) {
                const pickupPlaceId = order.pickupLocation.placeId;
                if (pickupPlaceId) {
                    const placeId = typeof pickupPlaceId === 'string' ? pickupPlaceId : pickupPlaceId._id;
                    const foundPickupPlace = pickupPlaces.find(p => p._id === placeId);
                    if (foundPickupPlace) {
                        setSelectedPickupPlace(foundPickupPlace);
                        setPickupSearch(foundPickupPlace.currentLocation?.address || foundPickupPlace.name || '');
                    }
                }
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
                const deliveryPlaceId = order.deliveryLocation.placeId;
                if (deliveryPlaceId) {
                    const placeId = typeof deliveryPlaceId === 'string' ? deliveryPlaceId : deliveryPlaceId._id;
                    const foundDeliveryPlace = deliveryPlaces.find(p => p._id === placeId);
                    if (foundDeliveryPlace) {
                        setSelectedDeliveryPlace(foundDeliveryPlace);
                        setDeliverySearch(foundDeliveryPlace.currentLocation?.address || foundDeliveryPlace.name || '');
                    }
                }
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
                if (order.shipper.addressType === 'manual') {
                    setShipperAddressType('manual');
                    setShipperManualAddress(order.shipper.address || '');
                } else {
                    setShipperAddressType('saved');
                    // Try to find matching address in places
                    const foundShipperPlace = pickupPlaces.find(p =>
                        p.currentLocation?.address === order.shipper.address ||
                        `${p.name || ''}, ${p.city || ''}, ${p.state || ''}` === order.shipper.address
                    );
                    if (foundShipperPlace) {
                        setSelectedShipperAddress(foundShipperPlace);
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
            setSelectedPickupPlace(null);
            setPickupSearch('');
            setPickupDate(new Date().toISOString().split('T')[0]);
            setPickupTime('12:00');
            setPickupAppointment('No');
            setPickupRefNo('');
            setPickupNote('');
            setSelectedDeliveryPlace(null);
            setDeliverySearch('');
            setDeliveryDate(new Date().toISOString().split('T')[0]);
            setDeliveryTime('12:00');
            setDeliveryAppointment('No');
            setDeliveryRefNo('');
            setDeliveryNote('');

            // Reset new fields
            setShipperName('');
            setShipperPhone('');
            setShipperEmail('');
            setShipperAddressType('saved');
            setSelectedShipperAddress(null);
            setShipperManualAddress('');
            setPickupAppointmentType('FCFS');
            setPickupAppointmentDate(new Date().toISOString().split('T')[0]);
            setPickupAppointmentTime('12:00');
            setPickupSpecialInstructions('');
            setPickupGatePass('');
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
            setInternalNotes('');
            setCustomerNotes('');
            setCurrentStep(1);
        }
    }, [order, customers, pickupPlaces, deliveryPlaces]);

    const fetchPlaces = async () => {
        try {
            const response = await listPlace();
            if (response?.success && response?.data) {
                setPickupPlaces(response.data);
                setDeliveryPlaces(response.data);
            }
        } catch (error) {
            console.error("Error fetching places:", error);
        }
    };

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
    const equipmentDropdownRef = useRef<HTMLDivElement>(null);
    const packagesDropdownRef = useRef<HTMLDivElement>(null);
    const pickupDropdownRef = useRef<HTMLDivElement>(null);
    const deliveryDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node | null;
            if (customerDropdownRef.current && target && !customerDropdownRef.current.contains(target)) {
                setCustomerDropdownOpen(false);
            }
            if (equipmentDropdownRef.current && target && !equipmentDropdownRef.current.contains(target)) {
                setEquipmentDropdownOpen(false);
            }
            if (packagesDropdownRef.current && target && !packagesDropdownRef.current.contains(target)) {
                setNoOfPackagesDropdownOpen(false);
            }
            if (pickupDropdownRef.current && target && !pickupDropdownRef.current.contains(target)) {
                setPickupDropdownOpen(false);
            }
            if (deliveryDropdownRef.current && target && !deliveryDropdownRef.current.contains(target)) {
                setDeliveryDropdownOpen(false);
            }
            if (shipperAddressDropdownRef.current && target && !shipperAddressDropdownRef.current.contains(target)) {
                setShipperAddressDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredCustomers = customers.filter(customer =>
        (customer.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
        (customer.address || '').toLowerCase().includes(customerSearch.toLowerCase())
    );

    const filteredPackages = packageTypes.filter(pkg =>
        pkg.toLowerCase().includes(noOfPackagesSearch.toLowerCase())
    );

    const filteredPickupPlaces = pickupPlaces.filter(place =>
        !pickupSearch ||
        (place.name || '').toLowerCase().includes(pickupSearch.toLowerCase()) ||
        (place.currentLocation?.address || '').toLowerCase().includes(pickupSearch.toLowerCase()) ||
        (place.city || '').toLowerCase().includes(pickupSearch.toLowerCase())
    );

    const filteredDeliveryPlaces = deliveryPlaces.filter(place =>
        !deliverySearch ||
        (place.name || '').toLowerCase().includes(deliverySearch.toLowerCase()) ||
        (place.currentLocation?.address || '').toLowerCase().includes(deliverySearch.toLowerCase()) ||
        (place.city || '').toLowerCase().includes(deliverySearch.toLowerCase())
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
    const handleFileUpload = (file: File, type: 'bol' | 'customs' | 'rate') => {
        if (type === 'bol') {
            setBolFile(file);
        } else if (type === 'customs') {
            setCustomsHazmatFiles(prev => [...prev, file]);
        } else if (type === 'rate') {
            setRateConfirmationFile(file);
        }
    };

    const removeFile = (type: 'bol' | 'customs' | 'rate', index?: number) => {
        if (type === 'bol') {
            setBolFile(null);
        } else if (type === 'customs' && index !== undefined) {
            setCustomsHazmatFiles(prev => prev.filter((_, i) => i !== index));
        } else if (type === 'rate') {
            setRateConfirmationFile(null);
        }
    };

    // Auto-entry functions
    const handleAutoExtract = async () => {
        if (!autoEntryFile) {
            addNotification('error', 'Please upload a document');
            return;
        }

        setAutoEntryLoading(true);
        try {
            const response = await autoExtractOrderData(autoEntryFile);

            if (response?.success && response?.data) {
                populateFormFromExtractedData(response.data);
                addNotification('success', 'Order data extracted and populated successfully!');
                setShowAutoEntryModal(false);
                setAutoEntryFile(null);
            } else {
                addNotification('error', response?.message || 'Failed to extract order data');
            }
        } catch (error: any) {
            console.error('Auto-extract error:', error);
            addNotification('error', error?.message || 'Failed to extract order data');
        } finally {
            setAutoEntryLoading(false);
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

    const populateFormFromExtractedData = (data: any) => {
        // Basic order information
        if (data.customerOrderNo) setCustomerOrderNo(data.customerOrderNo);
        if (data.orderType) setLoadType(data.orderType);
        if (data.freightOn) setFreightOn(data.freightOn);
        if (data.salesman) setSelectedSalesman(data.salesman);
        if (data.orderNotes) setOrderNotes(data.orderNotes);

        // Pickup details (NO location auto-population)
        if (data.pickupDate) setPickupDate(data.pickupDate);
        if (data.pickupTime) setPickupTime(data.pickupTime);
        if (data.pickupAppointment !== null && data.pickupAppointment !== undefined) {
            setPickupAppointment(data.pickupAppointment ? "Yes" : "No");
        }
        if (data.pickupNote) setPickupNote(data.pickupNote);

        // Delivery details (NO location auto-population)
        if (data.deliveryDate) setDeliveryDate(data.deliveryDate);
        if (data.deliveryTime) setDeliveryTime(data.deliveryTime);
        if (data.deliveryAppointment !== null && data.deliveryAppointment !== undefined) {
            setDeliveryAppointment(data.deliveryAppointment ? "Yes" : "No");
        }
        if (data.deliveryNote) setDeliveryNote(data.deliveryNote);

        // Shipment details
        if (data.commodity) setCommodity(data.commodity);
        if (data.valueOfGoods) setValueOfGoods(data.valueOfGoods.toString());
        if (data.valueOfGoodsCurrency) setValueOfGoodsCurrency(data.valueOfGoodsCurrency);
        if (data.equipment && Array.isArray(data.equipment)) {
            setSelectedEquipment(data.equipment);
        }
        if (data.noOfPackages) setNoOfPackages(data.noOfPackages.toString());
        if (data.noOfPackagesType) setNoOfPackagesType(data.noOfPackagesType);
        if (data.weight) setWeight(data.weight.toString());
        if (data.weightUnit) setWeightUnit(data.weightUnit);
        if (data.temperature !== null && data.temperature !== undefined) {
            setTemperature(data.temperature.toString());
        }
        if (data.temperatureUnit) setTemperatureUnit(data.temperatureUnit);
        if (data.dimensions) {
            if (data.dimensions.length) setDimensionL(data.dimensions.length.toString());
            if (data.dimensions.width) setDimensionB(data.dimensions.width.toString());
            if (data.dimensions.height) setDimensionH(data.dimensions.height.toString());
            if (data.dimensions.unit) setDimensionUnit(data.dimensions.unit);
        }
        if (data.distance) setDistance(data.distance.toString());

        // Additional info
        if (data.additionalInfo) {
            setAdditionalInfo(prev => ({
                ...prev,
                CSA: data.additionalInfo.CSA ?? prev.CSA,
                CTPAT: data.additionalInfo.CTPAT ?? prev.CTPAT,
                PIP: data.additionalInfo.PIP ?? prev.PIP,
                HAZMAT: data.additionalInfo.HAZMAT ?? prev.HAZMAT,
                TARP: data.additionalInfo.TARP ?? prev.TARP,
                OverDimension: data.additionalInfo.OverDimension ?? prev.OverDimension
            }));
        }

        // Shipper information (NO address auto-population)
        if (data.shipperName) setShipperName(data.shipperName);
        if (data.shipperPhone) setShipperPhone(data.shipperPhone);
        if (data.shipperEmail) setShipperEmail(data.shipperEmail);
        if (data.pickupAppointmentType) setPickupAppointmentType(data.pickupAppointmentType);
        if (data.pickupAppointmentDate) setPickupAppointmentDate(data.pickupAppointmentDate);
        if (data.pickupAppointmentTime) setPickupAppointmentTime(data.pickupAppointmentTime);
        if (data.pickupSpecialInstructions) setPickupSpecialInstructions(data.pickupSpecialInstructions);
        if (data.pickupGatePass) setPickupGatePass(data.pickupGatePass);

        // Receiver information
        if (data.receiverName) setReceiverName(data.receiverName);
        if (data.receiverPhone) setReceiverPhone(data.receiverPhone);
        if (data.receiverAddress) setReceiverAddress(data.receiverAddress);
        if (data.deliveryAppointmentType) setDeliveryAppointmentType(data.deliveryAppointmentType);
        if (data.deliveryAppointmentDate) setDeliveryAppointmentDate(data.deliveryAppointmentDate);
        if (data.deliveryAppointmentTime) setDeliveryAppointmentTime(data.deliveryAppointmentTime);
        if (data.deliveryUnloadingInstructions) setDeliveryUnloadingInstructions(data.deliveryUnloadingInstructions);
    };

    // Step navigation
    const nextStep = () => {
        if (currentStep < 5) {
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
            if (!selectedCustomer) {
                addNotification('error', "Please select a customer");
                return false;
            }
            if (!customerOrderNo) {
                addNotification('error', "Please enter customer order number");
                return false;
            }
            if (!selectedPickupPlace) {
                addNotification('error', "Please select a pickup location");
                return false;
            }
            if (!selectedDeliveryPlace) {
                addNotification('error', "Please select a delivery location");
                return false;
            }
            if (!commodity) {
                addNotification('error', "Please enter commodity");
                return false;
            }
        } else if (step === 2) {
            if (!shipperName) {
                addNotification('error', "Please enter shipper name");
                return false;
            }
            if (!shipperPhone) {
                addNotification('error', "Please enter shipper phone");
                return false;
            }
            if (shipperAddressType === "saved" && !selectedShipperAddress) {
                addNotification('error', "Please select shipper address");
                return false;
            }
            if (shipperAddressType === "manual" && !shipperManualAddress) {
                addNotification('error', "Please enter shipper address");
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
            if (!receiverAddress) {
                addNotification('error', "Please enter receiver address");
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
        if (!selectedCustomer) {
            addNotification('error', "Please select a customer");
            return;
        }
        if (!selectedPickupPlace) {
            addNotification('error', "Please select a pickup location");
            return;
        }
        if (!selectedDeliveryPlace) {
            addNotification('error', "Please select a delivery location");
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
        if (!receiverName || !receiverPhone || !receiverAddress) {
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

            // Build order data
            const orderData = {
                customerOrderNo: customerOrderNo,
                tripNo: '',
                orderType: loadType || 'Regular',
                freightOn: freightOn || 'Order',
                salesman: selectedSalesman || '',
                orderNotes: orderNotes || '',
                customer: selectedCustomer._id || selectedCustomer.id,
                pickupLocation: {
                    placeId: selectedPickupPlace._id,
                    place: selectedPickupPlace.currentLocation?.address || `${selectedPickupPlace.name || ''}, ${selectedPickupPlace.city || ''}, ${selectedPickupPlace.state || ''}`,
                    latitude: selectedPickupPlace.currentLocation?.latitude?.toString() || '',
                    longitude: selectedPickupPlace.currentLocation?.longitude?.toString() || ''
                },
                pickupDate: pickupDateTime,
                pickupTime: pickupTime || '',
                pickupAppointment: pickupAppointment === "Yes",
                pickupRefNo: pickupRefNo || '',
                pickupNote: pickupNote || '',
                deliveryLocation: {
                    placeId: selectedDeliveryPlace._id,
                    place: selectedDeliveryPlace.currentLocation?.address || `${selectedDeliveryPlace.name || ''}, ${selectedDeliveryPlace.city || ''}, ${selectedDeliveryPlace.state || ''}`,
                    latitude: selectedDeliveryPlace.currentLocation?.latitude?.toString() || '',
                    longitude: selectedDeliveryPlace.currentLocation?.longitude?.toString() || ''
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
                // New fields
                shipper: {
                    name: shipperName,
                    phone: shipperPhone,
                    email: shipperEmail,
                    address: shipperAddressType === "saved"
                        ? (selectedShipperAddress?.currentLocation?.address || `${selectedShipperAddress?.name || ''}, ${selectedShipperAddress?.city || ''}, ${selectedShipperAddress?.state || ''}`)
                        : shipperManualAddress,
                    addressType: shipperAddressType
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
                    address: receiverAddress
                },
                deliveryAppointmentDetails: {
                    type: deliveryAppointmentType,
                    date: deliveryAppointmentDate,
                    time: deliveryAppointmentTime,
                    unloadingInstructions: deliveryUnloadingInstructions
                },
                documents: {
                    bol: bolFile?.name || null,
                    customsHazmat: customsHazmatFiles.map(f => f.name),
                    rateConfirmation: rateConfirmationFile?.name || null
                },
                internalNotes: internalNotes,
                customerNotes: customerNotes
            };

            let response;
            if (order && order._id) {
                // Update existing order
                response = await updateOrder(order._id, orderData);
                if (response?.success) {
                    addNotification('success', "Order updated successfully!");
                    if (onSave) {
                        onSave();
                    }
                    if (onClose) {
                        onClose();
                    }
                } else {
                    addNotification('error', response?.message || "Failed to update order");
                }
            } else {
                // Create new order
                response = await createOrder(orderData);
                if (response?.success) {
                    addNotification('success', "Order created successfully!");
                    if (onSave) {
                        onSave();
                    }
                    if (onClose) {
                        onClose();
                    }
                } else {
                    addNotification('error', response?.message || "Failed to create order");
                }
            }
        } catch (error) {
            console.error(`Error ${order ? 'updating' : 'creating'} order:`, error);
            addNotification('error', `Failed to ${order ? 'update' : 'create'} order. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    // Filtered shipper addresses
    const filteredShipperAddresses = shipperSavedAddresses.filter(place =>
        !shipperAddressSearch ||
        (place.name || '').toLowerCase().includes(shipperAddressSearch.toLowerCase()) ||
        (place.currentLocation?.address || '').toLowerCase().includes(shipperAddressSearch.toLowerCase()) ||
        (place.city || '').toLowerCase().includes(shipperAddressSearch.toLowerCase())
    );

    // Calculate mileage (auto-calc)
    const calculateMileage = () => {
        if (selectedPickupPlace && selectedDeliveryPlace &&
            selectedPickupPlace.currentLocation?.latitude && selectedPickupPlace.currentLocation?.longitude &&
            selectedDeliveryPlace.currentLocation?.latitude && selectedDeliveryPlace.currentLocation?.longitude) {
            // Simple distance calculation (Haversine formula would be better, but this is a placeholder)
            const lat1 = parseFloat(selectedPickupPlace.currentLocation.latitude.toString());
            const lon1 = parseFloat(selectedPickupPlace.currentLocation.longitude.toString());
            const lat2 = parseFloat(selectedDeliveryPlace.currentLocation.latitude.toString());
            const lon2 = parseFloat(selectedDeliveryPlace.currentLocation.longitude.toString());

            // Rough calculation (not accurate, but placeholder)
            const R = 3959; // Earth radius in miles
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c;
            return Math.round(distance);
        }
        return 0;
    };

    const calculatedMileage = calculateMileage();

    const stepNames = ["Details", "Shipper", "Receiver", "Documents", "Review"];

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-5 border-b-2 border-gray-200 bg-gradient-to-r from-white to-gray-50 flex-shrink-0 shadow-sm">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-bold text-gray-800">{order ? 'Edit Order' : 'Create New Order'}</h2>
                        {!order && (
                            <button
                                onClick={() => setShowAutoEntryModal(true)}
                                className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                AI Auto-Entry
                            </button>
                        )}
                    </div>
                    {/* Step Indicator */}
                    <div className="flex items-center gap-1 flex-wrap">
                        {stepNames.map((name, index) => (
                            <div key={index} className="flex items-center">
                                <div className={`flex items-center gap-2 ${index + 1 === currentStep ? 'text-blue-600' : index + 1 < currentStep ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${index + 1 === currentStep ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300' :
                                        index + 1 < currentStep ? 'bg-green-600 text-white' :
                                            'bg-gray-200 text-gray-500'
                                        }`}>
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
                {/* Step 1: Details Section */}
                {currentStep === 1 && (
                    <div className="border-b border-gray-200">
                        <div className="p-5 bg-gradient-to-r from-blue-50 to-gray-50 border-b border-gray-200">
                            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                                Order Details
                            </h3>
                            <p className="text-xs text-gray-600 mt-1 ml-10">Enter basic order information and shipment details</p>
                        </div>
                        <div className="p-5 space-y-6">
                            {/* Customer Information */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Customer Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                    {/* Customer Field */}
                                    <div className="relative" ref={customerDropdownRef}>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Customer *</label>
                                        <div className="relative">
                                            <div
                                                onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                                                className="flex items-center gap-1 p-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                                            >
                                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${customerDropdownOpen ? 'rotate-180' : ''}`} />
                                                <input
                                                    type="text"
                                                    value={selectedCustomer ? `${selectedCustomer.name || ''} | ${selectedCustomer.address || selectedCustomer.email || ''}` : customerSearch}
                                                    onChange={(e) => {
                                                        setCustomerSearch(e.target.value);
                                                        setCustomerDropdownOpen(true);
                                                    }}
                                                    onFocus={() => setCustomerDropdownOpen(true)}
                                                    placeholder="customer"
                                                    className="flex-1 outline-none text-sm min-w-0"
                                                    readOnly={!!selectedCustomer}
                                                />
                                                {selectedCustomer && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedCustomer(null);
                                                                setCustomerSearch("");
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                                                        >
                                                            <X className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Edit functionality
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                                                        >
                                                            <Pencil className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    </>
                                                )}
                                                <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${customerDropdownOpen ? '' : 'rotate-180 opacity-0'}`} />
                                            </div>

                                            {customerDropdownOpen && (
                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                    <div className="p-2 border-b border-gray-200">
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={customerSearch}
                                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                                placeholder="Search..."
                                                                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                autoFocus
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="overflow-y-auto max-h-48">
                                                        {filteredCustomers.length > 0 ? (
                                                            filteredCustomers.map((customer) => (
                                                                <div
                                                                    key={customer._id || customer.id}
                                                                    onClick={() => {
                                                                        setSelectedCustomer(customer);
                                                                        setCustomerSearch("");
                                                                        setCustomerDropdownOpen(false);
                                                                    }}
                                                                    className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${(selectedCustomer?._id || selectedCustomer?.id) === (customer._id || customer.id) ? 'bg-blue-50' : ''
                                                                        }`}
                                                                >
                                                                    <div className="font-medium text-blue-600">{customer.name || 'Unnamed Customer'}</div>
                                                                    <div className="text-xs text-gray-600">{customer.address || customer.email || customer.phone || ''}</div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Customer Order # */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Customer Order # *</label>
                                        <input
                                            type="text"
                                            value={customerOrderNo}
                                            onChange={(e) => setCustomerOrderNo(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        />
                                    </div>

                                    {/* Order Type Toggle */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Order Type</label>
                                        <div className="flex border border-gray-300 rounded overflow-hidden">
                                            <button
                                                onClick={() => setLoadType("FTL")}
                                                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${loadType === "FTL"
                                                    ? "bg-blue-600 !text-white"
                                                    : "bg-white text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                FTL
                                            </button>
                                            <button
                                                onClick={() => setLoadType("LTL")}
                                                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${loadType === "LTL"
                                                    ? "bg-blue-600 !text-white"
                                                    : "bg-white text-gray-700 hover:bg-gray-50"
                                                    }`}
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
                                                    ? "bg-blue-600 !text-white"
                                                    : "bg-white text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                Order
                                            </button>
                                            <button
                                                onClick={() => setFreightOn("Item")}
                                                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${freightOn === "Item"
                                                    ? "bg-blue-600 !text-white"
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
                                                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                            >
                                                <option value="">Select</option>
                                                <option value="john">John Doe</option>
                                                <option value="jane">Jane Smith</option>
                                            </select>
                                            <button className="px-2 text-blue-500 hover:bg-blue-50 rounded text-xl leading-none flex-shrink-0">+</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Order Notes</label>
                                    <textarea
                                        rows={2}
                                        value={orderNotes}
                                        onChange={(e) => setOrderNotes(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
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
                                                            className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
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
                                                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                            <select
                                                value={valueOfGoodsCurrency}
                                                onChange={(e) => setValueOfGoodsCurrency(e.target.value)}
                                                className="w-48 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
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
                                                    className="flex-1 p-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 flex items-center justify-between"
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
                                                    className="px-3 py-2 bg-blue-500 !text-white rounded hover:bg-blue-600 text-sm font-medium flex-shrink-0"
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
                                                            className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 cursor-pointer"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEquipment.includes(equipment)}
                                                                onChange={() => handleEquipmentToggle(equipment)}
                                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
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
                                                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                            <div className="relative w-48">
                                                <div
                                                    onClick={() => setNoOfPackagesDropdownOpen(!noOfPackagesDropdownOpen)}
                                                    className="flex items-center justify-between p-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500"
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
                                                                    className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                                                    className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
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
                                                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                            <select
                                                value={weightUnit}
                                                onChange={(e) => setWeightUnit(e.target.value)}
                                                className="w-24 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
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
                                                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                            />
                                            <select
                                                value={temperatureUnit}
                                                onChange={(e) => setTemperatureUnit(e.target.value)}
                                                className="w-32 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
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
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">Snow Conditions</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={weatherConditions.highTemperature}
                                                    onChange={(e) => setWeatherConditions(prev => ({ ...prev, highTemperature: e.target.checked }))}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                                                className="w-20 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                            />
                                            <span className="text-gray-400 text-sm">×</span>
                                            <input
                                                type="text"
                                                value={dimensionB}
                                                onChange={(e) => setDimensionB(e.target.value)}
                                                placeholder="B"
                                                className="w-20 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                            />
                                            <span className="text-gray-400 text-sm">×</span>
                                            <input
                                                type="text"
                                                value={dimensionH}
                                                onChange={(e) => setDimensionH(e.target.value)}
                                                placeholder="H"
                                                className="w-20 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                            />
                                            <select
                                                value={dimensionUnit}
                                                onChange={(e) => setDimensionUnit(e.target.value)}
                                                className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm min-w-[100px]"
                                            >
                                                <option value="">Select</option>
                                                {dimensionUnits.map(unit => (
                                                    <option key={unit} value={unit}>{unit}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* PICKUP and DELIVERY Side by Side */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4 mt-6 pt-4 border-t border-gray-200">
                                        {/* PICKUP Section */}
                                        <div className="border-2 border-blue-100 rounded-lg p-4 bg-blue-50/30">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" id="pickup-checkbox" className="w-4 h-4" defaultChecked />
                                                    <label htmlFor="pickup-checkbox" className="font-medium text-gray-800 text-sm">PICKUP</label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" id="same-pickup" className="w-4 h-4" />
                                                    <label htmlFor="same-pickup" className="text-xs text-gray-600">Same pickup for next shipment</label>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="relative" ref={pickupDropdownRef}>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Location *</label>
                                                    <div className="relative">
                                                        <div
                                                            onClick={() => setPickupDropdownOpen(!pickupDropdownOpen)}
                                                            className="flex items-center gap-1 p-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                                                        >
                                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${pickupDropdownOpen ? 'rotate-180' : ''}`} />
                                                            <input
                                                                type="text"
                                                                value={selectedPickupPlace ? `${selectedPickupPlace.name || ''} | ${selectedPickupPlace.currentLocation?.address || ''}` : pickupSearch}
                                                                onChange={(e) => {
                                                                    setPickupSearch(e.target.value);
                                                                    setPickupDropdownOpen(true);
                                                                }}
                                                                onFocus={() => setPickupDropdownOpen(true)}
                                                                placeholder="Search pickup location..."
                                                                className="flex-1 outline-none text-sm min-w-0"
                                                                readOnly={!!selectedPickupPlace}
                                                            />
                                                            {selectedPickupPlace && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedPickupPlace(null);
                                                                            setPickupSearch("");
                                                                        }}
                                                                        className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                                                                    >
                                                                        <X className="w-4 h-4 text-gray-400" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>

                                                        {pickupDropdownOpen && (
                                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                                <div className="p-2 border-b border-gray-200">
                                                                    <div className="relative">
                                                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                        <input
                                                                            type="text"
                                                                            value={pickupSearch}
                                                                            onChange={(e) => setPickupSearch(e.target.value)}
                                                                            placeholder="Search places..."
                                                                            className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                            autoFocus
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-y-auto max-h-48">
                                                                    {filteredPickupPlaces.length > 0 ? (
                                                                        filteredPickupPlaces.map((place) => (
                                                                            <div
                                                                                key={place._id}
                                                                                onClick={() => {
                                                                                    setSelectedPickupPlace(place);
                                                                                    setPickupSearch("");
                                                                                    setPickupDropdownOpen(false);
                                                                                }}
                                                                                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${selectedPickupPlace?._id === place._id ? 'bg-blue-50' : ''
                                                                                    }`}
                                                                            >
                                                                                <div className="font-medium text-blue-600">{place.name || 'Unnamed Place'}</div>
                                                                                <div className="text-xs text-gray-600">{place.currentLocation?.address || `${place.city || ''}, ${place.state || ''}`}</div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="px-3 py-2 text-sm text-gray-500">No places found</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Reference No.</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ref No"
                                                        value={pickupRefNo}
                                                        onChange={(e) => setPickupRefNo(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Pickup Date *</label>
                                                        <input
                                                            type="date"
                                                            value={pickupDate}
                                                            onChange={(e) => setPickupDate(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Time *</label>
                                                        <input
                                                            type="time"
                                                            value={pickupTime}
                                                            onChange={(e) => setPickupTime(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Appointment</label>
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="pickup-appointment"
                                                                value="Yes"
                                                                checked={pickupAppointment === "Yes"}
                                                                onChange={(e) => setPickupAppointment(e.target.value)}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm">Yes</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="pickup-appointment"
                                                                value="No"
                                                                checked={pickupAppointment === "No"}
                                                                onChange={(e) => setPickupAppointment(e.target.value)}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm">No</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Note</label>
                                                    <textarea
                                                        rows={3}
                                                        value={pickupNote}
                                                        onChange={(e) => setPickupNote(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* DELIVERY Section */}
                                        <div className="border-2 border-green-100 rounded-lg p-4 bg-green-50/30">
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <input type="checkbox" id="delivery-checkbox" className="w-4 h-4" defaultChecked />
                                                    <label htmlFor="delivery-checkbox" className="font-medium text-gray-800 text-sm">DELIVERY</label>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="relative" ref={deliveryDropdownRef}>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Location *</label>
                                                    <div className="relative">
                                                        <div
                                                            onClick={() => setDeliveryDropdownOpen(!deliveryDropdownOpen)}
                                                            className="flex items-center gap-1 p-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                                                        >
                                                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${deliveryDropdownOpen ? 'rotate-180' : ''}`} />
                                                            <input
                                                                type="text"
                                                                value={selectedDeliveryPlace ? `${selectedDeliveryPlace.name || ''} | ${selectedDeliveryPlace.currentLocation?.address || ''}` : deliverySearch}
                                                                onChange={(e) => {
                                                                    setDeliverySearch(e.target.value);
                                                                    setDeliveryDropdownOpen(true);
                                                                }}
                                                                onFocus={() => setDeliveryDropdownOpen(true)}
                                                                placeholder="Search delivery location..."
                                                                className="flex-1 outline-none text-sm min-w-0"
                                                                readOnly={!!selectedDeliveryPlace}
                                                            />
                                                            {selectedDeliveryPlace && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedDeliveryPlace(null);
                                                                            setDeliverySearch("");
                                                                        }}
                                                                        className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                                                                    >
                                                                        <X className="w-4 h-4 text-gray-400" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>

                                                        {deliveryDropdownOpen && (
                                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                                <div className="p-2 border-b border-gray-200">
                                                                    <div className="relative">
                                                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                        <input
                                                                            type="text"
                                                                            value={deliverySearch}
                                                                            onChange={(e) => setDeliverySearch(e.target.value)}
                                                                            placeholder="Search places..."
                                                                            className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                            autoFocus
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-y-auto max-h-48">
                                                                    {filteredDeliveryPlaces.length > 0 ? (
                                                                        filteredDeliveryPlaces.map((place) => (
                                                                            <div
                                                                                key={place._id}
                                                                                onClick={() => {
                                                                                    setSelectedDeliveryPlace(place);
                                                                                    setDeliverySearch("");
                                                                                    setDeliveryDropdownOpen(false);
                                                                                }}
                                                                                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${selectedDeliveryPlace?._id === place._id ? 'bg-blue-50' : ''
                                                                                    }`}
                                                                            >
                                                                                <div className="font-medium text-blue-600">{place.name || 'Unnamed Place'}</div>
                                                                                <div className="text-xs text-gray-600">{place.currentLocation?.address || `${place.city || ''}, ${place.state || ''}`}</div>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <div className="px-3 py-2 text-sm text-gray-500">No places found</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Reference No.</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ref No"
                                                        value={deliveryRefNo}
                                                        onChange={(e) => setDeliveryRefNo(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Date *</label>
                                                        <input
                                                            type="date"
                                                            value={deliveryDate}
                                                            onChange={(e) => setDeliveryDate(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Time *</label>
                                                        <input
                                                            type="time"
                                                            value={deliveryTime}
                                                            onChange={(e) => setDeliveryTime(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Appointment</label>
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="delivery-appointment"
                                                                value="Yes"
                                                                checked={deliveryAppointment === "Yes"}
                                                                onChange={(e) => setDeliveryAppointment(e.target.value)}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm">Yes</span>
                                                        </label>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name="delivery-appointment"
                                                                value="No"
                                                                checked={deliveryAppointment === "No"}
                                                                onChange={(e) => setDeliveryAppointment(e.target.value)}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm">No</span>
                                                        </label>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Note</label>
                                                    <textarea
                                                        rows={3}
                                                        value={deliveryNote}
                                                        onChange={(e) => setDeliveryNote(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Distance and Additional Info */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-200">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Distance</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Distance"
                                                    value={distance || (typeof calculatedMileage === 'number' && calculatedMileage > 0 ? calculatedMileage.toString() : '')}
                                                    onChange={(e) => setDistance(e.target.value)}
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const mileage = calculateMileage();
                                                        if (typeof mileage === 'number' && mileage > 0) {
                                                            setDistance(mileage.toString());
                                                            addNotification('success', `Distance calculated: ${mileage} miles`);
                                                        } else {
                                                            addNotification('warning', 'Please select both pickup and delivery locations to calculate distance');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 !text-white rounded text-sm font-medium hover:bg-blue-700 flex-shrink-0"
                                                >
                                                    Calculate
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Additional Info</label>
                                            <div className="flex flex-wrap gap-3">
                                                {(Object.keys(additionalInfo) as Array<keyof typeof additionalInfo>).map((key) => (
                                                    <label key={key} className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={additionalInfo[key]}
                                                            onChange={() => handleAdditionalInfoToggle(key)}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-xs">{key === "OverDimension" ? "Over Dimension" : key}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {currentStep === 2 && (
                    <div className="border-b border-gray-200">
                        <div className="p-5 bg-gradient-to-r from-blue-50 to-gray-50 border-b border-gray-200">
                            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                                Shipper Information
                            </h3>
                            <p className="text-xs text-gray-600 mt-1 ml-10">Enter shipper contact details and pickup appointment information</p>
                        </div>
                        <div className="p-5 space-y-6">
                            {/* Shipper Contact Information */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Contact Information</h4>
                                <div className="space-y-4">
                                    {/* Shipper Name */}
                                    <div className="relative">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Shipper Name *</label>
                                        <input
                                            type="text"
                                            value={shipperName}
                                            onChange={(e) => {
                                                setShipperName(e.target.value);
                                                debouncedFetchSuggestions('shipperName', e.target.value);
                                            }}
                                            onFocus={() => {
                                                if (shipperName && shipperName.length >= 2) {
                                                    fetchSuggestions('shipperName', shipperName);
                                                }
                                            }}
                                            onBlur={() => {
                                                setTimeout(() => setShowShipperNameSuggestions(false), 200);
                                            }}
                                            className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="Enter shipper name"
                                        />
                                        {showShipperNameSuggestions && shipperNameSuggestions.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {shipperNameSuggestions.map((suggestion, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => {
                                                            setShipperName(suggestion);
                                                            setShowShipperNameSuggestions(false);
                                                        }}
                                                        className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
                                                    >
                                                        {suggestion}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Shipper Phone */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Shipper Phone *</label>
                                        <input
                                            type="tel"
                                            value={shipperPhone}
                                            onChange={(e) => setShipperPhone(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="Enter shipper phone"
                                        />
                                    </div>

                                    {/* Shipper Email */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Shipper Email (optional)</label>
                                        <input
                                            type="email"
                                            value={shipperEmail}
                                            onChange={(e) => setShipperEmail(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder="Enter shipper email"
                                        />
                                    </div>

                                    {/* Shipper Address */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Shipper Address *</label>
                                        <div className="flex gap-2 mb-2">
                                            <button
                                                onClick={() => setShipperAddressType("saved")}
                                                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${shipperAddressType === "saved"
                                                    ? "bg-blue-600 !text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                    }`}
                                            >
                                                Saved Master
                                            </button>
                                            <button
                                                onClick={() => setShipperAddressType("manual")}
                                                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${shipperAddressType === "manual"
                                                    ? "bg-blue-600 !text-white"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                    }`}
                                            >
                                                Manual Entry
                                            </button>
                                        </div>

                                        {shipperAddressType === "saved" ? (
                                            <div className="relative" ref={shipperAddressDropdownRef}>
                                                <div className="relative">
                                                    <div
                                                        onClick={() => setShipperAddressDropdownOpen(!shipperAddressDropdownOpen)}
                                                        className="flex items-center gap-1 p-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                                                    >
                                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${shipperAddressDropdownOpen ? 'rotate-180' : ''}`} />
                                                        <input
                                                            type="text"
                                                            value={selectedShipperAddress ? `${selectedShipperAddress.name || ''} | ${selectedShipperAddress.currentLocation?.address || ''}` : shipperAddressSearch}
                                                            onChange={(e) => {
                                                                setShipperAddressSearch(e.target.value);
                                                                setShipperAddressDropdownOpen(true);
                                                            }}
                                                            onFocus={() => setShipperAddressDropdownOpen(true)}
                                                            placeholder="Search saved address..."
                                                            className="flex-1 outline-none text-sm min-w-0"
                                                            readOnly={!!selectedShipperAddress}
                                                        />
                                                        {selectedShipperAddress && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedShipperAddress(null);
                                                                    setShipperAddressSearch("");
                                                                }}
                                                                className="p-1 hover:bg-gray-100 rounded flex-shrink-0"
                                                            >
                                                                <X className="w-4 h-4 text-gray-400" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {shipperAddressDropdownOpen && (
                                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                            <div className="p-2 border-b border-gray-200">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                    <input
                                                                        type="text"
                                                                        value={shipperAddressSearch}
                                                                        onChange={(e) => setShipperAddressSearch(e.target.value)}
                                                                        placeholder="Search addresses..."
                                                                        className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="overflow-y-auto max-h-48">
                                                                {filteredShipperAddresses.length > 0 ? (
                                                                    filteredShipperAddresses.map((place) => (
                                                                        <div
                                                                            key={place._id}
                                                                            onClick={() => {
                                                                                setSelectedShipperAddress(place);
                                                                                setShipperAddressSearch("");
                                                                                setShipperAddressDropdownOpen(false);
                                                                            }}
                                                                            className={`px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm ${selectedShipperAddress?._id === place._id ? 'bg-blue-50' : ''
                                                                                }`}
                                                                        >
                                                                            <div className="font-medium text-blue-600">{place.name || 'Unnamed Place'}</div>
                                                                            <div className="text-xs text-gray-600">{place.currentLocation?.address || `${place.city || ''}, ${place.state || ''}`}</div>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="px-3 py-2 text-sm text-gray-500">No addresses found</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <textarea
                                                rows={3}
                                                value={shipperManualAddress}
                                                onChange={(e) => setShipperManualAddress(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                                placeholder="Enter shipper address manually"
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Pickup Appointment */}
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Pickup Appointment Details</h4>

                                    <div className="space-y-4">
                                        {/* Appointment Type */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-2">Appointment Type *</label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setPickupAppointmentType("FCFS")}
                                                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors rounded-md ${pickupAppointmentType === "FCFS"
                                                        ? "bg-blue-600 !text-white"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    FCFS
                                                </button>
                                                <button
                                                    onClick={() => setPickupAppointmentType("Window")}
                                                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors rounded-md ${pickupAppointmentType === "Window"
                                                        ? "bg-blue-600 !text-white"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    Window
                                                </button>
                                                <button
                                                    onClick={() => setPickupAppointmentType("Strict Time")}
                                                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors rounded-md ${pickupAppointmentType === "Strict Time"
                                                        ? "bg-blue-600 !text-white"
                                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    Strict Time
                                                </button>
                                            </div>
                                        </div>

                                        {/* Date + Time */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                                                <input
                                                    type="date"
                                                    value={pickupAppointmentDate}
                                                    onChange={(e) => setPickupAppointmentDate(e.target.value)}
                                                    className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Time *</label>
                                                <input
                                                    type="time"
                                                    value={pickupAppointmentTime}
                                                    onChange={(e) => setPickupAppointmentTime(e.target.value)}
                                                    className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                                                />
                                            </div>
                                        </div>

                                        {/* Special Instructions */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Special Instructions</label>
                                            <textarea
                                                rows={3}
                                                value={pickupSpecialInstructions}
                                                onChange={(e) => setPickupSpecialInstructions(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                placeholder="Enter special instructions"
                                            />
                                        </div>

                                        {/* Gate Pass / Dock Number */}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Gate Pass / Dock Number (optional)</label>
                                            <input
                                                type="text"
                                                value={pickupGatePass}
                                                onChange={(e) => setPickupGatePass(e.target.value)}
                                                className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                                placeholder="Enter gate pass or dock number"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Receiver Information Section */}
                {currentStep === 3 && (
                    <div className="border-b border-gray-200">
                        <div className="p-5 bg-gradient-to-r from-green-50 to-gray-50 border-b border-gray-200">
                            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                                Receiver Information
                            </h3>
                            <p className="text-xs text-gray-600 mt-1 ml-10">Enter receiver contact details and delivery appointment information</p>
                        </div>
                        <div className="p-5 space-y-6">
                            {/* Receiver Contact Information */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Contact Information</h4>
                                <div className="space-y-4">
                                    {/* Receiver Name */}
                                    <div className="relative">
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Receiver Name *</label>
                                        <input
                                            type="text"
                                            value={receiverName}
                                            onChange={(e) => {
                                                setReceiverName(e.target.value);
                                                debouncedFetchSuggestions('receiverName', e.target.value);
                                            }}
                                            onFocus={() => {
                                                if (receiverName && receiverName.length >= 2) {
                                                    fetchSuggestions('receiverName', receiverName);
                                                }
                                            }}
                                            onBlur={() => {
                                                setTimeout(() => setShowReceiverNameSuggestions(false), 200);
                                            }}
                                            className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                            placeholder="Enter receiver name"
                                        />
                                        {showReceiverNameSuggestions && receiverNameSuggestions.length > 0 && (
                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {receiverNameSuggestions.map((suggestion, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => {
                                                            setReceiverName(suggestion);
                                                            setShowReceiverNameSuggestions(false);
                                                        }}
                                                        className="px-3 py-2 cursor-pointer hover:bg-green-50 text-sm"
                                                    >
                                                        {suggestion}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Receiver Phone */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Receiver Phone *</label>
                                        <input
                                            type="tel"
                                            value={receiverPhone}
                                            onChange={(e) => setReceiverPhone(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                            placeholder="Enter receiver phone"
                                        />
                                    </div>

                                    {/* Delivery Address */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Address *</label>
                                        <textarea
                                            rows={3}
                                            value={receiverAddress}
                                            onChange={(e) => setReceiverAddress(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                            placeholder="Enter delivery address"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Appointment */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Delivery Appointment Details</h4>

                                {/* Appointment Type */}
                                <div className="mb-3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Appointment Type *</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setDeliveryAppointmentType("Window")}
                                            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${deliveryAppointmentType === "Window"
                                                ? "bg-blue-600 !text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            Window
                                        </button>
                                        <button
                                            onClick={() => setDeliveryAppointmentType("Strict Time")}
                                            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${deliveryAppointmentType === "Strict Time"
                                                ? "bg-blue-600 !text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                }`}
                                        >
                                            Strict Time
                                        </button>
                                    </div>
                                </div>

                                {/* Date + Time */}
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                                        <input
                                            type="date"
                                            value={deliveryAppointmentDate}
                                            onChange={(e) => setDeliveryAppointmentDate(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Time *</label>
                                        <input
                                            type="time"
                                            value={deliveryAppointmentTime}
                                            onChange={(e) => setDeliveryAppointmentTime(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
                                        />
                                    </div>
                                </div>

                                {/* Unloading Instructions */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Unloading Instructions</label>
                                    <textarea
                                        rows={3}
                                        value={deliveryUnloadingInstructions}
                                        onChange={(e) => setDeliveryUnloadingInstructions(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                        placeholder="Enter unloading instructions"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                )}

                {/* Step 4: Document Area */}
                {currentStep === 4 && (
                    <div className="border-b border-gray-200">
                        <div className="p-5 bg-gradient-to-r from-purple-50 to-gray-50 border-b border-gray-200">
                            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold">4</span>
                                Documents & Notes
                            </h3>
                            <p className="text-xs text-gray-600 mt-1 ml-10">Upload documents and add internal or customer notes</p>
                        </div>
                        <div className="p-5 space-y-6">
                            {/* Upload BOL */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <label className="block text-sm font-semibold text-gray-800 mb-3">Upload BOL (optional)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                                    {bolFile ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                                <span className="text-sm text-gray-700">{bolFile.name}</span>
                                            </div>
                                            <button
                                                onClick={() => removeFile('bol')}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center cursor-pointer">
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
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
                                    )}
                                </div>
                            </div>

                            {/* Upload Customs / HAZMAT docs */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <label className="block text-sm font-semibold text-gray-800 mb-3">Upload Customs / HAZMAT docs</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                                    {customsHazmatFiles.length > 0 ? (
                                        <div className="space-y-2">
                                            {customsHazmatFiles.map((file, index) => (
                                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm text-gray-700">{file.name}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile('customs', index)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                                        <Plus className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-blue-600">Add file</span>
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
                                </div>
                            </div>

                            {/* Upload Rate Confirmation */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <label className="block text-sm font-semibold text-gray-800 mb-3">Upload Rate Confirmation (for internal use)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                                    {rateConfirmationFile ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-5 h-5 text-blue-600" />
                                                <span className="text-sm text-gray-700">{rateConfirmationFile.name}</span>
                                            </div>
                                            <button
                                                onClick={() => removeFile('rate')}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center cursor-pointer">
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
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
                                    )}
                                </div>
                            </div>

                            {/* Internal Notes */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">Internal Notes (visible to dispatcher)</label>
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
                                <label className="block text-sm font-semibold text-gray-800 mb-2">Customer Notes (visible to customer)</label>
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
                )}

                {/* Step 5: Review Page */}
                {currentStep === 5 && (
                    <div className="border-b border-gray-200">
                        <div className="p-5 bg-gradient-to-r from-green-50 to-gray-50 border-b border-gray-200">
                            <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">5</span>
                                Review & Submit
                            </h3>
                            <p className="text-xs text-gray-600 mt-1 ml-10">Review all information before creating the order</p>
                        </div>
                        <div className="p-5 space-y-6">
                            {/* Shipper Summary */}
                            <div className="bg-white border-2 border-blue-100 rounded-lg p-5 shadow-sm">
                                <h4 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                                    Shipper Summary
                                </h4>
                                <div className="space-y-2.5 text-sm">
                                    <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Name:</span> <span className="text-gray-800">{shipperName || 'N/A'}</span></div>
                                    <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Phone:</span> <span className="text-gray-800">{shipperPhone || 'N/A'}</span></div>
                                    <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Email:</span> <span className="text-gray-800">{shipperEmail || 'N/A'}</span></div>
                                    <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Address:</span> <span className="text-gray-800">{
                                        shipperAddressType === "saved"
                                            ? (selectedShipperAddress?.currentLocation?.address || `${selectedShipperAddress?.name || ''}, ${selectedShipperAddress?.city || ''}, ${selectedShipperAddress?.state || ''}` || 'N/A')
                                            : (shipperManualAddress || 'N/A')
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
                                    <div className="flex gap-2"><span className="font-semibold text-gray-700 min-w-[80px]">Address:</span> <span className="text-gray-800">{receiverAddress || 'N/A'}</span></div>
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
                                    <div><span className="font-medium">Mileage:</span> {calculatedMileage ? `${calculatedMileage} miles` : (distance || 'N/A')}</div>
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
                                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">5</span>
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
                )}
            </div>

            {/* Fixed Footer */}
            <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0 shadow-lg">
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
                        {currentStep < 5 ? (
                            <button
                                onClick={handleNextStep}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 !text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
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
            </div>

            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-[10001] flex flex-col gap-2">
                {notifications.map((notification) => (
                    <ToastNotification
                        key={notification.id}
                        notification={notification}
                        onClose={removeNotification}
                    />
                ))}
            </div>

            {/* Auto-Entry Modal */}
            {showAutoEntryModal && (
                <div className="fixed inset-0 bg-white/30 backdrop-blur-md flex items-center justify-center z-[10001] p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800">AI Auto-Entry from Document</h3>
                            <button
                                onClick={() => {
                                    setShowAutoEntryModal(false);
                                    setAutoEntryFile(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Rate Confirmation or Order Document (PDF or Text)
                                </label>
                                <p className="text-xs text-gray-500 mb-3">
                                    Upload a document to automatically extract and populate order fields. Note: Pickup/Delivery locations, Customer, and Shipper Address will not be auto-populated.
                                </p>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    {autoEntryFile ? (
                                        <div className="space-y-2">
                                            <FileText className="w-12 h-12 text-green-500 mx-auto" />
                                            <p className="text-sm font-medium text-gray-700">{autoEntryFile.name}</p>
                                            <button
                                                onClick={() => setAutoEntryFile(null)}
                                                className="text-sm text-red-600 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="cursor-pointer">
                                            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600 mb-1">
                                                Click to upload or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                PDF, TXT files up to 20MB
                                            </p>
                                            <input
                                                type="file"
                                                accept=".pdf,.txt"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setAutoEntryFile(file);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowAutoEntryModal(false);
                                        setAutoEntryFile(null);
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAutoExtract}
                                    disabled={autoEntryLoading || !autoEntryFile}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {autoEntryLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Extracting...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Extract & Populate
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewOrderSidebar;