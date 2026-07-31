// Map and Geolocation Utilities

export interface Location {
  latitude: number;
  longitude: number;
}

export interface GeoError {
  code: number;
  message: string;
}

/**
 * Request user's current location using Geolocation API
 */
export async function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let message = 'Failed to get location';
        
        if (error.code === 1) {
          message = 'Location permission denied. Please enable location access in your browser settings.';
        } else if (error.code === 2) {
          message = 'Location information is unavailable';
        } else if (error.code === 3) {
          message = 'Location request timed out';
        }

        reject({
          code: error.code,
          message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calculate distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

/**
 * Format distance with direction/location
 */
export function formatLocationDistance(distanceKm: number, locationName: string): string {
  return `${formatDistance(distanceKm)} away in ${locationName}`;
}

/**
 * Get map bounds for a list of coordinates
 */
export function getBounds(
  coordinates: Array<{ latitude: number; longitude: number }>
) {
  if (coordinates.length === 0) {
    return null;
  }

  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;

  for (const coord of coordinates) {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  }

  return {
    northeast: { lat: maxLat, lng: maxLng },
    southwest: { lat: minLat, lng: minLng },
  };
}

/**
 * Store user's last known location in localStorage
 */
export function saveUserLocation(location: Location): void {
  try {
    localStorage.setItem(
      'meetmap_last_location',
      JSON.stringify({
        ...location,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Failed to save location:', error);
  }
}

/**
 * Get user's last known location from localStorage
 */
export function getSavedUserLocation(): Location | null {
  try {
    const saved = localStorage.getItem('meetmap_last_location');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };
    }
  } catch (error) {
    console.error('Failed to retrieve saved location:', error);
  }
  return null;
}

/**
 * Default location (can be used as fallback)
 */
export const DEFAULT_LOCATION: Location = {
  latitude: 40.7128, // New York City
  longitude: -74.006,
};

/**
 * Check if a location is within a given radius
 */
export function isWithinRadius(
  userLat: number,
  userLng: number,
  planLat: number,
  planLng: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(userLat, userLng, planLat, planLng);
  return distance <= radiusKm;
}

/**
 * Filter plans by radius from user
 */
export function filterPlansByRadius(
  plans: Array<{
    latitude: number;
    longitude: number;
    distance_km?: number;
    [key: string]: any;
  }>,
  userLat: number,
  userLng: number,
  radiusKm: number
) {
  return plans.filter((plan) => {
    const distance = plan.distance_km || calculateDistance(userLat, userLng, plan.latitude, plan.longitude);
    return distance <= radiusKm;
  });
}

/**
 * Sort plans by distance from user
 */
export function sortPlansByDistance(
  plans: Array<{
    latitude: number;
    longitude: number;
    distance_km?: number;
    [key: string]: any;
  }>,
  userLat: number,
  userLng: number
) {
  return [...plans].sort((a, b) => {
    const distA = a.distance_km || calculateDistance(userLat, userLng, a.latitude, a.longitude);
    const distB = b.distance_km || calculateDistance(userLat, userLng, b.latitude, b.longitude);
    return distA - distB;
  });
}

/**
 * Estimate travel time based on distance and transport mode
 */
export function estimateTravelTime(
  distanceKm: number,
  transportMode: 'walking' | 'cycling' | 'driving' = 'driving'
): string {
  const speeds = {
    walking: 5, // km/h
    cycling: 15, // km/h
    driving: 40, // km/h (average, accounting for traffic)
  };

  const speed = speeds[transportMode];
  const minutes = Math.round((distanceKm / speed) * 60);

  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
