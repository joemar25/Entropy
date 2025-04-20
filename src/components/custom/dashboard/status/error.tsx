import { Button } from '@/components/ui/button'

export const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2 text-destructive">
            <p>Error loading dashboard data</p>
            <Button onClick={onRetry} variant="outline">
                Try Again
            </Button>
        </div>
    </div>
)