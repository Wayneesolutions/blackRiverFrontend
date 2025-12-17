import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { FC } from "react";
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { createtCustomer } from '../../../../../axios/api/distapcher';
import { createPlace } from '../../../../../axios/api/dispatcher.places';

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
    const [currentStep, setCurrentStep] = useState(1);
    const [customerData, setCustomerData] = useState({
        name: '',
        email: '',
        phone: '',
        country: '',
        state: '',
        city: '',
        internalId: ''
    });
    const [placeData, setPlaceData] = useState({
        name: '',
        street1: '',
        street2: '',
        neighbourHood: '',
        building: '',
        securityAccessCodepostalCode: '',
        city: '',
        state: '',
        country: '',
        phone: '',
    });
    const [selectedCountry, setSelectedCountry] = useState('US');
    const [countries, setCountries] = useState<Array<{ name: string; code: string; flag: string; dialCode: string }>>([]);
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

    // Fetch countries data
    useEffect(() => {
        if (isOpen) {
            fetch('https://restcountries.com/v3.1/all?fields=name,flag,idd,cca2')
                .then(res => res.json())
                .then(data => {
                    const sortedCountries = data
                        .filter((c: any) => c.idd && c.idd.root)
                        .map((c: any) => ({
                            name: c.name.common,
                            code: c.cca2,
                            flag: c.flag,
                            dialCode: c.idd.root + (c.idd.suffixes ? c.idd.suffixes[0] : ''),
                        }))
                        .sort((a: any, b: any) => a.name.localeCompare(b.name));
                    setCountries(sortedCountries);
                    const defaultCountry = sortedCountries.find((c: any) => c.code === 'US');
                    if (defaultCountry) setSelectedCountry(defaultCountry.code);
                })
                .catch(() => {
                    const fallback = [
                        { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1' },
                        { name: 'India', code: 'IN', flag: '🇮🇳', dialCode: '+91' },
                    ];
                    setCountries(fallback);
                    setSelectedCountry('US');
                });
        }
    }, [isOpen]);

    const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomerData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlaceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPlaceData(prev => ({ ...prev, [name]: value }));
    };

    const handleCountryChange = (code: string) => {
        const country = countries.find(c => c.code === code);
        setSelectedCountry(code);
        setPlaceData(prev => ({ ...prev, country: country ? country.name : '' }));
    };

    const handleNext = () => {
        if (currentStep === 1) {
            if (!customerData.name.trim()) {
                showToast('error', 'Please enter customer name');
                return;
            }
            setCurrentStep(2);
        }
    };

    const handleBack = () => {
        if (currentStep === 2) {
            setCurrentStep(1);
        }
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);

            // Step 1: Create customer
            const customerResponse = await createtCustomer(customerData);

            if (!customerResponse?.success) {
                showToast('error', customerResponse?.message || 'Error creating customer. Please try again.');
                setIsLoading(false);
                return;
            }

            // Step 2: Create place (if place data is provided)
            if (placeData.name.trim()) {
                const placeResponse = await createPlace(placeData);
                
                if (!placeResponse?.success) {
                    showToast('error', placeResponse?.message || 'Customer created but failed to create place.');
                } else {
                    showToast('success', 'Customer and place created successfully!');
                }
            } else {
                showToast('success', customerResponse.message || 'Customer created successfully!');
            }

            // Reset form
            setCustomerData({
                name: '',
                email: '',
                phone: '',
                country: '',
                state: '',
                city: '',
                internalId: ''
            });
            setPlaceData({
                name: '',
                street1: '',
                street2: '',
                neighbourHood: '',
                building: '',
                securityAccessCodepostalCode: '',
                city: '',
                state: '',
                country: '',
                phone: '',
            });
            setCurrentStep(1);
            
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error: any) {
            console.error('Error creating customer/place:', error);
            showToast('error', error?.message || 'Error creating customer. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setCurrentStep(1);
        setCustomerData({
            name: '',
            email: '',
            phone: '',
            country: '',
            state: '',
            city: '',
            internalId: ''
        });
        setPlaceData({
            name: '',
            street1: '',
            street2: '',
            neighbourHood: '',
            building: '',
            securityAccessCodepostalCode: '',
            city: '',
            state: '',
            country: '',
            phone: '',
        });
    };

    const handleClose = () => {
        resetForm();
        onClose();
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
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={handleClose}></div>

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-[500px] bg-white border-l border-gray-200 shadow-xl z-[101] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">New Customer</h2>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Step Indicator */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                                currentStep >= 1 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : 'border-gray-300 text-gray-400'
                            }`}>
                                {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
                            </div>
                            <span className={`ml-2 text-sm font-medium ${
                                currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                                Customer Details
                            </span>
                        </div>
                        <div className="flex-1 h-0.5 mx-4 bg-gray-200">
                            <div className={`h-full transition-all duration-300 ${
                                currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                            }`} style={{ width: currentStep >= 2 ? '100%' : '0%' }}></div>
                        </div>
                        <div className="flex items-center">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                                currentStep >= 2 
                                    ? 'bg-blue-600 border-blue-600 text-white' 
                                    : 'border-gray-300 text-gray-400'
                            }`}>
                                2
                            </div>
                            <span className={`ml-2 text-sm font-medium ${
                                currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'
                            }`}>
                                Place Details
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {currentStep === 1 ? (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={customerData.name}
                                    onChange={handleCustomerInputChange}
                                    placeholder="Customer Name"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={customerData.email}
                                    onChange={handleCustomerInputChange}
                                    placeholder="customer@example.com"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={customerData.phone}
                                    onChange={handleCustomerInputChange}
                                    placeholder="Phone Number"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={customerData.country}
                                        onChange={handleCustomerInputChange}
                                        placeholder="Country"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={customerData.state}
                                        onChange={handleCustomerInputChange}
                                        placeholder="State"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={customerData.city}
                                    onChange={handleCustomerInputChange}
                                    placeholder="City"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Internal ID</label>
                                <input
                                    type="text"
                                    name="internalId"
                                    value={customerData.internalId}
                                    onChange={handleCustomerInputChange}
                                    placeholder="Internal ID"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Place Information</h3>
                            <p className="text-sm text-gray-500 mb-4">Optional: Add a place associated with this customer</p>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Place Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={placeData.name}
                                    onChange={handlePlaceInputChange}
                                    placeholder="Place Name"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Street 1</label>
                                <input
                                    type="text"
                                    name="street1"
                                    value={placeData.street1}
                                    onChange={handlePlaceInputChange}
                                    placeholder="Street Address 1"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Street 2</label>
                                <input
                                    type="text"
                                    name="street2"
                                    value={placeData.street2}
                                    onChange={handlePlaceInputChange}
                                    placeholder="Street Address 2"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Neighbourhood</label>
                                    <input
                                        type="text"
                                        name="neighbourHood"
                                        value={placeData.neighbourHood}
                                        onChange={handlePlaceInputChange}
                                        placeholder="Neighbourhood"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                                    <input
                                        type="text"
                                        name="building"
                                        value={placeData.building}
                                        onChange={handlePlaceInputChange}
                                        placeholder="Building"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code / Security Access Code</label>
                                <input
                                    type="text"
                                    name="securityAccessCodepostalCode"
                                    value={placeData.securityAccessCodepostalCode}
                                    onChange={handlePlaceInputChange}
                                    placeholder="Postal Code"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={placeData.city}
                                        onChange={handlePlaceInputChange}
                                        placeholder="City"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={placeData.state}
                                        onChange={handlePlaceInputChange}
                                        placeholder="State"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <select
                                    value={selectedCountry}
                                    onChange={e => handleCountryChange(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                                >
                                    {countries.map(c => (
                                        <option key={c.code} value={c.code}>
                                            {c.flag} {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={placeData.phone}
                                    onChange={handlePlaceInputChange}
                                    placeholder="Phone Number"
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-between items-center bg-white sticky bottom-0 z-[102]">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <div className="flex gap-3">
                        {currentStep === 2 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
                                disabled={isLoading}
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </button>
                        )}
                        {currentStep === 1 ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                className="px-5 py-2.5 rounded-lg text-white transition-all font-medium flex items-center gap-2"
                                style={{
                                    background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                                }}
                                disabled={isLoading || !customerData.name.trim()}
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-5 py-2.5 rounded-lg text-white transition-all font-medium flex items-center gap-2"
                                style={{
                                    background: 'linear-gradient(90deg, #42aeec 0%, #1db5f5 40%, #0ea3d8 100%)',
                                }}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating...' : 'Create Customer'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default NewCustomerSidebar;
