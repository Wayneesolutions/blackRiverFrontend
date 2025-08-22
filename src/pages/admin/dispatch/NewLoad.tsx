import React, { useState } from "react";
import { X, Plus, Trash, Package, Edit3, Upload, Camera } from "lucide-react";

interface NewLoadProps {
    onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
    title,
    children,
}) => {
    const [open, setOpen] = useState(true);
    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Section Header */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex justify-between items-center px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                style={{ backgroundColor: '#f3f4f6' }}
            >
                {title}
                <span className="text-lg">{open ? "−" : "+"}</span>
            </button>
            {/* Section Body */}
            {open && <div className="p-4 space-y-4" style={{ backgroundColor: 'white' }}>{children}</div>}
        </div>
    );
};

const Toggle = ({
    label,
    checked,
    onChange
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) => {
    return (
        <label className="flex items-center gap-2 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="hidden"
            />
            <span
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${checked ? "bg-green-500" : "bg-gray-300"
                    }`}
            >
                <span
                    className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${checked ? "translate-x-4" : "translate-x-0"
                        }`}
                />
            </span>
            <span className="text-gray-700">{label}</span>
        </label>
    );
};

const NewLoad: React.FC<NewLoadProps> = ({ onClose }) => {
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
        { id: number; waypoint: string; customer: string; type: "pickup" | "dropoff" }[]
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
    }[]>([]);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Dummy images for demonstration
    const dummyImages = [
        "https://images.unsplash.com/photo-1586864387789-628af9feed72?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1580169980114-ccd0babfa840?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop"
    ];

    // Waypoint functions
    const addWaypoint = () => {
        setWaypoints([
            ...waypoints,
            { id: Date.now(), waypoint: "", customer: "", type: "dropoff" },
        ]);
    };

    const removeWaypoint = (id: number) => {
        setWaypoints(waypoints.filter((w) => w.id !== id));
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
            image: randomImage
        }]);
    };

    const removeItem = (id: number) => {
        setItems(items.filter((i) => i.id !== id));
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
                    {/* Details Section */}
                    <Section title="Details">
                        <div className="grid grid-cols-2 gap-4">
                            <select className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Select Order Type</option>
                            </select>
                            <input
                                className="p-2 border border-gray-300 rounded w-full"
                                style={{ backgroundColor: '#f9fafb' }}
                                value="Internal ID"
                                readOnly
                            />
                            <select className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Select Customer</option>
                            </select>
                            <select className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Select Facilitator</option>
                            </select>
                            <select className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Select Driver</option>
                            </select>
                            <select className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>Select Vehicle</option>
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
                                <select className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4">
                                    <option>Select Pickup</option>
                                </select>
                                <select className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4">
                                    <option>Select Dropoff</option>
                                </select>
                                <select className="p-2 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4">
                                    <option>Select Return</option>
                                </select>
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
                                            <select className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4">
                                                <option>Select Address</option>
                                            </select>
                                            <select className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 !mb-4">
                                                <option>Select Customer</option>
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
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="absolute top-2 right-2 p-1 hover:bg-red-100 rounded z-10"
                                        >
                                            <X className="text-red-500 w-4 h-4" />
                                        </button>

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
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded bg-white !mb-4"
                                                placeholder="Item Name"
                                                value={item.name}
                                                readOnly
                                            />
                                            <input
                                                className="w-full p-2 border border-gray-300 rounded bg-white !mb-4"
                                                placeholder="SKU"
                                                value={item.sku}
                                                readOnly
                                            />
                                            <button
                                                onClick={() => setEditingItem(item)}
                                                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-300 rounded w-full justify-center transition-colors mt-2"
                                                style={{ backgroundColor: '#e5e7eb' }}
                                            >
                                                <Edit3 size={14} /> Edit Item
                                            </button>
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
                        <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 hover:bg-blue-100 transition-colors">
                            <p className="mb-3 text-gray-600">
                                Drag and drop files into this dropzone. Upload Documents & Files
                            </p>
                            <button className="px-6 py-2 bg-blue-500 hover:bg-blue-600 !text-white rounded transition-colors">
                                or select files to upload
                            </button>
                        </div>
                    </Section>
                </div>

                {/* Fixed Footer */}
                <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
                    <div className="flex gap-3">
                        <button className="flex-1 bg-green-500 hover:bg-green-600 !text-white font-semibold px-6 py-3 rounded shadow transition-colors">
                            Save Load
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
                                            className="w-full p-2 border border-gray-300 rounded text-gray-900 bg-gray-50"
                                            placeholder="Auto-generated"
                                            readOnly
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
                                </div>

                                <div className="mt-4">
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