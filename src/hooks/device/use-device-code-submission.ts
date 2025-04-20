'use client'

import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDeviceCode } from './use-device-code'

export const useDeviceCodeSubmission = () => {
    const [deviceCode, setDeviceCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { setDeviceCode: setStoredDeviceCode } = useDeviceCode()

    // Check if device code exists on mount
    useEffect(() => {
        const savedDeviceCode = localStorage.getItem('deviceCode') // Or use another storage method if necessary
        if (savedDeviceCode) {
            setDeviceCode(savedDeviceCode)
            router.push('/dashboard') // Automatically redirect if device code exists
        }
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!deviceCode.trim()) {
            toast.error('Please enter a device code')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/device/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ deviceCode: deviceCode.trim() }),
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setStoredDeviceCode(deviceCode.trim())
                localStorage.setItem('deviceCode', deviceCode.trim()) // Store device code in local storage
                toast.success('Device code accepted')
                router.push('/dashboard')
            } else {
                // Handle 401 and other errors
                const errorMessage = response.status === 401
                    ? 'Invalid device code'
                    : data.message || 'Failed to verify device code'
                toast.error(errorMessage)
                setStoredDeviceCode(null)
                localStorage.removeItem('deviceCode') // Clear local storage on failure
            }
        } catch (error) {
            console.error('Error submitting device code:', error)
            toast.error('Failed to verify device code')
            setStoredDeviceCode(null)
            localStorage.removeItem('deviceCode') // Clear local storage on error
        } finally {
            setIsLoading(false)
        }
    }

    return {
        deviceCode,
        setDeviceCode,
        isLoading,
        handleSubmit,
    }
}
