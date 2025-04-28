'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ExplanationMap {
    [key: string]: {
        high: string;
        low?: string;
        description: string;
        thresholds: { low: string; high: string };
        mitigation: string[];
    };
}

const warningExplanations: ExplanationMap = {
    temperature: {
        high: 'High temperature can reduce comfort and stress sensitive individuals.',
        low: 'Low temperature can cause discomfort and increase respiratory issues.',
        description: 'Temperature measures ambient air temperature. Extremes affect comfort and health.',
        thresholds: { low: '22°C', high: '28°C' },
        mitigation: ['Use air conditioning for high temperatures.', 'Use heating for low temperatures.', 'Monitor sensitive populations.'],
    },
    humidity: {
        high: 'High humidity can promote mold and worsen respiratory conditions.',
        low: 'Low humidity can cause dry skin and respiratory discomfort.',
        description: 'Humidity measures moisture in the air. Improper levels cause health issues.',
        thresholds: { low: '40%', high: '60%' },
        mitigation: ['Use dehumidifiers for high humidity.', 'Use humidifiers for low humidity.', 'Ensure ventilation.'],
    },
    pm25: {
        high: 'High PM2.5 can harm lungs and cause respiratory issues.',
        description: 'PM2.5 is particulate matter smaller than 2.5 micrometers, harmful at high levels.',
        thresholds: { low: '0 µg/m³', high: '4 µg/m³' },
        mitigation: ['Use HEPA air purifiers.', 'Limit outdoor activities.', 'Wear N95 masks if needed.'],
    },
    voc: {
        high: 'High VOC levels may cause irritation and headaches.',
        description: 'Volatile Organic Compounds (VOCs) are emitted by solids or liquids.',
        thresholds: { low: '0 ppm', high: '0.05 ppm' },
        mitigation: ['Increase ventilation.', 'Use low-VOC products.', 'Install air purifiers.'],
    },
    o3: {
        high: 'High ozone can irritate the respiratory system.',
        description: 'Ozone (O3) is harmful at ground level in high concentrations.',
        thresholds: { low: '0 ppm', high: '0.3 ppm' },
        mitigation: ['Avoid outdoor activities.', 'Use air purifiers.', 'Monitor air quality.'],
    },
    co: {
        high: 'High carbon monoxide is dangerous, causing dizziness or worse.',
        description: 'Carbon Monoxide (CO) is a toxic, colorless, odorless gas.',
        thresholds: { low: '0 ppm', high: '8.73 ppm' },
        mitigation: ['Install CO detectors.', 'Ventilate immediately if high.', 'Avoid fuel-burning appliances indoors.'],
    },
    co2: {
        high: 'High CO2 can cause drowsiness and impair cognition.',
        description: 'Carbon Dioxide (CO2) affects indoor air quality at high levels.',
        thresholds: { low: '0 ppm', high: '500 ppm' },
        mitigation: ['Increase ventilation.', 'Monitor CO2 in crowded spaces.', 'Use plants.'],
    },
    no2: {
        high: 'High nitrogen dioxide can irritate airways and worsen asthma.',
        description: 'Nitrogen Dioxide (NO2) is a pollutant from combustion.',
        thresholds: { low: '0 ppm', high: '5 ppm' },
        mitigation: ['Improve ventilation.', 'Reduce combustion appliances.', 'Monitor near traffic areas.'],
    },
    so2: {
        high: 'High sulfur dioxide can irritate lungs and worsen heart/lung diseases.',
        description: 'Sulfur Dioxide (SO2) is a gas from industrial processes.',
        thresholds: { low: '0 ppm', high: '5 ppm' },
        mitigation: ['Improve ventilation.', 'Avoid industrial areas.', 'Use air purifiers.'],
    },
};

export default function ContaminantInfoPage() {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleExpand = (key: string) => {
        setExpanded(expanded === key ? null : key);
    };

    const filteredExplanations = Object.entries(warningExplanations).filter(([key, { description }]) =>
        key.toLowerCase().includes(searchTerm.toLowerCase()) || description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className='space-y-6 p-4'>
            <div className='flex flex-col items-center space-y-2 mb-4'>
                <Image src='/logo.svg' alt='AIRQuant Logo' width={80} height={80} />
                <h1 className='text-2xl font-bold'>AIRQuant</h1>
                <p className='text-sm text-muted-foreground'>By Team Entropy</p>
            </div>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto mb-6">
                <input
                    type="text"
                    placeholder="Search contaminants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 border rounded-md"
                />
            </div>

            {/* Contaminant List */}
            <div className="max-w-3xl mx-auto">
                <h1 className="text-2xl font-semibold mb-6">Contaminant Information</h1>
                <div className="space-y-4">
                    {filteredExplanations.length > 0 ? (
                        filteredExplanations.map(([key, { description, high, low, thresholds, mitigation }]) => (
                            <div key={key} className="border p-4 rounded-md">
                                <div
                                    className="flex justify-between cursor-pointer"
                                    onClick={() => toggleExpand(key)}
                                >
                                    <h2 className="text-lg font-medium">{key.toUpperCase()}</h2>
                                    <span>{expanded === key ? '▲' : '▼'}</span>
                                </div>
                                {expanded === key && (
                                    <div className="mt-4 space-y-4">
                                        <p className="text-sm">{description}</p>
                                        <div>
                                            <h3 className="text-sm font-semibold">Thresholds</h3>
                                            <ul className="text-sm list-disc pl-5">
                                                <li><strong>Low:</strong> {thresholds.low}</li>
                                                <li><strong>High:</strong> {thresholds.high}</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold">Warnings</h3>
                                            <p className="text-sm"><strong>High:</strong> {high}</p>
                                            {low && <p className="text-sm"><strong>Low:</strong> {low}</p>}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold">Mitigation Tips</h3>
                                            <ul className="text-sm list-disc pl-5">
                                                {mitigation.map((tip, index) => (
                                                    <li key={index}>{tip}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center">No contaminants found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}