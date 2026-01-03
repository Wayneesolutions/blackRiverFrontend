import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ChevronDown, ChevronUp, Search, FileText, ArrowLeft, ArrowRight, GripVertical, Edit, Trash2 } from "lucide-react";
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaFileAlt, FaUpload, FaCheck } from "react-icons/fa";
import { listCustomer, createOrder, updateOrder, getOrderSuggestions, getAuditTrail } from "../../../../../axios/api/distapcher";
import { listTrucks } from "../../../../../axios/api/truckTracking";
import { listTrailers } from "../../../../../axios/api/trailerTracking";
import { getAllDrivers } from "../../../../../axios/api/driver";
import { getUserInfo } from "../../../../../utils/auth";

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

    // Helper function to add audit trail entry
    const addAuditTrailEntry = useCallback((action: string) => {
        // Get current user from localStorage
        const userInfo = getUserInfo();
        const userName = userInfo?.userData?.name || 
                        userInfo?.userData?.email || 
                        userInfo?.name || 
                        'System';
        
        const newEntry = {
            id: Date.now(),
            user: userName,
            action: action,
            date: new Date().toLocaleString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true 
            })
        };
        setAuditTrail(prev => [newEntry, ...prev]);
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

    // Customer Information fields (from images)
    const [customerUnit, setCustomerUnit] = useState("");
    const [customerPostalCode, setCustomerPostalCode] = useState("");
    const [customerPrimaryPhone, setCustomerPrimaryPhone] = useState("");
    const [customerSecondaryPhone, setCustomerSecondaryPhone] = useState("");
    const [customerContact, setCustomerContact] = useState("");
    const [payableEmail, setPayableEmail] = useState("");
    const [secondaryPayableEmail, setSecondaryPayableEmail] = useState("");

    // Billing Information fields
    const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
    const [rate, setRate] = useState("0");
    const [rateCurrency, setRateCurrency] = useState("CAD");
    const [dispatcher, setDispatcher] = useState("");
    const [dispatcherEmail, setDispatcherEmail] = useState("");
    const [bookedForCarrier, setBookedForCarrier] = useState(false);
    const [sendToFactor, setSendToFactor] = useState(false);

    // Tax Configuration
    const [taxCode, setTaxCode] = useState("No Tax");
    const [taxAmount, setTaxAmount] = useState("");

    // Customs Information additional fields
    const [pars, setPars] = useState("");
    const [paps, setPaps] = useState("");
    const [trailerSealNo, setTrailerSealNo] = useState("");

    // Additional checkboxes (from second image)
    const [csaFastApproved, setCsaFastApproved] = useState(false);
    const [bondedShipmentCA, setBondedShipmentCA] = useState(false);
    const [bondedShipmentUS, setBondedShipmentUS] = useState(false);
    const [highPriority, setHighPriority] = useState(false);
    const [cityDriver, setCityDriver] = useState(false);
    const [teamLoad, setTeamLoad] = useState(false);
    const [roundTrip, setRoundTrip] = useState(false);
    const [oversized, setOversized] = useState(false);
    const [empty, setEmpty] = useState(false);

    // Other Charges
    const [otherCharges, setOtherCharges] = useState<Array<{
        category: string;
        chargePercent: string;
        chargeAmount: string;
        description: string;
        gst: boolean;
    }>>([]);
    const [newChargeCategory, setNewChargeCategory] = useState("");
    const [newChargePercent, setNewChargePercent] = useState("");
    const [newChargeAmount, setNewChargeAmount] = useState("");
    const [newChargeDescription, setNewChargeDescription] = useState("");
    const [newChargeGst, setNewChargeGst] = useState(false);

    // Notes
    const [invoiceInstructions, setInvoiceInstructions] = useState("");
    const [invoiceNotes, setInvoiceNotes] = useState("");

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
    const [currentStep, setCurrentStep] = useState(1); // 1: Customer, 2: Shipper, 3: Receiver, 4: Review, 5: Assignment, 6: Notes/Audit

    // Shipper Information states
    const [shipperName, setShipperName] = useState("");
    const [shipperPhone, setShipperPhone] = useState("");
    const [shipperEmail, setShipperEmail] = useState("");
    const [shipperAddress, setShipperAddress] = useState("");
    const [shipperUnit, setShipperUnit] = useState("");
    const [shipperCountry, setShipperCountry] = useState("");
    const [shipperProvince, setShipperProvince] = useState("");
    const [shipperCity, setShipperCity] = useState("");
    const [shipperPostalCode, setShipperPostalCode] = useState("");
    const [shipperPrimaryPhone, setShipperPrimaryPhone] = useState("");
    const [shipperSecondaryPhone, setShipperSecondaryPhone] = useState("");
    const [shipperContact, setShipperContact] = useState("");
    const [shipperStore, setShipperStore] = useState("");
    const [shipperType, setShipperType] = useState("DELIVERY"); // DROP, HOOK & GO, DELIVERY
    const [pickupAppointmentType, setPickupAppointmentType] = useState("EXACT"); // EXACT / WINDOW
    const [pickupAppointmentDate, setPickupAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [pickupAppointmentTime, setPickupAppointmentTime] = useState("12:00");
    // WINDOW appointment fields
    const [pickupStartDate, setPickupStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [pickupStartTime, setPickupStartTime] = useState("TBA");
    const [pickupEndDate, setPickupEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [pickupEndTime, setPickupEndTime] = useState("TBA");
    const [pickupSpecialInstructions, setPickupSpecialInstructions] = useState("");
    const [pickupGatePass, setPickupGatePass] = useState("");
    
    // Goods and Pick Up Details
    const [goods, setGoods] = useState("");
    const [pickUpNotes, setPickUpNotes] = useState("");
    const [pickUpNumber, setPickUpNumber] = useState("");
    const [pickupSkids, setPickupSkids] = useState("");
    const [pickupCases, setPickupCases] = useState("");
    const [pickupUoM, setPickupUoM] = useState("Kg");
    const [pickupTempUnits, setPickupTempUnits] = useState("");

    // Stop Information Table
    const [stops, setStops] = useState<Array<{
        stop: number;
        shipper: string;
        date: string;
        endDate: string;
        appointment: string;
        pickUpNumber: string;
        contact: string;
        skids: string;
        cases: string;
        weight: string;
        uom: string;
        temperature: string;
        address: string;
        ltl: boolean;
    }>>([]);

    // Receiver Information states
    const [receiverName, setReceiverName] = useState("");
    const [receiverPhone, setReceiverPhone] = useState("");
    const [receiverAddress, setReceiverAddress] = useState("");
    const [receiverContact, setReceiverContact] = useState("");
    const [deliveryAppointmentType, setDeliveryAppointmentType] = useState("EXACT"); // EXACT / WINDOW
    const [deliveryAppointmentDate, setDeliveryAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryAppointmentTime, setDeliveryAppointmentTime] = useState("12:00");
    // WINDOW appointment fields for delivery
    const [deliveryStartDate, setDeliveryStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryStartTime, setDeliveryStartTime] = useState("TBA");
    const [deliveryEndDate, setDeliveryEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [deliveryEndTime, setDeliveryEndTime] = useState("TBA");
    const [deliveryUnloadingInstructions, setDeliveryUnloadingInstructions] = useState("");
    // Delivery goods and drop off details
    const [deliveryGoods, setDeliveryGoods] = useState("");
    const [dropOffNotes, setDropOffNotes] = useState("");
    const [dropOffNumber, setDropOffNumber] = useState("");
    const [deliverySkids, setDeliverySkids] = useState("");
    const [deliveryCases, setDeliveryCases] = useState("");
    const [deliveryUoM, setDeliveryUoM] = useState("Kg");
    const [deliveryTempUnits, setDeliveryTempUnits] = useState("");

    // Receiver Stop Information Table
    const [receiverStops, setReceiverStops] = useState<Array<{
        stop: number;
        receiver: string;
        date: string;
        endDate: string;
        appointment: string;
        dropOffNumber: string;
        contact: string;
        skids: string;
        cases: string;
        weight: string;
        uom: string;
        temperature: string;
        address: string;
        ltl: boolean;
    }>>([]);

    // Document states
    const [bolFile, setBolFile] = useState<File | null>(null);
    const [customsHazmatFiles, setCustomsHazmatFiles] = useState<File[]>([]);
    const [rateConfirmationFile, setRateConfirmationFile] = useState<File | null>(null);
    const [internalNotes, setInternalNotes] = useState("");
    const [customerNotes, setCustomerNotes] = useState("");

    const [loadSecurementFiles, setLoadSecurementFiles] = useState<File[]>([]);

    // Assignment states
    const [assignmentType, setAssignmentType] = useState<"DRIVER" | "CARRIER">("DRIVER");
    const [selectedTruck, setSelectedTruck] = useState<any>(null);
    const [truckSearch, setTruckSearch] = useState("");
    const [truckDropdownOpen, setTruckDropdownOpen] = useState(false);
    const [trucks, setTrucks] = useState<any[]>([]);
    
    const [selectedTrailer, setSelectedTrailer] = useState<any>(null);
    const [trailerSearch, setTrailerSearch] = useState("");
    const [trailerDropdownOpen, setTrailerDropdownOpen] = useState(false);
    const [trailers, setTrailers] = useState<any[]>([]);
    
    const [selectedDriver, setSelectedDriver] = useState<any>(null);
    const [driverSearch, setDriverSearch] = useState("");
    const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);
    const [drivers, setDrivers] = useState<any[]>([]);
    
    const [selectedCoDriver, setSelectedCoDriver] = useState<any>(null);
    const [coDriverSearch, setCoDriverSearch] = useState("");
    const [coDriverDropdownOpen, setCoDriverDropdownOpen] = useState(false);
    const [coDrivers, setCoDrivers] = useState<any[]>([]);
    
    const [selectedCarrier, setSelectedCarrier] = useState<any>(null);
    const [carrierSearch, setCarrierSearch] = useState("");
    const [carrierDropdownOpen, setCarrierDropdownOpen] = useState(false);
    const [carriers, setCarriers] = useState<any[]>([]);

    // Pay section states
    const [selectedPayDriver, setSelectedPayDriver] = useState<any>(null);
    const [payType, setPayType] = useState<"TOTAL" | "BASE" | "ADD" | "SUBTRACT">("TOTAL");
    const [payCurrency, setPayCurrency] = useState<"CAD" | "USD">("CAD");
    const [payRateUnit, setPayRateUnit] = useState<"/MILE" | "/TRIP" | "/HR" | "/%" | "/LOAD" | "/DAY">("/MILE");
    const [payRate, setPayRate] = useState("0.27");
    const [payHours, setPayHours] = useState("");
    const [payAmount, setPayAmount] = useState("");
    const [payDate, setPayDate] = useState("");
    const [payMemo, setPayMemo] = useState("");
    const [payGst, setPayGst] = useState(false);
    const [presetMemo, setPresetMemo] = useState("");
    const [payItems, setPayItems] = useState<Array<{
        amount: string;
        date: string;
        currency: string;
        memo: string;
        gst: boolean;
    }>>([]);
    const [payParking, setPayParking] = useState("");
    const [deductionItems, setDeductionItems] = useState<Array<{
        amount: string;
        date: string;
        currency: string;
        memo: string;
        gst: boolean;
    }>>([]);
    const [deductionAmount, setDeductionAmount] = useState("");
    const [deductionDate, setDeductionDate] = useState("");
    const [deductionMemo, setDeductionMemo] = useState("");
    const [deductionGst, setDeductionGst] = useState(false);
    const [deductionPresetMemo, setDeductionPresetMemo] = useState("");
    
    // Miles section states
    const [routeSegments, setRouteSegments] = useState<Array<{
        from: string;
        to: string;
        miles: number;
        locked: boolean;
    }>>([]);
    const [totalMiles, setTotalMiles] = useState(0);
    const [emptyMiles, setEmptyMiles] = useState(0);
    const [milesDate, setMilesDate] = useState("");
    const [emptyMilesCheck, setEmptyMilesCheck] = useState(false);
    const [milesCurrency, setMilesCurrency] = useState<"CAD" | "USD">("USD");
    const [milesParking, setMilesParking] = useState("");

    // Job stops table states
    const [jobStops, setJobStops] = useState<Array<{
        job: number;
        type: "Pick Up" | "Drop Off" | "YARD START" | "YARD END";
        name: string;
        city: string;
        date: string;
        truck: string;
        trailer: string;
        driver: string;
        coDriver: string;
        status: string;
    }>>([]);
    const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(null);

    // Notes states
    const [yardNotes, setYardNotes] = useState("");
    const [shipperNotes, setShipperNotes] = useState("");
    const [receiverNotes, setReceiverNotes] = useState("");
    const [yardNotes2, setYardNotes2] = useState("");
    const [smsPhoneNumber, setSmsPhoneNumber] = useState("+1 (647) 451-8874");
    
    // Notes/Audit states
    const [noteType, setNoteType] = useState<"public" | "private">("public");
    const [noteText, setNoteText] = useState("");
    const [notes, setNotes] = useState<Array<{
        id: number;
        type: "public" | "private";
        text: string;
        user: string;
        date: string;
    }>>([]);
    const [auditTrail, setAuditTrail] = useState<Array<{
        id: string | number;
        user: string;
        action: string;
        date: string;
        timestamp?: string;
        entityId?: string;
        details?: string;
    }>>([]);
    const [auditTrailLoading, setAuditTrailLoading] = useState(false);
    const [attachments, setAttachments] = useState<Array<{
        id: number;
        name: string;
        file: File | null;
        url?: string;
        fileSize?: number;
        payable: boolean;
        shareWithDriver: boolean;
    }>>([]);
    const [isDragging, setIsDragging] = useState(false);

    const [podFile, setPodFile] = useState<File | null>(null);
    const [stampedManifestFile, setStampedManifestFile] = useState<File | null>(null);
    
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

    const [showCommoditySuggestions, setShowCommoditySuggestions] = useState(false);


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
            // Map to Goods and Pick Up Details fields
            setPickUpNotes(order.pickupNote || '');
            setPickUpNumber(order.pickupRefNo || '');
            setPickupSkids(order.pickupSkids || '');
            setPickupCases(order.pickupCases || '');
            setGoods(order.commodity || '');

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
            // Also set drop off number and notes from these fields
            if (!dropOffNumber) setDropOffNumber(order.dropOffNumber || order.deliveryRefNo || '');
            if (!dropOffNotes) setDropOffNotes(order.dropOffNotes || order.deliveryNote || '');
            setDeliverySkids(order.deliverySkids || '');
            setDeliveryCases(order.deliveryCases || '');
            if (!deliveryGoods) setDeliveryGoods(order.commodity || '');
            setDeliveryNote(order.deliveryNote || '');

            // Shipper Information
            if (order.shipper) {
                setShipperName(order.shipper.name || '');
                setShipperPhone(order.shipper.phone || '');
                setShipperEmail(order.shipper.email || '');
                setShipperUnit(order.shipper.unit || '');
                setShipperCountry(order.shipper.country || '');
                setShipperProvince(order.shipper.province || '');
                setShipperCity(order.shipper.city || '');
                setShipperPostalCode(order.shipper.postalCode || '');
                setShipperPrimaryPhone(order.shipper.primaryPhone || '');
                setShipperSecondaryPhone(order.shipper.secondaryPhone || '');
                setShipperContact(order.shipper.contact || '');
                setShipperStore(order.shipper.store || '');
                setShipperType(order.shipper.type || 'DELIVERY');
                // Set shipper address from order data
                if (order.shipper.address) {
                    setShipperAddress(order.shipper.address);
                    // Update pickup location address if shipper address is provided
                    const shipperAddrParts = [
                        order.shipper.address || '',
                        order.shipper.city || '',
                        order.shipper.province || '',
                        order.shipper.country || '',
                        order.shipper.postalCode || ''
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
                setPickupAppointmentType(order.pickupAppointmentDetails.type || 'EXACT');
                if (order.pickupAppointmentDetails.date) {
                    const dateObj = new Date(order.pickupAppointmentDetails.date);
                    setPickupAppointmentDate(dateObj.toISOString().split('T')[0]);
                }
                setPickupAppointmentTime(order.pickupAppointmentDetails.time || '12:00');
                // WINDOW appointment fields
                if (order.pickupAppointmentDetails.startDate) {
                    const startDateObj = new Date(order.pickupAppointmentDetails.startDate);
                    setPickupStartDate(startDateObj.toISOString().split('T')[0]);
                }
                setPickupStartTime(order.pickupAppointmentDetails.startTime || 'TBA');
                if (order.pickupAppointmentDetails.endDate) {
                    const endDateObj = new Date(order.pickupAppointmentDetails.endDate);
                    setPickupEndDate(endDateObj.toISOString().split('T')[0]);
                }
                setPickupEndTime(order.pickupAppointmentDetails.endTime || 'TBA');
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
                setDeliveryAppointmentType(order.deliveryAppointmentDetails.type || 'EXACT');
                if (order.deliveryAppointmentDetails.date) {
                    const dateObj = new Date(order.deliveryAppointmentDetails.date);
                    setDeliveryAppointmentDate(dateObj.toISOString().split('T')[0]);
                }
                setDeliveryAppointmentTime(order.deliveryAppointmentDetails.time || '12:00');
                // WINDOW appointment fields
                if (order.deliveryAppointmentDetails.startDate) {
                    const startDateObj = new Date(order.deliveryAppointmentDetails.startDate);
                    setDeliveryStartDate(startDateObj.toISOString().split('T')[0]);
                }
                setDeliveryStartTime(order.deliveryAppointmentDetails.startTime || 'TBA');
                if (order.deliveryAppointmentDetails.endDate) {
                    const endDateObj = new Date(order.deliveryAppointmentDetails.endDate);
                    setDeliveryEndDate(endDateObj.toISOString().split('T')[0]);
                }
                setDeliveryEndTime(order.deliveryAppointmentDetails.endTime || 'TBA');
                setDeliveryUnloadingInstructions(order.deliveryAppointmentDetails.unloadingInstructions || '');
            }

            // Receiver Stop Information
            if (order.receiverStops && Array.isArray(order.receiverStops)) {
                setReceiverStops(order.receiverStops);
            }

            // Documents and Notes
            setInternalNotes(order.internalNotes || '');
            setCustomerNotes(order.customerNotes || '');
            
            // Load notes array
            console.log('📝 [FRONTEND] Loading notes from order:', {
                hasNotes: !!order.notes,
                isArray: Array.isArray(order.notes),
                notesLength: order.notes?.length || 0,
                notes: order.notes
            });
            if (order.notes && Array.isArray(order.notes) && order.notes.length > 0) {
                console.log('📝 [FRONTEND] Setting notes:', order.notes);
                // Map backend notes format to frontend format
                const mappedNotes = order.notes.map((note: any) => ({
                    id: note.id || note._id || Date.now() + Math.random(),
                    type: note.type || 'public',
                    text: note.text || note.note || '',
                    user: note.user || note.createdBy || 'Unknown',
                    date: note.createdAt 
                        ? new Date(note.createdAt).toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        })
                        : note.date || new Date().toLocaleString()
                }));
                setNotes(mappedNotes);
            } else {
                console.log('📝 [FRONTEND] No valid notes found, setting empty array');
                setNotes([]);
            }
            
            // Load attachments array
            if (order.attachments && Array.isArray(order.attachments)) {
                setAttachments(order.attachments.map((att: any) => ({
                    id: att.id || Date.now() + Math.random(),
                    name: att.name || '',
                    file: null, // Files are loaded from URLs
                    url: att.url || '',
                    payable: att.payable || false,
                    shareWithDriver: att.shareWithDriver || false
                })));
            }

            // Customer Information additional fields
            setCustomerUnit(order.customerUnit || '');
            setCustomerPostalCode(order.customerPostalCode || '');
            setCustomerPrimaryPhone(order.customerPrimaryPhone || '');
            setCustomerSecondaryPhone(order.customerSecondaryPhone || '');
            setCustomerContact(order.customerContact || '');
            setPayableEmail(order.payableEmail || '');
            setSecondaryPayableEmail(order.secondaryPayableEmail || '');

            // Billing Information
            if (order.billingDate) {
                const billingDateObj = new Date(order.billingDate);
                setBillingDate(billingDateObj.toISOString().split('T')[0]);
            }
            setRate(order.rate?.toString() || '0');
            setRateCurrency(order.rateCurrency || 'CAD');
            setDispatcher(order.dispatcher || '');
            setDispatcherEmail(order.dispatcherEmail || '');
            setBookedForCarrier(order.bookedForCarrier || false);
            setSendToFactor(order.sendToFactor || false);

            // Tax Configuration
            const loadedTaxCode = order.taxCode || 'No Tax';
            setTaxCode(loadedTaxCode);
            // If tax amount is not provided, auto-populate based on tax code
            if (order.taxAmount) {
                setTaxAmount(order.taxAmount.toString());
            } else {
                const taxRates: { [key: string]: string } = {
                    "No Tax": "",
                    "GST": "5",
                    "HST": "13",
                    "QST": "9.975",
                    "GST And QST": "14.975",
                    "GST And PST": "12"
                };
                setTaxAmount(taxRates[loadedTaxCode] || "");
            }

            // Customs Information
            setPars(order.pars || '');
            setPaps(order.paps || '');
            setTrailerSealNo(order.trailerSealNo || '');

            // Additional checkboxes
            setCsaFastApproved(order.csaFastApproved || false);
            setBondedShipmentCA(order.bondedShipmentCA || false);
            setBondedShipmentUS(order.bondedShipmentUS || false);
            setHighPriority(order.highPriority || false);
            setCityDriver(order.cityDriver || false);
            setTeamLoad(order.teamLoad || false);
            setRoundTrip(order.roundTrip || false);
            setOversized(order.oversized || false);
            setEmpty(order.empty || false);

            // Other Charges
            if (order.otherCharges && Array.isArray(order.otherCharges)) {
                setOtherCharges(order.otherCharges);
            }

            // Invoice Notes
            setInvoiceInstructions(order.invoiceInstructions || '');
            setInvoiceNotes(order.invoiceNotes || '');

            // Stop Information
            if (order.stops && Array.isArray(order.stops)) {
                setStops(order.stops);
            }
            
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

            // Assignment Information - Load assignment data when order is opened
            // First, fetch trucks, trailers, and drivers if not already loaded
            const loadAssignmentData = async () => {
                try {
                    let trucksData = trucks;
                    let trailersData = trailers;
                    let driversData = drivers;
                    
                    // Fetch trucks
                    if (trucks.length === 0) {
                        const trucksResponse = await listTrucks({ page: 1, limit: 100 });
                        trucksData = Array.isArray(trucksResponse.data) ? trucksResponse.data : trucksResponse.data.data || [];
                        setTrucks(trucksData);
                    }
                    // Fetch trailers
                    if (trailers.length === 0) {
                        const trailersResponse = await listTrailers({ page: 1, limit: 100 });
                        trailersData = Array.isArray(trailersResponse.data) ? trailersResponse.data : trailersResponse.data.data || [];
                        setTrailers(trailersData);
                    }
                    // Fetch drivers
                    if (drivers.length === 0) {
                        const driversResponse = await getAllDrivers(1, 100);
                        driversData = Array.isArray(driversResponse.data) ? driversResponse.data : driversResponse.data.data || [];
                        setDrivers(driversData);
                        setCoDrivers(driversData); // Co-drivers use the same list
                    }
                    
                    // Now set selected items using the fetched data
                    if (order.truck) {
                        const truckId = order.truck._id || order.truck.id || order.truck;
                        const matchingTruck = trucksData.find(t => (t._id || t.id) === truckId) || order.truck;
                        setSelectedTruck(matchingTruck);
                        setTruckSearch(matchingTruck.unitNumber || matchingTruck.plateNumber || matchingTruck.internalId || '');
                    }
                    if (order.trailer) {
                        const trailerId = order.trailer._id || order.trailer.id || order.trailer;
                        const matchingTrailer = trailersData.find(t => (t._id || t.id) === trailerId) || order.trailer;
                        setSelectedTrailer(matchingTrailer);
                        setTrailerSearch(matchingTrailer.unitNumber || matchingTrailer.plateNumber || matchingTrailer.internalId || '');
                    }
                    if (order.driver) {
                        const driverId = order.driver._id || order.driver.id || order.driver;
                        const matchingDriver = driversData.find(d => (d._id || d.id) === driverId) || order.driver;
                        setSelectedDriver(matchingDriver);
                        setDriverSearch(matchingDriver.name || matchingDriver.email || '');
                    }
                    if (order.coDriver) {
                        const coDriverId = order.coDriver._id || order.coDriver.id || order.coDriver;
                        const matchingCoDriver = driversData.find(d => (d._id || d.id) === coDriverId) || order.coDriver;
                        setSelectedCoDriver(matchingCoDriver);
                        setCoDriverSearch(matchingCoDriver.name || matchingCoDriver.email || '');
                    }
                } catch (error) {
                    console.error('Error loading assignment data:', error);
                    // Even if fetch fails, try to set from order data directly
                    if (order.truck) {
                        setSelectedTruck(order.truck);
                        setTruckSearch(order.truck.unitNumber || order.truck.plateNumber || order.truck.internalId || '');
                    }
                    if (order.trailer) {
                        setSelectedTrailer(order.trailer);
                        setTrailerSearch(order.trailer.unitNumber || order.trailer.plateNumber || order.trailer.internalId || '');
                    }
                    if (order.driver) {
                        setSelectedDriver(order.driver);
                        setDriverSearch(order.driver.name || order.driver.email || '');
                    }
                    if (order.coDriver) {
                        setSelectedCoDriver(order.coDriver);
                        setCoDriverSearch(order.coDriver.name || order.coDriver.email || '');
                    }
                }
            };
            
            // Load assignment data
            loadAssignmentData();
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
            setPickupAppointmentType('EXACT');
            setPickupAppointmentDate(new Date().toISOString().split('T')[0]);
            setPickupAppointmentTime('12:00');
            setPickupStartDate(new Date().toISOString().split('T')[0]);
            setPickupStartTime('TBA');
            setPickupEndDate(new Date().toISOString().split('T')[0]);
            setPickupEndTime('TBA');
            setPickupSpecialInstructions('');
            setPickupGatePass('');
            setSelectedReceiverCustomer(null);
            setReceiverCustomerSearch('');
            setReceiverName('');
            setReceiverPhone('');
            setReceiverAddress('');
            setDeliveryAppointmentType('EXACT');
            setDeliveryAppointmentDate(new Date().toISOString().split('T')[0]);
            setDeliveryAppointmentTime('12:00');
            setDeliveryStartDate(new Date().toISOString().split('T')[0]);
            setDeliveryStartTime('TBA');
            setDeliveryEndDate(new Date().toISOString().split('T')[0]);
            setDeliveryEndTime('TBA');
            setReceiverStops([]);
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
            
            // Reset new fields
            setCustomerUnit('');
            setCustomerPostalCode('');
            setCustomerPrimaryPhone('');
            setCustomerSecondaryPhone('');
            setCustomerContact('');
            setPayableEmail('');
            setSecondaryPayableEmail('');
            setBillingDate(new Date().toISOString().split('T')[0]);
            setRate('0');
            setRateCurrency('CAD');
            setDispatcher('');
            setDispatcherEmail('');
            setBookedForCarrier(false);
            setSendToFactor(false);
            setTaxCode('No Tax');
            setTaxAmount('');
            setPars('');
            setPaps('');
            setTrailerSealNo('');
            setCsaFastApproved(false);
            setBondedShipmentCA(false);
            setBondedShipmentUS(false);
            setHighPriority(false);
            setCityDriver(false);
            setTeamLoad(false);
            setRoundTrip(false);
            setOversized(false);
            setEmpty(false);
            setOtherCharges([]);
            setInvoiceInstructions('');
            setInvoiceNotes('');
            setStops([]);
            
            setCurrentStep(1);
        }
    }, [order, customers]);

    // Helper function to get customer address
    const getCustomerAddress = (customer: Customer | null): { address: string; city: string; state: string; country: string; zipCode: string; unit: string } => {
        if (!customer) return { address: '', city: '', state: '', country: '', zipCode: '', unit: '' };
        
        return {
            address: customer.customerDetails?.address || customer.address || '',
            city: customer.customerDetails?.city || customer.city || '',
            state: customer.customerDetails?.state || customer.state || '',
            country: customer.customerDetails?.country || customer.country || '',
            zipCode: customer.customerDetails?.zipCode || '',
            unit: customer.customerDetails?.unit || ''
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

    const equipmentTypes = ["DV", "RF", "FB", "HV", "SD", "DV/RF", "B-TRAIN", "FDA", "Double Drop", "Drayage", "Other", "PO", "Tri-Axle", "Tandem", "Quad-Axle"];
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

    // Filtered customers for customer selection
    const filteredCustomerOptions = useMemo(() => {
        const searchTerm = customerSearch.toLowerCase();
        return customers.filter(customer =>
            (customer.name || '').toLowerCase().includes(searchTerm) ||
            (customer.customerDetails?.address || customer.address || '').toLowerCase().includes(searchTerm) ||
            (customer.email || '').toLowerCase().includes(searchTerm) ||
            (customer.customerDetails?.city || customer.city || '').toLowerCase().includes(searchTerm)
        );
    }, [customers, customerSearch]);

    // Handler for customer selection
    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch("");
        setCustomerDropdownOpen(false);
        
        // Auto-fill customer fields
        if (customer.name) {
            // Customer name is already set via selectedCustomer
        }
        if (customer.phone) {
            setCustomerPrimaryPhone(customer.phone);
        }
        if (customer.email) {
            setPayableEmail(customer.email);
        }
        
        // Auto-fill address fields
        const addr = getCustomerAddress(customer);
        if (addr.unit) setCustomerUnit(addr.unit);
        if (addr.zipCode) setCustomerPostalCode(addr.zipCode);
    };

    // Handler for shipper customer selection
    const handleShipperSelect = (customer: Customer) => {
        setSelectedShipperCustomer(customer);
        setShipperCustomerSearch("");
        setShipperCustomerDropdownOpen(false);
        
        // Auto-fill shipper fields from customer
        if (customer.name) setShipperName(customer.name);
        if (customer.phone) {
            setShipperPhone(customer.phone);
            setShipperPrimaryPhone(customer.phone);
        }
        if (customer.email) setShipperEmail(customer.email);
        
        // Auto-fill address fields
        const addr = getCustomerAddress(customer);
        if (addr.address) setShipperAddress(addr.address);
        if (addr.unit) setShipperUnit(addr.unit);
        if (addr.country) setShipperCountry(addr.country);
        if (addr.state) setShipperProvince(addr.state);
        if (addr.city) setShipperCity(addr.city);
        if (addr.zipCode) setShipperPostalCode(addr.zipCode);
        
        // Auto-fill pickup location address (full address as single string)
        const fullAddress = formatFullAddress(customer);
        setPickupLocationAddress(fullAddress);
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

    // Invoice calculations
    const invoiceCalculations = useMemo(() => {
        const loadRate = parseFloat(rate) || 0;
        const taxPercent = parseFloat(taxAmount) || 0;
        const taxAmountValue = (loadRate * taxPercent) / 100;
        
        // Calculate other charges
        let otherChargesTotal = 0;
        otherCharges.forEach(charge => {
            if (charge.chargeAmount) {
                otherChargesTotal += parseFloat(charge.chargeAmount) || 0;
            } else if (charge.chargePercent) {
                otherChargesTotal += (loadRate * parseFloat(charge.chargePercent)) / 100;
            }
        });
        
        const subtotal = loadRate + otherChargesTotal;
        const total = subtotal + taxAmountValue;
        
        return {
            loadRate,
            subtotal,
            total,
            taxAmount: taxAmountValue
        };
    }, [rate, taxAmount, otherCharges]);

    // Helper functions for other charges
    const addOtherCharge = () => {
        if (!newChargeCategory && !newChargeDescription) {
            addNotification('error', 'Please fill in at least category or description');
            return;
        }
        setOtherCharges([...otherCharges, {
            category: newChargeCategory,
            chargePercent: newChargePercent,
            chargeAmount: newChargeAmount,
            description: newChargeDescription,
            gst: newChargeGst
        }]);
        setNewChargeCategory('');
        setNewChargePercent('');
        setNewChargeAmount('');
        setNewChargeDescription('');
        setNewChargeGst(false);
    };

    const removeOtherCharge = (index: number) => {
        setOtherCharges(otherCharges.filter((_, i) => i !== index));
    };

    // Helper functions for stops table
    const addStop = () => {
        const newStop = {
            stop: stops.length + 1,
            shipper: shipperName || '',
            date: pickupDate && pickupTime ? `${pickupDate} ${pickupTime}` : pickupDate || '',
            endDate: 'N/A',
            appointment: pickupAppointmentType || 'EXACT',
            pickUpNumber: pickUpNumber || '',
            contact: shipperContact || '',
            skids: pickupSkids || '',
            cases: pickupCases || '',
            weight: weight || '',
            uom: pickupUoM || 'Kg',
            temperature: temperature || '',
            address: shipperAddress || pickupLocationAddress || '',
            ltl: false
        };
        setStops([...stops, newStop]);
        addNotification('success', 'Stop added to table');
    };

    const removeStop = (index: number) => {
        const updatedStops = stops.filter((_, i) => i !== index).map((stop, idx) => ({
            ...stop,
            stop: idx + 1
        }));
        setStops(updatedStops);
    };

    // Helper functions for receiver stops table
    const addReceiverStop = () => {
        const newStop = {
            stop: receiverStops.length + 1,
            receiver: receiverName || '',
            date: deliveryDate && deliveryTime ? `${deliveryDate} ${deliveryTime}` : deliveryDate || '',
            endDate: deliveryAppointmentType === "WINDOW" && deliveryEndDate ? deliveryEndDate : 'N/A',
            appointment: deliveryAppointmentType || 'EXACT',
            dropOffNumber: dropOffNumber || '',
            contact: receiverContact || '',
            skids: deliverySkids || '',
            cases: deliveryCases || '',
            weight: weight || '',
            uom: deliveryUoM || 'Kg',
            temperature: temperature || '',
            address: receiverAddress || deliveryLocationAddress || '',
            ltl: false
        };
        setReceiverStops([...receiverStops, newStop]);
        addNotification('success', 'Receiver stop added to table');
    };

    const removeReceiverStop = (index: number) => {
        const updatedStops = receiverStops.filter((_, i) => i !== index).map((stop, idx) => ({
            ...stop,
            stop: idx + 1
        }));
        setReceiverStops(updatedStops);
    };

    const debouncedFetchSuggestions = useCallback(
        debounce((field: string, value: string) => fetchSuggestions(field, value), 300),
        [selectedCustomer]
    );

    // Helper function to render Shipper Panel
    const renderShipperPanel = (shipperData: {
        name?: string;
        address?: string;
        phone?: string;
        contact?: string;
        pickUpNumber?: string;
        uom?: string;
        province?: string;
        appointmentType?: string;
        appointmentDate?: string;
        appointmentTime?: string;
        startDate?: string;
        startTime?: string;
        endDate?: string;
        endTime?: string;
        temperature?: string;
        postalCode?: string;
        goods?: string;
        skids?: string;
        cases?: string;
        pickUpNotes?: string;
        weight?: string;
    }) => {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                    <div className="w-3 h-3 rounded-full bg-green-600"></div>
                    <h4 className="text-sm font-semibold text-gray-800">Shipper</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="font-semibold text-gray-700">Basic Information:</span>
                        <div className="mt-1 text-gray-800">
                            <div>{shipperData.name || 'N/A'}</div>
                            <div>{shipperData.address || 'N/A'}</div>
                            <div>{shipperData.phone || 'N/A'}</div>
                        </div>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Contact:</span>
                        <span className="ml-2 text-gray-800">{shipperData.contact || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Pick Up Number:</span>
                        <span className="ml-2 text-gray-800">{shipperData.pickUpNumber || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">UoM:</span>
                        <span className="ml-2 text-gray-800">{shipperData.uom || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Province:</span>
                        <span className="ml-2 text-gray-800">{shipperData.province || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Appointment:</span>
                        <span className="ml-2 text-gray-800">
                            {shipperData.appointmentType || 'N/A'}
                            {shipperData.appointmentType === "EXACT" && shipperData.appointmentDate && (
                                <span className="ml-1">- {shipperData.appointmentDate} {shipperData.appointmentTime || 'TBA'}</span>
                            )}
                            {shipperData.appointmentType === "WINDOW" && shipperData.startDate && (
                                <span className="ml-1">- Start: {shipperData.startDate} {shipperData.startTime || 'TBA'}, End: {shipperData.endDate} {shipperData.endTime || 'TBA'}</span>
                            )}
                        </span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Temperature:</span>
                        <span className="ml-2 text-gray-800">{shipperData.temperature || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Postal Code:</span>
                        <span className="ml-2 text-gray-800">{shipperData.postalCode || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Goods:</span>
                        <span className="ml-2 text-gray-800">{shipperData.goods || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Skids:</span>
                        <span className="ml-2 text-gray-800">{shipperData.skids || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Cases:</span>
                        <span className="ml-2 text-gray-800">{shipperData.cases || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Pick Up Notes:</span>
                        <span className="ml-2 text-gray-800">{shipperData.pickUpNotes || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Weight:</span>
                        <span className="ml-2 text-gray-800">{shipperData.weight || 'N/A'}</span>
                    </div>
                </div>
            </div>
        );
    };

    // Helper function to render Receiver Panel
    const renderReceiverPanel = (receiverData: {
        name?: string;
        address?: string;
        phone?: string;
        contact?: string;
        dropOffNumber?: string;
        uom?: string;
        province?: string;
        appointmentType?: string;
        appointmentDate?: string;
        appointmentTime?: string;
        startDate?: string;
        startTime?: string;
        endDate?: string;
        endTime?: string;
        temperature?: string;
        postalCode?: string;
        goods?: string;
        skids?: string;
        cases?: string;
        dropOffNotes?: string;
        weight?: string;
    }) => {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                    <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                    <h4 className="text-sm font-semibold text-gray-800">Receiver</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="font-semibold text-gray-700">Basic Information:</span>
                        <div className="mt-1 text-gray-800">
                            <div>{receiverData.name || 'N/A'}</div>
                            <div>{receiverData.address || 'N/A'}</div>
                            <div>{receiverData.phone || 'N/A'}</div>
                        </div>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Contact:</span>
                        <span className="ml-2 text-gray-800">{receiverData.contact || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Drop Off Number:</span>
                        <span className="ml-2 text-gray-800">{receiverData.dropOffNumber || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">UoM:</span>
                        <span className="ml-2 text-gray-800">{receiverData.uom || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Province:</span>
                        <span className="ml-2 text-gray-800">{receiverData.province || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Appointment:</span>
                        <span className="ml-2 text-gray-800">
                            {receiverData.appointmentType || 'N/A'}
                            {receiverData.appointmentType === "EXACT" && receiverData.appointmentDate && (
                                <span className="ml-1">- {receiverData.appointmentDate} {receiverData.appointmentTime || 'TBA'}</span>
                            )}
                            {receiverData.appointmentType === "WINDOW" && receiverData.startDate && (
                                <span className="ml-1">- Start: {receiverData.startDate} {receiverData.startTime || 'TBA'}, End: {receiverData.endDate} {receiverData.endTime || 'TBA'}</span>
                            )}
                        </span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Temperature:</span>
                        <span className="ml-2 text-gray-800">{receiverData.temperature || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Postal Code:</span>
                        <span className="ml-2 text-gray-800">{receiverData.postalCode || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Goods:</span>
                        <span className="ml-2 text-gray-800">{receiverData.goods || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Skids:</span>
                        <span className="ml-2 text-gray-800">{receiverData.skids || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Cases:</span>
                        <span className="ml-2 text-gray-800">{receiverData.cases || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Drop Off Notes:</span>
                        <span className="ml-2 text-gray-800">{receiverData.dropOffNotes || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-gray-700">Weight:</span>
                        <span className="ml-2 text-gray-800">{receiverData.weight || 'N/A'}</span>
                    </div>
                </div>
            </div>
        );
    };

    // Step navigation
    const nextStep = () => {
        if (currentStep < 8) {
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
            // Shipper phone is now optional - not all customers have phone numbers
            // if (!shipperPhone) {
            //     addNotification('error', "Please enter shipper phone");
            //     return false;
            // }
            if (!pickupLocationAddress) {
                addNotification('error', "Please select a shipper customer to set pickup location");
                return false;
            }
        } else if (step === 3) {
            if (!receiverName) {
                addNotification('error', "Please enter receiver name");
                return false;
            }
            // Receiver phone is now optional - not all customers have phone numbers
            // if (!receiverPhone) {
            //     addNotification('error', "Please enter receiver phone");
            //     return false;
            // }
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
        if (!shipperName) {
            addNotification('error', "Please enter shipper name");
            return;
        }
        // Shipper phone is optional - not all customers have phone numbers
        if (!receiverName) {
            addNotification('error', "Please enter receiver name");
            return;
        }
        // Receiver phone is also optional
        

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
            // Append attachment files (from Notes/Audit section)
            if (attachments && attachments.length > 0) {
                attachments.forEach((attachment, index) => {
                    if (attachment.file) {
                        formData.append(`attachment`, attachment.file);
                        formData.append(`attachmentName_${index}`, attachment.name);
                        formData.append(`attachmentPayable_${index}`, String(attachment.payable));
                        formData.append(`attachmentShareWithDriver_${index}`, String(attachment.shareWithDriver));
                    }
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
                pickupRefNo: pickUpNumber || pickupRefNo || '',
                pickupNote: pickUpNotes || pickupNote || '',
                deliveryLocation: {
                    place: deliveryLocationAddress || receiverAddress || '',
                    latitude: '',
                    longitude: ''
                },
                deliveryDate: deliveryDateTime,
                deliveryTime: deliveryTime || '',
                deliveryAppointment: deliveryAppointment === "Yes",
                deliveryRefNo: dropOffNumber || deliveryRefNo || '',
                deliveryNote: dropOffNotes || deliveryNote || '',
                commodity: goods || commodity || '',
                valueOfGoods: valueOfGoods ? parseFloat(valueOfGoods) : 0,
                valueOfGoodsCurrency: valueOfGoodsCurrency || 'CAD',
                equipment: selectedEquipment || [],
                noOfPackages: noOfPackages ? parseInt(noOfPackages) : 0,
                noOfPackagesType: noOfPackagesType || '',
                weight: weight ? parseFloat(weight) : 0,
                weightUnit: weightUnit || pickupUoM || 'kg',
                temperature: temperature ? parseFloat(temperature) : null,
                temperatureUnit: temperatureUnit || 'Celsius',
                // Additional pickup fields for Goods and Pick Up Details
                pickupSkids: pickupSkids || '',
                pickupCases: pickupCases || '',
                // Delivery goods and drop off details
                deliverySkids: deliverySkids || '',
                deliveryCases: deliveryCases || '',
                dropOffNotes: dropOffNotes || '',
                dropOffNumber: dropOffNumber || '',
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

                // Border Information - Always send if borderRequired is true OR if any customs broker fields are filled
                borderInfo: (borderRequired || brokerName || brokerPhone || brokerEmail) ? {
                    detailsRequired: borderRequired || false,
                    direction: borderDirection || 'CA_TO_US',
                    portOfEntry: portOfEntry || '',
                    cargoDescription: cargoDescription || '',
                    hsCode: hsCode || '',
                    brokerName: brokerName || '',
                    brokerPhone: brokerPhone || '',
                    brokerEmail: brokerEmail || '',
                    commercialValue: commercialValue || '',
                    countryOfOrigin: countryOfOrigin || ''
                } : null,

                // New fields - Shipper with all fields
                shipper: {
                    name: shipperName || '',
                    phone: shipperPhone || '',
                    email: shipperEmail || '',
                    address: pickupLocationAddress || shipperAddress || '',
                    unit: shipperUnit || '',
                    country: shipperCountry || '',
                    province: shipperProvince || '',
                    city: shipperCity || '',
                    postalCode: shipperPostalCode || '',
                    primaryPhone: shipperPrimaryPhone || '',
                    secondaryPhone: shipperSecondaryPhone || '',
                    contact: shipperContact || '',
                    store: shipperStore || '',
                    type: shipperType || 'DELIVERY'
                },
                pickupAppointmentDetails: {
                    type: pickupAppointmentType,
                    date: pickupAppointmentType === "EXACT" ? pickupAppointmentDate : pickupStartDate,
                    time: pickupAppointmentType === "EXACT" ? pickupAppointmentTime : pickupStartTime,
                    startDate: pickupAppointmentType === "WINDOW" ? pickupStartDate : undefined,
                    startTime: pickupAppointmentType === "WINDOW" ? pickupStartTime : undefined,
                    endDate: pickupAppointmentType === "WINDOW" ? pickupEndDate : undefined,
                    endTime: pickupAppointmentType === "WINDOW" ? pickupEndTime : undefined,
                    specialInstructions: pickupSpecialInstructions,
                    gatePass: pickupGatePass
                },
                receiver: {
                    name: receiverName || '',
                    phone: receiverPhone || '',
                    address: deliveryLocationAddress || receiverAddress || '',
                    contact: receiverContact || ''
                },
                deliveryAppointmentDetails: {
                    type: deliveryAppointmentType,
                    date: deliveryAppointmentType === "EXACT" ? deliveryAppointmentDate : deliveryStartDate,
                    time: deliveryAppointmentType === "EXACT" ? deliveryAppointmentTime : deliveryStartTime,
                    startDate: deliveryAppointmentType === "WINDOW" ? deliveryStartDate : undefined,
                    startTime: deliveryAppointmentType === "WINDOW" ? deliveryStartTime : undefined,
                    endDate: deliveryAppointmentType === "WINDOW" ? deliveryEndDate : undefined,
                    endTime: deliveryAppointmentType === "WINDOW" ? deliveryEndTime : undefined,
                    unloadingInstructions: deliveryUnloadingInstructions
                },
                // Receiver Stop Information
                receiverStops: receiverStops,
                // Don't include documents object - files are sent separately via FormData
                internalNotes: internalNotes,
                customerNotes: customerNotes,
                // Notes array (for Notes/Audit section)
                notes: notes,
                // Attachments (for Notes/Audit section - send existing attachments with URLs, new files will be uploaded separately)
                attachments: attachments.map(att => ({
                    id: att.id,
                    name: att.name,
                    url: att.url || '', // URL will be set by backend after file upload
                    fileSize: att.file?.size || att.fileSize || 0,
                    payable: att.payable || false,
                    shareWithDriver: att.shareWithDriver || false
                })),

                // Customer Information additional fields
                customerUnit: customerUnit,
                customerPostalCode: customerPostalCode,
                customerPrimaryPhone: customerPrimaryPhone,
                customerSecondaryPhone: customerSecondaryPhone,
                customerContact: customerContact,
                payableEmail: payableEmail,
                secondaryPayableEmail: secondaryPayableEmail,

                // Billing Information
                billingDate: billingDate,
                rate: rate ? parseFloat(rate) : 0,
                rateCurrency: rateCurrency,
                dispatcher: dispatcher,
                dispatcherEmail: dispatcherEmail,
                bookedForCarrier: bookedForCarrier,
                sendToFactor: sendToFactor,

                // Tax Configuration
                taxCode: taxCode,
                taxAmount: taxAmount ? parseFloat(taxAmount) : 0,

                // Customs Information
                pars: pars,
                paps: paps,
                trailerSealNo: trailerSealNo,

                // Additional checkboxes
                csaFastApproved: csaFastApproved,
                bondedShipmentCA: bondedShipmentCA,
                bondedShipmentUS: bondedShipmentUS,
                highPriority: highPriority,
                cityDriver: cityDriver,
                teamLoad: teamLoad,
                roundTrip: roundTrip,
                oversized: oversized,
                empty: empty,

                // Other Charges
                otherCharges: otherCharges,

                // Invoice Notes
                invoiceInstructions: invoiceInstructions,
                invoiceNotes: invoiceNotes,

                // Stop Information
                stops: stops,

                // Assignment Information
                truck: selectedTruck?._id || selectedTruck?.id || null,
                trailer: selectedTrailer?._id || selectedTrailer?.id || null,
                driver: selectedDriver?._id || selectedDriver?.id || null,
                coDriver: selectedCoDriver?._id || selectedCoDriver?.id || null
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
        
        // Only auto-calculate if we're on the final review step and both addresses are available
        if (currentStep === 8 && originAddress && destinationAddress && !calculatedDistance && !calculatingDistance) {
            calculateDistance();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, pickupLocationAddress, shipperAddress, deliveryLocationAddress, receiverAddress]);

    // Fetch trucks, trailers, and drivers when Assignment section is opened
    useEffect(() => {
        if (currentStep === 5) {
            // Fetch trucks
            const fetchTrucks = async () => {
                try {
                    const response = await listTrucks({ page: 1, limit: 100 });
                    if (response.success && response.data) {
                        setTrucks(Array.isArray(response.data) ? response.data : response.data.data || []);
                    }
                } catch (error) {
                    console.error('Error fetching trucks:', error);
                }
            };

            // Fetch trailers
            const fetchTrailers = async () => {
                try {
                    const response = await listTrailers({ page: 1, limit: 100 });
                    if (response.success && response.data) {
                        setTrailers(Array.isArray(response.data) ? response.data : response.data.data || []);
                    }
                } catch (error) {
                    console.error('Error fetching trailers:', error);
                }
            };

            // Fetch drivers
            const fetchDrivers = async () => {
                try {
                    const response = await getAllDrivers(1, 100);
                    if (response.success && response.data) {
                        const driversData = Array.isArray(response.data) ? response.data : response.data.data || [];
                        setDrivers(driversData);
                        setCoDrivers(driversData); // Co-drivers use the same list
                    }
                } catch (error) {
                    console.error('Error fetching drivers:', error);
                }
            };

            fetchTrucks();
            fetchTrailers();
            fetchDrivers();

            // Initialize job stops with shipper and receiver data
            const initialStops: Array<{
                job: number;
                type: "Pick Up" | "Drop Off";
                name: string;
                city: string;
                date: string;
                truck: string;
                trailer: string;
                driver: string;
                coDriver: string;
                status: string;
            }> = [];

            let jobNumber = 1;

            // Add shipper (Pick Up) if exists
            if (shipperName || shipperAddress) {
                initialStops.push({
                    job: jobNumber++,
                    type: "Pick Up",
                    name: shipperName || '',
                    city: shipperAddress || '',
                    date: pickupDate ? `${pickupDate} ${pickupTime || 'TBA'}` : "-",
                    truck: selectedTruck ? (selectedTruck.plateNumber || selectedTruck.vehicleNumber || '12/31/2025 TBA') : '12/31/2025 TBA',
                    trailer: selectedTrailer ? (selectedTrailer.trailer || selectedTrailer.plateNumber || 'TBA') : 'TBA',
                    driver: selectedDriver ? (selectedDriver.name || '') : '',
                    coDriver: selectedCoDriver ? (selectedCoDriver.name || '') : '',
                    status: ''
                });
            }

            // Add receiver (Drop Off) if exists
            if (receiverName || receiverAddress || deliveryLocationAddress) {
                initialStops.push({
                    job: jobNumber++,
                    type: "Drop Off",
                    name: receiverName || '',
                    city: receiverAddress || deliveryLocationAddress || '',
                    date: deliveryDate ? `${deliveryDate} ${deliveryTime || 'TBA'}` : "-",
                    truck: selectedTruck ? (selectedTruck.plateNumber || selectedTruck.vehicleNumber || '12/31/2025 TBA') : '12/31/2025 TBA',
                    trailer: selectedTrailer ? (selectedTrailer.trailer || selectedTrailer.plateNumber || 'TBA') : 'TBA',
                    driver: selectedDriver ? (selectedDriver.name || '') : '',
                    coDriver: selectedCoDriver ? (selectedCoDriver.name || '') : '',
                    status: 'PENDING'
                });
            }

            // Add receiver stops
            receiverStops.forEach((stop) => {
                initialStops.push({
                    job: jobNumber++,
                    type: "Drop Off",
                    name: stop.receiver || '',
                    city: stop.address || '',
                    date: stop.date || "-",
                    truck: selectedTruck ? (selectedTruck.plateNumber || selectedTruck.vehicleNumber || '12/31/2025 TBA') : '12/31/2025 TBA',
                    trailer: selectedTrailer ? (selectedTrailer.trailer || selectedTrailer.plateNumber || 'TBA') : 'TBA',
                    driver: selectedDriver ? (selectedDriver.name || '') : '',
                    coDriver: selectedCoDriver ? (selectedCoDriver.name || '') : '',
                    status: 'PENDING'
                });
            });

            setJobStops(initialStops);
        }
    }, [currentStep, shipperName, shipperAddress, receiverName, receiverAddress, deliveryLocationAddress, pickupDate, pickupTime, deliveryDate, deliveryTime, receiverStops, selectedTruck, selectedTrailer, selectedDriver, selectedCoDriver]);

    // Calculate route segments when on Assignment page
    useEffect(() => {
        if (currentStep === 5) {
            const segments: Array<{ from: string; to: string; miles: number; locked: boolean }> = [];
            
            // Get origin (shipper)
            const origin = shipperAddress || pickupLocationAddress;
            const originCity = shipperCity || shipperProvince || '';
            
            // Get destinations (receivers)
            const destinations: Array<{ address: string; city: string }> = [];
            
            // Add main receiver if exists
            if (receiverAddress || deliveryLocationAddress) {
                destinations.push({
                    address: receiverAddress || deliveryLocationAddress || '',
                    city: receiverName || ''
                });
            }
            
            // Add receiver stops
            receiverStops.forEach(stop => {
                if (stop.address) {
                    destinations.push({
                        address: stop.address,
                        city: stop.receiver || ''
                    });
                }
            });
            
            // Calculate segments
            if (origin && destinations.length > 0) {
                let previousLocation = origin;
                destinations.forEach((dest, index) => {
                    if (dest.address) {
                        // For now, use a placeholder distance calculation
                        // In production, you'd use a mapping service API
                        const estimatedMiles = 100 * (index + 1); // Placeholder
                        segments.push({
                            from: previousLocation.split(',')[0] || previousLocation,
                            to: dest.address.split(',')[0] || dest.address,
                            miles: estimatedMiles,
                            locked: false
                        });
                        previousLocation = dest.address;
                    }
                });
            }
            
            setRouteSegments(segments);
            
            // Calculate total miles
            const total = segments.reduce((sum, seg) => sum + seg.miles, 0);
            setTotalMiles(total);
        }
    }, [currentStep, shipperAddress, pickupLocationAddress, receiverAddress, deliveryLocationAddress, receiverStops, shipperCity, shipperProvince, receiverName]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.assignment-dropdown-container')) {
                setTruckDropdownOpen(false);
                setTrailerDropdownOpen(false);
                setDriverDropdownOpen(false);
                setCoDriverDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch audit trail when Notes/Audit step is opened
    useEffect(() => {
        const fetchOrderAuditTrail = async () => {
            if (currentStep === 6 && order?._id) {
                setAuditTrailLoading(true);
                try {
                    const response = await getAuditTrail();
                    if (response.success && response.data) {
                        // Filter audit trail entries for this specific order
                        const orderId = order._id.toString();
                        const orderNumber = order.orderNumber;
                        const filteredEntries = response.data
                            .filter((entry: any) => {
                                const entryOrderId = entry.entityId || '';
                                return entryOrderId === orderId || 
                                       entryOrderId === orderNumber ||
                                       entry.id?.includes(orderId);
                            })
                            .map((entry: any) => ({
                                id: entry.id || entry._id || Date.now(),
                                user: entry.user || 'Unknown',
                                action: entry.action || 'Updated',
                                date: entry.timestamp 
                                    ? new Date(entry.timestamp).toLocaleString('en-US', {
                                        month: '2-digit',
                                        day: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: true
                                    })
                                    : new Date().toLocaleString(),
                                timestamp: entry.timestamp,
                                entityId: entry.entityId,
                                details: entry.details || entry.action
                            }));
                        setAuditTrail(filteredEntries);
                    }
                } catch (error) {
                    console.error('Error fetching audit trail:', error);
                    addNotification('error', 'Failed to fetch audit trail');
                } finally {
                    setAuditTrailLoading(false);
                }
            }
        };

        fetchOrderAuditTrail();
    }, [currentStep, order?._id, order?.orderNumber]);

    const stepNames = ["Customer", "Shipper", "Receiver", "Review", "Assignment", "Notes / Audit"];

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
                                    Customer Details
                                </h3>
                                <p className="text-xs text-gray-600 mt-1 ml-10">Enter basic customer information and  details</p>
                            </div>
                            <div className="px-5 pt-5 pb-0 space-y-6">
                             

                                {/* Basic Information Section - Additional Customer Fields */}
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                                       
                                        Basic Information
                                    </h4>
                                    <div className="space-y-4">
                                        {/* Select Customer */}
                                        <div className="relative" ref={customerDropdownRef}>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Select Customer *</label>
                                            <div className="relative">
                                                <div
                                                    onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                                                    className="flex items-center gap-1 p-2 border border-gray-300 rounded bg-white cursor-pointer hover:border-opacity-75"
                                                >
                                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${customerDropdownOpen ? 'rotate-180' : ''}`} />
                                                    <input
                                                        type="text"
                                                        value={
                                                            selectedCustomer 
                                                                ? `${selectedCustomer.name || ''} | ${formatFullAddress(selectedCustomer) || selectedCustomer.email || ''}`
                                                                : customerSearch
                                                        }
                                                        onChange={(e) => {
                                                            setCustomerSearch(e.target.value);
                                                            setCustomerDropdownOpen(true);
                                                        }}
                                                        onFocus={() => setCustomerDropdownOpen(true)}
                                                        placeholder="Select customer"
                                                        className="flex-1 outline-none text-sm min-w-0"
                                                        readOnly={!!selectedCustomer}
                                                    />
                                                    {selectedCustomer && (
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
                                                                    placeholder="Search customers..."
                                                                    className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="overflow-y-auto max-h-48">
                                                            {filteredCustomerOptions.length > 0 ? (
                                                                <>
                                                                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-200 sticky top-0">
                                                                        Customers
                                                                    </div>
                                                                    {filteredCustomerOptions.map((customer) => {
                                                                        const fullAddr = formatFullAddress(customer);
                                                                        return (
                                                                            <div
                                                                                key={`customer-${customer._id || customer.id}`}
                                                                                onClick={() => handleCustomerSelect(customer)}
                                                                                className={`px-3 py-2 cursor-pointer text-sm hover:bg-gray-50 ${
                                                                                    (selectedCustomer?._id || selectedCustomer?.id) === (customer._id || customer.id) ? 'bg-blue-50' : ''
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
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Customer*</label>
                                            <input
                                                type="text"
                                                value={selectedCustomer?.name || ""}
                                                readOnly
                                                className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                                            <input
                                                type="text"
                                                value={customerUnit}
                                                onChange={(e) => setCustomerUnit(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Address*</label>
                                            <input
                                                type="text"
                                                value={formatFullAddress(selectedCustomer)}
                                                readOnly
                                                className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code*</label>
                                            <div className="flex gap-1">
                                                <input
                                                    type="text"
                                                    value={customerPostalCode}
                                                    onChange={(e) => setCustomerPostalCode(e.target.value)}
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                                <button className="px-2 rounded text-xl leading-none flex-shrink-0 transition-colors" style={{ color: PRIMARY_COLOR }}>
                                                    ✏️
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">City*</label>
                                            <input
                                                type="text"
                                                value={getCustomerAddress(selectedCustomer).city}
                                                readOnly
                                                className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Country*</label>
                                            <input
                                                type="text"
                                                value={getCustomerAddress(selectedCustomer).country}
                                                readOnly
                                                className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Province/State*</label>
                                            <input
                                                type="text"
                                                value={getCustomerAddress(selectedCustomer).state}
                                                readOnly
                                                className="w-full p-2 border border-gray-300 rounded bg-gray-50 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Primary Phone #</label>
                                            <div className="flex gap-1">
                                                <select className="w-20 p-2 border border-gray-300 rounded text-sm">
                                                    <option>🇺🇸 +1</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={customerPrimaryPhone}
                                                    onChange={(e) => setCustomerPrimaryPhone(e.target.value)}
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Secondary Phone #</label>
                                            <div className="flex gap-1">
                                                <select className="w-20 p-2 border border-gray-300 rounded text-sm">
                                                    <option>🇺🇸 +1</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={customerSecondaryPhone}
                                                    onChange={(e) => setCustomerSecondaryPhone(e.target.value)}
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Contact</label>
                                            <input
                                                type="text"
                                                value={customerContact}
                                                onChange={(e) => setCustomerContact(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Payable Email</label>
                                            <input
                                                type="email"
                                                value={payableEmail}
                                                onChange={(e) => setPayableEmail(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Equipment*</label>
                                            <select
                                                value={selectedEquipment[0] || ""}
                                                onChange={(e) => setSelectedEquipment(e.target.value ? [e.target.value] : [])}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                            >
                                                <option value="">Select</option>
                                                {equipmentTypes.map(eq => (
                                                    <option key={eq} value={eq}>{eq}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Secondary Payable Email</label>
                                            <input
                                                type="email"
                                                value={secondaryPayableEmail}
                                                onChange={(e) => setSecondaryPayableEmail(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Customs Information Section */}
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Customs Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Customs Broker</label>
                                            <div className="flex gap-1">
                                                <input
                                                    type="text"
                                                    value={brokerName}
                                                    onChange={(e) => setBrokerName(e.target.value)}
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    placeholder="Enter customs broker"
                                                />
                                                <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                                                    <Search className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Primary Phone #</label>
                                            <div className="flex gap-1">
                                                <select className="w-20 p-2 border border-gray-300 rounded text-sm">
                                                    <option>🇺🇸 +1</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    value={brokerPhone}
                                                    onChange={(e) => setBrokerPhone(e.target.value)}
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    placeholder="Enter phone number"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Broker Email</label>
                                            <input
                                                type="email"
                                                value={brokerEmail}
                                                onChange={(e) => setBrokerEmail(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                placeholder="Enter broker email"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">PARS</label>
                                            <div className="flex gap-1">
                                                <input
                                                    type="text"
                                                    value={pars}
                                                    onChange={(e) => setPars(e.target.value)}
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    placeholder="Enter PARS number"
                                                />
                                                <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                                                    <Search className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">PAPS</label>
                                            <div className="flex gap-1">
                                                <input
                                                    type="text"
                                                    value={paps}
                                                    onChange={(e) => setPaps(e.target.value)}
                                                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    placeholder="Enter PAPS number"
                                                />
                                                <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                                                    <Search className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Trailer Seal No.</label>
                                            <input
                                                type="text"
                                                value={trailerSealNo}
                                                onChange={(e) => setTrailerSealNo(e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                placeholder="Enter Alphanumeric Seal Number"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Section */}
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Additional</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={csaFastApproved}
                                                onChange={(e) => setCsaFastApproved(e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">CSA/FAST Approved</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={bondedShipmentCA}
                                                onChange={(e) => setBondedShipmentCA(e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">Bonded Shipment (CA)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={bondedShipmentUS}
                                                onChange={(e) => setBondedShipmentUS(e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">Bonded Shipment (US)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={highPriority}
                                                onChange={(e) => setHighPriority(e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">High Priority</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={cityDriver}
                                                onChange={(e) => setCityDriver(e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">City Driver</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={additionalInfo.TARP}
                                                onChange={(e) => setAdditionalInfo(prev => ({ ...prev, TARP: e.target.checked }))}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">Tarp Required</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={teamLoad}
                                                onChange={(e) => setTeamLoad(e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">Team Load</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={roundTrip}
                                                onChange={(e) => setRoundTrip(e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">Round Trip</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={additionalInfo.HAZMAT}
                                                onChange={(e) => setAdditionalInfo(prev => ({ ...prev, HAZMAT: e.target.checked }))}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">Hazmat Goods</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={additionalInfo.OverDimension || oversized}
                                                onChange={(e) => {
                                                    setOversized(e.target.checked);
                                                    setAdditionalInfo(prev => ({ ...prev, OverDimension: e.target.checked }));
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">Oversized</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={empty}
                                                onChange={(e) => setEmpty(e.target.checked)}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700">Empty</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Billing Information and Invoice Preview - Side by Side */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Billing Information */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Billing Information</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Order*</label>
                                                <input
                                                    type="text"
                                                    value={customerOrderNo}
                                                    onChange={(e) => setCustomerOrderNo(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                                                <input
                                                    type="date"
                                                    value={billingDate}
                                                    onChange={(e) => setBillingDate(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Rate*</label>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={rate}
                                                        onChange={(e) => setRate(e.target.value)}
                                                        className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    />
                                                    <div className="flex border border-gray-300 rounded overflow-hidden">
                                                        <button
                                                            onClick={() => setRateCurrency("CAD")}
                                                            className={`px-3 py-2 text-sm ${rateCurrency === "CAD" ? "bg-gray-800 !text-white" : "bg-white text-gray-700"}`}
                                                        >
                                                            CAD
                                                        </button>
                                                        <button
                                                            onClick={() => setRateCurrency("USD")}
                                                            className={`px-3 py-2 text-sm ${rateCurrency === "USD" ? "bg-gray-800 !text-white" : "bg-white text-gray-700"}`}
                                                        >
                                                            USD
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Salesperson</label>
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
                                                    <Search className="w-5 h-5 text-gray-400 mt-2" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Dispatcher</label>
                                                <input
                                                    type="text"
                                                    value={dispatcher}
                                                    onChange={(e) => setDispatcher(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Dispatcher's Email</label>
                                                <input
                                                    type="email"
                                                    value={dispatcherEmail}
                                                    onChange={(e) => setDispatcherEmail(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                            </div>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={bookedForCarrier}
                                                        onChange={(e) => setBookedForCarrier(e.target.checked)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm text-gray-700">Booked For Carrier</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={sendToFactor}
                                                        onChange={(e) => setSendToFactor(e.target.checked)}
                                                        className="w-4 h-4"
                                                    />
                                                    <span className="text-sm text-gray-700">Send To Factor</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tax Configuration and Invoice Preview */}
                                    <div className="space-y-4">
                                        {/* Tax Configuration */}
                                        <div className="bg-white rounded-lg border-2 border-green-200 p-4">
                                            <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Tax Configuration</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Tax Code</label>
                                                    <select
                                                        value={taxCode}
                                                        onChange={(e) => {
                                                            setTaxCode(e.target.value);
                                                            // Auto-populate tax amount based on tax code
                                                            const taxRates: { [key: string]: string } = {
                                                                "No Tax": "",
                                                                "GST": "5",
                                                                "HST": "13",
                                                                "QST": "9.975",
                                                                "GST And QST": "14.975",
                                                                "GST And PST": "12"
                                                            };
                                                            setTaxAmount(taxRates[e.target.value] || "");
                                                        }}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    >
                                                        <option value="No Tax">No Tax</option>
                                                        <option value="GST">GST</option>
                                                        <option value="HST">HST</option>
                                                        <option value="QST">QST</option>
                                                        <option value="GST And QST">GST And QST</option>
                                                        <option value="GST And PST">GST And PST</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Tax Amount (%)</label>
                                                    <input
                                                        type="number"
                                                        value={taxAmount}
                                                        onChange={(e) => setTaxAmount(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Invoice Preview */}
                                        <div className="bg-white rounded-lg border-2 border-green-200 p-4">
                                            <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Invoice Preview</h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-700">Load Rate</span>
                                                    <span className="text-sm font-medium text-gray-800">
                                                        {rateCurrency === "CAD" ? "$" : "$"}{invoiceCalculations.loadRate.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="border-t border-gray-200 pt-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-gray-700">Subtotal</span>
                                                        <span className="text-sm font-medium text-gray-800">
                                                            {rateCurrency === "CAD" ? "$" : "$"}{invoiceCalculations.subtotal.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="border-t-2 border-green-500 pt-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-green-600">Total</span>
                                                        <span className="text-sm font-bold text-green-600">
                                                            {rateCurrency === "CAD" ? "$" : "$"}{invoiceCalculations.total.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Invoice Instructions and Notes Section */}
                                <div className="space-y-4 mt-6">
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">Invoice Instructions</label>
                                        <textarea
                                            rows={4}
                                            value={invoiceInstructions}
                                            onChange={(e) => setInvoiceInstructions(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm resize-y"
                                            placeholder="Enter invoice instructions..."
                                        />
                                    </div>

                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">Invoice Notes</label>
                                        <textarea
                                            rows={4}
                                            value={invoiceNotes}
                                            onChange={(e) => setInvoiceNotes(e.target.value)}
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm resize-y"
                                            placeholder="Enter invoice notes..."
                                        />
                                    </div>
                                </div>

                                {/* Other Charges Section */}
                                <div className="bg-white rounded-lg border border-gray-200 p-4 mt-4">
                                    <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Other Charges</h4>
                                    <div className="space-y-3">
                                        {/* Add New Charge Row */}
                                        <div className="grid grid-cols-12 gap-2 items-end">
                                            <div className="col-span-3">
                                                <select
                                                    value={newChargeCategory}
                                                    onChange={(e) => setNewChargeCategory(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded text-xs"
                                                >
                                                    <option value="">Select Category</option>
                                                    <option value="Fuel Surcharge - % Of Base Rate">Fuel Surcharge - % Of Base Rate</option>
                                                    <option value="Bond Charges - $ Per Bond">Bond Charges - $ Per Bond</option>
                                                    <option value="Dangerous Goods - $ Per DG">Dangerous Goods - $ Per DG</option>
                                                    <option value="Reefer Surcharge - $">Reefer Surcharge - $</option>
                                                    <option value="Scheduled Truck Cancellation Charge - $">Scheduled Truck Cancellation Charge - $</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="text"
                                                    value={newChargePercent}
                                                    onChange={(e) => setNewChargePercent(e.target.value)}
                                                    placeholder="Charge %"
                                                    className="w-full p-2 border border-gray-300 rounded text-xs"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="text"
                                                    value={newChargeAmount}
                                                    onChange={(e) => setNewChargeAmount(e.target.value)}
                                                    placeholder="Charge $"
                                                    className="w-full p-2 border border-gray-300 rounded text-xs"
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    type="text"
                                                    value={newChargeDescription}
                                                    onChange={(e) => setNewChargeDescription(e.target.value)}
                                                    placeholder="Description"
                                                    className="w-full p-2 border border-gray-300 rounded text-xs"
                                                />
                                            </div>
                                            <div className="col-span-1 flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={newChargeGst}
                                                    onChange={(e) => setNewChargeGst(e.target.checked)}
                                                    className="w-4 h-4"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <button
                                                    onClick={addOtherCharge}
                                                    className="w-full p-2 bg-black !text-white rounded text-md font-bold hover:bg-gray-800 flex items-center justify-center"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                        {/* Charges List Header and Display */}
                                        <div className="border-t border-gray-200 pt-2">
                                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 mb-2 pb-1 border-b">
                                                <div className="col-span-2">Charge %</div>
                                                <div className="col-span-2">Charge $</div>
                                                <div className="col-span-6">Description</div>
                                                <div className="col-span-1">GST</div>
                                                <div className="col-span-1"></div>
                                            </div>
                                            {/* Charges Display Area */}
                                            {otherCharges.length > 0 ? (
                                                <div className="max-h-40 overflow-y-auto space-y-1">
                                                    {otherCharges.map((charge, index) => (
                                                        <div key={index} className="grid grid-cols-12 gap-2 text-xs items-center py-1 hover:bg-gray-50 border-b border-gray-100">
                                                            <div className="col-span-2">{charge.chargePercent || '-'}</div>
                                                            <div className="col-span-2">{charge.chargeAmount || '-'}</div>
                                                            <div className="col-span-6">{charge.category || charge.description || '-'}</div>
                                                            <div className="col-span-1">{charge.gst ? 'Yes' : 'No'}</div>
                                                            <div className="col-span-1">
                                                                <button
                                                                    onClick={() => removeOtherCharge(index)}
                                                                    className="text-red-500 hover:text-red-700 text-lg font-bold"
                                                                    title="Remove charge"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-8 text-center text-sm text-gray-400 bg-gray-50 rounded border border-gray-200">
                                                    No charges added yet
                                                </div>
                                            )}
                                        </div>
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
                                <div className="px-1 pt-5 pb-0 space-y-6">
                                    {/* Stop Information Table */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-semibold text-gray-800">Stop Information</h4>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={addStop}
                                                    className="px-3 py-1.5 bg-green-600 !text-white rounded text-sm font-medium hover:bg-green-700 flex items-center gap-1"
                                                >
                                                    <span className="text-lg">+</span>
                                                    <span>Add</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Stop</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Shipper</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Date</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">End Date</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Appointment</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Pick Up #</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Contact</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Skids</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Cases</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Weight</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">UoM</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Temperature</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Address</th>
                                                        <th className="p-2 text-left font-medium text-gray-700">LTL</th>
                                                        <th className="p-2 text-left font-medium text-gray-700">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stops.length > 0 ? (
                                                        stops.map((stop, index) => (
                                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="p-2 border-r border-gray-200">{stop.stop}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.shipper || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.date || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.endDate || 'N/A'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.appointment || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.pickUpNumber || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.contact || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.skids || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.cases || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.weight || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.uom || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.temperature || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.address || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={stop.ltl}
                                                                        onChange={(e) => {
                                                                            const updatedStops = [...stops];
                                                                            updatedStops[index].ltl = e.target.checked;
                                                                            setStops(updatedStops);
                                                                        }}
                                                                        className="w-4 h-4"
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <button
                                                                        onClick={() => removeStop(index)}
                                                                        className="text-red-500 hover:text-red-700 font-bold text-lg"
                                                                        title="Remove stop"
                                                                    >
                                                                        −
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={15} className="p-8 text-center text-gray-400 bg-gray-50">
                                                                No stops added yet. Fill in the fields below and click "Add Stop" to add entries.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Two Column Layout: Left - Shipper Info, Right - Goods & Pick Up */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Left Panel - Shipper Information */}
                                        <div className="space-y-4">
                                            {/* Select Shipper */}
                                            <div className="bg-white rounded-lg border border-gray-200 p-4">
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
                                            </div>

                                            {/* Search Address */}
                                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Search Address</label>
                                                <input
                                                    type="text"
                                                    placeholder="Search For An Address..."
                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                />
                                            </div>

                                            {/* Shipper Information Section */}
                                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Shipper Information</h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Shipper*</label>
                                                        <input
                                                            type="text"
                                                            value={shipperName}
                                                            onChange={(e) => setShipperName(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                                                        <input
                                                            type="text"
                                                            value={shipperUnit}
                                                            onChange={(e) => setShipperUnit(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Address*</label>
                                                        <input
                                                            type="text"
                                                            value={shipperAddress}
                                                            onChange={(e) => setShipperAddress(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Country*</label>
                                                        <select
                                                            value={shipperCountry}
                                                            onChange={(e) => setShipperCountry(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                        >
                                                            <option value="">Select Country</option>
                                                            <option value="Canada">Canada</option>
                                                            <option value="United States">United States</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Province/State*</label>
                                                        <input
                                                            type="text"
                                                            value={shipperProvince}
                                                            onChange={(e) => setShipperProvince(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">City*</label>
                                                        <input
                                                            type="text"
                                                            value={shipperCity}
                                                            onChange={(e) => setShipperCity(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
                                                        <div className="flex gap-1">
                                                            <input
                                                                type="text"
                                                                value={shipperPostalCode}
                                                                onChange={(e) => setShipperPostalCode(e.target.value)}
                                                                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                            <button className="p-2 border border-gray-300 rounded hover:bg-gray-50 text-green-600">
                                                                ✓
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Primary Phone #</label>
                                                        <div className="flex gap-1">
                                                            <select className="w-20 p-2 border border-gray-300 rounded text-sm">
                                                                <option>🇺🇸 +1</option>
                                                            </select>
                                                            <input
                                                                type="text"
                                                                value={shipperPrimaryPhone}
                                                                onChange={(e) => setShipperPrimaryPhone(e.target.value)}
                                                                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Secondary Phone #</label>
                                                        <div className="flex gap-1">
                                                            <select className="w-20 p-2 border border-gray-300 rounded text-sm">
                                                                <option>🇺🇸 +1</option>
                                                            </select>
                                                            <input
                                                                type="text"
                                                                value={shipperSecondaryPhone}
                                                                onChange={(e) => setShipperSecondaryPhone(e.target.value)}
                                                                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Contact</label>
                                                        <input
                                                            type="text"
                                                            value={shipperContact}
                                                            onChange={(e) => setShipperContact(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Store</label>
                                                        <input
                                                            type="text"
                                                            value={shipperStore}
                                                            onChange={(e) => setShipperStore(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={csaFastApproved}
                                                                onChange={(e) => setCsaFastApproved(e.target.checked)}
                                                                className="w-4 h-4"
                                                            />
                                                            <span className="text-sm text-gray-700">CSA/FAST Approved</span>
                                                        </label>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-2">Type</label>
                                                        <div className="flex gap-2">
                                                            {["DROP", "HOOK & GO", "DELIVERY"].map((type) => (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => setShipperType(type)}
                                                                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                                                                        shipperType === type
                                                                            ? "bg-blue-600 !text-white"
                                                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                    }`}
                                                                >
                                                                    {type}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Panel - Goods and Pick Up Details */}
                                        <div className="space-y-4">
                                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                                <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Goods and Pick Up Details</h4>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Goods</label>
                                                        <textarea
                                                            rows={4}
                                                            value={goods}
                                                            onChange={(e) => setGoods(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm resize-y"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Pick Up Notes</label>
                                                        <textarea
                                                            rows={4}
                                                            value={pickUpNotes}
                                                            onChange={(e) => setPickUpNotes(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm resize-y"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Pick Up Number</label>
                                                        <input
                                                            type="text"
                                                            value={pickUpNumber}
                                                            onChange={(e) => setPickUpNumber(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                                                            <input
                                                                type="text"
                                                                value={weight}
                                                                onChange={(e) => setWeight(e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Skids</label>
                                                            <input
                                                                type="text"
                                                                value={pickupSkids}
                                                                onChange={(e) => setPickupSkids(e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Cases</label>
                                                            <input
                                                                type="text"
                                                                value={pickupCases}
                                                                onChange={(e) => setPickupCases(e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">UoM</label>
                                                            <select
                                                                value={pickupUoM}
                                                                onChange={(e) => setPickupUoM(e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            >
                                                                <option value="Kg">Kg</option>
                                                                <option value="lbs">lbs</option>
                                                                <option value="tons">tons</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Temperature</label>
                                                            <input
                                                                type="text"
                                                                value={temperature}
                                                                onChange={(e) => setTemperature(e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-700 mb-1">Temp. Units</label>
                                                            <select
                                                                value={pickupTempUnits}
                                                                onChange={(e) => setPickupTempUnits(e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            >
                                                                <option value="">Select</option>
                                                                <option value="Celsius">Celsius</option>
                                                                <option value="Fahrenheit">Fahrenheit</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-2">Appointment</label>
                                                        <div className="flex gap-2">
                                                            {["EXACT", "WINDOW"].map((type) => (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => setPickupAppointmentType(type)}
                                                                    type="button"
                                                                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-all ${
                                                                        pickupAppointmentType === type
                                                                            ? "bg-blue-600 !text-white shadow-sm"
                                                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                                    }`}
                                                                >
                                                                    {type}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {pickupAppointmentType === "EXACT" ? (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Date*</label>
                                                                <input
                                                                    type="date"
                                                                    value={pickupDate}
                                                                    onChange={(e) => setPickupDate(e.target.value)}
                                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                                                                <div className="relative flex items-center">
                                                                    <input
                                                                        type="time"
                                                                        value={pickupTime}
                                                                        onChange={(e) => setPickupTime(e.target.value)}
                                                                        className="w-full p-2 pr-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                    />
                                                                    {pickupTime && (
                                                                        <button
                                                                            onClick={() => setPickupTime("")}
                                                                            className="absolute right-2 p-1 hover:bg-gray-100 rounded transition-colors"
                                                                            title="Clear"
                                                                            type="button"
                                                                        >
                                                                            <X className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {/* Start Date and Time */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date*</label>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="date"
                                                                            value={pickupStartDate}
                                                                            onChange={(e) => setPickupStartDate(e.target.value)}
                                                                            className="w-full p-2 pr-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                                                                    <div className="relative flex items-center">
                                                                        <input
                                                                            type="text"
                                                                            value={pickupStartTime}
                                                                            onChange={(e) => setPickupStartTime(e.target.value)}
                                                                            placeholder="TBA"
                                                                            className="w-full p-2 pr-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                        />
                                                                        {pickupStartTime && (
                                                                            <button
                                                                                onClick={() => setPickupStartTime("")}
                                                                                className="absolute right-2 p-1 hover:bg-gray-100 rounded transition-colors"
                                                                                title="Clear"
                                                                                type="button"
                                                                            >
                                                                                <X className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {/* End Date and Time */}
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date*</label>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="date"
                                                                            value={pickupEndDate}
                                                                            onChange={(e) => setPickupEndDate(e.target.value)}
                                                                            className="w-full p-2 pr-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                                                                    <div className="relative flex items-center">
                                                                        <input
                                                                            type="text"
                                                                            value={pickupEndTime}
                                                                            onChange={(e) => setPickupEndTime(e.target.value)}
                                                                            placeholder="TBA"
                                                                            className="w-full p-2 pr-8 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                                        />
                                                                        {pickupEndTime && (
                                                                            <button
                                                                                onClick={() => setPickupEndTime("")}
                                                                                className="absolute right-2 p-1 hover:bg-gray-100 rounded transition-colors"
                                                                                title="Clear"
                                                                                type="button"
                                                                            >
                                                                                <X className="w-3.5 h-3.5 text-gray-500 hover:text-gray-700" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {/* Add Stop Button */}
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <button
                                                            onClick={addStop}
                                                            className="w-full px-4 py-2 bg-blue-600 !text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                                                        >
                                                            <span className="text-lg font-bold">+</span>
                                                            <span>Add Stop to Table</span>
                                                        </button>
                                                    </div>
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
                                    {/* Stop Information Table */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-semibold text-gray-800">Stop Information</h4>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={addReceiverStop}
                                                    className="px-3 py-1.5 bg-green-600 !text-white rounded text-sm font-medium hover:bg-green-700 flex items-center gap-1"
                                                >
                                                    <span className="text-lg">+</span>
                                                    <span>Add</span>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-200">
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Stop</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Receiver</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Date</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">End Date</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Appointment</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Drop Off #</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Contact</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Skids</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Cases</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Weight</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">UoM</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Temperature</th>
                                                        <th className="p-2 text-left font-medium text-gray-700 border-r border-gray-200">Address</th>
                                                        <th className="p-2 text-left font-medium text-gray-700">LTL</th>
                                                        <th className="p-2 text-left font-medium text-gray-700">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {receiverStops.length > 0 ? (
                                                        receiverStops.map((stop, index) => (
                                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="p-2 border-r border-gray-200">{stop.stop}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.receiver || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.date || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.endDate || 'N/A'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.appointment || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.dropOffNumber || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.contact || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.skids || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.cases || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.weight || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.uom || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.temperature || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">{stop.address || '-'}</td>
                                                                <td className="p-2 border-r border-gray-200">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={stop.ltl}
                                                                        onChange={(e) => {
                                                                            const updatedStops = [...receiverStops];
                                                                            updatedStops[index].ltl = e.target.checked;
                                                                            setReceiverStops(updatedStops);
                                                                        }}
                                                                        className="w-4 h-4"
                                                                    />
                                                                </td>
                                                                <td className="p-2">
                                                                    <button
                                                                        onClick={() => removeReceiverStop(index)}
                                                                        className="text-red-500 hover:text-red-700 font-bold text-lg"
                                                                        title="Remove stop"
                                                                    >
                                                                        −
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={15} className="p-8 text-center text-gray-400 bg-gray-50">
                                                                No stops added yet. Fill in the fields below and click "Add Stop" to add entries.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

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
                                

                                    {/* Goods and Drop Off Details */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <h4 className="text-sm font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">Goods and Drop Off Details</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Goods</label>
                                                <textarea
                                                    rows={4}
                                                    value={deliveryGoods}
                                                    onChange={(e) => setDeliveryGoods(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm resize-y"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Drop Off Notes</label>
                                                <textarea
                                                    rows={4}
                                                    value={dropOffNotes}
                                                    onChange={(e) => setDropOffNotes(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm resize-y"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Drop Off Number</label>
                                                    <input
                                                        type="text"
                                                        value={dropOffNumber}
                                                        onChange={(e) => setDropOffNumber(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Skids</label>
                                                    <input
                                                        type="text"
                                                        value={deliverySkids}
                                                        onChange={(e) => setDeliverySkids(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cases</label>
                                                    <input
                                                        type="text"
                                                        value={deliveryCases}
                                                        onChange={(e) => setDeliveryCases(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Weight</label>
                                                    <input
                                                        type="text"
                                                        value={weight}
                                                        onChange={(e) => setWeight(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">UoM</label>
                                                    <select
                                                        value={deliveryUoM}
                                                        onChange={(e) => setDeliveryUoM(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    >
                                                        <option value="Kg">Kg</option>
                                                        <option value="Lbs">Lbs</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Temperature</label>
                                                    <input
                                                        type="text"
                                                        value={temperature}
                                                        onChange={(e) => setTemperature(e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Temp. Units</label>
                                                <select
                                                    value={deliveryTempUnits}
                                                    onChange={(e) => setDeliveryTempUnits(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="Celsius">Celsius</option>
                                                    <option value="Fahrenheit">Fahrenheit</option>
                                                </select>
                                            </div>
                                            {/* Add Stop Button */}
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                                <button
                                                    onClick={addReceiverStop}
                                                    className="w-full px-4 py-2 bg-blue-600 !text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                                                >
                                                    <span className="text-lg font-bold">+</span>
                                                    <span>Add Stop to Table</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        )
                    }

                    {/* Step 4: Review Section (After Receiver) */}
                    {
                        currentStep === 4 && (
                            <div className="border-b border-gray-200">
                                <div className="p-5 border-b border-gray-200" style={{ background: `linear-gradient(to right, ${PRIMARY_LIGHT_BG}, rgba(229, 231, 235, 0.5))` }}>
                                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold" style={{ background: PRIMARY_GRADIENT }}>4</span>
                                        Review
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1 ml-10">Review customer, shipper, and receiver information</p>
                                </div>
                                <div className="px-5 pt-5 pb-0 space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Customer Panel */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                                <h4 className="text-sm font-semibold text-gray-800">Customer</h4>
                                            </div>
                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <span className="font-semibold text-gray-700">Basic Information:</span>
                                                    <div className="mt-1 text-gray-800">
                                                        <div>{selectedCustomer?.name || 'N/A'}</div>
                                                        <div>{formatFullAddress(selectedCustomer) || 'N/A'}</div>
                                                        <div>{customerPrimaryPhone || 'N/A'}</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-700">Order No:</span>
                                                    <span className="ml-2 text-gray-800">{customerOrderNo || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-700">Equipment Code:</span>
                                                    <span className="ml-2 text-gray-800">{selectedEquipment.join(', ') || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-700">Dispatcher:</span>
                                                    <span className="ml-2 text-gray-800">{selectedSalesman || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-700">Customs Broker:</span>
                                                    <span className="ml-2 text-gray-800">{brokerName || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-700">Additional:</span>
                                                    <span className="ml-2 text-gray-800">{orderNotes || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Finance Panel */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                                                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                                                <h4 className="text-sm font-semibold text-gray-800">Finance</h4>
                                            </div>
                                            <div className="space-y-3 text-sm">
                                                <div>
                                                    <span className="font-semibold text-gray-700">Rate:</span>
                                                    <span className="ml-2 text-gray-800">
                                                        {rate ? `$${parseFloat(rate).toFixed(2)} (${rateCurrency})` : '$0.00 (CAD)'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-700">Payable:</span>
                                                    <span className="ml-2 text-gray-800">{payableEmail || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-700">Charges:</span>
                                                    <span className="ml-2 text-gray-800">
                                                        {otherCharges.length > 0 ? `${otherCharges.length} charge(s)` : 'N/A'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-700">Total Rate:</span>
                                                    <span className="ml-2 text-gray-800">
                                                        ${invoiceCalculations.total.toFixed(2)} ({rateCurrency || 'CAD'})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shipper Panel(s) - Show main shipper if it has data */}
                                    {(shipperName || shipperAddress || shipperPhone) && renderShipperPanel({
                                        name: shipperName,
                                        address: shipperAddress,
                                        phone: shipperPhone,
                                        contact: shipperContact,
                                        pickUpNumber: pickUpNumber,
                                        uom: pickupUoM,
                                        province: shipperProvince,
                                        appointmentType: pickupAppointmentType,
                                        appointmentDate: pickupDate,
                                        appointmentTime: pickupTime,
                                        startDate: pickupStartDate,
                                        startTime: pickupStartTime,
                                        endDate: pickupEndDate,
                                        endTime: pickupEndTime,
                                        temperature: temperature,
                                        postalCode: shipperPostalCode,
                                        goods: goods,
                                        skids: pickupSkids,
                                        cases: pickupCases,
                                        pickUpNotes: pickUpNotes,
                                        weight: weight
                                    })}

                                    {/* Receiver Panel(s) - Show main receiver if it has data */}
                                    {(receiverName || receiverAddress || deliveryLocationAddress || receiverPhone) && renderReceiverPanel({
                                        name: receiverName,
                                        address: receiverAddress || deliveryLocationAddress,
                                        phone: receiverPhone,
                                        contact: receiverContact,
                                        dropOffNumber: dropOffNumber,
                                        uom: deliveryUoM,
                                        province: '', // Not stored in state
                                        appointmentType: deliveryAppointmentType,
                                        appointmentDate: deliveryDate,
                                        appointmentTime: deliveryTime,
                                        startDate: deliveryStartDate,
                                        startTime: deliveryStartTime,
                                        endDate: deliveryEndDate,
                                        endTime: deliveryEndTime,
                                        temperature: temperature,
                                        postalCode: '', // Not stored in state
                                        goods: deliveryGoods,
                                        skids: deliverySkids,
                                        cases: deliveryCases,
                                        dropOffNotes: dropOffNotes,
                                        weight: weight
                                    })}

                                    {/* Additional Receiver Panels from receiverStops */}
                                    {receiverStops.map((stop, index) => {
                                        // Parse the date string to extract date and time
                                        const dateParts = stop.date ? stop.date.split(' ') : [];
                                        const stopDate = dateParts[0] || '';
                                        const stopTime = dateParts.slice(1).join(' ') || 'TBA';
                                        
                                        return (
                                            <div key={`receiver-stop-${index}`}>
                                                {renderReceiverPanel({
                                                    name: stop.receiver,
                                                    address: stop.address,
                                                    phone: '', // Receiver stops don't have phone in the structure
                                                    contact: stop.contact,
                                                    dropOffNumber: stop.dropOffNumber,
                                                    uom: stop.uom,
                                                    province: '', // Receiver stops don't have province in the structure
                                                    appointmentType: stop.appointment,
                                                    appointmentDate: stopDate,
                                                    appointmentTime: stopTime,
                                                    startDate: stop.endDate !== 'N/A' ? stop.endDate : undefined,
                                                    startTime: 'TBA',
                                                    endDate: stop.endDate !== 'N/A' ? stop.endDate : undefined,
                                                    endTime: 'TBA',
                                                    temperature: stop.temperature,
                                                    postalCode: '', // Receiver stops don't have postal code in the structure
                                                    goods: '', // Receiver stops don't have goods in the structure
                                                    skids: stop.skids,
                                                    cases: stop.cases,
                                                    dropOffNotes: '', // Receiver stops don't have drop off notes in the structure
                                                    weight: stop.weight
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    }

                    {/* Step 5: Assignment Section */}
                    {
                        currentStep === 5 && (
                            <div className="border-b border-gray-200">
                                <div className="p-5 border-b border-gray-200" style={{ background: `linear-gradient(to right, ${PRIMARY_LIGHT_BG}, rgba(229, 231, 235, 0.5))` }}>
                                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold" style={{ background: PRIMARY_GRADIENT }}>5</span>
                                        Assignment
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1 ml-10">Assign truck, trailer, driver, and co-driver</p>
                                </div>
                                <div className="px-5 pt-5 pb-5 space-y-6">
                                    {/* Job Stops Table */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">
                                                            <div className="flex items-center gap-1">
                                                                Sr. No.
                                                                <div className="flex flex-col">
                                                                    <ChevronUp className="w-3 h-3 text-gray-400" />
                                                                    <ChevronDown className="w-3 h-3 text-gray-400 -mt-1" />
                                                                </div>
                                                            </div>
                                                        </th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">Job</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">Name</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">City</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">Date</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">Truck</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">Trailer</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">Driver / Carrier</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-200">Co-Driver</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {jobStops.length > 0 ? (
                                                        jobStops.map((stop, index) => (
                                                            <tr 
                                                                key={index}
                                                                onClick={() => setSelectedStopIndex(index)}
                                                                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                                                                    selectedStopIndex === index ? 'bg-blue-50' : ''
                                                                }`}
                                                            >
                                                                <td className="px-3 py-2 border-r border-gray-200">{stop.job}</td>
                                                                <td className="px-3 py-2 border-r border-gray-200">
                                                                    {stop.type}
                                                                </td>
                                                                <td className="px-3 py-2 border-r border-gray-200">
                                                                    {stop.name || ''}
                                                                </td>
                                                                <td className="px-3 py-2 border-r border-gray-200">{stop.city || ''}</td>
                                                                <td className="px-3 py-2 border-r border-gray-200">
                                                                    {stop.date && stop.date !== '-' && stop.date.includes('TBA') ? (
                                                                        <div className="flex flex-col">
                                                                            <span>{stop.date.split(' TBA')[0]}</span>
                                                                            <span className="text-xs">TBA</span>
                                                                        </div>
                                                                    ) : stop.date && stop.date !== '-' ? (
                                                                        <div className="flex flex-col">
                                                                            {stop.date.includes(' ') ? (
                                                                                <>
                                                                                    <span>{stop.date.split(' ')[0]}</span>
                                                                                    <span className="text-xs">{stop.date.split(' ').slice(1).join(' ')}</span>
                                                                                </>
                                                                            ) : (
                                                                                <span>{stop.date}</span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        '-'
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 border-r border-gray-200">
                                                                    {stop.truck && stop.truck !== 'TBA' && stop.truck !== '12/31/2025 TBA' && !stop.truck.includes('2025-12-31') ? (
                                                                        <span className="text-red-600">
                                                                            {stop.truck.includes(' ') ? (
                                                                                <div className="flex flex-col">
                                                                                    <span>{stop.truck.split(' ')[0]}</span>
                                                                                    <span className="text-xs">{stop.truck.split(' ').slice(1).join(' ')}</span>
                                                                                </div>
                                                                            ) : (
                                                                                stop.truck
                                                                            )}
                                                                        </span>
                                                                    ) : stop.truck && stop.truck.includes('TBA') ? (
                                                                        <div className="flex flex-col">
                                                                            <span>{stop.truck.split(' TBA')[0]}</span>
                                                                            <span className="text-xs">TBA</span>
                                                                        </div>
                                                                    ) : stop.truck && stop.truck.includes('2025-12-31') ? (
                                                                        <div className="flex flex-col">
                                                                            <span>{stop.truck.split(' ')[0]}</span>
                                                                            <span className="text-xs">{stop.truck.split(' ').slice(1).join(' ')}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex flex-col">
                                                                            <span>TBA</span>
                                                                            <span className="text-xs">TBA</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 border-r border-gray-200">
                                                                    {stop.trailer && stop.trailer !== 'TBA' ? (
                                                                        <span className="text-red-600">
                                                                            {stop.trailer.includes(' ') ? (
                                                                                <div className="flex flex-col">
                                                                                    <span>{stop.trailer.split(' ')[0]}</span>
                                                                                    <span className="text-xs">{stop.trailer.split(' ').slice(1).join(' ')}</span>
                                                                                </div>
                                                                            ) : (
                                                                                stop.trailer
                                                                            )}
                                                                        </span>
                                                                    ) : (
                                                                        <div className="flex flex-col">
                                                                            <span>TBA</span>
                                                                            <span className="text-xs">TBA</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 border-r border-gray-200">
                                                                    {stop.driver && stop.driver !== 'TBA' ? (
                                                                        <div className="flex flex-col text-xs">
                                                                            {stop.driver.split(' ').length > 2 ? (
                                                                                <>
                                                                                    <span>{stop.driver.split(' ').slice(0, 2).join(' ')}</span>
                                                                                    <span>{stop.driver.split(' ').slice(2).join(' ')}</span>
                                                                                </>
                                                                            ) : (
                                                                                <span>{stop.driver}</span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        'TBA'
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 border-r border-gray-200">
                                                                    {stop.coDriver && stop.coDriver !== '-' ? (
                                                                        <div className="flex flex-col text-xs">
                                                                            {stop.coDriver.split(' ').length > 2 ? (
                                                                                <>
                                                                                    <span>{stop.coDriver.split(' ').slice(0, 2).join(' ')}</span>
                                                                                    <span>{stop.coDriver.split(' ').slice(2).join(' ')}</span>
                                                                                </>
                                                                            ) : (
                                                                                <span>{stop.coDriver}</span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        'TBA'
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <span className={stop.status === 'PENDING' ? "text-orange-600" : ""}>
                                                                        {stop.status || ''}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={10} className="px-3 py-4 text-center text-gray-500">
                                                                No job stops added yet. Use YARD START or YARD END to add stops.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Stop Edit Panel */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                                            <h4 className="text-sm font-semibold text-gray-800">Stop Edit</h4>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        // Add stop logic
                                                    }}
                                                    className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-sm"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (selectedStopIndex !== null) {
                                                            const updatedStops = jobStops.filter((_, i) => i !== selectedStopIndex);
                                                            setJobStops(updatedStops.map((stop, i) => ({ ...stop, job: i + 1 })));
                                                            setSelectedStopIndex(null);
                                                        }
                                                    }}
                                                    className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-sm"
                                                >
                                                    -
                                                </button>
                                            </div>
                                        </div>

                                        {/* Yard Buttons */}
                                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                                            <button
                                                onClick={() => {
                                                    const newStop = {
                                                        job: 1,
                                                        type: "Pick Up" as const,
                                                        name: "",
                                                        city: "Yard",
                                                        date: "-",
                                                        truck: selectedTruck ? (selectedTruck.plateNumber || selectedTruck.vehicleNumber || '12/31/2025 TBA') : '12/31/2025 TBA',
                                                        trailer: selectedTrailer ? (selectedTrailer.trailer || selectedTrailer.plateNumber || 'TBA') : 'TBA',
                                                        driver: selectedDriver ? (selectedDriver.name || '') : '',
                                                        coDriver: selectedCoDriver ? (selectedCoDriver.name || '') : '',
                                                        status: ""
                                                    };
                                                    // Add at the beginning
                                                    const updatedStops = [newStop, ...jobStops].map((stop, i) => ({ ...stop, job: i + 1 }));
                                                    setJobStops(updatedStops);
                                                    setSelectedStopIndex(0);
                                                    addNotification('success', 'YARD START - Pick Up job added at the top');
                                                }}
                                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium text-gray-700"
                                            >
                                                YARD START
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const newStop = {
                                                        job: jobStops.length + 1,
                                                        type: "Drop Off" as const,
                                                        name: "",
                                                        city: "Yard",
                                                        date: "-",
                                                        truck: selectedTruck ? (selectedTruck.plateNumber || selectedTruck.vehicleNumber || '12/31/2025 TBA') : '12/31/2025 TBA',
                                                        trailer: selectedTrailer ? (selectedTrailer.trailer || selectedTrailer.plateNumber || 'TBA') : 'TBA',
                                                        driver: selectedDriver ? (selectedDriver.name || '') : '',
                                                        coDriver: selectedCoDriver ? (selectedCoDriver.name || '') : '',
                                                        status: "PENDING"
                                                    };
                                                    // Add at the end
                                                    const updatedStops = [...jobStops, newStop].map((stop, i) => ({ ...stop, job: i + 1 }));
                                                    setJobStops(updatedStops);
                                                    setSelectedStopIndex(updatedStops.length - 1);
                                                    addNotification('success', 'YARD END - Drop Off job added at the bottom');
                                                }}
                                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium text-gray-700"
                                            >
                                                YARD END
                                            </button>
                                           
                                            <button
                                                onClick={() => {
                                                    const newStop = {
                                                        job: jobStops.length + 1,
                                                        type: "Drop Off" as const,
                                                        name: "",
                                                        city: "Yard",
                                                        date: "-",
                                                        truck: selectedTruck ? (selectedTruck.plateNumber || selectedTruck.vehicleNumber || '12/31/2025 TBA') : '12/31/2025 TBA',
                                                        trailer: selectedTrailer ? (selectedTrailer.trailer || selectedTrailer.plateNumber || 'TBA') : 'TBA',
                                                        driver: selectedDriver ? (selectedDriver.name || '') : '',
                                                        coDriver: selectedCoDriver ? (selectedCoDriver.name || '') : '',
                                                        status: "PENDING"
                                                    };
                                                    // Add after the currently selected stop, or at the end if none selected
                                                    let insertIndex = jobStops.length;
                                                    if (selectedStopIndex !== null && selectedStopIndex >= 0) {
                                                        insertIndex = selectedStopIndex + 1;
                                                    }
                                                    const updatedStops = [
                                                        ...jobStops.slice(0, insertIndex),
                                                        newStop,
                                                        ...jobStops.slice(insertIndex)
                                                    ].map((stop, i) => ({ ...stop, job: i + 1 }));
                                                    setJobStops(updatedStops);
                                                    setSelectedStopIndex(insertIndex);
                                                    addNotification('success', 'TAKE TO YARD - Drop Off job added');
                                                }}
                                                className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded text-xs font-medium text-gray-700"
                                            >
                                                TAKE TO YARD
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const newStop = {
                                                        job: jobStops.length + 1,
                                                        type: "Drop Off" as const,
                                                        name: "Tractor Swap",
                                                        city: "Yard",
                                                        date: "-",
                                                        truck: selectedTruck ? (selectedTruck.plateNumber || selectedTruck.vehicleNumber || '12/31/2025 TBA') : '12/31/2025 TBA',
                                                        trailer: selectedTrailer ? (selectedTrailer.trailer || selectedTrailer.plateNumber || 'TBA') : 'TBA',
                                                        driver: selectedDriver ? (selectedDriver.name || '') : '',
                                                        coDriver: selectedCoDriver ? (selectedCoDriver.name || '') : '',
                                                        status: "PENDING"
                                                    };
                                                    // Add after the currently selected stop, or at the end if none selected
                                                    let insertIndex = jobStops.length;
                                                    if (selectedStopIndex !== null && selectedStopIndex >= 0) {
                                                        insertIndex = selectedStopIndex + 1;
                                                    }
                                                    const updatedStops = [
                                                        ...jobStops.slice(0, insertIndex),
                                                        newStop,
                                                        ...jobStops.slice(insertIndex)
                                                    ].map((stop, i) => ({ ...stop, job: i + 1 }));
                                                    setJobStops(updatedStops);
                                                    setSelectedStopIndex(insertIndex);
                                                    addNotification('success', 'TRACTOR SWAP - Drop Off job added');
                                                }}
                                                className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded text-xs font-medium text-gray-700"
                                            >
                                                TRACTOR SWAP
                                            </button>
                                        </div>

                                        {/* Stop Details */}
                                        {selectedStopIndex !== null && jobStops[selectedStopIndex] && (
                                            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600">Type</label>
                                                        <div className="mt-1 text-red-600 font-medium">
                                                            {jobStops[selectedStopIndex].type === "YARD START" || jobStops[selectedStopIndex].type === "YARD END" 
                                                                ? jobStops[selectedStopIndex].type 
                                                                : jobStops[selectedStopIndex].type}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600">Date</label>
                                                        <div className="mt-1 flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={jobStops[selectedStopIndex].date}
                                                                onChange={(e) => {
                                                                    const updated = [...jobStops];
                                                                    updated[selectedStopIndex].date = e.target.value;
                                                                    setJobStops(updated);
                                                                }}
                                                                className="flex-1 p-1 border border-gray-300 rounded text-xs"
                                                            />
                                                            <button className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs">
                                                                TBA
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600">Address</label>
                                                        <select 
                                                            value={jobStops[selectedStopIndex]?.city || ''}
                                                            onChange={(e) => {
                                                                const updated = [...jobStops];
                                                                updated[selectedStopIndex].city = e.target.value;
                                                                setJobStops(updated);
                                                            }}
                                                            className="mt-1 w-full p-1 border border-gray-300 rounded text-xs"
                                                        >
                                                            <option value="">Select Yard</option>
                                                            <option value="Winnipeg Yard">Winnipeg Yard</option>
                                                            <option value="Surrey Yard / TMG">Surrey Yard / TMG</option>
                                                            <option value="Calgary Yard / Ocean">Calgary Yard / Ocean</option>
                                                            <option value="Impact Freight Services - Acheson">Impact Freight Services - Acheson</option>
                                                            <option value="Laredo Yard - Santos">Laredo Yard - Santos</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Three Column Layout: Assignment, Pay, Miles */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                                        {/* Assignment Column */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-semibold text-gray-800">Assignment</h4>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            // Add assignment logic
                                                        }}
                                                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-sm"
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            // Remove assignment logic
                                                        }}
                                                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-sm"
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Assignment Type Toggle */}
                                            <div className="flex items-center gap-2 mb-4">
                                                <button
                                                    onClick={() => setAssignmentType("DRIVER")}
                                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                        assignmentType === "DRIVER"
                                                            ? "bg-gray-800 !text-white"
                                                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    DRIVER
                                                </button>
                                                <button
                                                    onClick={() => setAssignmentType("CARRIER")}
                                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                                                        assignmentType === "CARRIER"
                                                            ? "bg-gray-800 !text-white"
                                                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    CARRIER
                                                </button>
                                            </div>

                                            {/* Assignment Fields */}
                                            <div className="space-y-4">
                                                {/* Carrier Field - Only shown when CARRIER is selected */}
                                                {assignmentType === "CARRIER" && (
                                                    <div className="relative assignment-dropdown-container">
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">Carrier</label>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                value={selectedCarrier ? (selectedCarrier.name || selectedCarrier.companyName || '') : carrierSearch}
                                                                onChange={(e) => {
                                                                    setCarrierSearch(e.target.value);
                                                                    setCarrierDropdownOpen(true);
                                                                }}
                                                                onFocus={() => setCarrierDropdownOpen(true)}
                                                                placeholder="Search carrier..."
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm pr-10"
                                                            />
                                                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                            {carrierDropdownOpen && (
                                                                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                                    <div className="p-2 border-b border-gray-200">
                                                                        <div className="relative">
                                                                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                            <input
                                                                                type="text"
                                                                                value={carrierSearch}
                                                                                onChange={(e) => setCarrierSearch(e.target.value)}
                                                                                placeholder="Search carriers..."
                                                                                className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                                                autoFocus
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="overflow-y-auto max-h-48">
                                                                        {carriers
                                                                            .filter(carrier => 
                                                                                !carrierSearch || 
                                                                                (carrier.name || '').toLowerCase().includes(carrierSearch.toLowerCase()) ||
                                                                                (carrier.companyName || '').toLowerCase().includes(carrierSearch.toLowerCase())
                                                                            )
                                                                            .map((carrier) => (
                                                                                <div
                                                                                    key={carrier._id || carrier.id}
                                                                                    onClick={() => {
                                                                                        const oldValue = selectedCarrier ? (selectedCarrier.name || selectedCarrier.companyName || '') : '';
                                                                                        const newValue = carrier.name || carrier.companyName || '';
                                                                                        setSelectedCarrier(carrier);
                                                                                        setCarrierSearch(newValue);
                                                                                        setCarrierDropdownOpen(false);
                                                                                        if (oldValue !== newValue) {
                                                                                            addAuditTrailEntry(`Receiver - Carrier Added`);
                                                                                        }
                                                                                    }}
                                                                                    className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                                                >
                                                                                    {carrier.name || carrier.companyName || 'N/A'}
                                                                                </div>
                                                                            ))}
                                                                        {carriers.length === 0 && (
                                                                            <div className="p-2 text-sm text-gray-500">No carriers found</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                            <button 
                                                                onClick={() => {
                                                                    setSelectedCarrier(null);
                                                                    setCarrierSearch('');
                                                                }}
                                                                className="hover:text-gray-700"
                                                            >
                                                                Clear
                                                            </button>
                                                            <span>Clear All</span>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Truck, Trailer, Driver, Co-Driver Fields - Only shown when DRIVER is selected */}
                                                {assignmentType === "DRIVER" && (
                                                    <>
                                                {/* Truck Field */}
                                                <div className="relative assignment-dropdown-container">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Truck</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={selectedTruck ? (selectedTruck.plateNumber || selectedTruck.vehicleNumber || selectedTruck.name || '') : truckSearch}
                                                            onChange={(e) => {
                                                                setTruckSearch(e.target.value);
                                                                setTruckDropdownOpen(true);
                                                            }}
                                                            onFocus={() => setTruckDropdownOpen(true)}
                                                            placeholder="Search truck..."
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm pr-10"
                                                        />
                                                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        {truckDropdownOpen && (
                                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                                <div className="p-2 border-b border-gray-200">
                                                                    <div className="relative">
                                                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                        <input
                                                                            type="text"
                                                                            value={truckSearch}
                                                                            onChange={(e) => setTruckSearch(e.target.value)}
                                                                            placeholder="Search trucks..."
                                                                            className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                                            autoFocus
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-y-auto max-h-48">
                                                                    {trucks
                                                                        .filter(truck => 
                                                                            !truckSearch || 
                                                                            (truck.plateNumber || '').toLowerCase().includes(truckSearch.toLowerCase()) ||
                                                                            (truck.vehicleNumber || '').toLowerCase().includes(truckSearch.toLowerCase()) ||
                                                                            (truck.make || '').toLowerCase().includes(truckSearch.toLowerCase()) ||
                                                                            (truck.model || '').toLowerCase().includes(truckSearch.toLowerCase()) ||
                                                                            (truck.internalId || '').toLowerCase().includes(truckSearch.toLowerCase()) ||
                                                                            (truck.unitNumber || '').toLowerCase().includes(truckSearch.toLowerCase())
                                                                        )
                                                                        .map((truck) => (
                                                                            <div
                                                                                key={truck._id || truck.id}
                                                                                onClick={() => {
                                                                                    const oldValue = selectedTruck ? (selectedTruck.plateNumber || selectedTruck.vehicleNumber || selectedTruck.name || '') : '';
                                                                                    const newValue = truck.plateNumber || truck.vehicleNumber || truck.name || '';
                                                                                    setSelectedTruck(truck);
                                                                                    setTruckSearch(newValue);
                                                                                    setTruckDropdownOpen(false);
                                                                                    if (oldValue !== newValue) {
                                                                                        addAuditTrailEntry(`Receiver - Truck Added`);
                                                                                    }
                                                                                }}
                                                                                className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                                                            >
                                                                                <div className="font-medium text-gray-900">
                                                                                    {truck.plateNumber || truck.vehicleNumber || truck.unitNumber || truck.name || 'N/A'}
                                                                                </div>
                                                                                <div className="text-xs text-gray-600 mt-0.5 space-y-0.5">
                                                                                    {truck.internalId && <div>ID: {truck.internalId}</div>}
                                                                                    {(truck.make || truck.model) && (
                                                                                        <div>{truck.make || ''} {truck.model || ''}</div>
                                                                                    )}
                                                                                    {truck.unitNumber && truck.unitNumber !== (truck.plateNumber || truck.vehicleNumber) && (
                                                                                        <div>Unit: {truck.unitNumber}</div>
                                                                                    )}
                                                                                    {truck.status && <div className="text-gray-500">Status: {truck.status}</div>}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    {trucks.length === 0 && (
                                                                        <div className="p-2 text-sm text-gray-500">No trucks found</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedTruck(null);
                                                                setTruckSearch('');
                                                            }}
                                                            className="hover:text-gray-700"
                                                        >
                                                            Clear
                                                        </button>
                                                        <span>Clear All</span>
                                                    </div>
                                                    {selectedTruck && (
                                                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                            <div className="text-xs font-semibold text-blue-900 mb-2">Selected Truck Details:</div>
                                                            <div className="text-xs text-gray-700 space-y-1">
                                                                {selectedTruck.internalId && <div><span className="font-medium">Internal ID:</span> {selectedTruck.internalId}</div>}
                                                                <div><span className="font-medium">Plate Number:</span> {selectedTruck.plateNumber || selectedTruck.vehicleNumber || 'N/A'}</div>
                                                                {selectedTruck.unitNumber && <div><span className="font-medium">Unit Number:</span> {selectedTruck.unitNumber}</div>}
                                                                {(selectedTruck.make || selectedTruck.model) && (
                                                                    <div><span className="font-medium">Make/Model:</span> {selectedTruck.make || ''} {selectedTruck.model || ''}</div>
                                                                )}
                                                                {selectedTruck.year && <div><span className="font-medium">Year:</span> {selectedTruck.year}</div>}
                                                                {selectedTruck.status && <div><span className="font-medium">Status:</span> {selectedTruck.status}</div>}
                                                                {selectedTruck.vinNumber && <div><span className="font-medium">VIN:</span> {selectedTruck.vinNumber}</div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Trailer Field */}
                                                <div className="relative assignment-dropdown-container">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Trailer</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={selectedTrailer ? (selectedTrailer.trailer || selectedTrailer.plateNumber || selectedTrailer.name || '') : trailerSearch}
                                                            onChange={(e) => {
                                                                setTrailerSearch(e.target.value);
                                                                setTrailerDropdownOpen(true);
                                                            }}
                                                            onFocus={() => setTrailerDropdownOpen(true)}
                                                            placeholder="Search trailer..."
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm pr-10"
                                                        />
                                                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        {trailerDropdownOpen && (
                                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                                <div className="p-2 border-b border-gray-200">
                                                                    <div className="relative">
                                                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                        <input
                                                                            type="text"
                                                                            value={trailerSearch}
                                                                            onChange={(e) => setTrailerSearch(e.target.value)}
                                                                            placeholder="Search trailers..."
                                                                            className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                                            autoFocus
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-y-auto max-h-48">
                                                                    {trailers
                                                                        .filter(trailer => 
                                                                            !trailerSearch || 
                                                                            (trailer.trailer || '').toLowerCase().includes(trailerSearch.toLowerCase()) ||
                                                                            (trailer.plateNumber || '').toLowerCase().includes(trailerSearch.toLowerCase()) ||
                                                                            (trailer.type || '').toLowerCase().includes(trailerSearch.toLowerCase()) ||
                                                                            (trailer.internalId || '').toLowerCase().includes(trailerSearch.toLowerCase()) ||
                                                                            (trailer.unitNumber || '').toLowerCase().includes(trailerSearch.toLowerCase())
                                                                        )
                                                                        .map((trailer) => (
                                                                            <div
                                                                                key={trailer._id || trailer.id}
                                                                                onClick={() => {
                                                                                    const oldValue = selectedTrailer ? (selectedTrailer.trailer || selectedTrailer.plateNumber || selectedTrailer.name || '') : '';
                                                                                    const newValue = trailer.trailer || trailer.plateNumber || trailer.name || '';
                                                                                    setSelectedTrailer(trailer);
                                                                                    setTrailerSearch(newValue);
                                                                                    setTrailerDropdownOpen(false);
                                                                                    if (oldValue !== newValue) {
                                                                                        addAuditTrailEntry(`Receiver - Trailer Added`);
                                                                                    }
                                                                                }}
                                                                                className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                                                            >
                                                                                <div className="font-medium text-gray-900">
                                                                                    {trailer.trailer || trailer.plateNumber || trailer.unitNumber || trailer.name || 'N/A'}
                                                                                </div>
                                                                                <div className="text-xs text-gray-600 mt-0.5 space-y-0.5">
                                                                                    {trailer.internalId && <div>ID: {trailer.internalId}</div>}
                                                                                    {trailer.type && <div>Type: {trailer.type}</div>}
                                                                                    {trailer.unitNumber && trailer.unitNumber !== (trailer.trailer || trailer.plateNumber) && (
                                                                                        <div>Unit: {trailer.unitNumber}</div>
                                                                                    )}
                                                                                    {trailer.status && <div className="text-gray-500">Status: {trailer.status}</div>}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    {trailers.length === 0 && (
                                                                        <div className="p-2 text-sm text-gray-500">No trailers found</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedTrailer(null);
                                                                setTrailerSearch('');
                                                            }}
                                                            className="hover:text-gray-700"
                                                        >
                                                            Clear
                                                        </button>
                                                        <span>Clear All</span>
                                                    </div>
                                                    {selectedTrailer && (
                                                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                            <div className="text-xs font-semibold text-green-900 mb-2">Selected Trailer Details:</div>
                                                            <div className="text-xs text-gray-700 space-y-1">
                                                                {selectedTrailer.internalId && <div><span className="font-medium">Internal ID:</span> {selectedTrailer.internalId}</div>}
                                                                <div><span className="font-medium">Trailer Number:</span> {selectedTrailer.trailer || selectedTrailer.plateNumber || 'N/A'}</div>
                                                                {selectedTrailer.plateNumber && <div><span className="font-medium">Plate Number:</span> {selectedTrailer.plateNumber}</div>}
                                                                {selectedTrailer.unitNumber && <div><span className="font-medium">Unit Number:</span> {selectedTrailer.unitNumber}</div>}
                                                                {selectedTrailer.type && <div><span className="font-medium">Type:</span> {selectedTrailer.type}</div>}
                                                                {selectedTrailer.status && <div><span className="font-medium">Status:</span> {selectedTrailer.status}</div>}
                                                                {selectedTrailer.capacity && <div><span className="font-medium">Capacity:</span> {selectedTrailer.capacity}</div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Driver Field */}
                                                <div className="relative assignment-dropdown-container">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Driver</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={selectedDriver ? (selectedDriver.name || selectedDriver.internalId || '') : driverSearch}
                                                            onChange={(e) => {
                                                                setDriverSearch(e.target.value);
                                                                setDriverDropdownOpen(true);
                                                            }}
                                                            onFocus={() => setDriverDropdownOpen(true)}
                                                            placeholder="Search driver..."
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm pr-10"
                                                        />
                                                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        {driverDropdownOpen && (
                                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                                <div className="p-2 border-b border-gray-200">
                                                                    <div className="relative">
                                                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                        <input
                                                                            type="text"
                                                                            value={driverSearch}
                                                                            onChange={(e) => setDriverSearch(e.target.value)}
                                                                            placeholder="Search drivers..."
                                                                            className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                                            autoFocus
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-y-auto max-h-48">
                                                                    {drivers
                                                                        .filter(driver => 
                                                                            !driverSearch || 
                                                                            (driver.name || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
                                                                            (driver.internalId || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
                                                                            (driver.phone || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
                                                                            (driver.email || '').toLowerCase().includes(driverSearch.toLowerCase())
                                                                        )
                                                                        .map((driver) => (
                                                                            <div
                                                                                key={driver._id || driver.id}
                                                                                onClick={() => {
                                                                                    const oldValue = selectedDriver ? (selectedDriver.name || selectedDriver.internalId || '') : '';
                                                                                    const newValue = driver.name || driver.internalId || '';
                                                                                    setSelectedDriver(driver);
                                                                                    setDriverSearch(newValue);
                                                                                    setDriverDropdownOpen(false);
                                                                                    if (oldValue !== newValue) {
                                                                                        addAuditTrailEntry(`Receiver - Driver Added`);
                                                                                    }
                                                                                }}
                                                                                className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                                                            >
                                                                                <div className="font-medium text-gray-900">
                                                                                    {driver.name || driver.internalId || 'N/A'}
                                                                                </div>
                                                                                <div className="text-xs text-gray-600 mt-0.5 space-y-0.5">
                                                                                    {driver.internalId && <div>Internal ID: {driver.internalId}</div>}
                                                                                    {driver.phone && <div>Phone: {driver.phone}</div>}
                                                                                    {driver.email && <div>Email: {driver.email}</div>}
                                                                                    {driver.licenseNumber && <div>License: {driver.licenseNumber}</div>}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    {drivers.length === 0 && (
                                                                        <div className="p-2 text-sm text-gray-500">No drivers found</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedDriver(null);
                                                                setDriverSearch('');
                                                            }}
                                                            className="hover:text-gray-700"
                                                        >
                                                            Clear
                                                        </button>
                                                        <span>Clear All</span>
                                                    </div>
                                                    {selectedDriver && (
                                                        <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                            <div className="text-xs font-semibold text-purple-900 mb-2">Selected Driver Details:</div>
                                                            <div className="text-xs text-gray-700 space-y-1">
                                                                {selectedDriver.internalId && <div><span className="font-medium">Internal ID:</span> {selectedDriver.internalId}</div>}
                                                                <div><span className="font-medium">Name:</span> {selectedDriver.name || 'N/A'}</div>
                                                                {selectedDriver.phone && <div><span className="font-medium">Phone:</span> {selectedDriver.phone}</div>}
                                                                {selectedDriver.email && <div><span className="font-medium">Email:</span> {selectedDriver.email}</div>}
                                                                {selectedDriver.licenseNumber && <div><span className="font-medium">License Number:</span> {selectedDriver.licenseNumber}</div>}
                                                                {selectedDriver.status && <div><span className="font-medium">Status:</span> {selectedDriver.status}</div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Co-Driver Field */}
                                                <div className="relative assignment-dropdown-container">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Co-Driver</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={selectedCoDriver ? (selectedCoDriver.name || selectedCoDriver.internalId || '') : coDriverSearch}
                                                            onChange={(e) => {
                                                                setCoDriverSearch(e.target.value);
                                                                setCoDriverDropdownOpen(true);
                                                            }}
                                                            onFocus={() => setCoDriverDropdownOpen(true)}
                                                            placeholder="Search co-driver..."
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm pr-10"
                                                        />
                                                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                        {coDriverDropdownOpen && (
                                                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                                                                <div className="p-2 border-b border-gray-200">
                                                                    <div className="relative">
                                                                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                                        <input
                                                                            type="text"
                                                                            value={coDriverSearch}
                                                                            onChange={(e) => setCoDriverSearch(e.target.value)}
                                                                            placeholder="Search co-drivers..."
                                                                            className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                                            autoFocus
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="overflow-y-auto max-h-48">
                                                                    {coDrivers
                                                                        .filter(driver => 
                                                                            !coDriverSearch || 
                                                                            (driver.name || '').toLowerCase().includes(coDriverSearch.toLowerCase()) ||
                                                                            (driver.internalId || '').toLowerCase().includes(coDriverSearch.toLowerCase()) ||
                                                                            (driver.phone || '').toLowerCase().includes(coDriverSearch.toLowerCase()) ||
                                                                            (driver.email || '').toLowerCase().includes(coDriverSearch.toLowerCase())
                                                                        )
                                                                        .map((driver) => (
                                                                            <div
                                                                                key={driver._id || driver.id}
                                                                                onClick={() => {
                                                                                    const oldValue = selectedCoDriver ? (selectedCoDriver.name || selectedCoDriver.internalId || '') : '';
                                                                                    const newValue = driver.name || driver.internalId || '';
                                                                                    setSelectedCoDriver(driver);
                                                                                    setCoDriverSearch(newValue);
                                                                                    setCoDriverDropdownOpen(false);
                                                                                    if (oldValue !== newValue) {
                                                                                        addAuditTrailEntry(`Receiver - Codriver Added`);
                                                                                    }
                                                                                }}
                                                                                className="p-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                                                                            >
                                                                                <div className="font-medium text-gray-900">
                                                                                    {driver.name || driver.internalId || 'N/A'}
                                                                                </div>
                                                                                <div className="text-xs text-gray-600 mt-0.5 space-y-0.5">
                                                                                    {driver.internalId && <div>Internal ID: {driver.internalId}</div>}
                                                                                    {driver.phone && <div>Phone: {driver.phone}</div>}
                                                                                    {driver.email && <div>Email: {driver.email}</div>}
                                                                                    {driver.licenseNumber && <div>License: {driver.licenseNumber}</div>}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    {coDrivers.length === 0 && (
                                                                        <div className="p-2 text-sm text-gray-500">No co-drivers found</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedCoDriver(null);
                                                                setCoDriverSearch('');
                                                            }}
                                                            className="hover:text-gray-700"
                                                        >
                                                            Clear
                                                        </button>
                                                        <span>Clear All</span>
                                                    </div>
                                                    {selectedCoDriver && (
                                                        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                                            <div className="text-xs font-semibold text-orange-900 mb-2">Selected Co-Driver Details:</div>
                                                            <div className="text-xs text-gray-700 space-y-1">
                                                                {selectedCoDriver.internalId && <div><span className="font-medium">Internal ID:</span> {selectedCoDriver.internalId}</div>}
                                                                <div><span className="font-medium">Name:</span> {selectedCoDriver.name || 'N/A'}</div>
                                                                {selectedCoDriver.phone && <div><span className="font-medium">Phone:</span> {selectedCoDriver.phone}</div>}
                                                                {selectedCoDriver.email && <div><span className="font-medium">Email:</span> {selectedCoDriver.email}</div>}
                                                                {selectedCoDriver.licenseNumber && <div><span className="font-medium">License Number:</span> {selectedCoDriver.licenseNumber}</div>}
                                                                {selectedCoDriver.status && <div><span className="font-medium">Status:</span> {selectedCoDriver.status}</div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Pay Column */}
                                        <div className="space-y-4">
                                            {/* + and - buttons at the top */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setPayType("ADD")}
                                                    className={`w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-sm transition-colors ${
                                                        payType === "ADD"
                                                            ? "bg-gray-800 !text-white border-gray-800"
                                                            : "bg-white"
                                                    }`}
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => setPayType("SUBTRACT")}
                                                    className={`w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-sm transition-colors ${
                                                        payType === "SUBTRACT"
                                                            ? "bg-gray-800 !text-white border-gray-800"
                                                            : "bg-white"
                                                    }`}
                                                >
                                                    -
                                                </button>
                                            </div>

                                            <h4 className="text-sm font-semibold text-gray-800">Pay</h4>
                                            
                                            {/* Driver Dropdown */}
                                            <div>
                                                <select
                                                    value={selectedPayDriver?._id || selectedDriver?._id || ''}
                                                    onChange={(e) => {
                                                        const driver = drivers.find(d => d._id === e.target.value);
                                                        setSelectedPayDriver(driver || null);
                                                    }}
                                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                >
                                                    <option value="">Select Driver</option>
                                                    {drivers.map((driver) => (
                                                        <option key={driver._id} value={driver._id}>
                                                            {driver.name || driver.internalId}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            {/* Auto-select driver from assignment if available */}
                                            {selectedDriver && !selectedPayDriver && (
                                                <div className="text-xs text-gray-500">
                                                    Using assigned driver: {selectedDriver.name || selectedDriver.internalId}
                                                </div>
                                            )}

                                            {/* Pay Type Buttons */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button
                                                    onClick={() => setPayType("TOTAL")}
                                                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                        payType === "TOTAL"
                                                            ? "bg-gray-800 !text-white"
                                                            : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                    }`}
                                                >
                                                    TOTAL
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setPayType("BASE")}
                                                        className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                            payType === "BASE"
                                                                ? "bg-gray-800 !text-white"
                                                                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        BASE
                                                    </button>
                                                    <button
                                                        onClick={() => setPayType("ADD")}
                                                        className={`w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-sm transition-colors ${
                                                            payType === "ADD"
                                                                ? "bg-gray-800 !text-white border-gray-800"
                                                                : "bg-white"
                                                        }`}
                                                    >
                                                        +
                                                    </button>
                                                    <button
                                                        onClick={() => setPayType("SUBTRACT")}
                                                        className={`w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-sm transition-colors ${
                                                            payType === "SUBTRACT"
                                                                ? "bg-gray-800 !text-white border-gray-800"
                                                                : "bg-white"
                                                        }`}
                                                    >
                                                        -
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Pay Content Based on Type */}
                                            {payType === "BASE" && (
                                                <div className="space-y-3">
                                                    <div className="text-xs font-medium text-gray-700">Driver Pay</div>
                                                    
                                                    {/* Currency Selection */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => setPayCurrency("CAD")}
                                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                                payCurrency === "CAD"
                                                                    ? "bg-gray-800 !text-white"
                                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            CAD
                                                        </button>
                                                        <button
                                                            onClick={() => setPayCurrency("USD")}
                                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                                payCurrency === "USD"
                                                                    ? "bg-gray-800 !text-white"
                                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            USD
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Rate Unit Selection */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <button
                                                            onClick={() => setPayRateUnit("/MILE")}
                                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                                payRateUnit === "/MILE"
                                                                    ? "bg-gray-800 !text-white"
                                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            /MILE
                                                        </button>
                                                        <button
                                                            onClick={() => setPayRateUnit("/TRIP")}
                                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                                payRateUnit === "/TRIP"
                                                                    ? "bg-gray-800 !text-white"
                                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            /TRIP
                                                        </button>
                                                        <button
                                                            onClick={() => setPayRateUnit("/HR")}
                                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                                payRateUnit === "/HR"
                                                                    ? "bg-gray-800 !text-white"
                                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            /HR
                                                        </button>
                                                        <button
                                                            onClick={() => setPayRateUnit("/%")}
                                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                                payRateUnit === "/%"
                                                                    ? "bg-gray-800 !text-white"
                                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            /%
                                                        </button>
                                                        <button
                                                            onClick={() => setPayRateUnit("/LOAD")}
                                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                                payRateUnit === "/LOAD"
                                                                    ? "bg-gray-800 !text-white"
                                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            /LOAD
                                                        </button>
                                                        <button
                                                            onClick={() => setPayRateUnit("/DAY")}
                                                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                                                payRateUnit === "/DAY"
                                                                    ? "bg-gray-800 !text-white"
                                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                                            }`}
                                                        >
                                                            /DAY
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Rate Input */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Rate{payRateUnit === "/MILE" ? "/Mile" : payRateUnit === "/TRIP" ? "/Trip" : payRateUnit === "/HR" ? "/Hr" : payRateUnit === "/%" ? "" : payRateUnit === "/LOAD" ? "/Load" : "/Day"}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={payRate}
                                                            onChange={(e) => setPayRate(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                            placeholder="0.27"
                                                        />
                                                    </div>
                                                    
                                                    {/* Number of Hours - Only shown when /HR is selected */}
                                                    {payRateUnit === "/HR" && (
                                                        <div>
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                Number of Hours
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={payHours}
                                                                onChange={(e) => setPayHours(e.target.value)}
                                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                                placeholder="8"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {payType === "ADD" && (
                                                <div className="space-y-3">
                                                    {/* Amount Input */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">$</span>
                                                            <input
                                                                type="text"
                                                                value={payAmount}
                                                                onChange={(e) => setPayAmount(e.target.value)}
                                                                className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                                placeholder="12"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Date Input */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                                                        <input
                                                            type="date"
                                                            value={payDate}
                                                            onChange={(e) => setPayDate(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                        />
                                                    </div>
                                                    
                                                    {/* Currency Selection */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                                                        <select
                                                            value={payCurrency}
                                                            onChange={(e) => setPayCurrency(e.target.value as "CAD" | "USD")}
                                                            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                        >
                                                            <option value="CAD">CAD</option>
                                                            <option value="USD">USD</option>
                                                        </select>
                                                    </div>
                                                    
                                                    {/* Memo Input */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Memo</label>
                                                        <input
                                                            type="text"
                                                            value={payMemo}
                                                            onChange={(e) => setPayMemo(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                            placeholder="Memo"
                                                        />
                                                    </div>
                                                    
                                                    {/* GST Checkbox and Add Button */}
                                                    <div className="flex items-center justify-between">
                                                        <label className="flex items-center gap-2 text-xs text-gray-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={payGst}
                                                                onChange={(e) => setPayGst(e.target.checked)}
                                                                className="w-4 h-4"
                                                            />
                                                            GST
                                                        </label>
                                                        <button
                                                            onClick={() => {
                                                                if (payAmount) {
                                                                    setPayItems([...payItems, {
                                                                        amount: payAmount,
                                                                        date: payDate,
                                                                        currency: payCurrency,
                                                                        memo: payMemo,
                                                                        gst: payGst
                                                                    }]);
                                                                    setPayAmount("");
                                                                    setPayDate("");
                                                                    setPayMemo("");
                                                                    setPayGst(false);
                                                                }
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center bg-gray-800 !text-white rounded hover:bg-gray-700 text-sm font-medium"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Preset Memo Dropdown */}
                                                    <div>
                                                        <select
                                                            value={presetMemo}
                                                            onChange={(e) => {
                                                                setPresetMemo(e.target.value);
                                                                setPayMemo(e.target.value);
                                                            }}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                        >
                                                            <option value="">Preset Memo</option>
                                                            <option value="Tolls">Tolls</option>
                                                            <option value="Layover">Layover</option>
                                                            <option value="Advance">Advance</option>
                                                            <option value="Parking">Parking</option>
                                                            <option value="Fuel">Fuel</option>
                                                            <option value="Other">Other</option>
                                                            <option value="Pickup">Pickup</option>
                                                            <option value="Delivery">Delivery</option>
                                                        </select>
                                                    </div>
                                                    
                                                    {/* Pay Items List */}
                                                    {payItems.length > 0 && (
                                                        <div className="space-y-2">
                                                            {payItems.map((item, index) => (
                                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-300 rounded text-sm">
                                                                    <span className="font-medium">${item.amount}</span>
                                                                    <span className="text-gray-600">{item.date}</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            const updated = payItems.filter((_, i) => i !== index);
                                                                            setPayItems(updated);
                                                                        }}
                                                                        className="text-red-600 hover:text-red-800 text-xs"
                                                                    >
                                                                        X
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {payItems.length === 0 && (
                                                        <div className="text-xs text-gray-500">No deductions</div>
                                                    )}
                                                </div>
                                            )}

                                            {payType === "TOTAL" && (
                                                <div className="bg-gray-100 border border-gray-300 rounded p-3 text-sm">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-gray-600">Base Pay ({payRateUnit})</span>
                                                        <span className="font-medium">$0.00</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mb-2">
                                                        0.00 mi x ${payRate}
                                                    </div>
                                                    <div className="border-t border-gray-300 pt-2 flex items-center justify-between">
                                                        <span className="font-semibold">TOTAL</span>
                                                        <span className="font-semibold">$0.00</span>
                                                    </div>
                                                </div>
                                            )}

                                            {payType === "SUBTRACT" && (
                                                <div className="space-y-3">
                                                    {/* Amount Input */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Amount</label>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">$</span>
                                                            <input
                                                                type="text"
                                                                value={deductionAmount}
                                                                onChange={(e) => setDeductionAmount(e.target.value)}
                                                                className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                                placeholder="12"
                                                            />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Date Input */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                                                        <input
                                                            type="date"
                                                            value={deductionDate}
                                                            onChange={(e) => setDeductionDate(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                        />
                                                    </div>
                                                    
                                                    {/* Currency Selection */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                                                        <select
                                                            value={payCurrency}
                                                            onChange={(e) => setPayCurrency(e.target.value as "CAD" | "USD")}
                                                            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                        >
                                                            <option value="CAD">CAD</option>
                                                            <option value="USD">USD</option>
                                                        </select>
                                                    </div>
                                                    
                                                    {/* Memo Input */}
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">Memo</label>
                                                        <input
                                                            type="text"
                                                            value={deductionMemo}
                                                            onChange={(e) => setDeductionMemo(e.target.value)}
                                                            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2"
                                                            placeholder="Memo"
                                                        />
                                                    </div>
                                                    
                                                    {/* GST Checkbox and Add Button */}
                                                    <div className="flex items-center justify-between">
                                                        <label className="flex items-center gap-2 text-xs text-gray-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={deductionGst}
                                                                onChange={(e) => setDeductionGst(e.target.checked)}
                                                                className="w-4 h-4"
                                                            />
                                                            GST
                                                        </label>
                                                        <button
                                                            onClick={() => {
                                                                if (deductionAmount) {
                                                                    setDeductionItems([...deductionItems, {
                                                                        amount: deductionAmount,
                                                                        date: deductionDate,
                                                                        currency: payCurrency,
                                                                        memo: deductionMemo,
                                                                        gst: deductionGst
                                                                    }]);
                                                                    setDeductionAmount("");
                                                                    setDeductionDate("");
                                                                    setDeductionMemo("");
                                                                    setDeductionGst(false);
                                                                }
                                                            }}
                                                            className="w-8 h-8 flex items-center justify-center bg-gray-800 !text-white rounded hover:bg-gray-700 text-sm font-medium"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    
                                                    {/* Preset Memo Dropdown */}
                                                    <div>
                                                        <select
                                                            value={deductionPresetMemo}
                                                            onChange={(e) => {
                                                                setDeductionPresetMemo(e.target.value);
                                                                setDeductionMemo(e.target.value);
                                                            }}
                                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 text-sm"
                                                        >
                                                            <option value="">Preset Memo</option>
                                                            <option value="Tolls">Tolls</option>
                                                            <option value="Layover">Layover</option>
                                                            <option value="Advance">Advance</option>
                                                            <option value="Parking">Parking</option>
                                                            <option value="Fuel">Fuel</option>
                                                            <option value="Other">Other</option>
                                                            <option value="Pickup">Pickup</option>
                                                            <option value="Delivery">Delivery</option>
                                                        </select>
                                                    </div>
                                                    
                                                    {/* Deduction Items List */}
                                                    {deductionItems.length > 0 && (
                                                        <div className="space-y-2">
                                                            {deductionItems.map((item, index) => (
                                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-300 rounded text-sm">
                                                                    <span className="font-medium">${item.amount}</span>
                                                                    <span className="text-gray-600">{item.date}</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            const updated = deductionItems.filter((_, i) => i !== index);
                                                                            setDeductionItems(updated);
                                                                        }}
                                                                        className="text-red-600 hover:text-red-800 text-xs"
                                                                    >
                                                                        X
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    
                                                    {deductionItems.length === 0 && (
                                                        <div className="text-xs text-gray-500">No deductions</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Miles Column */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-semibold text-gray-800">Miles</h4>
                                            
                                            {/* Route Segments */}
                                            <div className="space-y-2">
                                                {routeSegments.map((segment, index) => (
                                                    <div key={index} className="p-2 bg-gray-100 border border-gray-200 rounded text-sm">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-700">
                                                                {segment.from} → {segment.to}
                                                            </div>
                                                            <div className="text-gray-600 mt-1">{segment.miles.toFixed(2)} miles</div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-2 justify-end">
                                                            <button className="text-gray-400 hover:text-gray-600">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                </svg>
                                                            </button>
                                                            <button className="w-5 h-5 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 text-xs">
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {routeSegments.length === 0 && (
                                                    <div className="p-2 bg-gray-100 border border-gray-200 rounded text-sm text-gray-500">
                                                        No route segments configured
                                                    </div>
                                                )}
                                            </div>

                                            {/* Total Miles */}
                                            <div className="pt-2">
                                                <div className="flex justify-between items-center text-sm font-semibold text-gray-800">
                                                    <span>Total Miles</span>
                                                    <span>{totalMiles.toFixed(2)}</span>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                    </div>

                                  
                                </div>
                            </div>
                        )
                    }

            

                    {/* Step 6: Notes / Audit Page */}
                    {
                        currentStep === 6 && (
                            <div className="border-b border-gray-200">
                                <div className="p-5 bg-gradient-to-r from-green-50 to-gray-50 border-b border-gray-200">
                                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">6</span>
                                        Notes / Audit
                                    </h3>
                                    <p className="text-xs text-gray-600 mt-1 ml-10">Add notes and view audit trail</p>
                                </div>
                                <div className="px-5 pt-5 pb-5 space-y-6">
                                    {/* Two Column Layout: Other Notes and Audit Trail */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Other Notes Section */}
                                        <div className="space-y-4">
                                            <h4 className="text-sm font-semibold text-gray-800">Other Notes</h4>
                                            
                                            {/* Note Type Selection */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-medium text-gray-700">Note Type:</label>
                                                <div className="flex flex-col gap-2">
                                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                                        <input
                                                            type="radio"
                                                            name="noteType"
                                                            value="public"
                                                            checked={noteType === "public"}
                                                            onChange={(e) => setNoteType(e.target.value as "public" | "private")}
                                                            className="w-4 h-4"
                                                        />
                                                        Public (Visible to everyone)
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                                        <input
                                                            type="radio"
                                                            name="noteType"
                                                            value="private"
                                                            checked={noteType === "private"}
                                                            onChange={(e) => setNoteType(e.target.value as "public" | "private")}
                                                            className="w-4 h-4"
                                                        />
                                                        Private (Only visible to you)
                                                    </label>
                                                </div>
                                            </div>
                                            
                                            {/* Note Text Area */}
                                            <div>
                                                <textarea
                                                    value={noteText}
                                                    onChange={(e) => setNoteText(e.target.value)}
                                                    placeholder={noteType === "public" ? "Add a new public note..." : "Add a new private note..."}
                                                    className="w-full p-3 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 min-h-[120px] resize-y"
                                                />
                                            </div>
                                            
                                            {/* Add Note Button */}
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        if (noteText.trim()) {
                                                            const newNote = {
                                                                id: Date.now(),
                                                                type: noteType,
                                                                text: noteText,
                                                                user: "Current User", // Replace with actual user
                                                                date: new Date().toLocaleString()
                                                            };
                                                            setNotes([...notes, newNote]);
                                                            setNoteText("");
                                                            addNotification('success', 'Note added successfully');
                                                        }
                                                    }}
                                                    className="px-4 py-2 bg-gray-800 !text-white rounded text-sm font-medium hover:bg-gray-700 transition-colors"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                            
                                            {/* Notes List */}
                                            {notes.length > 0 && (
                                                <div className="space-y-2 mt-4">
                                                    {notes.map((note) => (
                                                        <div key={note.id} className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                                                            <div className="flex items-start justify-between mb-1">
                                                                <span className="font-medium text-gray-700">{note.user}</span>
                                                                <span className="text-xs text-gray-500">{note.date}</span>
                                                            </div>
                                                            <p className="text-gray-600">{note.text}</p>
                                                            <span className="text-xs text-gray-400 mt-1 inline-block">
                                                                {note.type === "public" ? "Public" : "Private"}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Audit Trail Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-gray-800">Audit Trail</h4>
                                                {auditTrailLoading && (
                                                    <span className="text-xs text-gray-500">Loading...</span>
                                                )}
                                            </div>
                                            
                                            {/* Audit Trail Table */}
                                            <div className="border border-gray-200 rounded overflow-hidden">
                                                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">User</th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Action</th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Date</th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Details</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {auditTrailLoading ? (
                                                                <tr>
                                                                    <td colSpan={4} className="px-3 py-4 text-center text-gray-500 text-sm">
                                                                        Loading audit trail...
                                                                    </td>
                                                                </tr>
                                                            ) : auditTrail.length > 0 ? (
                                                                auditTrail.map((audit) => (
                                                                    <tr key={audit.id} className="hover:bg-gray-50">
                                                                        <td className="px-3 py-2 text-gray-700">{audit.user}</td>
                                                                        <td className="px-3 py-2 text-gray-600">{audit.action}</td>
                                                                        <td className="px-3 py-2 text-gray-500 text-xs">{audit.date}</td>
                                                                        <td className="px-3 py-2 text-gray-500 text-xs">{audit.details || '-'}</td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={4} className="px-3 py-4 text-center text-gray-500 text-sm">
                                                                        No audit trail entries yet
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* File Attachments Section */}
                                    <div className="space-y-4 pt-4 border-t border-gray-200">
                                        <h4 className="text-sm font-semibold text-gray-800">Attachments</h4>
                                        
                                        {/* Attachments List */}
                                        {attachments.length > 0 && (
                                            <div className="space-y-2">
                                                {attachments.map((attachment) => (
                                                    <div key={attachment.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded">
                                                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                                                        <button
                                                            onClick={() => {
                                                                if (attachment.file) {
                                                                    const url = URL.createObjectURL(attachment.file);
                                                                    window.open(url, '_blank');
                                                                }
                                                            }}
                                                            className="flex-1 text-sm text-blue-600 hover:text-blue-800 hover:underline text-left"
                                                        >
                                                            {attachment.name}
                                                        </button>
                                                        <label className="flex items-center gap-1 text-xs text-gray-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={attachment.payable}
                                                                onChange={(e) => {
                                                                    const updated = attachments.map(a => 
                                                                        a.id === attachment.id ? { ...a, payable: e.target.checked } : a
                                                                    );
                                                                    setAttachments(updated);
                                                                }}
                                                                className="w-4 h-4"
                                                            />
                                                            Payable
                                                        </label>
                                                        <label className="flex items-center gap-1 text-xs text-gray-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={attachment.shareWithDriver}
                                                                onChange={(e) => {
                                                                    const updated = attachments.map(a => 
                                                                        a.id === attachment.id ? { ...a, shareWithDriver: e.target.checked } : a
                                                                    );
                                                                    setAttachments(updated);
                                                                }}
                                                                className="w-4 h-4"
                                                            />
                                                            Share w/ Driver
                                                        </label>
                                                        <button
                                                            onClick={() => {
                                                                // Edit functionality
                                                            }}
                                                            className="p-1 text-blue-600 hover:text-blue-800"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setAttachments(attachments.filter(a => a.id !== attachment.id));
                                                            }}
                                                            className="p-1 text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Drag and Drop Zone */}
                                        <div
                                            onDragOver={(e) => {
                                                e.preventDefault();
                                                setIsDragging(true);
                                            }}
                                            onDragLeave={(e) => {
                                                e.preventDefault();
                                                setIsDragging(false);
                                            }}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                setIsDragging(false);
                                                const files = Array.from(e.dataTransfer.files);
                                                const newAttachments = files.map((file, index) => ({
                                                    id: Date.now() + index,
                                                    name: file.name,
                                                    file: file,
                                                    payable: false,
                                                    shareWithDriver: false
                                                }));
                                                setAttachments([...attachments, ...newAttachments]);
                                                files.forEach(file => {
                                                    addAuditTrailEntry(`Attachment Added: ${file.name}`);
                                                });
                                                addNotification('success', `${files.length} file(s) added`);
                                            }}
                                            className={`w-full px-4 py-3 bg-gray-800 text-white rounded text-sm font-medium text-center cursor-pointer hover:bg-gray-700 transition-colors ${isDragging ? 'bg-gray-700 border-2 border-dashed border-white' : ''}`}
                                        >
                                            <label className="block w-full cursor-pointer">
                                                <input
                                                    type="file"
                                                    multiple
                                                    onChange={(e) => {
                                                        if (e.target.files) {
                                                            const files = Array.from(e.target.files);
                                                            const newAttachments = files.map((file, index) => ({
                                                                id: Date.now() + index,
                                                                name: file.name,
                                                                file: file,
                                                                payable: false,
                                                                shareWithDriver: false
                                                            }));
                                                            setAttachments([...attachments, ...newAttachments]);
                                                            files.forEach(file => {
                                                                addAuditTrailEntry(`Attachment Added: ${file.name}`);
                                                            });
                                                            addNotification('success', `${files.length} file(s) added`);
                                                        }
                                                    }}
                                                    className="hidden"
                                                />
                                                Add Or Drag & Drop Attachments
                                            </label>
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