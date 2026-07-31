'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
}

const MOCK_VENUES: Venue[] = [
  {
    id: 'v1',
    name: 'Brew & Bean Coffee Shop',
    address: '123 Main St, Downtown',
    lat: 40.7524,
    lng: -73.9797,
    distance: 0.3,
  },
  {
    id: 'v2',
    name: 'Central Park Entrance',
    address: 'Fifth Ave, Midtown',
    lat: 40.7829,
    lng: -73.9654,
    distance: 1.2,
  },
  {
    id: 'v3',
    name: 'Trattoria da Lucia',
    address: '456 Park Ave, Upper East',
    lat: 40.7505,
    lng: -73.9972,
    distance: 0.8,
  },
  {
    id: 'v4',
    name: 'Brooklyn Vintage Market',
    address: '789 Bedford Ave, Brooklyn',
    lat: 40.6782,
    lng: -73.9442,
    distance: 2.5,
  },
  {
    id: 'v5',
    name: 'Modern Art Museum',
    address: '1000 Museum Mile, Midtown',
    lat: 40.7711,
    lng: -73.9776,
    distance: 1.5,
  },
  {
    id: 'v6',
    name: 'West 4th Street Basketball Court',
    address: 'West Village',
    lat: 40.7331,
    lng: -74.0025,
    distance: 1.8,
  },
  {
    id: 'v7',
    name: 'Rooftop Coffee Lounge',
    address: '2000 Broadway, Midtown',
    lat: 40.7489,
    lng: -73.9680,
    distance: 0.5,
  },
  {
    id: 'v8',
    name: 'Hudson River Greenway',
    address: 'West Side, Manhattan',
    lat: 40.7577,
    lng: -73.9855,
    distance: 0.7,
  },
];

interface VenueSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (venue: Venue) => void;
  selectedVenue: Venue | null;
}

export default function VenueSearch({
  value,
  onChange,
  onSelect,
  selectedVenue,
}: VenueSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Venue[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filter venues based on input
    if (value.trim()) {
      const filtered = MOCK_VENUES.filter((venue) =>
        venue.name.toLowerCase().includes(value.toLowerCase()) ||
        venue.address.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectVenue = (venue: Venue) => {
    onSelect(venue);
    onChange(venue.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    onSelect(null);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => value && setIsOpen(true)}
          placeholder="Search for a venue..."
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

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden"
        >
          <div className="max-h-80 overflow-y-auto">
            {suggestions.map((venue) => (
              <button
                key={venue.id}
                onClick={() => handleSelectVenue(venue)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-slate-900">{venue.name}</div>
                <div className="text-xs text-slate-600 mt-1">{venue.address}</div>
                <div className="text-xs text-teal-600 font-semibold mt-1">
                  {venue.distance}km away
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Venue Badge */}
      {selectedVenue && (
        <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-start gap-3">
          <MapPin size={16} className="text-teal-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900">{selectedVenue.name}</div>
            <div className="text-xs text-slate-600">{selectedVenue.address}</div>
          </div>
        </div>
      )}
    </div>
  );
}
