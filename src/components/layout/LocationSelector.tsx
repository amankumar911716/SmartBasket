'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Crosshair,
  Loader2,
  Check,
  X,
  Clock,
  Navigation,
  Home,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LocationData {
  label: string;
  address: string;
  lat?: number;
  lng?: number;
}

// Recent locations stored in localStorage
const RECENT_LOCATIONS_KEY = 'smartbasket-recent-locations';
const MAX_RECENT_LOCATIONS = 5;

function getRecentLocations(): LocationData[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_LOCATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentLocation(location: LocationData) {
  try {
    const existing = getRecentLocations();
    // Remove duplicate by address
    const filtered = existing.filter((l) => l.address !== location.address);
    const updated = [location, ...filtered].slice(0, MAX_RECENT_LOCATIONS);
    localStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
  } catch {
    // Silently fail
  }
}

// Predefined popular locations for quick selection
const POPULAR_LOCATIONS: LocationData[] = [
  { label: 'BiharSharif', address: 'BiharSharif, Nalanda, Bihar, India', lat: 25.1934, lng: 85.5299 },
  { label: 'Patna', address: 'Patna, Bihar, India', lat: 25.6093, lng: 85.1376 },
  { label: 'Rajgir', address: 'Rajgir, Nalanda, Bihar, India', lat: 25.0286, lng: 85.4199 },
  { label: 'Nalanda', address: 'Nalanda, Bihar, India', lat: 25.1361, lng: 85.4428 },
];

export default function LocationSelector({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const { deliveryLocation, setDeliveryLocation } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualLabel, setManualLabel] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [recentLocations, setRecentLocations] = useState<LocationData[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent locations on mount
  useEffect(() => {
    setRecentLocations(getRecentLocations());
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowManualForm(false);
        setGeoError(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when manual form opens
  useEffect(() => {
    if (showManualForm && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showManualForm]);

  // Detect current location using Geolocation API
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      toast({
        title: 'Not Supported',
        description: 'Your browser does not support geolocation. Please enter your address manually.',
        variant: 'destructive',
      });
      return;
    }

    setIsDetecting(true);
    setGeoError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 min cache
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
          {
            headers: {
              'Accept-Language': 'en',
            },
          }
        );
        const data = await res.json();

        if (data && data.display_name) {
          const address = data.display_name;
          // Extract a short label from the address
          const parts = address.split(',');
          const label = parts[0].trim().substring(0, 25) || 'Current Location';

          const locationData: LocationData = {
            label,
            address,
            lat: latitude,
            lng: longitude,
          };

          setDeliveryLocation(locationData);
          saveRecentLocation(locationData);
          setRecentLocations(getRecentLocations());
          setIsOpen(false);

          toast({
            title: 'Location Detected!',
            description: `Delivering to ${label}`,
          });
        } else {
          // Fallback: just use coordinates
          const locationData: LocationData = {
            label: 'Current Location',
            address: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
            lat: latitude,
            lng: longitude,
          };

          setDeliveryLocation(locationData);
          saveRecentLocation(locationData);
          setRecentLocations(getRecentLocations());
          setIsOpen(false);

          toast({
            title: 'Location Detected!',
            description: 'Could not determine address name, using coordinates.',
          });
        }
      } catch {
        // Reverse geocoding failed, use coordinates as fallback
        const locationData: LocationData = {
          label: 'Current Location',
          address: `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`,
          lat: latitude,
          lng: longitude,
        };

        setDeliveryLocation(locationData);
        saveRecentLocation(locationData);
        setRecentLocations(getRecentLocations());
        setIsOpen(false);

        toast({
          title: 'Location Detected',
          description: 'Address lookup unavailable. Coordinates will be used.',
        });
      }
    } catch (err) {
      setIsDetecting(false);
      const error = err as GeolocationPositionError;

      if (error.code === error.PERMISSION_DENIED) {
        setGeoError('Location access was denied. Please enter your address manually or enable location permissions in your browser settings.');
        toast({
          title: 'Permission Denied',
          description: 'Location access was denied. Please enter your address manually.',
          variant: 'destructive',
        });
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        setGeoError('Location information is unavailable. Please try again or enter your address manually.');
        toast({
          title: 'Location Unavailable',
          description: 'Could not determine your location. Please enter it manually.',
          variant: 'destructive',
        });
      } else if (error.code === error.TIMEOUT) {
        setGeoError('Location request timed out. Please try again or enter your address manually.');
        toast({
          title: 'Timeout',
          description: 'Location detection timed out. Please enter your address manually.',
          variant: 'destructive',
        });
      } else {
        setGeoError('An unknown error occurred while detecting location.');
      }
    } finally {
      setIsDetecting(false);
    }
  }, [setDeliveryLocation]);

  // Save manual address
  const saveManualAddress = useCallback(() => {
    const address = manualInput.trim();
    const label = manualLabel.trim() || address.split(',')[0]?.trim() || 'My Address';

    if (!address) {
      toast({
        title: 'Address Required',
        description: 'Please enter your delivery address.',
        variant: 'destructive',
      });
      return;
    }

    if (address.length < 5) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a more detailed address (at least 5 characters).',
        variant: 'destructive',
      });
      return;
    }

    const locationData: LocationData = {
      label: label.substring(0, 25),
      address,
    };

    setDeliveryLocation(locationData);
    saveRecentLocation(locationData);
    setRecentLocations(getRecentLocations());
    setManualInput('');
    setManualLabel('');
    setShowManualForm(false);
    setIsOpen(false);

    toast({
      title: 'Address Updated',
      description: `Delivering to ${label}`,
    });
  }, [manualInput, manualLabel, setDeliveryLocation]);

  // Select from recent or popular locations
  const selectLocation = useCallback((location: LocationData) => {
    setDeliveryLocation(location);
    saveRecentLocation(location);
    setRecentLocations(getRecentLocations());
    setIsOpen(false);
    setGeoError(null);
    setShowManualForm(false);

    toast({
      title: 'Location Updated',
      description: `Delivering to ${location.label}`,
    });
  }, [setDeliveryLocation]);

  const isCompact = variant === 'mobile';

  return (
    <div className="relative" ref={containerRef}>
      {/* Location trigger button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowManualForm(false);
          setGeoError(null);
        }}
        className={`flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10 transition-all duration-200 hover:bg-white/20 hover:border-white/20 group ${
          isCompact ? 'px-2.5 py-1.5' : 'px-3 py-2'
        } ${isOpen ? 'bg-white/20 border-white/25 ring-2 ring-white/20' : ''}`}
        title="Select delivery location"
      >
        <MapPin
          className={`text-emerald-200 shrink-0 transition-transform duration-200 ${isCompact ? 'size-3' : 'size-3.5'} group-hover:scale-110`}
        />
        <span
          className={`font-medium text-white/90 truncate max-w-[120px] sm:max-w-[160px] ${
            isCompact ? 'text-[11px]' : 'text-xs'
          }`}
        >
          {deliveryLocation.label}
        </span>
        <svg
          className={`size-2.5 text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className={`absolute z-50 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
            variant === 'mobile'
              ? 'left-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80'
              : 'left-1/2 -translate-x-1/2 top-full mt-2.5 w-80'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100/80">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Choose delivery location</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Select a location for delivery</p>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowManualForm(false);
                }}
                className="p-1.5 rounded-lg hover:bg-white/80 transition-colors"
              >
                <X className="size-3.5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Detect location button */}
          <div className="px-4 pt-3 pb-2">
            <button
              onClick={detectLocation}
              disabled={isDetecting}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 border-dashed border-green-200 bg-green-50/50 hover:bg-green-50 hover:border-green-300 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center size-8 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                {isDetecting ? (
                  <Loader2 className="size-4 text-green-600 animate-spin" />
                ) : (
                  <Crosshair className="size-4 text-green-600" />
                )}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-semibold text-gray-800">
                  {isDetecting ? 'Detecting location...' : 'Use current location'}
                </p>
                <p className="text-[11px] text-gray-500">
                  {isDetecting
                    ? 'Getting your GPS coordinates...'
                    : 'Allow browser to detect your location'}
                </p>
              </div>
              <Navigation className="size-4 text-green-400 shrink-0" />
            </button>
          </div>

          {/* Geolocation error */}
          {geoError && (
            <div className="mx-4 mb-2">
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80">
                <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-700">{geoError}</p>
                  <button
                    onClick={() => {
                      setShowManualForm(true);
                      setGeoError(null);
                    }}
                    className="text-[11px] text-amber-600 hover:text-amber-800 underline underline-offset-2 mt-1 transition-colors"
                  >
                    Enter address manually
                  </button>
                </div>
                <button
                  onClick={() => setGeoError(null)}
                  className="p-0.5 hover:bg-amber-100 rounded transition-colors"
                >
                  <X className="size-3 text-amber-400" />
                </button>
              </div>
            </div>
          )}

          {/* Manual address form */}
          {showManualForm ? (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setShowManualForm(false)}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <svg
                    className="size-3.5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <p className="text-sm font-semibold text-gray-700">Enter delivery address</p>
              </div>

              <div className="space-y-2.5">
                <Input
                  ref={inputRef}
                  value={manualLabel}
                  onChange={(e) => setManualLabel(e.target.value)}
                  placeholder="Label (e.g., Home, Office)"
                  className="h-9 text-sm rounded-lg border-gray-200 focus-visible:ring-green-400/50 focus-visible:border-green-300"
                  maxLength={25}
                />
                <textarea
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Full address (e.g., House 123, Main Road, BiharSharif, Bihar, 803101)"
                  className="w-full min-h-[70px] px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-300 placeholder:text-gray-400 transition-all"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      saveManualAddress();
                    }
                  }}
                />
                <Button
                  onClick={saveManualAddress}
                  className="w-full h-9 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Check className="size-3.5 mr-1.5" />
                  Save Address
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Divider with "or" */}
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">or select</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Popular locations */}
              <div className="px-4 pb-2">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Popular Locations
                </p>
                <div className="space-y-1">
                  {POPULAR_LOCATIONS.map((loc) => {
                    const isSelected = deliveryLocation.address === loc.address;
                    return (
                      <button
                        key={loc.address}
                        onClick={() => selectLocation(loc)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                          isSelected
                            ? 'bg-green-50 border border-green-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div
                          className={`flex items-center justify-center size-7 rounded-lg shrink-0 ${
                            isSelected ? 'bg-green-100' : 'bg-gray-100'
                          }`}
                        >
                          <MapPin
                            className={`size-3.5 ${isSelected ? 'text-green-600' : 'text-gray-400'}`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isSelected ? 'text-green-700' : 'text-gray-700'
                            }`}
                          >
                            {loc.label}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">{loc.address}</p>
                        </div>
                        {isSelected && (
                          <Check className="size-4 text-green-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent locations */}
              {recentLocations.length > 0 && (
                <div className="px-4 pb-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Recent Locations
                  </p>
                  <div className="space-y-1">
                    {recentLocations.map((loc) => {
                      const isSelected = deliveryLocation.address === loc.address;
                      return (
                        <button
                          key={loc.address}
                          onClick={() => selectLocation(loc)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 ${
                            isSelected
                              ? 'bg-green-50 border border-green-200'
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <div
                            className={`flex items-center justify-center size-7 rounded-lg shrink-0 ${
                              isSelected ? 'bg-green-100' : 'bg-gray-100'
                            }`}
                          >
                            <Clock
                              className={`size-3.5 ${isSelected ? 'text-green-600' : 'text-gray-400'}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isSelected ? 'text-green-700' : 'text-gray-700'
                              }`}
                            >
                              {loc.label}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">{loc.address}</p>
                          </div>
                          {isSelected && (
                            <Check className="size-4 text-green-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Enter address manually link */}
              <div className="px-4 pb-3">
                <button
                  onClick={() => {
                    setShowManualForm(true);
                    setGeoError(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Enter address manually
                </button>
              </div>
            </>
          )}

          {/* Current selection footer */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin className="size-3 text-green-500" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-gray-500">Delivering to</p>
                <p className="text-xs font-semibold text-gray-700 truncate">{deliveryLocation.address}</p>
              </div>
              {deliveryLocation.detectedAt && (
                <span className="text-[10px] text-gray-400 shrink-0">
                  {deliveryLocation.lat ? '📍' : '📝'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
