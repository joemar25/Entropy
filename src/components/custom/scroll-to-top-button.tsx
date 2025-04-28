'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { Button } from '../ui/button'

export function ScrollToTopButton() {
    const [showButton, setShowButton] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowButton(true)
            } else {
                setShowButton(false)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (!showButton) return null

    return (
        <Button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
            aria-label="Scroll to top"
        >
            <ChevronUp className="h-6 w-6" />
        </Button>
    )
}
