import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { FC } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { createtCustomer } from '../../../../../axios/api/distapcher';

interface ToastNotification {
  id: number;
  type: 'success' | 'error';
  message: string;
}

const ToastNotification = ({ notification, onClose }: { notification: ToastNotification; onClose: (id: number) => void }) => {
  const icons = {
    success: <FaCheckCircle className="text-green-500" size={24} />,
    error: <FaExclamationCircle className="text-red-500" size={24} />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notification.id, onClose]);

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg ${bgColors[notification.type]} animate-slide-in`}>
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

interface NewCustomerSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const NewCustomerSidebar: FC<NewCustomerSidebarProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        country: '',
        state: '',
        city: '',
        internalId: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [notifications, setNotifications] = useState<ToastNotification[]>([]);
    const notificationIdRef = useRef(0);

    const showToast = (type: 'success' | 'error', message: string) => {
        const id = notificationIdRef.current++;
        setNotifications((prev) => [...prev, { id, type, message }]);
    };

    const removeNotification = (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);

            const response = await createtCustomer(formData);

            if (response?.success) {
                console.log('Customer created successfully:', response);
                showToast('success', response.message || 'Customer created successfully!');
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    country: '',
                    state: '',
                    city: '',
                    internalId: ''
                });
                setTimeout(() => {
                    onClose();
                }, 500);
            } else {
                console.error('Error creating customer:', response);
                showToast('error', response?.message || 'Error creating customer. Please try again.');
            }
        } catch (error: any) {
            console.error('Error creating customer:', error);
            showToast('error', error?.message || 'Error creating customer. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-[10000] space-y-2">
                {notifications.map((notification) => (
                    <ToastNotification
                        key={notification.id}
                        notification={notification}
                        onClose={removeNotification}
                    />
                ))}
            </div>

            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={onClose}></div>

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex-shrink-0 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">New Customer</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Customer Name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Phone"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Country */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            placeholder="Country"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* State */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="State"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* City */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="City"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Internal ID */}
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
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex justify-end bg-white sticky bottom-0 z-[102]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 !mr-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 mr-3"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        style={{
                            background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                          }}
                        className="px-4 py-2 bg-blue-600 !text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                        disabled={isLoading || !formData.name.trim()}
                    >
                        {isLoading ? 'Creating...' : 'Create Customer'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default NewCustomerSidebar;
