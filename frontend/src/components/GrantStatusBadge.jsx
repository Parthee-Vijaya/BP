import { formatHours, calculateGrantPercentage, getGrantStatusColor } from '../utils/helpers';

// Warning icon SVG
const WarningIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

export default function GrantStatusBadge({ used, total, showBar = true }) {
    const percentage = calculateGrantPercentage(used, total);
    const color = getGrantStatusColor(percentage);

    const colorClasses = {
        green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        yellow: 'bg-amber-50 text-amber-700 border-amber-200',
        red: 'bg-rose-50 text-rose-700 border-rose-200'
    };

    const barColorClasses = {
        green: 'bg-emerald-500',
        yellow: 'bg-amber-500',
        red: 'bg-rose-500'
    };

    return (
        <div className="space-y-1.5">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${colorClasses[color]}`}>
                <span className="font-semibold">{formatHours(used)}</span>
                <span className="text-gray-400">/</span>
                <span>{formatHours(total)} timer</span>
                {percentage >= 100 && (
                    <span className="ml-1 text-rose-600">
                        <WarningIcon />
                    </span>
                )}
            </div>

            {showBar && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${barColorClasses[color]}`}
                        style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                </div>
            )}
        </div>
    );
}
