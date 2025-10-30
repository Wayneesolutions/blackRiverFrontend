import React, { useState, useEffect } from "react";
import { X, Plus, Trash, Package, Edit3, Upload, Camera } from "lucide-react";
import { Section } from './settings/Section';
import { Toggle } from './settings/Section';

interface NewLoadProps {
    onClose: () => void;
}


const NewLoad: React.FC<NewLoadProps> = ({ onClose }) => {
    // Static dropdown data (mock)
    const [customers] = useState<any[]>([
        { _id: 'cust-1', name: '3 Rivers Logistics Inc' },
        { _id: 'cust-2', name: 'Tech Freight' },
        { _id: 'cust-3', name: 'Express Logistics' },
    ]);
    const [drivers] = useState<any[]>([
        { _id: 'drv-1', name: 'John Doe' },
        { _id: 'drv-2', name: 'Jane Smith' },
        { _id: 'drv-3', name: 'Mike Johnson' },
    ]);
    const [facilator] = useState<any[]>([
        { _id: 'fac-1', name: 'In-house' },
        { _id: 'fac-2', name: 'Partner A' },
        { _id: 'fac-3', name: 'Partner B' },
    ]);
    const vehicles = [
        { _id: 'trk-1', internalId: 'TRK-001', make: 'Volvo', model: 'VNL', plateNumber: 'ABC-123' },
        { _id: 'trk-2', internalId: 'TRK-002', make: 'Freightliner', model: 'Cascadia', plateNumber: 'XYZ-987' },
        { _id: 'trk-3', internalId: 'TRK-003', make: 'Kenworth', model: 'T680', plateNumber: 'JKL-456' },
    ];
    const vehiclesLoading = false;
    const vehiclesError = false;
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

	// New Load Form: Customer/Contact/Billing/Customs/Options states (static)
	const [customerName, setCustomerName] = useState("");
	const [customerEmail, setCustomerEmail] = useState("");
	const [customerPhone, setCustomerPhone] = useState("");
	const [customerAddress, setCustomerAddress] = useState("");

	// Shipper fields
	const [shipperName, setShipperName] = useState("");
	const [shipperContact, setShipperContact] = useState("");
	const [shipperPhone, setShipperPhone] = useState("");
	const [shipperEmail, setShipperEmail] = useState("");
	const [shipperAddress, setShipperAddress] = useState("");
	const [pickupDate, setPickupDate] = useState("");
	const [pickupTime, setPickupTime] = useState("");
	const [pickupAppointment, setPickupAppointment] = useState("");
	const [pickupRef, setPickupRef] = useState("");
	const [pickupNotes, setPickupNotes] = useState("");

	// Receiver fields
	const [receiverName, setReceiverName] = useState("");
	const [receiverContact, setReceiverContact] = useState("");
	const [receiverPhone, setReceiverPhone] = useState("");
	const [receiverEmail, setReceiverEmail] = useState("");
	const [receiverAddress, setReceiverAddress] = useState("");
	const [deliveryDate, setDeliveryDate] = useState("");
	const [deliveryTime, setDeliveryTime] = useState("");
	const [deliveryAppointment, setDeliveryAppointment] = useState("");
	const [deliveryRef, setDeliveryRef] = useState("");
	const [deliveryNotes, setDeliveryNotes] = useState("");

	const [billingAddress, setBillingAddress] = useState("");
	const [billingCity, setBillingCity] = useState("");
	const [billingState, setBillingState] = useState("");
	const [billingZip, setBillingZip] = useState("");
	const [billingCountry, setBillingCountry] = useState("");
	const [paymentTerms, setPaymentTerms] = useState("Net 15");

	const [taxConfig, setTaxConfig] = useState("GST");
	const [taxPercent, setTaxPercent] = useState("5.0000");
	const [invoicePreviewNumber, setInvoicePreviewNumber] = useState("");

	const [customsIsInternational, setCustomsIsInternational] = useState(false);
	const [customsCountryOfOrigin, setCustomsCountryOfOrigin] = useState("");
	const [customsHsCode, setCustomsHsCode] = useState("");
	const [customsBroker, setCustomsBroker] = useState("");
	const [customsDocumentsRequired, setCustomsDocumentsRequired] = useState<string[]>([]);

	const [optBondedShipment, setOptBondedShipment] = useState(false);
	const [optHighPriority, setOptHighPriority] = useState(false);
	const [optHazmat, setOptHazmat] = useState(false);
	const [optInside, setOptInside] = useState(false);
	const [optLiftgate, setOptLiftgate] = useState(false);
	const [optSignature, setOptSignature] = useState(false);

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

    // Dummy images for demonstration
    const dummyImages = [
        "https://images.unsplash.com/photo-1586864387789-628af9feed72?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1580169980114-ccd0babfa840?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop"
    ];

    // No API calls — static data only

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

    // Handle form submission (static)
    const handleSaveLoad = () => {
        const validationErrors = validateForm();
        if (validationErrors.length > 0) {
            alert("Please fix the following errors:\n" + validationErrors.join("\n"));
            return;
        }
        onClose();
    };

    return (
        <>
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
					{/* Customer Section */}
					<Section title="Customer">
						<div className="grid grid-cols-2 gap-4">
							<input className="p-2 border border-gray-300 rounded" placeholder="Customer Name *" value={customerName} onChange={(e)=>setCustomerName(e.target.value)} />
							<input type="email" className="p-2 border border-gray-300 rounded" placeholder="Customer Email" value={customerEmail} onChange={(e)=>setCustomerEmail(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="Customer Phone" value={customerPhone} onChange={(e)=>setCustomerPhone(e.target.value)} />
							<textarea rows={2} className="p-2 border border-gray-300 rounded" placeholder="Customer Address" value={customerAddress} onChange={(e)=>setCustomerAddress(e.target.value)} />
						</div>
					</Section>

					{/* Shipper Section */}
					<Section title="Shipper">
						<div className="grid grid-cols-2 gap-4">
							<input className="p-2 border border-gray-300 rounded" placeholder="Shipper Name" value={shipperName} onChange={(e)=>setShipperName(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="Shipper Contact" value={shipperContact} onChange={(e)=>setShipperContact(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="Shipper Phone" value={shipperPhone} onChange={(e)=>setShipperPhone(e.target.value)} />
							<input type="email" className="p-2 border border-gray-300 rounded" placeholder="Shipper Email" value={shipperEmail} onChange={(e)=>setShipperEmail(e.target.value)} />
							<textarea rows={2} className="p-2 border border-gray-300 rounded" placeholder="Shipper Address" value={shipperAddress} onChange={(e)=>setShipperAddress(e.target.value)} />
							<div className="grid grid-cols-2 gap-2">
								<input type="date" className="p-2 border border-gray-300 rounded" value={pickupDate} onChange={(e)=>setPickupDate(e.target.value)} />
								<input type="time" className="p-2 border border-gray-300 rounded" value={pickupTime} onChange={(e)=>setPickupTime(e.target.value)} />
							</div>
							<select className="p-2 border border-gray-300 rounded" value={pickupAppointment} onChange={(e)=>setPickupAppointment(e.target.value)}>
								<option value="">Appointment?</option>
								<option>Yes</option>
								<option>No</option>
								<option>Blank</option>
							</select>
							<input className="p-2 border border-gray-300 rounded" placeholder="Reference #" value={pickupRef} onChange={(e)=>setPickupRef(e.target.value)} />
							<textarea rows={2} className="p-2 border border-gray-300 rounded" placeholder="Pickup Notes" value={pickupNotes} onChange={(e)=>setPickupNotes(e.target.value)} />
						</div>
					</Section>

					{/* Receiver Section */}
					<Section title="Receiver">
						<div className="grid grid-cols-2 gap-4">
							<input className="p-2 border border-gray-300 rounded" placeholder="Receiver Name" value={receiverName} onChange={(e)=>setReceiverName(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="Receiver Contact" value={receiverContact} onChange={(e)=>setReceiverContact(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="Receiver Phone" value={receiverPhone} onChange={(e)=>setReceiverPhone(e.target.value)} />
							<input type="email" className="p-2 border border-gray-300 rounded" placeholder="Receiver Email" value={receiverEmail} onChange={(e)=>setReceiverEmail(e.target.value)} />
							<textarea rows={2} className="p-2 border border-gray-300 rounded" placeholder="Receiver Address" value={receiverAddress} onChange={(e)=>setReceiverAddress(e.target.value)} />
							<div className="grid grid-cols-2 gap-2">
								<input type="date" className="p-2 border border-gray-300 rounded" value={deliveryDate} onChange={(e)=>setDeliveryDate(e.target.value)} />
								<input type="time" className="p-2 border border-gray-300 rounded" value={deliveryTime} onChange={(e)=>setDeliveryTime(e.target.value)} />
							</div>
							<select className="p-2 border border-gray-300 rounded" value={deliveryAppointment} onChange={(e)=>setDeliveryAppointment(e.target.value)}>
								<option value="">Appointment?</option>
								<option>Yes</option>
								<option>No</option>
							</select>
							<input className="p-2 border border-gray-300 rounded" placeholder="Reference #" value={deliveryRef} onChange={(e)=>setDeliveryRef(e.target.value)} />
							<textarea rows={2} className="p-2 border border-gray-300 rounded" placeholder="Delivery Notes" value={deliveryNotes} onChange={(e)=>setDeliveryNotes(e.target.value)} />
						</div>
					</Section>

					{/* Billing Information */}
					<Section title="Billing Information">
						<div className="grid grid-cols-2 gap-4">
							<textarea rows={2} className="p-2 border border-gray-300 rounded" placeholder="Billing Address" value={billingAddress} onChange={(e)=>setBillingAddress(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="City" value={billingCity} onChange={(e)=>setBillingCity(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="State/Province" value={billingState} onChange={(e)=>setBillingState(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="ZIP/Postal" value={billingZip} onChange={(e)=>setBillingZip(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="Country" value={billingCountry} onChange={(e)=>setBillingCountry(e.target.value)} />
							<select className="p-2 border border-gray-300 rounded" value={paymentTerms} onChange={(e)=>setPaymentTerms(e.target.value)}>
								<option>Net 15</option>
								<option>Net 30</option>
								<option>Due on Receipt</option>
							</select>
						</div>
					</Section>

					{/* Tax Configuration & Invoice Preview */}
					<Section title="Tax Configuration & Invoice Preview">
						<div className="grid grid-cols-2 gap-4">
							<input className="p-2 border border-gray-300 rounded" placeholder="Tax (e.g., GST/HST/PST)" value={taxConfig} onChange={(e)=>setTaxConfig(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="Tax Rate %" value={taxPercent} onChange={(e)=>setTaxPercent(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="Invoice # Preview" value={invoicePreviewNumber} onChange={(e)=>setInvoicePreviewNumber(e.target.value)} />
							<input readOnly className="p-2 border border-gray-300 rounded bg-gray-50" placeholder="Calculated Tax Value (preview)" value={"Auto"} />
						</div>
					</Section>

					{/* Customs Information */}
					<Section title="Customs Information">
						<div className="grid grid-cols-2 gap-4">
							<Toggle label="International Shipment" checked={customsIsInternational} onChange={setCustomsIsInternational} />
							<input className="p-2 border border-gray-300 rounded" placeholder="Country of Origin" value={customsCountryOfOrigin} onChange={(e)=>setCustomsCountryOfOrigin(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="HS Code" value={customsHsCode} onChange={(e)=>setCustomsHsCode(e.target.value)} />
							<input className="p-2 border border-gray-300 rounded" placeholder="Customs Broker" value={customsBroker} onChange={(e)=>setCustomsBroker(e.target.value)} />
							<div>
								<label className="block text-sm text-gray-600 mb-1">Documents Required</label>
								<select multiple className="w-full p-2 border border-gray-300 rounded" value={customsDocumentsRequired} onChange={(e)=> setCustomsDocumentsRequired(Array.from(e.target.selectedOptions).map(o=>o.value))}>
									<option value="Commercial Invoice">Commercial Invoice</option>
									<option value="Packing List">Packing List</option>
									<option value="Certificate of Origin">Certificate of Origin</option>
								</select>
							</div>
						</div>
					</Section>

					{/* Additional Options */}
					<Section title="Additional Options">
						<div className="grid grid-cols-3 gap-4">
							<Toggle label="Bonded Shipment" checked={optBondedShipment} onChange={setOptBondedShipment} />
							<Toggle label="High Priority" checked={optHighPriority} onChange={setOptHighPriority} />
							<Toggle label="Hazmat" checked={optHazmat} onChange={setOptHazmat} />
							<Toggle label="Inside Pickup/Delivery" checked={optInside} onChange={setOptInside} />
							<Toggle label="Liftgate Required" checked={optLiftgate} onChange={setOptLiftgate} />
							<Toggle label="Signature Required" checked={optSignature} onChange={setOptSignature} />
						</div>
					</Section>
                    {/* Details Section */}
                    <Section title="Details">
                        <div className="grid grid-cols-2 gap-4">
                            <select 
                                value={orderType}
                                onChange={(e) => setOrderType(e.target.value)}
                                className={`p-2 border rounded w-full focus:outline-none focus:ring-2 ${
                                    !orderType ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
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
                                className={`p-2 border rounded w-full focus:outline-none focus:ring-2 ${
                                    !selectedCustomer ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
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
                            <select 
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
                            </select>
                            <select 
                                value={selectedDriver}
                                onChange={(e) => setSelectedDriver(e.target.value)}
                                className={`p-2 border rounded w-full focus:outline-none focus:ring-2 ${
                                    !selectedDriver ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                disabled={loading}
                                required
                            >
                                <option value="">Select Driver *</option>
                                {drivers.map((driver) => (
                                    <option key={driver._id} value={driver._id}>
                                        {driver.name}
                                    </option>
                                ))}
                            </select>
                            <select 
                                value={selectedVehicle}
                                onChange={(e) => setSelectedVehicle(e.target.value)}
                                className={`p-2 border rounded w-full focus:outline-none focus:ring-2 ${
                                    !selectedVehicle ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                                }`}
                                disabled={loading || vehiclesLoading}
                                required
                            >
                                <option value="">Select Vehicle *</option>
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

                            {/* Require Proof with type selector */}
                            <div className="flex items-center gap-3 mt-3">
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
                        </div>
                    </Section>

                    {/* Route Section */}
                    <Section title="Route">
                        <div className="mb-4">
                            <Toggle label="Multiple Dropoffs" checked={multipleDropoffs} onChange={setMultipleDropoffs} />
                        </div>

                        {!multipleDropoffs ? (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Enter Pickup Address"
                                    value={selectPickup}
                                    onChange={(e) => setSelectPickup(e.target.value)}
                                    className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4"
                                />
                                <input
                                    type="text"
                                    placeholder="Enter Dropoff Address"
                                    value={selectDropoff}
                                    onChange={(e) => setSelectDropoff(e.target.value)}
                                    className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4"
                                />
                                <input
                                    type="text"
                                    placeholder="Enter Return Address"
                                    value={selectReturn}
                                    onChange={(e) => setSelectReturn(e.target.value)}
                                    className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4"
                                />
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