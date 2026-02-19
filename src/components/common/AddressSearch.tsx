import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';

interface PhotonFeature {
  geometry: {
    coordinates: [number, number]; // [longitude, latitude]
    type: string;
  };
  type: string;
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    countrycode?: string;
    district?: string;
    county?: string;
    [key: string]: any;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

interface AddressResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    street?: string;
    street_name?: string;

    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    city_district?: string;

    state?: string;
    state_district?: string;
    province?: string;
    region?: string;

    postcode?: string;
    postal_code?: string;

    country?: string;
    country_code?: string;
  };
}


interface AddressSearchProps {
  placeholder?: string;
  value?: string;
  onAddressSelect: (address: {
    fullAddress: string;
    streetNumber: string;
    route: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    latitude: string;
    longitude: string;
  }) => void;
  onChange?: (value: string) => void;
  className?: string;
  label?: string;
  debounceMs?: number;
}

const AddressSearch: React.FC<AddressSearchProps> = ({
  placeholder = "Search For An Address...",
  value,
  onAddressSelect,
  onChange,
  className = "",
  label = "Search Address",
  debounceMs = 500
}) => {
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update searchQuery when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSearchQuery(value);
    }
  }, [value]);

  // Search addresses using Google Places Autocomplete (via backend proxy) or Photon API (fallback)
  const searchAddresses = async (query: string) => {
    if (!query || query.trim().length < 3) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);

    try {
      // Extract house number from search query if present (e.g., "410 Burnell St" -> "410")
      const queryNumberMatch = query.trim().match(/^(\d+[A-Za-z]?)\s/);
      const queryHouseNumber = queryNumberMatch ? queryNumberMatch[1] : '';
      const queryWithoutNumber = queryNumberMatch ? query.replace(queryNumberMatch[0], '').trim() : query;

      // Use Photon API (Komoot) - free, faster than Nominatim, better rate limits
      // Search with and without house number to get better results
      const searchQuery = queryWithoutNumber || query;
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=10`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        console.error('❌ [AddressSearch] Photon API error:', response.status);
        if (response.status === 429) {
          setErrorMessage('Too many requests. Please wait before searching again.');
        } else {
          setErrorMessage(`Search failed. Please try again.`);
        }
        setResults([]);
        setShowResults(false);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: PhotonResponse = await response.json();
      
      console.log('✅ [AddressSearch] Photon API successful! Found', data.features?.length || 0, 'results');

      // Convert Photon format to our AddressResult format
      const convertedResults: AddressResult[] = data.features.map((feature, index) => {
        const props = feature.properties;
        const [lon, lat] = feature.geometry.coordinates;

        // Extract house number - try multiple sources
        let houseNumber = props.housenumber || '';
        
        // If housenumber not in properties, try to extract from name
        if (!houseNumber && props.name) {
          // Try to extract number from name (e.g., "410 Burnell St" -> "410")
          const nameMatch = props.name.match(/^(\d+[A-Za-z]?)\s/);
          if (nameMatch) {
            houseNumber = nameMatch[1];
          }
        }
        
        // If still no house number and we extracted one from query, use it
        if (!houseNumber && queryHouseNumber) {
          houseNumber = queryHouseNumber;
        }

        // Extract street/road - try multiple sources
        let street = props.street || props.name || '';
        
        // If we extracted house number from name, remove it from street
        if (houseNumber && street && street.startsWith(houseNumber)) {
          street = street.replace(new RegExp(`^${houseNumber}\\s*`), '').trim();
        }
        
        // Clean up street name - remove common prefixes if house number was added from query
        if (queryHouseNumber && !props.housenumber && street) {
          // Remove house number from street if it's there
          street = street.replace(new RegExp(`^${queryHouseNumber}\\s*`), '').trim();
        }

        // Build street address: house_number + street
        const streetAddress = [houseNumber, street].filter(Boolean).join(' ').trim();
        
        // Build display name from available properties
        const nameParts = [
          streetAddress || props.name,
          props.city,
          props.state,
          props.postcode,
          props.country
        ].filter(Boolean);
        const displayName = nameParts.join(', ') || props.name || query;

        // Create a unique ID from coordinates and index
        const uniqueId = `${lat.toFixed(6)}_${lon.toFixed(6)}_${index}`;

        return {
          place_id: parseInt(uniqueId.replace(/[._-]/g, '')) || index,
          display_name: displayName,
          lat: lat.toString(),
          lon: lon.toString(),
          address: {
            house_number: houseNumber,
            road: street,
            city: props.city || props.district || props.county || '',
            state: props.state || '',
            postcode: props.postcode || '',
            country: props.country || '',
            country_code: props.countrycode || ''
          }
        };
      });

      console.log('✅ [AddressSearch] Photon API: Successfully converted', convertedResults.length, 'address results');
      setResults(convertedResults);
      setShowResults(true);
      setSelectedIndex(-1);

    } catch (error: any) {
      console.error('❌ [AddressSearch] Error searching addresses:', error);

      // Only set error message if not already set
      if (!errorMessage) {
        if (error.message && error.message.includes('Rate limit')) {
          setErrorMessage('Rate limit exceeded. Please wait a moment before searching again.');
        } else if (!error.message.includes('HTTP error')) {
          setErrorMessage('Failed to search addresses. Please try again.');
        }
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddresses(searchQuery);
      }, debounceMs);
    } else {
      setResults([]);
      setShowResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, debounceMs]);

  // Handle address selection
  const handleAddressSelect = (result: AddressResult) => {
    const address = result.address || {};

    // Extract address components with better fallbacks
    let streetNumber = address.house_number || '';
    let route = address.road || address.street || address.street_name || '';
    
    // If street number is missing, try to extract from display_name
    if (!streetNumber && result.display_name) {
      const firstPart = result.display_name.split(',')[0].trim();
      // Try to extract number from first part (e.g., "410 Burnell St" -> "410")
      const numberMatch = firstPart.match(/^(\d+[A-Za-z]?)\s/);
      if (numberMatch) {
        streetNumber = numberMatch[1];
        // Remove the number from route if it's there
        route = firstPart.replace(new RegExp(`^${streetNumber}\\s*`), '').trim() || route;
      } else if (!route) {
        // If no route and no number match, use first part as route
        route = firstPart;
      }
    }
    
    // Build full street address: street_number + route
    const streetAddress = [streetNumber, route].filter(Boolean).join(' ').trim() || result.display_name.split(',')[0];

    // Try multiple fields for city
    const city = address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      address.city_district ||
      '';

    // Try multiple fields for state/province
    const state = address.state ||
      address.province ||
      address.region ||
      address.state_district ||
      '';

    const postalCode = address.postcode || address.postal_code || '';

    // Get country name or code
    const country = address.country ||
      (address.country_code ? address.country_code.toUpperCase() : '') ||
      '';

    // Call the callback with structured address data
    onAddressSelect({
      fullAddress: result.display_name,
      streetNumber: streetNumber,
      route: route,
      address: streetAddress,
      city: city,
      state: state,
      postalCode: postalCode,
      country: country,
      latitude: result.lat,
      longitude: result.lon
    });

    // Set the selected address in the input field
    setSearchQuery(result.display_name);
    setResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleAddressSelect(results[selectedIndex]);
        } else if (results.length > 0) {
          handleAddressSelect(results[0]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (onChange) {
                onChange(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) {
                setShowResults(true);
              }
            }}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setResults([]);
                setShowResults(false);
                if (onChange) {
                  onChange('');
                }
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && results.length > 0 && (
          <div
            ref={resultsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {results.map((result, index) => (
              <button
                key={`${result.lat}_${result.lon}_${index}`}
                type="button"
                onClick={() => handleAddressSelect(result)}
                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${selectedIndex === index ? 'bg-blue-50' : ''
                  }`}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {(() => {
                        // Build street address from house_number + road for display
                        const streetAddr = [result.address?.house_number, result.address?.road].filter(Boolean).join(' ').trim();
                        return streetAddr || result.display_name.split(',')[0];
                      })()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {result.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="absolute z-50 w-full mt-1 bg-yellow-50 border border-yellow-300 rounded-lg shadow-lg p-3">
            <p className="text-sm text-yellow-800 text-center">
              {errorMessage}
            </p>
            <button
              onClick={() => setErrorMessage(null)}
              className="absolute right-2 top-2 text-yellow-600 hover:text-yellow-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* No Results Message */}
        {showResults && !isSearching && !errorMessage && results.length === 0 && searchQuery.trim().length >= 3 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
            <p className="text-sm text-gray-500 text-center">
              No addresses found. Try a different search term.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressSearch;

