import { useState, useEffect } from 'react';
import { timeEntriesApi, childrenApi, caregiversApi, exportApi } from '../../utils/api';
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

const SearchIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export default function ApprovalPage() {
    const [activeTab, setActiveTab] = useState('pending');
    const [entries, setEntries] = useState([]);
    const [children, setChildren] = useState([]);
    const [caregivers, setCaregivers] = useState([]);
    const [selectedChild, setSelectedChild] = useState('all');
    const [selectedCaregiver, setSelectedCaregiver] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [rejectModal, setRejectModal] = useState({ open: false, entryId: null });
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab, selectedChild, selectedCaregiver]);

    async function loadData() {
        setLoading(true);
        try {
            const params = { status: activeTab };
            if (selectedChild !== 'all') {
                params.child_id = selectedChild;
            }
            if (selectedCaregiver !== 'all') {
                params.caregiver_id = selectedCaregiver;
            }

            const [entriesData, childrenData, caregiversData] = await Promise.all([
                timeEntriesApi.getAll(params),
                childrenApi.getAll(),
                caregiversApi.getAll()
            ]);

            setEntries(entriesData);
            setChildren(childrenData);
            setCaregivers(caregiversData);
        } catch (error) {
            console.error('Fejl ved indlæsning:', error);
        } finally {
            setLoading(false);
        }
    }

    // Filtrér entries baseret på søgning
    const filteredEntries = entries.filter(entry => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const caregiverName = `${entry.caregiver_first_name} ${entry.caregiver_last_name}`.toLowerCase();
        const maNumber = (entry.ma_number || '').toLowerCase();
        return caregiverName.includes(query) || maNumber.includes(query);
    });

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
        if (selectedIds.length === filteredEntries.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredEntries.map(e => e.id));
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
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-4">
                    {/* Søgefelt */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Søg barnepige (navn/MA-nr.)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                        />
                    </div>

                    <label className="text-sm text-gray-600 flex items-center gap-2">
                        <span>Barn:</span>
                        <select
                            value={selectedChild}
                            onChange={(e) => setSelectedChild(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                        >
                            <option value="all">Alle børn</option>
                            {children.map((child) => (
                                <option key={child.id} value={child.id}>
                                    {child.first_name} {child.last_name} {child.birth_date ? `(${formatDate(child.birth_date)})` : ''}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-sm text-gray-600 flex items-center gap-2">
                        <span>Barnepige:</span>
                        <select
                            value={selectedCaregiver}
                            onChange={(e) => setSelectedCaregiver(e.target.value)}
                            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                        >
                            <option value="all">Alle barnepiger</option>
                            {caregivers.map((cg) => (
                                <option key={cg.id} value={cg.id}>
                                    {cg.first_name} {cg.last_name} ({cg.ma_number})
                                </option>
                            ))}
                        </select>
                    </label>

                    {activeTab === 'pending' && filteredEntries.length > 0 && (
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
                ) : filteredEntries.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <CheckIcon />
                        </div>
                        <p className="text-gray-500">
                            {searchQuery ? 'Ingen resultater for søgningen' : 'Ingen registreringer i denne kategori'}
                        </p>
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
                                                checked={selectedIds.length === filteredEntries.length && filteredEntries.length > 0}
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
                                            <th className="px-4 py-3">Godkendt dato</th>
                                            <th className="px-4 py-3">Lønsystem</th>
                                            <th className="px-4 py-3">Sendt til løn</th>
                                        </>
                                    )}
                                    {activeTab === 'rejected' && (
                                        <>
                                            <th className="px-4 py-3">Afvist af</th>
                                            <th className="px-4 py-3">Afvist dato</th>
                                            <th className="px-4 py-3">Årsag</th>
                                        </>
                                    )}
                                    {activeTab === 'pending' && <th className="px-4 py-3">Handlinger</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredEntries.map((entry) => (
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
                                            <div>
                                                {entry.child_first_name} {entry.child_last_name}
                                                {entry.child_birth_date && (
                                                    <div className="text-xs text-gray-400">
                                                        f. {formatDate(entry.child_birth_date)}
                                                    </div>
                                                )}
                                            </div>
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
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {entry.reviewed_at ? formatDate(entry.reviewed_at) : '-'}
                                                </td>
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
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {entry.payroll_date ? formatDate(entry.payroll_date) : '-'}
                                                </td>
                                            </>
                                        )}
                                        {activeTab === 'rejected' && (
                                            <>
                                                <td className="px-4 py-3 text-sm">{entry.reviewed_by}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {entry.reviewed_at ? formatDate(entry.reviewed_at) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-red-600">
                                                    {entry.rejection_reason}
                                                </td>
                                            </>
                                        )}
                                        {activeTab === 'pending' && (
                                            <td className="px-4 py-3">
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
                                            </td>
                                        )}
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
