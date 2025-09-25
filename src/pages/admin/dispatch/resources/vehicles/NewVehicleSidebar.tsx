import React, { useState, useEffect } from 'react';
import { X, MapPin, Truck, Image as ImageIcon } from 'lucide-react';
import type { FC } from "react";
import { listDriver, createVehicle,listTrailers } from '../../../../../axios/api/distapcher';

interface NewVehicleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Driver {
  _id: string;
  name: string;
}

interface Trailer {
  _id: string;
  trailer: string;
}

const NewVehicleSidebar: FC<NewVehicleSidebarProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    internalId: '',
    plateNumber: '',
    vinNumber: '',
    make: '',
    model: '',
    year: '',
    driverId: '',
    status: 'stopped',
    address: '',
    trailerId: '',
    vehicleImages: [] as File[],
  });

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await listDriver();
        const tra = await listTrailers()
        if (res.success) setDrivers(res.data);
        if(res.success) setTrailers(tra.data)
      } catch (err) {
        console.error('Error fetching drivers', err);
      }
    };
    fetchDrivers();
  }, []);



  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files) {
      const fileArray = Array.from(files);
      setFormData(prev => ({
        ...prev,
        vehicleImages: [...prev.vehicleImages, ...fileArray],
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      vehicleImages: prev.vehicleImages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      // Prepare form data for backend
      const data = new FormData();
      data.append('internalId', formData.internalId);
      data.append('plateNumber', formData.plateNumber);
      data.append('vinNumber', formData.vinNumber);
      data.append('make', formData.make);
      data.append('model', formData.model);
      data.append('year', formData.year.toString());
      data.append('driverId', formData.driverId);
      data.append('status', formData.status);
      data.append('address', formData.address);
      data.append('trailer', formData.trailerId);

      formData.vehicleImages.forEach((file) => {
        data.append('vehicleImages', file);
      });

      const res = await createVehicle(data);
      if (res.success) {
        alert('Vehicle created successfully!');
        onClose();
      } else {
        alert('Error: ' + res.message);
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong!');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={onClose}></div>

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-126 bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">New Vehicle</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
          <div className="bg-gray-50 p-4 rounded-md space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal ID</label>
                <input
                  type="text"
                  name="internalId"
                  value={formData.internalId}
                  onChange={handleInputChange}
                  placeholder="Internal ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                <input
                  type="text"
                  name="plateNumber"
                  value={formData.plateNumber}
                  onChange={handleInputChange}
                  placeholder="Plate Number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIN Number</label>
                <input
                  type="text"
                  name="vinNumber"
                  value={formData.vinNumber}
                  onChange={handleInputChange}
                  placeholder="VIN Number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  placeholder="Vehicle make"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="Vehicle model"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="Vehicle year"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver Assigned</label>
                <select
                  name="driverId"
                  value={formData.driverId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Driver</option>
                  {drivers.map(driver => (
                    <option key={driver._id} value={driver._id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="stopped">Stopped</option>
                  <option value="moving">Moving</option>
                  <option value="idle">Idle</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Enter vehicle address"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Trailer Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trailer</label>
              <select
                name="trailerId"
                value={formData.trailerId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Trailer</option>
                {trailers?.map(trailer => (
                  <option key={trailer._id} value={trailer._id}>{trailer.trailer}</option>
                ))}
              </select>
            </div>

            {/* Vehicle Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <label htmlFor="vehicle-images" className="cursor-pointer mt-2 block text-sm text-gray-900">
                    Upload vehicle images (PNG, JPG, GIF up to 10MB each)
                  </label>
                  <input
                    id="vehicle-images"
                    name="vehicleImages"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                  />
                </div>

                {formData.vehicleImages.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {formData.vehicleImages.map((image, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Vehicle ${idx + 1}`}
                          className="h-20 w-full object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white sticky bottom-0 z-[102] shadow-lg">
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Vehicle
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewVehicleSidebar;
