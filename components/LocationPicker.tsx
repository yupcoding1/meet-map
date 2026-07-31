'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, X, Search, Loader2 } from 'lucide-react';

const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center">
      <p className="text-slate-500 text-sm">Loading map...</p>
    </div>
  ),
});

export interface SelectedLocation {
  name: string;
  lat: number;
  lng: number;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
}

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: SelectedLocation) => void;
  selectedLocation: SelectedLocation | null;
  placeholder?: string;
}

export default function LocationPicker({
  value,
  onChange,
  onSelect,
  selectedLocation,
  placeholder = 'Search for a place or click on the map...',
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search using Nominatim API (OpenStreetMap - free, no API key needed)
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);

    searchTimerRef.current = setTimeout(async () => {
      try {
        console.log('[LocationPicker] Searching for:', searchQuery);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );
        const data: SearchResult[] = await response.json();
        console.log(`[LocationPicker] Found ${data.length} results`);
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        console.error('[LocationPicker] Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (result: SearchResult) => {
    console.log('[LocationPicker] Selected search result:', result.display_name);
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const shortName = result.display_name.split(',')[0];
    onChange(shortName);
    onSelect({ name: shortName, lat, lng });
    setSearchQuery('');
    setShowResults(false);
  };

  const handleMapClick = (lat: number, lng: number) => {
    console.log('[LocationPicker] Map clicked:', { lat, lng });
    const name = value || `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    onSelect({ name, lat, lng });
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
    onSelect({ name: '', lat: 0, lng: 0 });
  };

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          placeholder="Search for a place (e.g. OI brew Pune)..."
          className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
        />
        {isSearching && (
          <Loader2
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 animate-spin"
          />
        )}
        {searchQuery && !isSearching && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        )}

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.place_id}
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-teal-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-slate-900 text-sm">
                        {result.display_name.split(',')[0]}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {result.display_name}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Place name input */}
      <div className="relative">
        <MapPin
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (selectedLocation) {
              onSelect({ ...selectedLocation, name: e.target.value });
            }
          }}
          placeholder="Place name (auto-filled from search or type your own)..."
          className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-500"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Map for picking location */}
      <MapPicker
        onLocationSelect={handleMapClick}
        selectedLocation={selectedLocation}
      />

      {/* Selected location info */}
      {selectedLocation && selectedLocation.lat !== 0 && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-start gap-3">
          <MapPin size={16} className="text-teal-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900">
              {selectedLocation.name || 'Selected location'}
            </div>
            <div className="text-xs text-slate-600 mt-1">
              {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
            </div>
          </div>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-slate-500">
        Search for a place above, or click directly on the map to mark a location.
      </p>
    </div>
  );
}