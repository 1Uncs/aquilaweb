import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

export type DeviceCoordinates = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp?: number;
};

export function useDeviceLocation(fallbackCoords?: { latitude: number; longitude: number }) {
  const [coordinates, setCoordinates] = useState<DeviceCoordinates | null>(
    fallbackCoords ? { latitude: fallbackCoords.latitude, longitude: fallbackCoords.longitude } : null
  );
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const requestedRef = useRef(false);

  const fetchCoordinates = useCallback(async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === Location.PermissionStatus.GRANTED;
      setPermissionGranted(granted);

      if (granted) {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setCoordinates({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          timestamp: loc.timestamp,
        });
        return {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
      } else if (fallbackCoords) {
        setCoordinates({
          latitude: fallbackCoords.latitude,
          longitude: fallbackCoords.longitude,
        });
        return fallbackCoords;
      }
    } catch (e) {
      if (__DEV__) console.warn('[location] getCurrentPosition failed, using fallback', e);
      if (fallbackCoords) {
        setCoordinates({
          latitude: fallbackCoords.latitude,
          longitude: fallbackCoords.longitude,
        });
        return fallbackCoords;
      }
    } finally {
      setLoading(false);
    }
    return null;
  }, [fallbackCoords]);

  useEffect(() => {
    if (!requestedRef.current) {
      requestedRef.current = true;
      fetchCoordinates().catch(() => {});
    }
  }, [fetchCoordinates]);

  return {
    coordinates,
    loading,
    permissionGranted,
    refreshLocation: fetchCoordinates,
  };
}
