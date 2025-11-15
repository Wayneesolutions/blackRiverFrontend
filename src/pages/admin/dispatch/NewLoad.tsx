import React, { useState, useEffect } from "react";
import { X, Plus, Trash, Package, Edit3, Upload, Camera } from "lucide-react";
import { createLoad, listCustomer, listFaciliator, listDriver } from "../../../axios/api/distapcher";
import { useVehicles } from "../../../customHooks/useVehicles";
import { Section } from './settings/Section';
import { Toggle } from './settings/Section';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

interface NewLoadProps {
    onClose: () => void;
}

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
    <div className={`fixed top-4 right-4 flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg z-[10000] ${bgColors[notification.type]} animate-slide-in`}>
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

const NewLoad: React.FC<NewLoadProps> = ({ onClose }) => {
    // Use custom hook for vehicles
    const { vehicles, loading: vehiclesLoading, error: vehiclesError } = useVehicles();

    // Debug vehicles data
    console.log('Vehicles from hook:', { vehicles, vehiclesLoading, vehiclesError });

    // API data states
    const [customers, setCustomers] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [facilator, setFaciliator] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form data states
    const [orderType, setOrderType] = useState("");
    const [internalId, setInternalId] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [selectedFacilitator, setSelectedFacilitator] = useState("");
    const [selectedDriver, setSelectedDriver] = useState("");
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [selectPickup, setSelectPickup] = useState("");
    const [selectDropoff, setSelectDropoff] = useState("");
    const [selectReturn, setSelectReturn] = useState("");
    const [loadAmount, setLoadAmount] = useState("");
    const [loadRate, setLoadRate] = useState("");
    // Receiver details
    const [receiverName, setReceiverName] = useState("");
    const [receiverEmail, setReceiverEmail] = useState("");
    const [receiverPhone, setReceiverPhone] = useState("");
    const [receiverAddress, setReceiverAddress] = useState("");
    const [receiverContactPerson, setReceiverContactPerson] = useState("");
    const [receiverNotes, setReceiverNotes] = useState("");

    // State for toggles and options
    const [isAdhoc, setIsAdhoc] = useState(false);
    const [adhocDistance, setAdhocDistance] = useState("");
    const [addMisc, setAddMisc] = useState(false);
    const [dispatchImmediately, setDispatchImmediately] = useState(false);
    const [requireProof, setRequireProof] = useState(false);
    const [proofType, setProofType] = useState("");
    const [multipleDropoffs, setMultipleDropoffs] = useState(false);
    const [applyServiceRate, setApplyServiceRate] = useState(false);
    const [notes, setNotes] = useState("");

    // State for waypoints and items
    const [waypoints, setWaypoints] = useState<
        { id: number; address: string; customer: string; type: "pickup" | "dropoff" }[]
    >([]);
    const [items, setItems] = useState<{
        id: number;
        name: string;
        sku: string;
        description: string;
        price: string;
        salePrice: string;
        cost: string;
        discountValue: string;
        length: string;
        width: string;
        height: string;
        weight: string;
        image: string;
        internalId: string;
    }[]>([]);
    const [editingItem, setEditingItem] = useState<any>(null);

    // State for documents
    const [documents, setDocuments] = useState<File[]>([]);
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);

    const addNotification = (type: NotificationType, message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Dummy images for demonstration
    const dummyImages = [
        "https://images.unsplash.com/photo-1586864387789-628af9feed72?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1580169980114-ccd0babfa840?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop"
    ];

    // Load API data on component mount
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const lc = await listCustomer();
                const ld = await listDriver();
                const lf = await listFaciliator();

                setCustomers(lc.data || []);
                setDrivers(ld.data || []);
                setFaciliator(lf.data || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Debug documents state changes
    useEffect(() => {
        console.log('Documents state changed:', documents);
    }, [documents]);

    // Waypoint functions
    const addWaypoint = () => {
        setWaypoints([
            ...waypoints,
            { id: Date.now(), address: "", customer: "", type: "dropoff" },
        ]);
    };

    const removeWaypoint = (id: number) => {
        setWaypoints(waypoints.filter((w) => w.id !== id));
    };

    const updateWaypoint = (id: number, field: string, value: any) => {
        setWaypoints(waypoints.map(w => w.id === id ? { ...w, [field]: value } : w));
    };

    const updateWaypointType = (id: number, type: "pickup" | "dropoff") => {
        setWaypoints(waypoints.map(w => w.id === id ? { ...w, type } : w));
    };

    // Item functions
    const addItem = () => {
        const randomImage = dummyImages[Math.floor(Math.random() * dummyImages.length)];
        setItems([...items, {
            id: Date.now(),
            name: "",
            sku: "",
            description: "",
            price: "",
            salePrice: "",
            cost: "",
            discountValue: "",
            length: "",
            width: "",
            height: "",
            weight: "",
            image: randomImage,
            internalId: `ITEM_${Date.now()}`
        }]);
    };

    const removeItem = (id: number) => {
        setItems(items.filter((i) => i.id !== id));
    };

    const updateItem = (id: number, field: string, value: string) => {
        setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
    };

    const saveItem = (updatedItem: any) => {
        setItems(items.map((i) => (i.id === updatedItem.id ? updatedItem : i)));
        setEditingItem(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editingItem) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setEditingItem({
                    ...editingItem,
                    image: event.target?.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle document selection
    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            console.log('Selected files:', newFiles);
            console.log('Current documents before update:', documents);

            // Simple state update
            setDocuments(prevDocuments => {
                const updated = [...prevDocuments, ...newFiles];
                console.log('Updated documents:', updated);
                return updated;
            });
        }
        // Clear the input so the same file can be selected again
        e.target.value = '';
    };

    // Remove document by index
    const removeDocument = (index: number) => {
        setDocuments(documents.filter((_, i) => i !== index));
    };

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            setDocuments(prevDocuments => {
                const updated = [...prevDocuments, ...files];
                console.log('Files dropped, updated documents:', updated);
                return updated;
            });
        }
    };

    // Form validation
    const validateForm = () => {
        const errors = [];

        if (!orderType) errors.push("Order type is required");
        if (!selectedCustomer) errors.push("Customer is required");

        if (!multipleDropoffs) {
            if (!selectPickup) errors.push("Pickup address is required");
            if (!selectDropoff) errors.push("Dropoff address is required");
        } else {
            if (waypoints.length === 0) errors.push("At least one waypoint is required");
            waypoints.forEach((wp, index) => {
                if (!wp.address) errors.push(`Waypoint ${index + 1} address is required`);
            });
        }

        if (items.length === 0) errors.push("At least one item is required");
        items.forEach((item, index) => {
            if (!item.name) errors.push(`Item ${index + 1} name is required`);
            if (!item.sku) errors.push(`Item ${index + 1} SKU is required`);
            if (!item.internalId) errors.push(`Item ${index + 1} internal ID is required`);
        });

        return errors;
    };

    // Handle form submission
    const handleSaveLoad = async () => {
        // Validate form
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            // Replace alert with notification
            addNotification('warning', "Please fix the following errors:\n" + validationErrors.join("\n"));
            return;
        }

        setLoading(true);
        try {
            const detailsData = {
                orderType,
                internalId: internalId || `LOAD_${Date.now()}`,
                customer: selectedCustomer || null,
                facilator: selectedFacilitator || null,
                driver: selectedDriver || null,
                vehicle: selectedVehicle || null,
                adHoc: isAdhoc ? parseFloat(adhocDistance) || null : null,
                addMisc,
                dispatchImmediately,
                requiredProof: requireProof ? proofType : null,
                amount: loadAmount ? parseFloat(loadAmount) : 0,
                rate: loadRate ? parseFloat(loadRate) : 0,
                receiver: {
                    name: receiverName || null,
                    email: receiverEmail || null,
                    phone: receiverPhone || null,
                    address: receiverAddress || null,
                    contactPerson: receiverContactPerson || null,
                    notes: receiverNotes || null
                }
            };

            const routeData = multipleDropoffs ? {
                multipleDropOffs: true,
                wayPoints: waypoints.map(wp => ({
                    address: wp.address,
                    customer: wp.customer || null,
                    dropOff: wp.type === "dropoff",
                    pickup: wp.type === "pickup"
                })),
                selectReturn
            } : {
                multipleDropOffs: false,
                selectPickup,
                selectDropOff: selectDropoff,
                selectReturn
            };

            const payloadsData = items.map(item => ({
                itemName: item.name,
                sku: item.sku,
                itemImageUrl: item.image,
                internalId: item.internalId,
                description: item.description,
                priceAndValues: {
                    price: parseFloat(item.price) || 0,
                    salePrice: parseFloat(item.salePrice) || 0,
                    cost: parseFloat(item.cost) || 0,
                    discountValue: parseFloat(item.discountValue) || 0
                },
                measurementAndWeight: {
                    length: parseFloat(item.length) || 0,
                    width: parseFloat(item.width) || 0,
                    height: parseFloat(item.height) || 0,
                    weight: parseFloat(item.weight) || 0
                }
            }));

            const servicesData = {
                applyServiceRate
            };

            const formData = new FormData();
            formData.append('details', JSON.stringify(detailsData));
            formData.append('route', JSON.stringify(routeData));
            formData.append('payloads', JSON.stringify(payloadsData));
            formData.append('services', JSON.stringify(servicesData));
            formData.append('notes', notes);
            // Status will be auto-set by backend based on driver/vehicle assignment

            documents.forEach((file) => {
                formData.append('documents', file);
            });

            const response = await createLoad(formData);
            if (response.success) {
                // Replace alert with notification
                addNotification('success', "Load created successfully!");
                // Close after a short delay to show the notification
                setTimeout(() => {
                    onClose();
                }, 1000);
            } else {
                // Replace alert with notification
                addNotification('error', "Error creating load: " + response.message);
            }
        } catch (error) {
            console.error("Error creating load:", error);
            // Replace alert with notification
            addNotification('error', "Error creating load. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Toast Notifications Container - High z-index to be above sidebar */}
            <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-3 max-w-md">
                {notifications.map(notification => (
                    <ToastNotification
                        key={notification.id}
                        notification={notification}
                        onClose={removeNotification}
                    />
                ))}
            </div>

            <div className="h-full flex flex-col bg-white">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800">New Load</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Details Section */}
                    <Section title="Details">
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value)}
                                className={`p-2 border rounded w-full focus:outline-none focus:ring-2 ${!orderType ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                required
                            >
                                <option value="">Select Order Type *</option>
                                <option value="standard">Standard</option>
                                <option value="express">Express</option>
                                <option value="overnight">Overnight</option>
                            </select>
                            <input
                                className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter Internal ID"
                                value={internalId}
                                onChange={(e) => setInternalId(e.target.value)}
                            />
                            <select
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                className={`p-2 border rounded w-full focus:outline-none focus:ring-2 ${!selectedCustomer ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                disabled={loading}
                                required
                            >
                                <option value="">Select Customer *</option>
                                {customers?.map((customer) => (
                                    <option key={customer._id} value={customer._id}>
                                        {customer.name}
                                    </option>
                                ))}
                            </select>
                            {/* <select
                                value={selectedFacilitator}
                                onChange={(e) => setSelectedFacilitator(e.target.value)}
                                className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select Facilitator</option>
                                {facilator?.map((facilator) => (
                                    <option key={facilator._id} value={facilator._id}>
                                        {facilator.name}
                                    </option>
                                ))}
                            </select> */}
                            <select
                                value={selectedDriver}
                                onChange={(e) => setSelectedDriver(e.target.value)}
                                className={`p-2 border rounded w-full focus:outline-none focus:ring-2 ${!selectedDriver ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                disabled={loading}
                                required
                            >
                                <option value="">Select Driver</option>
                                {drivers.map((driver) => (
                                    <option key={driver._id} value={driver._id}>
                                        {driver.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedVehicle}
                                onChange={(e) => setSelectedVehicle(e.target.value)}
                                className={`p-2 border rounded w-full focus:outline-none focus:ring-2 ${!selectedVehicle ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                    }`}
                                disabled={loading || vehiclesLoading}
                                required
                            >
                                <option value="">Select Vehicle</option>
                                {vehiclesError && <option disabled>Error loading vehicles</option>}
                                {vehiclesLoading && <option disabled>Loading vehicles...</option>}
                                {vehicles.length > 0 && vehicles.map((vehicle) => (
                                    <option key={vehicle._id} value={vehicle._id}>
                                        {vehicle.internalId} - {vehicle.make} {vehicle.model} ({vehicle.plateNumber})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4 mt-6">
                            {/* Ad-hoc with distance input */}
                            {/*
                            <div className="flex items-center gap-3">
                                <Toggle label="Ad-hoc" checked={isAdhoc} onChange={setIsAdhoc} />
                                {isAdhoc && (
                                    <input
                                        type="number"
                                        placeholder="Adhoc-Ping Distance"
                                        value={adhocDistance}
                                        onChange={(e) => setAdhocDistance(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                )}
                            </div>

                            <div className="mt-3">
                                <Toggle label="Add Misc" checked={addMisc} onChange={setAddMisc} />
                            </div>
                            <div className="mt-3">
                                <Toggle label="Dispatch Immediately" checked={dispatchImmediately} onChange={setDispatchImmediately} />
                            </div>
                             */}

                            {/* Require Proof with type selector */}
                            {/*    <div className="flex items-center gap-3 mt-3">
                                <Toggle label="Require Proof of Delivery" checked={requireProof} onChange={setRequireProof} />
                                {requireProof && (
                                    <select
                                        value={proofType}
                                        onChange={(e) => setProofType(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Proof Type</option>
                                        <option value="scan">Scan</option>
                                        <option value="signature">Signature</option>
                                        <option value="photo">Photo</option>
                                    </select>
                                )}
                            </div>
                            */}
                        </div>
                    </Section>

                    {/* Route Section */}
                    <Section title="Route">
                        <div className="mb-4">
                            <Toggle label="Multiple Dropoffs" checked={multipleDropoffs} onChange={setMultipleDropoffs} />
                        </div>

                        {!multipleDropoffs ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Address *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Pickup Address"
                                        value={selectPickup}
                                        onChange={(e) => setSelectPickup(e.target.value)}
                                        className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Dropoff Address *</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Dropoff Address"
                                        value={selectDropoff}
                                        onChange={(e) => setSelectDropoff(e.target.value)}
                                        className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Return Address</label>
                                    <input
                                        type="text"
                                        placeholder="Enter Return Address (Optional)"
                                        value={selectReturn}
                                        onChange={(e) => setSelectReturn(e.target.value)}
                                        className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <button
                                    onClick={addWaypoint}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 !text-white rounded transition-colors !mb-4"
                                >
                                    <Plus size={16} /> Add Waypoint
                                </button>

                                {waypoints.map((wp, index) => (
                                    <div
                                        key={wp.id}
                                        className="border border-gray-300 rounded-lg p-4 relative"
                                        style={{ backgroundColor: '#f9fafb' }}
                                    >
                                        <button
                                            onClick={() => removeWaypoint(wp.id)}
                                            className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded"
                                        >
                                            <Trash className="text-red-500 w-4 h-4" />
                                        </button>

                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-gray-700">Waypoint {index + 1}</h4>
                                            <input
                                                type="text"
                                                placeholder="Enter Address"
                                                value={wp.address}
                                                onChange={(e) => updateWaypoint(wp.id, 'address', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4"
                                            />
                                            <select
                                                value={wp.customer}
                                                onChange={(e) => updateWaypoint(wp.id, 'customer', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4"
                                                disabled={loading}
                                            >
                                                <option value="">Select Customer</option>
                                                {customers.map((customer) => (
                                                    <option key={customer._id} value={customer._id}>
                                                        {customer.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        checked={wp.type === "dropoff"}
                                                        onChange={() => updateWaypointType(wp.id, "dropoff")}
                                                        className="text-blue-500"
                                                    />
                                                    <span>Dropoff</span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        checked={wp.type === "pickup"}
                                                        onChange={() => updateWaypointType(wp.id, "pickup")}
                                                        className="text-blue-500"
                                                    />
                                                    <span>Pickup</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Receiver Details Section */}
                    <Section title="Receiver Details">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Receiver Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter receiver name"
                                    value={receiverName}
                                    onChange={(e) => setReceiverName(e.target.value)}
                                    className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Contact Person
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter contact person name"
                                    value={receiverContactPerson}
                                    onChange={(e) => setReceiverContactPerson(e.target.value)}
                                    className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Receiver Email
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter receiver email"
                                    value={receiverEmail}
                                    onChange={(e) => setReceiverEmail(e.target.value)}
                                    className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Receiver Phone
                                </label>
                                <input
                                    type="tel"
                                    placeholder="Enter receiver phone"
                                    value={receiverPhone}
                                    onChange={(e) => setReceiverPhone(e.target.value)}
                                    className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Receiver Address
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter receiver address"
                                    value={receiverAddress}
                                    onChange={(e) => setReceiverAddress(e.target.value)}
                                    className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Receiver Notes
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Enter any special instructions or notes for receiver"
                                    value={receiverNotes}
                                    onChange={(e) => setReceiverNotes(e.target.value)}
                                    className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </Section>

                    {/* Payload Entries */}
                    <Section title="Payload / Entities">
                        <button
                            onClick={addItem}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 !text-white rounded transition-colors w-full justify-center"
                        >
                            <Plus size={16} /> Add Item to Order
                        </button>

                        {items.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="border border-gray-300 rounded-lg p-4 relative"
                                        style={{ backgroundColor: '#f9fafb' }}
                                    >

                                        <div className="flex justify-center mb-3">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt="Item"
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                />
                                            ) : (
                                                <Package className="w-12 h-12 text-gray-400" />
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <div>
                                                <label className="block text-xs mb-1 text-gray-600 font-medium">Item Name *</label>
                                                <input
                                                    className="w-full p-2 border border-gray-300 rounded bg-white !mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Enter item name"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs mb-1 text-gray-600 font-medium">SKU *</label>
                                                <input
                                                    className="w-full p-2 border border-gray-300 rounded bg-white !mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Enter SKU"
                                                    value={item.sku}
                                                    onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs mb-1 text-gray-600 font-medium">Internal ID</label>
                                                <input
                                                    className="w-full p-2 border border-gray-300 rounded bg-white !mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Enter internal ID"
                                                    value={item.internalId}
                                                    onChange={(e) => updateItem(item.id, 'internalId', e.target.value)}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingItem(item)}
                                                    className="flex items-center gap-2 px-3 py-2 hover:bg-gray-300 rounded flex-1 justify-center transition-colors"
                                                    style={{ backgroundColor: '#e5e7eb' }}
                                                >
                                                    <Edit3 size={14} /> Advanced Edit
                                                </button>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-100 rounded transition-colors"
                                                    style={{ backgroundColor: '#fee2e2' }}
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Services */}
                    <Section title="Services">
                        <Toggle label="Apply service rate" checked={applyServiceRate} onChange={setApplyServiceRate} />
                    </Section>

                    {/* Notes */}
                    <Section title="Notes">
                        <textarea
                            rows={4}
                            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter order notes here..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </Section>

                    {/* Documents */}
                    <Section title="Documents & Files">
                        {/* Debug info */}
                        <div className="mb-2 text-xs text-gray-500">
                            Documents: {documents.length} file{documents.length !== 1 ? 's' : ''} selected
                        </div>
                        <div
                            className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 hover:bg-blue-100 transition-colors"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            {documents.length === 0 ? (
                                <div>
                                    <p className="mb-3 text-gray-600">
                                        Drag and drop files into this dropzone. Upload Documents & Files
                                    </p>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleDocumentUpload}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <button
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                        className="px-6 py-2 bg-blue-500 hover:bg-blue-600 !text-white rounded transition-colors"
                                    >
                                        Select files to upload
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <Upload className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {documents.length} file{documents.length > 1 ? 's' : ''} selected
                                            </p>
                                            <p className="text-xs text-gray-500">Ready to upload</p>
                                        </div>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleDocumentUpload}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <button
                                        onClick={() => document.getElementById('file-upload')?.click()}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 !text-white rounded transition-colors mr-2"
                                    >
                                        Add More Files
                                    </button>
                                    <button
                                        onClick={() => setDocuments([])}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 !text-white rounded transition-colors"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            )}
                            {documents.length > 0 && (
                                <div className="mt-6">
                                    <div className="space-y-2">
                                        {documents.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <Upload className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeDocument(index)}
                                                    className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Remove file"
                                                >
                                                    <X className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Section>
                </div>

                {/* Fixed Footer */}
                <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveLoad}
                            disabled={loading}
                            className="flex-1 bg-green-500 hover:bg-green-600 !text-white font-semibold px-6 py-3 rounded shadow transition-colors disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Load"}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded shadow transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* Full Screen Edit Item Modal - Fixed positioning */}
            {editingItem && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[200]">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-semibold text-lg text-gray-900">Edit Item</h3>
                            </div>
                            <button
                                onClick={() => setEditingItem(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Image Upload Section */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-gray-700">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    Product Image
                                </h4>

                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0">
                                        {editingItem.image ? (
                                            <img
                                                src={editingItem.image}
                                                alt="Item"
                                                className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-lg border border-gray-300 flex items-center justify-center bg-gray-50">
                                                <Package className="w-16 h-16 text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 !text-white rounded cursor-pointer transition-colors">
                                            <Upload size={16} />
                                            Upload Image
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                        </label>
                                        <button
                                            onClick={() => {
                                                const randomImage = dummyImages[Math.floor(Math.random() * dummyImages.length)];
                                                setEditingItem({ ...editingItem, image: randomImage });
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 !text-white rounded transition-colors"
                                        >
                                            <Camera size={16} />
                                            Use Sample Image
                                        </button>
                                        {editingItem.image && (
                                            <button
                                                onClick={() => setEditingItem({ ...editingItem, image: '' })}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 !text-white rounded transition-colors"
                                            >
                                                <Trash size={16} />
                                                Remove Image
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-gray-700">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    Details
                                </h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">Name</label>
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            placeholder="Item name"
                                            value={editingItem.name}
                                            onChange={(e) =>
                                                setEditingItem({ ...editingItem, name: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">Internal ID</label>
                                        <input
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            placeholder="Enter internal ID"
                                            value={editingItem.internalId}
                                            onChange={(e) =>
                                                setEditingItem({ ...editingItem, internalId: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-xs mb-1 text-gray-500">SKU</label>
                                    <input
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        placeholder="SKU"
                                        value={editingItem.sku}
                                        onChange={(e) =>
                                            setEditingItem({ ...editingItem, sku: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="block text-xs mb-1 text-gray-500">Description</label>
                                    <textarea
                                        rows={3}
                                        className="w-full p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                        placeholder="Item description"
                                        value={editingItem.description}
                                        onChange={(e) =>
                                            setEditingItem({ ...editingItem, description: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            {/* Pricing & Value Section */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-gray-700">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    Pricing & Value
                                </h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">Price</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            placeholder="0"
                                            value={editingItem.price}
                                            onChange={(e) =>
                                                setEditingItem({ ...editingItem, price: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">Sale Price</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            placeholder="0"
                                            value={editingItem.salePrice}
                                            onChange={(e) =>
                                                setEditingItem({ ...editingItem, salePrice: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">Cost</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            placeholder="0"
                                            value={editingItem.cost}
                                            onChange={(e) =>
                                                setEditingItem({ ...editingItem, cost: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">Discount Value</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            placeholder="0"
                                            value={editingItem.discountValue}
                                            onChange={(e) =>
                                                setEditingItem({ ...editingItem, discountValue: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Measurements Section */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-gray-700">
                                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    Measurements & Weight
                                </h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">Length</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            placeholder="0"
                                            value={editingItem.length}
                                            onChange={(e) =>
                                                setEditingItem({ ...editingItem, length: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">Width</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            placeholder="0"
                                            value={editingItem.width}
                                            onChange={(e) =>
                                                setEditingItem({ ...editingItem, width: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">Height</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            placeholder="0"
                                            value={editingItem.height}
                                            onChange={(e) =>
                                                setEditingItem({ ...editingItem, height: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs mb-1 text-gray-500">Weight</label>
                                        <input
                                            type="number"
                                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                            placeholder="0"
                                            value={editingItem.weight}
                                            onChange={(e) =>
                                                setEditingItem({ ...editingItem, weight: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex gap-3 justify-end p-4 border-t border-gray-200 bg-white flex-shrink-0">
                            <button
                                onClick={() => setEditingItem(null)}
                                className="px-6 py-2 font-semibold rounded shadow transition-colors bg-gray-300 hover:bg-gray-400 text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => saveItem(editingItem)}
                                className="px-6 py-2 font-semibold rounded shadow transition-colors bg-green-500 hover:bg-green-600 !text-white"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default NewLoad;