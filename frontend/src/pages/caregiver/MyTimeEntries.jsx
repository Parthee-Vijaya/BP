import { useState, useEffect } from 'react';
import { timeEntriesApi } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatHours } from '../../utils/helpers';

// Icons
const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default function MyTimeEntries({ caregiverId = 1 }) {
    const [entries, setEntries] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEntries();
    }, [activeTab, caregiverId]);

    async function loadEntries() {
        setLoading(true);
        try {
            const data = await timeEntriesApi.getAll({
                caregiver_id: caregiverId,
                status: activeTab
            });
            setEntries(data);
        } catch (error) {
            console.error('Fejl ved indlæsning:', error);
        } finally {
            setLoading(false);
        }
    }

    const tabs = [
        { id: 'pending', label: 'Afventer', icon: <ClockIcon /> },
        { id: 'approved', label: 'Godkendt', icon: <CheckIcon /> },
        { id: 'rejected', label: 'Afvist', icon: <XIcon /> }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Mine Registreringer</h2>
                <p className="text-gray-500 mt-1">Se status på dine indberettede timer</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'border-[#B54A32] text-[#B54A32] bg-[#B54A32]/5'
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                        >
                            <span className={activeTab === tab.id ? 'text-[#B54A32]' : 'text-gray-400'}>
                                {tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Indlæser...</div>
                ) : entries.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Ingen registreringer i denne kategori
                    </div>
                ) : (
                    <div className="divide-y">
                        {entries.map((entry) => (
                            <div key={entry.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="font-medium">
                                            {entry.child_first_name} {entry.child_last_name}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            {formatDate(entry.date)} • {entry.start_time} - {entry.end_time}
                                        </div>
                                        {entry.comment && (
                                            <div className="text-sm text-gray-500 mt-1 italic">
                                                "{entry.comment}"
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <StatusBadge status={entry.status} />
                                        <div className="text-lg font-bold mt-2">
                                            {formatHours(entry.total_hours)} timer
                                        </div>
                                    </div>
                                </div>

                                {/* Timer breakdown */}
                                <div className="mt-3 flex gap-4 text-xs text-gray-500">
                                    {entry.normal_hours > 0 && (
                                        <span>Normal: {formatHours(entry.normal_hours)}</span>
                                    )}
                                    {entry.evening_hours > 0 && (
                                        <span>Aften: {formatHours(entry.evening_hours)}</span>
                                    )}
                                    {entry.night_hours > 0 && (
                                        <span>Nat: {formatHours(entry.night_hours)}</span>
                                    )}
                                    {entry.saturday_hours > 0 && (
                                        <span>Lørdag: {formatHours(entry.saturday_hours)}</span>
                                    )}
                                    {entry.sunday_holiday_hours > 0 && (
                                        <span>Søn/Hellig: {formatHours(entry.sunday_holiday_hours)}</span>
                                    )}
                                </div>

                                {/* Rejection reason */}
                                {entry.status === 'rejected' && entry.rejection_reason && (
                                    <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                                        <div className="text-sm font-medium text-red-700">Årsag til afvisning:</div>
                                        <div className="text-sm text-red-600">{entry.rejection_reason}</div>
                                        <div className="text-xs text-red-500 mt-1">
                                            Afvist af {entry.reviewed_by} • {formatDate(entry.reviewed_at)}
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500">
                                            Bemærk: Afviste registreringer kan ikke rettes. Opret en ny registrering i stedet.
                                        </div>
                                    </div>
                                )}

                                {/* Approved info */}
                                {entry.status === 'approved' && (
                                    <div className="mt-3 text-xs text-green-600">
                                        Godkendt af {entry.reviewed_by} • {formatDate(entry.reviewed_at)}
                                        {entry.payroll_registered && (
                                            <span className="ml-2">• Registreret i lønsystem</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
