'use client'

import Image from 'next/image'

export const Footer = () => {
    return (
        <footer className='border-t mt-8 py-6 px-4 flex flex-col items-center justify-center text-sm text-muted-foreground'>
            <div className='flex items-center space-x-2'>
                <span>Built by Team Entropy —</span>
                <span className='font-semibold text-foreground'>AIRQuant</span>
            </div>
            <Image src='/logo.svg' alt='AIRQuant Logo' width={100} height={100} className='mt-2' />
        </footer>
    )
}
