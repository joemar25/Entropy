import { RefreshCw } from 'lucide-react'

export const LoadingState = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <p>Loading dashboard...</p>
        </div>
    </div>
)