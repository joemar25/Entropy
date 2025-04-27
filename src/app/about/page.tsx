import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function About() {
    const teamMembers = [
        {
            name: 'Richard David Balbin Jr.',
            role: 'BS Chemistry - Bicol University',
            description: 'Leads the team in the development of our IoT devices and data collection systems.'
        },
        {
            name: 'John Francis Baleda',
            role: 'BS Chemical Engineering - Bicol University',
            description: 'Researcher and helper in the development of our IoT devices and data collection systems.'
        },
        {
            name: 'Joemar Cardiño',
            role: 'BS Computer Science - Bicol University',
            description: 'Leads the development of our web platform and data visualization.'
        },
        {
            name: 'Leemed Mier',
            role: 'BS Computer Engineering - Bicol University',
            description: 'Specializes in sensor integration and creating our IoT devices.'
        }
    ]

    return (
        <div className='space-y-6 p-4'>

            {/* Logo and App Name */}
            <div className='flex flex-col items-center space-y-2 mb-4'>
                <Image src='/logo.svg' alt='AIRQuant Logo' width={80} height={80} />
                <h1 className='text-2xl font-bold'>AIRQuant</h1>
                <p className='text-sm text-muted-foreground'>By Team Entropy</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>About AIRQuant</CardTitle>
                    <CardDescription>Transforming air quality data into actionable insights</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div>
                        <h3 className='text-lg font-semibold mb-2'>Our Journey</h3>
                        <p className='text-muted-foreground'>
                            Founded in 2023 by Team Entropy, AIRQuant is an IoT platform designed to revolutionize air quality monitoring and data visualization.
                            Our mission is to make environmental data simple, accessible, and useful to everyone.
                        </p>
                    </div>

                    <div>
                        <h3 className='text-lg font-semibold mb-2'>Technology Stack</h3>
                        <div className='flex flex-wrap gap-2'>
                            <Badge variant={'secondary'}>Next.js</Badge>
                            <Badge variant={'secondary'}>IoT Sensors</Badge>
                            <Badge variant={'secondary'}>Real-time Data</Badge>
                            <Badge variant={'secondary'}>Data Visualization</Badge>
                            <Badge variant={'secondary'}>Machine Learning</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Our Team</CardTitle>
                    <CardDescription>Meet the minds behind AIRQuant</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                        {teamMembers.map((member, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <CardTitle className='text-lg'>{member.name}</CardTitle>
                                    <Badge variant={'outline'}>{member.role}</Badge>
                                </CardHeader>
                                <CardContent>
                                    <p className='text-sm text-muted-foreground'>
                                        {member.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Our Mission</CardTitle>
                    <CardDescription>Making IoT accessible and valuable</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <p className='text-muted-foreground'>
                        We strive to bridge the gap between complex IoT data and meaningful insights.
                        Our platform enables users to:
                    </p>
                    <ul className='list-disc list-inside space-y-2 text-muted-foreground'>
                        <li>Monitor real-time sensor data</li>
                        <li>Analyze trends and patterns</li>
                        <li>Make data-driven decisions</li>
                        <li>Receive automated alerts and notifications</li>
                    </ul>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Competition and Advisor</CardTitle>
                    <CardDescription>Guidance and support</CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                    <div>
                        <span className='font-semibold'>Competition:</span> Nickel Asia Corporation (NAC) Innovation Challenge
                    </div>
                    <div>
                        <span className='font-semibold'>Project Advisor:</span> Ma&apos;am Grace
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
