// src/hooks/device/use-device-data.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDeviceCode } from './use-device-code';
import { toast } from 'sonner';
import type { DeviceData } from '@/types/device';

// Debounce utility with proper typing
function debounce<T extends (...args: Parameters<T>) => void>(func: T, wait: number) {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export const useDeviceData = () => {
    const { deviceCode, isAuthenticated } = useDeviceCode();
    const [data, setData] = useState<DeviceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [timeFilter, setTimeFilter] = useState('10');
    const latestDataRef = useRef<DeviceData | null>(null); // Track latest data for comparison

    // Core fetch logic
    const fetchDataImpl = useCallback(async () => {
        if (!deviceCode || !isAuthenticated) {
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `/api/device/readings?deviceCode=${deviceCode}&timeFilter=${timeFilter}`,
                {
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch device data');
            }

            const deviceData: DeviceData = await response.json();

            // Validate data
            if (!deviceData.temperature || !deviceData.humidity || !deviceData.timestamp) {
                throw new Error('Invalid data format received');
            }

            // Compare key metrics with a threshold
            const hasSignificantChange = (newData: DeviceData, oldData: DeviceData | null) => {
                if (!oldData) return true;
                const thresholds = {
                    temperature: 0.5, // °C
                    humidity: 2, // %
                    pm25: 1, // µg/m³
                };
                const latestNew = {
                    temperature: newData.temperature[newData.temperature.length - 1],
                    humidity: newData.humidity[newData.humidity.length - 1],
                    pm25: newData.pm25[newData.pm25.length - 1],
                };
                const latestOld = {
                    temperature: oldData.temperature[oldData.temperature.length - 1],
                    humidity: oldData.humidity[oldData.humidity.length - 1],
                    pm25: oldData.pm25[oldData.pm25.length - 1],
                };
                return (
                    Math.abs(latestNew.temperature - latestOld.temperature) > thresholds.temperature ||
                    Math.abs(latestNew.humidity - latestOld.humidity) > thresholds.humidity ||
                    Math.abs(latestNew.pm25 - latestOld.pm25) > thresholds.pm25
                );
            };

            // Only update if data has changed significantly
            if (hasSignificantChange(deviceData, latestDataRef.current)) {
                setData(deviceData);
                latestDataRef.current = deviceData;
                setLastUpdated(new Date());
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching device data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch device data');
            toast.error('Failed to fetch device data');
        } finally {
            setIsLoading(false);
        }
    }, [deviceCode, isAuthenticated, timeFilter]);

    // Debounced fetch function
    const debouncedFetchData = useRef(debounce(fetchDataImpl, 1000)).current;

    useEffect(() => {
        if (!isAuthenticated || !deviceCode) {
            setIsLoading(false);
            return;
        }

        // Initial fetch
        debouncedFetchData();

        // Polling for real-time updates
        const interval = setInterval(() => debouncedFetchData(), 5000); // 5 seconds to match backend

        // Placeholder for future WebSocket/SSE
        const ws: WebSocket | null = process.env.NEXT_PUBLIC_WS_ENDPOINT
            ? new WebSocket(`${process.env.NEXT_PUBLIC_WS_ENDPOINT}?deviceCode=${deviceCode}`)
            : null;

        if (ws) {
            ws.onmessage = (event) => {
                const newData = JSON.parse(event.data) as DeviceData;
                setData(newData);
                latestDataRef.current = newData;
                setLastUpdated(new Date());
                setError(null);
            };
            ws.onerror = () => {
                setError('WebSocket connection failed');
                toast.error('Real-time updates unavailable');
            };
        }

        return () => {
            clearInterval(interval);
            if (ws) {
                ws.close();
            }
        };
    }, [deviceCode, isAuthenticated, debouncedFetchData]);

    const refreshData = useCallback(() => {
        setIsLoading(true);
        debouncedFetchData();
    }, [debouncedFetchData]);

    const updateTimeFilter = useCallback((newFilter: string) => {
        setTimeFilter(newFilter);
        setIsLoading(true);
    }, []);

    return {
        data,
        isLoading,
        error,
        lastUpdated,
        refreshData,
        timeFilter,
        updateTimeFilter,
    };
};