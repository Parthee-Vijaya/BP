import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { timeEntriesApi, childrenApi, caregiversApi } from '../../utils/api';
import { formatHours, formatDate } from '../../utils/helpers';

// Icons
const ClockIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const UsersIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const ArrowIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        pendingCount: 0,
        approvedToday: 0,
        childrenCount: 0,
        caregiversCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentPending, setRecentPending] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [entries, children, caregivers] = await Promise.all([
                timeEntriesApi.getAll(),
                childrenApi.getAll(),
                caregiversApi.getAll()
            ]);

            const pending = entries.filter(e => e.status === 'pending');
            const today = new Date().toISOString().split('T')[0];
            const approvedToday = entries.filter(
                e => e.status === 'approved' &&
                e.reviewed_at &&
                e.reviewed_at.startsWith(today)
            ).length;

            setStats({
                pendingCount: pending.length,
                approvedToday,
                childrenCount: children.length,
                caregiversCount: caregivers.length
            });

            setRecentPending(pending.slice(0, 5));
        } catch (error) {
            console.error('Fejl ved indlæsning:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B54A32]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Oversigt</h2>
                <p className="text-gray-500 mt-1">Overblik over timeregistreringer og stamdata</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                    to="/admin/godkendelse"
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-[#B54A32]/30 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                            <ClockIcon />
                        </div>
                        <ArrowIcon />
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-bold text-gray-900">{stats.pendingCount}</div>
                        <div className="text-sm text-gray-500 mt-1">Afventer godkendelse</div>
                    </div>
                </Link>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        <CheckIcon />
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-bold text-gray-900">{stats.approvedToday}</div>
                        <div className="text-sm text-gray-500 mt-1">Godkendt i dag</div>
                    </div>
                </div>

                <Link
                    to="/admin/boern"
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-[#B54A32]/30 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-[#B54A32]/10 rounded-lg flex items-center justify-center text-[#B54A32]">
                            <UserIcon />
                        </div>
                        <ArrowIcon />
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-bold text-gray-900">{stats.childrenCount}</div>
                        <div className="text-sm text-gray-500 mt-1">Børn</div>
                    </div>
                </Link>

                <Link
                    to="/admin/barnepiger"
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-[#B54A32]/30 transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-[#B54A32]/10 rounded-lg flex items-center justify-center text-[#B54A32]">
                            <UsersIcon />
                        </div>
                        <ArrowIcon />
                    </div>
                    <div className="mt-4">
                        <div className="text-3xl font-bold text-gray-900">{stats.caregiversCount}</div>
                        <div className="text-sm text-gray-500 mt-1">Barnepiger</div>
                    </div>
                </Link>
            </div>

            {/* Recent pending */}
            {recentPending.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Seneste afventende registreringer</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {recentPending.map((entry) => (
                            <div key={entry.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-sm font-medium">
                                        {entry.caregiver_first_name?.charAt(0)}{entry.caregiver_last_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {entry.caregiver_first_name} {entry.caregiver_last_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {entry.child_first_name} {entry.child_last_name}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-gray-900">{formatHours(entry.total_hours)} timer</div>
                                    <div className="text-sm text-gray-500">
                                        {formatDate(entry.date)} &middot; {entry.start_time}-{entry.end_time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <Link
                            to="/admin/godkendelse"
                            className="inline-flex items-center gap-2 text-[#B54A32] hover:text-[#9a3f2b] text-sm font-medium"
                        >
                            Se alle afventende
                            <ArrowIcon />
                        </Link>
                    </div>
                </div>
            )}

            {recentPending.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckIcon />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Ingen afventende registreringer</h3>
                    <p className="text-gray-500 mt-1">Alle registreringer er blevet behandlet</p>
                </div>
            )}
        </div>
    );
}
