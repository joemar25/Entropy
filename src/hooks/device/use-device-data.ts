'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDeviceCode } from './use-device-code';
import { toast } from 'sonner';
import type { DeviceData } from '@/types/device';
import { debounce } from 'lodash';

export const useDeviceData = () => {
    const { deviceCode, isAuthenticated } = useDeviceCode();
    const [data, setData] = useState<DeviceData | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [timeFilter, setTimeFilter] = useState('10');
    const latestDataRef = useRef<DeviceData | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const fetchDataImpl = useCallback(async () => {
        if (!deviceCode || !isAuthenticated) {
            setIsInitialLoading(false);
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

            if (!deviceData.temperature || !deviceData.humidity || !deviceData.timestamp) {
                throw new Error('Invalid data format received');
            }

            const hasSignificantChange = (newData: DeviceData, oldData: DeviceData | null) => {
                if (!oldData) return true;
                const thresholds = {
                    temperature: 0.5,
                    humidity: 2,
                    pm25: 1,
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
            setIsInitialLoading(false);
        }
    }, [deviceCode, isAuthenticated, timeFilter]);

    // Recreate debounced function when fetchDataImpl changes
    const debouncedFetchData = useMemo(() => debounce(fetchDataImpl, 500), [fetchDataImpl]);

    const connectWebSocket = useCallback(() => {
        if (!process.env.NEXT_PUBLIC_WS_ENDPOINT || !deviceCode || !isAuthenticated) {
            return;
        }

        wsRef.current = new WebSocket(`${process.env.NEXT_PUBLIC_WS_ENDPOINT}?deviceCode=${deviceCode}`);

        wsRef.current.onopen = () => {
            reconnectAttempts.current = 0;
            setError(null);
        };

        wsRef.current.onmessage = (event) => {
            const newData = JSON.parse(event.data) as DeviceData;
            if (
                newData.temperature &&
                newData.humidity &&
                newData.timestamp &&
                latestDataRef.current
            ) {
                const mergedData: DeviceData = {
                    ...latestDataRef.current,
                    temperature: [
                        ...latestDataRef.current.temperature,
                        ...newData.temperature,
                    ].slice(-100),
                    humidity: [
                        ...latestDataRef.current.humidity,
                        ...newData.humidity,
                    ].slice(-100),
                    pm25: [...latestDataRef.current.pm25, ...newData.pm25].slice(-100),
                    voc: [...latestDataRef.current.voc, ...newData.voc].slice(-100),
                    o3: [...latestDataRef.current.o3, ...newData.o3].slice(-100),
                    co: [...latestDataRef.current.co, ...newData.co].slice(-100),
                    co2: [...latestDataRef.current.co2, ...newData.co2].slice(-100),
                    no2: [...latestDataRef.current.no2, ...newData.no2].slice(-100),
                    so2: [...latestDataRef.current.so2, ...newData.so2].slice(-100),
                    timestamp: [
                        ...latestDataRef.current.timestamp,
                        ...newData.timestamp,
                    ].slice(-100),
                };
                setData(mergedData);
                latestDataRef.current = mergedData;
                setLastUpdated(new Date());
                setError(null);
            }
        };

        wsRef.current.onerror = () => {
            setError('WebSocket connection failed');
            toast.error('Real-time updates unavailable');
        };

        wsRef.current.onclose = () => {
            if (reconnectAttempts.current < maxReconnectAttempts) {
                setTimeout(() => {
                    reconnectAttempts.current += 1;
                    connectWebSocket();
                }, 1000 * Math.pow(2, reconnectAttempts.current));
            } else {
                setError('Max WebSocket reconnection attempts reached');
                toast.error('Real-time updates disabled');
            }
        };
    }, [deviceCode, isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated || !deviceCode) {
            setIsInitialLoading(false);
            return;
        }

        debouncedFetchData();
        const interval = setInterval(debouncedFetchData, 5000);

        connectWebSocket();

        return () => {
            clearInterval(interval);
            debouncedFetchData.cancel(); // Cancel any pending debounced calls
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [deviceCode, isAuthenticated, debouncedFetchData, connectWebSocket]);

    useEffect(() => {
        // Fetch data immediately when timeFilter changes
        debouncedFetchData();
    }, [timeFilter, debouncedFetchData]);

    const refreshData = useCallback(() => {
        debouncedFetchData();
    }, [debouncedFetchData]);

    const updateTimeFilter = useCallback((newFilter: string) => {
        setTimeFilter(newFilter);
    }, []);

    return {
        data,
        isInitialLoading,
        error,
        lastUpdated,
        refreshData,
        timeFilter,
        updateTimeFilter,
    };
};