import { useState, useEffect } from 'react';
import { timeEntriesApi, childrenApi, exportApi } from '../../utils/api';
import StatusBadge from '../../components/StatusBadge';
import GrantStatusBadge from '../../components/GrantStatusBadge';
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

const DownloadIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const CheckMarkIcon = () => (
    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

export default function ApprovalPage() {
    const [activeTab, setActiveTab] = useState('pending');
    const [entries, setEntries] = useState([]);
    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [rejectModal, setRejectModal] = useState({ open: false, entryId: null });
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab, selectedChild]);

    async function loadData() {
        setLoading(true);
        try {
            const params = { status: activeTab };
            if (selectedChild !== 'all') {
                params.child_id = selectedChild;
            }

            const [entriesData, childrenData] = await Promise.all([
                timeEntriesApi.getAll(params),
                childrenApi.getAll()
            ]);

            setEntries(entriesData);
            setChildren(childrenData);
        } catch (error) {
            console.error('Fejl ved indlæsning:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleApprove(id) {
        try {
            await timeEntriesApi.approve(id, 'Admin');
            loadData();
        } catch (error) {
            alert('Fejl ved godkendelse: ' + error.message);
        }
    }

    async function handleReject() {
        if (!rejectReason.trim()) {
            alert('Angiv venligst en årsag');
            return;
        }

        try {
            await timeEntriesApi.reject(rejectModal.entryId, 'Admin', rejectReason);
            setRejectModal({ open: false, entryId: null });
            setRejectReason('');
            loadData();
        } catch (error) {
            alert('Fejl ved afvisning: ' + error.message);
        }
    }

    async function handleBatchApprove() {
        if (selectedIds.length === 0) {
            alert('Vælg mindst én registrering');
            return;
        }

        try {
            await timeEntriesApi.batchApprove(selectedIds, 'Admin');
            setSelectedIds([]);
            loadData();
        } catch (error) {
            alert('Fejl ved batch-godkendelse: ' + error.message);
        }
    }

    async function handleMarkPayroll(id) {
        try {
            await timeEntriesApi.markPayroll(id);
            loadData();
        } catch (error) {
            alert('Fejl: ' + error.message);
        }
    }

    function toggleSelect(id) {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    }

    function toggleSelectAll() {
        if (selectedIds.length === entries.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(entries.map(e => e.id));
        }
    }

    const tabs = [
        { id: 'pending', label: 'Afventer godkendelse', icon: <ClockIcon /> },
        { id: 'approved', label: 'Godkendte', icon: <CheckIcon /> },
        { id: 'rejected', label: 'Afviste', icon: <XIcon /> }
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Godkendelse</h2>
                    <p className="text-gray-500 mt-1">Gennemgå og godkend timeregistreringer</p>
                </div>

                {/* Export button */}
                <a
                    href={exportApi.timeEntries({ status: activeTab })}
                    download
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                    <DownloadIcon />
                    Eksporter CSV
                </a>
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

                {/* Filters */}
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-4">
                    <label className="text-sm text-gray-600 flex items-center gap-2">
                        <span>Filtrer på barn:</span>
                        <select
                            value={selectedChild}
                            onChange={(e) => setSelectedChild(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                        >
                            <option value="all">Alle børn</option>
                            {children.map((child) => (
                                <option key={child.id} value={child.id}>
                                    {child.first_name} {child.last_name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {activeTab === 'pending' && entries.length > 0 && (
                        <button
                            onClick={handleBatchApprove}
                            disabled={selectedIds.length === 0}
                            className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                        >
                            <CheckMarkIcon />
                            Godkend valgte ({selectedIds.length})
                        </button>
                    )}
                </div>

                {/* Table */}
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B54A32] mx-auto"></div>
                        <p className="text-gray-500 mt-3">Indlæser...</p>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <CheckIcon />
                        </div>
                        <p className="text-gray-500">Ingen registreringer i denne kategori</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left text-sm text-gray-600">
                                <tr>
                                    {activeTab === 'pending' && (
                                        <th className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === entries.length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                    )}
                                    <th className="px-4 py-3">Barnepige</th>
                                    <th className="px-4 py-3">MA-nr.</th>
                                    <th className="px-4 py-3">Barn</th>
                                    <th className="px-4 py-3">Dato</th>
                                    <th className="px-4 py-3">Tid</th>
                                    <th className="px-4 py-3">Normal</th>
                                    <th className="px-4 py-3">Aften</th>
                                    <th className="px-4 py-3">Nat</th>
                                    <th className="px-4 py-3">Lør</th>
                                    <th className="px-4 py-3">Søn/Hel</th>
                                    <th className="px-4 py-3">Total</th>
                                    {activeTab === 'approved' && (
                                        <>
                                            <th className="px-4 py-3">Godkendt af</th>
                                            <th className="px-4 py-3">Lønsystem</th>
                                        </>
                                    )}
                                    {activeTab === 'rejected' && (
                                        <>
                                            <th className="px-4 py-3">Afvist af</th>
                                            <th className="px-4 py-3">Årsag</th>
                                        </>
                                    )}
                                    <th className="px-4 py-3">Handlinger</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        {activeTab === 'pending' && (
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(entry.id)}
                                                    onChange={() => toggleSelect(entry.id)}
                                                />
                                            </td>
                                        )}
                                        <td className="px-4 py-3 font-medium">
                                            {entry.caregiver_first_name} {entry.caregiver_last_name}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{entry.ma_number}</td>
                                        <td className="px-4 py-3">
                                            {entry.child_first_name} {entry.child_last_name}
                                        </td>
                                        <td className="px-4 py-3">{formatDate(entry.date)}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {entry.start_time} - {entry.end_time}
                                        </td>
                                        <td className="px-4 py-3">{formatHours(entry.normal_hours)}</td>
                                        <td className="px-4 py-3">{formatHours(entry.evening_hours)}</td>
                                        <td className="px-4 py-3">{formatHours(entry.night_hours)}</td>
                                        <td className="px-4 py-3">{formatHours(entry.saturday_hours)}</td>
                                        <td className="px-4 py-3">{formatHours(entry.sunday_holiday_hours)}</td>
                                        <td className="px-4 py-3 font-bold">{formatHours(entry.total_hours)}</td>
                                        {activeTab === 'approved' && (
                                            <>
                                                <td className="px-4 py-3 text-sm text-gray-600">{entry.reviewed_by}</td>
                                                <td className="px-4 py-3">
                                                    {entry.payroll_registered ? (
                                                        <span className="inline-flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full">
                                                            <CheckMarkIcon />
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleMarkPayroll(entry.id)}
                                                            className="text-[#B54A32] hover:text-[#9a3f2b] text-sm font-medium"
                                                        >
                                                            Marker
                                                        </button>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                        {activeTab === 'rejected' && (
                                            <>
                                                <td className="px-4 py-3 text-sm">{entry.reviewed_by}</td>
                                                <td className="px-4 py-3 text-sm text-red-600">
                                                    {entry.rejection_reason}
                                                </td>
                                            </>
                                        )}
                                        <td className="px-4 py-3">
                                            {activeTab === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleApprove(entry.id)}
                                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                                                    >
                                                        Godkend
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectModal({ open: true, entryId: entry.id })}
                                                        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
                                                    >
                                                        Afvis
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {rejectModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-rose-600">
                                <XIcon />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Afvis registrering</h3>
                        </div>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Angiv årsag til afvisning..."
                            className="w-full border border-gray-200 rounded-lg p-3 h-32 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleReject}
                                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium transition-colors"
                            >
                                Afvis
                            </button>
                            <button
                                onClick={() => {
                                    setRejectModal({ open: false, entryId: null });
                                    setRejectReason('');
                                }}
                                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                            >
                                Annuller
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
