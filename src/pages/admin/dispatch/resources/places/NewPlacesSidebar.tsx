import React, { useState, useEffect } from 'react';
import { X, MapPin, Truck, ChevronDown, ChevronUp, Building, Building2 } from 'lucide-react';

interface NewPlaceSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Country {
    name: string;
    code: string;
    flag: string;
    dialCode: string;
}

const NewPlacesSidebar: React.FC<NewPlaceSidebarProps> = ({ isOpen, onClose }) => {
    const [openDetails, setOpenDetails] = useState(true);
    const [openAvatar, setOpenAvatar] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showPhoneCountryDropdown, setShowPhoneCountryDropdown] = useState(false);
    const [phoneCountry, setPhoneCountry] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        street1: '',
        street2: '',
        neighborhood: '',
        building: '',
        securityAccessCode: '',
        postalCode: '',
        city: '',
        state: '',
        country: '',
        coordinates: '',
        phoneNumber: '',
        internalId: '',
        plateNumber: '',
        vinNumber: '',
        make: '',
        model: '',
        year: '',
        driverAssigned: '',
        status: 'Active',
        latitude: '',
        longitude: ''
    });

    const placeAvatars = [
        { id: 'skyscraper', name: 'Custom: Skyscraper', selected: false, icon: Building2 },
        { id: 'office', name: 'Custom: Office Building', selected: false, icon: Building },
        { id: 'basic', name: 'Basic Building', selected: true, icon: Building },
    ];

    // Fetch countries data
    useEffect(() => {
        fetch('https://restcountries.com/v3.1/all?fields=name,flag,idd,cca2')
            .then(response => response.json())
            .then(data => {
                const sortedCountries = data
                    .filter((country: any) => country.idd && country.idd.root)
                    .map((country: any) => ({
                        name: country.name.common,
                        code: country.cca2,
                        flag: country.flag,
                        dialCode: country.idd.root + (country.idd.suffixes ? country.idd.suffixes[0] : '')
                    }))
                    .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

                setCountries(sortedCountries);

                // Set default phone country to US
                const defaultCountry = sortedCountries.find((c: Country) => c.code === 'US');
                if (defaultCountry) {
                    setPhoneCountry(defaultCountry.code);
                }
            })
            .catch(error => {
                console.error('Error fetching countries:', error);
                // Fallback data
                const fallbackCountries = [
                    { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1' },
                    { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dialCode: '+44' },
                    { name: 'Canada', code: 'CA', flag: '🇨🇦', dialCode: '+1' },
                    { name: 'India', code: 'IN', flag: '🇮🇳', dialCode: '+91' },
                    { name: 'Australia', code: 'AU', flag: '🇦🇺', dialCode: '+61' }
                ];
                setCountries(fallbackCountries);
                setPhoneCountry('US');
            });
    }, []);

    const handleInputChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCountryChange = (countryCode: string) => {
        setSelectedCountry(countryCode);
        const country = countries.find(c => c.code === countryCode);
        setFormData(prev => ({
            ...prev,
            country: country ? country.name : ''
        }));
        setShowCountryDropdown(false);
    };

    const handlePhoneCountryChange = (countryCode: string) => {
        setPhoneCountry(countryCode);
        setShowPhoneCountryDropdown(false);
    };

    const handleAvatarSelect = (avatarId: string) => {
        setSelectedAvatar(avatarId);
    };

    const getCountryByCode = (code: string) => {
        return countries.find(c => c.code === code);
    };

    const getSelectedCountryDialCode = () => {
        const country = getCountryByCode(phoneCountry);
        return country ? country.dialCode : '+1';
    };

    const getSelectedCountryFlag = () => {
        const country = getCountryByCode(phoneCountry);
        return country ? country.flag : '🇺🇸';
    };

    const handleSubmit = () => {
        console.log('Form submitted:', formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100]" onClick={onClose}></div>

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-136 bg-white border-l border-gray-200 shadow-lg z-[101] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">New Place</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                    <div className="flex-1 overflow-y-auto space-y-6">

                        {/* Place Details Panel */}
                        <div className="bg-white border border-gray-200 rounded-lg">
                            <div
                                className="flex items-center justify-between cursor-pointer p-4 border-b border-gray-200"
                                onClick={() => setOpenDetails(!openDetails)}
                            >
                                <h3 className="text-lg font-semibold text-gray-900">▼ Place Details</h3>
                                {openDetails ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                            </div>

                            {openDetails && (
                                <div className="p-4 space-y-4">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Street 1 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Street 1
                                        </label>
                                        <input
                                            type="text"
                                            name="street1"
                                            value={formData.street1}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Street 2 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Street 2
                                        </label>
                                        <input
                                            type="text"
                                            name="street2"
                                            value={formData.street2}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>

                                    {/* Three column row */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Neighbourhood
                                            </label>
                                            <input
                                                type="text"
                                                name="neighborhood"
                                                value={formData.neighborhood}
                                                onChange={handleInputChange}
                                                placeholder="Neighbourhood"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Building
                                            </label>
                                            <input
                                                type="text"
                                                name="building"
                                                value={formData.building}
                                                onChange={handleInputChange}
                                                placeholder="Building"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Security Access Code
                                            </label>
                                            <input
                                                type="text"
                                                name="securityAccessCode"
                                                value={formData.securityAccessCode}
                                                onChange={handleInputChange}
                                                placeholder="Security Access Code"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Three column row */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Postal Code
                                            </label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleInputChange}
                                                placeholder="Postal Code"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleInputChange}
                                                placeholder="City"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                name="state"
                                                value={formData.state}
                                                onChange={handleInputChange}
                                                placeholder="State"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Country */}
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Country
                                        </label>
                                        <div
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md cursor-pointer flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                        >
                                            <span className="flex items-center">
                                                {selectedCountry ? (
                                                    <>
                                                        <span className="mr-2">{getCountryByCode(selectedCountry)?.flag}</span>
                                                        <span>{getCountryByCode(selectedCountry)?.name}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-500">Select Country</span>
                                                )}
                                            </span>
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        </div>

                                        {showCountryDropdown && (
                                            <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg">
                                                {countries.map((country) => (
                                                    <div
                                                        key={country.code}
                                                        className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center"
                                                        onClick={() => handleCountryChange(country.code)}
                                                    >
                                                        <span className="mr-3">{country.flag}</span>
                                                        <span>{country.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Coordinates */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Coordinates
                                        </label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <input
                                                type="number"
                                                name="latitude"
                                                value={formData.latitude}
                                                onChange={handleInputChange}
                                                placeholder="Longitude"
                                                step="any"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <input
                                                type="number"
                                                name="longitude"
                                                value={formData.longitude}
                                                onChange={handleInputChange}
                                                placeholder="Latitude"
                                                step="any"
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="mt-2 text-blue-600 text-sm hover:text-blue-700 flex items-center"
                                        >
                                            <MapPin className="w-4 h-4 mr-1" />
                                            Select from map
                                        </button>
                                    </div>

                                    {/* Phone Number with Country Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone Number
                                        </label>
                                        <div className="flex relative">
                                            <div
                                                className="flex items-center bg-gray-50 border border-r-0 border-gray-300 rounded-l-md px-3 py-2 min-w-[120px] cursor-pointer"
                                                onClick={() => setShowPhoneCountryDropdown(!showPhoneCountryDropdown)}
                                            >
                                                <span className="mr-2">{getSelectedCountryFlag()}</span>
                                                <span className="text-sm text-gray-600 mr-1">
                                                    {getSelectedCountryDialCode()}
                                                </span>
                                                <ChevronDown className="w-3 h-3 text-gray-400" />
                                            </div>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                placeholder="123 456 7890"
                                                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />

                                            {showPhoneCountryDropdown && (
                                                <div className="absolute top-full left-0 z-50 mt-1 w-64 max-h-60 overflow-auto bg-white border border-gray-300 rounded-md shadow-lg">
                                                    {countries.map((country) => (
                                                        <div
                                                            key={country.code}
                                                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                                            onClick={() => handlePhoneCountryChange(country.code)}
                                                        >
                                                            <div className="flex items-center">
                                                                <span className="mr-3">{country.flag}</span>
                                                                <span className="text-sm">{country.name}</span>
                                                            </div>
                                                            <span className="text-sm text-gray-600">{country.dialCode}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>

                        {/* Avatar Panel */}
                        <div className="bg-white border border-gray-200 rounded-lg">
                            <div
                                className="flex items-center justify-between cursor-pointer p-4 border-b border-gray-200"
                                onClick={() => setOpenAvatar(!openAvatar)}
                            >
                                <h3 className="text-lg font-semibold text-gray-900">▼ Avatar</h3>
                                {openAvatar ? (
                                    <ChevronUp className="w-5 h-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                            </div>

                            {openAvatar && (
                                <div className="p-4">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Select map avatar <span className="text-gray-400 text-xs">ℹ</span>
                                        </label>
                                        <select
                                            value={selectedAvatar}
                                            onChange={(e) => handleAvatarSelect(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select avatar</option>
                                            {placeAvatars.map((avatar) => (
                                                <option key={avatar.id} value={avatar.id}>
                                                    {avatar.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-between">
                                        <div className="flex-1 mr-4">
                                            <div className="space-y-2">
                                                {placeAvatars.map((avatar) => {
                                                    const IconComponent = avatar.icon;
                                                    const isSelected = selectedAvatar === avatar.id;

                                                    return (
                                                        <div
                                                            key={avatar.id}
                                                            className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${isSelected
                                                                ? 'border-blue-500 bg-blue-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            onClick={() => handleAvatarSelect(avatar.id)}
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <div className={`w-8 h-8 rounded flex items-center justify-center ${isSelected ? 'bg-blue-100' : 'bg-gray-100'
                                                                    }`}>
                                                                    <IconComponent className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'
                                                                        }`} />
                                                                </div>
                                                                <span className="text-sm text-gray-700">{avatar.name}</span>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="w-24 h-32 bg-gray-900 rounded-md flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-2">
                                                    {selectedAvatar ? (
                                                        (() => {
                                                            const selectedAvatarData = placeAvatars.find(a => a.id === selectedAvatar);
                                                            const IconComponent = selectedAvatarData?.icon || Building;
                                                            return <IconComponent className="w-6 h-6 text-gray-300" />;
                                                        })()
                                                    ) : (
                                                        <Building className="w-6 h-6 text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-1">
                                                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-white sticky bottom-0 z-[102] shadow-lg">
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 !mr-3 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-600 !text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Create Place
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NewPlacesSidebar;