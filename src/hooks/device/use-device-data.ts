'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDeviceCode } from './use-device-code'
import { toast } from 'sonner'
import type { DeviceData } from '@/types/device'

export const useDeviceData = () => {
    const { deviceCode, isAuthenticated } = useDeviceCode()
    const [data, setData] = useState<DeviceData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [timeFilter, setTimeFilter] = useState('all') // Default to 'all' to show all metrics initially

    const fetchData = useCallback(async () => {
        if (!deviceCode || !isAuthenticated) {
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`/api/device/readings?deviceCode=${deviceCode}&timeFilter=${timeFilter}`, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                },
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to fetch device data')
            }

            const deviceData = await response.json()

            // Basic validation
            if (!deviceData.temperature || !deviceData.humidity || !deviceData.timestamp) {
                throw new Error('Invalid data format received')
            }

            setData(deviceData)
            setLastUpdated(new Date())
            setError(null)
        } catch (err) {
            console.error('Error fetching device data:', err)
            setError(err instanceof Error ? err.message : 'Failed to fetch device data')
            toast.error('Failed to fetch device data')
        } finally {
            setIsLoading(false)
        }
    }, [deviceCode, isAuthenticated, timeFilter])

    useEffect(() => {
        if (!isAuthenticated || !deviceCode) {
            setIsLoading(false)
            return
        }

        fetchData()

        // Set up polling for real-time updates
        const interval = setInterval(fetchData, 30000) // Fetch every 30 seconds

        return () => clearInterval(interval)
    }, [deviceCode, isAuthenticated, fetchData])

    const refreshData = useCallback(() => {
        setIsLoading(true)
        fetchData()
    }, [fetchData])

    const updateTimeFilter = useCallback((newFilter: string) => {
        setTimeFilter(newFilter)
        setIsLoading(true)
        // The fetchData will be called automatically due to the dependency on timeFilter
    }, [])

    return {
        data,
        isLoading,
        error,
        lastUpdated,
        refreshData,
        timeFilter,
        updateTimeFilter,
    }
}