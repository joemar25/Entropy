'use client'
import { Button } from '@/components/ui/button'

type IntervalOption = {
    value: number
    label: string
}

const DEFAULT_INTERVAL_OPTIONS: IntervalOption[] = [
    { value: 30000, label: '30s' },
    { value: 60000, label: '1m' },
]

export const IntervalSelector = ({
    updateInterval,
    onChange,
    options = DEFAULT_INTERVAL_OPTIONS,
    disabled = false
}: {
    updateInterval: number
    onChange: (interval: number) => void
    options?: IntervalOption[]
    disabled?: boolean
}) => (
    <div className="flex items-center gap-2">
        <span className="text-sm">Update interval:</span>
        <div className="flex gap-1">
            {options.map((option) => (
                <Button
                    key={option.value}
                    variant={updateInterval === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => onChange(option.value)}
                    disabled={disabled}
                >
                    {option.label}
                </Button>
            ))}
        </div>
    </div>
)