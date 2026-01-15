import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { childrenApi, caregiversApi } from '../../utils/api';
import GrantStatusBadge from '../../components/GrantStatusBadge';
import { translateGrantType, translateWeekday } from '../../utils/helpers';

// Icons
const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const ArrowIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

export default function CaregiverDashboard({ caregiverId = 1 }) {
    const [children, setChildren] = useState([]);
    const [caregiver, setCaregiver] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [caregiverId]);

    async function loadData() {
        try {
            const caregiverData = await caregiversApi.getById(caregiverId);
            setCaregiver(caregiverData);

            if (caregiverData.children && caregiverData.children.length > 0) {
                const childrenDetails = await Promise.all(
                    caregiverData.children.map(child => childrenApi.getById(child.id))
                );
                setChildren(childrenDetails);
            } else {
                setChildren([]);
            }
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

    if (!caregiver) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-500">Barnepige ikke fundet</p>
            </div>
        );
    }

    if (children.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <UserIcon />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Ingen børn tilknyttet</h2>
                <p className="text-gray-500">
                    Du er ikke tilknyttet nogen børn endnu. Kontakt din leder for at blive tilknyttet.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mine Børn</h2>
                    <p className="text-gray-500 mt-1">Oversigt over tilknyttede børn og bevillinger</p>
                </div>
                <Link
                    to="/barnepige/registrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B54A32] text-white rounded-lg hover:bg-[#9a3f2b] transition-colors font-medium"
                >
                    <PlusIcon />
                    Registrer timer
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children.map((child) => (
                    <div key={child.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#B54A32]/10 rounded-full flex items-center justify-center text-[#B54A32] font-semibold">
                                        {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {child.first_name} {child.last_name}
                                        </h3>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                            {child.has_frame_grant ? 'Rammebevilling' : translateGrantType(child.grant_type)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bevillingsstatus */}
                            {child.grantSummary && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="text-sm font-medium text-gray-700 mb-3">Forbrugt bevilling</div>
                                    {child.grantSummary.grantType === 'specific_weekdays' ? (
                                        <div className="space-y-2">
                                            {Object.entries(child.grantSummary.weekdays || {}).map(([day, data]) => (
                                                <div key={day} className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-600">{translateWeekday(day)}</span>
                                                    <GrantStatusBadge
                                                        used={data.usedHours}
                                                        total={data.grantHours}
                                                        showBar={false}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <GrantStatusBadge
                                            used={child.grantSummary.usedHours}
                                            total={child.grantSummary.grantHours}
                                        />
                                    )}

                                    {child.grantSummary.periodStart && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                                            Periode: {child.grantSummary.periodStart} til {child.grantSummary.periodEnd}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                            <Link
                                to={`/barnepige/registrer?child=${child.id}`}
                                className="inline-flex items-center gap-2 text-[#B54A32] hover:text-[#9a3f2b] text-sm font-medium"
                            >
                                Registrer timer for {child.first_name}
                                <ArrowIcon />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
