'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { HomeIcon, Users, LayoutDashboard, LogOut, Maximize2, Minimize2, HelpingHand } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ThemeChange } from './theme/theme-change'
import { useDeviceCode } from '@/hooks/device/use-device-code'
import { useState } from 'react'

export function Header() {
    const pathname = usePathname()
    const { deviceCode, clearDeviceCode } = useDeviceCode()
    const [isFullscreen, setIsFullscreen] = useState(false)

    const navItems = [
        ...(deviceCode
            ? [
                {
                    name: 'Dashboard',
                    path: '/dashboard',
                    icon: <LayoutDashboard className='w-4 h-4' />,
                },
            ]
            : [
                {
                    name: 'Home',
                    path: '/',
                    icon: <HomeIcon className='w-4 h-4' />,
                },
            ]),
        {
            name: 'Contaminants',
            path: '/contaminants',
            icon: <HelpingHand className='w-4 h-4' />,
        },
        {
            name: 'About',
            path: '/about',
            icon: <Users className='w-4 h-4' />,
        },
    ]

    const handleLogout = () => {
        clearDeviceCode()
        toast.success('Successfully logged out')
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`)
            })
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    return (
        <header className='flex justify-between items-center px-6 py-4 shadow-md sticky top-0 z-10 bg-background'>
            <div className='inline-flex items-center rounded-lg bg-muted p-1.5 gap-2'>
                {navItems.map((item) => (
                    <div key={item.path} className='relative'>
                        <Button
                            variant={'ghost'}
                            asChild
                            className='relative px-4 sm:px-8 py-2.5 flex items-center gap-2 transition-all duration-300'
                        >
                            <Link href={item.path}>
                                <span className='relative z-20 flex items-center gap-3'>
                                    {item.icon}
                                    <span className='hidden sm:inline'>{item.name}</span>
                                </span>
                            </Link>
                        </Button>
                        {pathname === item.path && (
                            <motion.div
                                layoutId='active-pill'
                                className='absolute inset-0 bg-background rounded-md'
                                style={{ zIndex: 10 }}
                                transition={{
                                    type: 'spring',
                                    bounce: 0.3,
                                    duration: 0.6,
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className='flex items-center gap-2'>
                {/* Fullscreen toggle button */}
                <Button
                    variant='ghost'
                    size='icon'
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                >
                    {isFullscreen ? (
                        <Minimize2 className='h-4 w-4' />
                    ) : (
                        <Maximize2 className='h-4 w-4' />
                    )}
                </Button>

                {deviceCode && (
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={handleLogout}
                        aria-label='Logout'
                    >
                        <LogOut className='h-4 w-4' />
                    </Button>
                )}
                <ThemeChange />
            </div>
        </header>
    )
}
