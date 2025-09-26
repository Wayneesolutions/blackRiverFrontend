import React, { useState, useEffect } from "react";
import { updatePlace } from "../../../../../axios/api/dispatcher.places";

interface Props {
  place: any;
  onClose: () => void;
  onSave: (place: any) => void;
}

const PlaceModal: React.FC<Props> = ({ place, onClose, onSave }) => {
  const [formData, setFormData] = useState<any>({
    name: "",
    street1: "",
    street2: "",
    neighbourHood: "",
    building: "",
    city: "",
    state: "",
    country: "",
    phone: "",
    securityAccessCodepostalCode: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (place) setFormData(place);
  }, [place]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await updatePlace(formData._id, formData);
      setLoading(false);
      if (res.success) {
        onSave(res.data);
        onClose();
      } else alert(res.message || "Failed to update place");
    } catch (err) {
      setLoading(false);
      alert("Error updating place");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-[600px] max-w-full p-6 relative">
        <h2 className="text-xl font-semibold mb-4">
          {place ? "Edit Place" : "Create Place"}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Name", name: "name" },
            { label: "Street 1", name: "street1" },
            { label: "Street 2", name: "street2" },
            { label: "Neighbourhood", name: "neighbourHood" },
            { label: "Building", name: "building" },
            { label: "City", name: "city" },
            { label: "State", name: "state" },
            { label: "Country", name: "country" },
            { label: "Phone", name: "phone" },
            { label: "Postal Code", name: "securityAccessCodepostalCode" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-gray-700 text-sm mb-1">{field.label}</label>
              <input
                type="text"
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6 space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceModal;
