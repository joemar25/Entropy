'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDeviceCode } from '@/hooks/device/use-device-code'
import HomeContent from '@/components/custom/home/home-content'

export default function Home() {
  const router = useRouter()
  const { deviceCode, isAuthenticated } = useDeviceCode()

  useEffect(() => {
    // Only redirect if there's a valid device code and authenticated
    if (deviceCode && isAuthenticated) {
      router.replace('/dashboard')
    }
  }, [deviceCode, isAuthenticated, router])

  // Always render the HomeContent
  // This avoids the infinite loading issue
  return <HomeContent />
}