import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { timeEntriesApi, caregiversApi } from '../../utils/api';
import { formatHours, translateWeekday } from '../../utils/helpers';

// Icons
const NoAccessIcon = () => (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);

const WarningIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

export default function RegisterTime({ caregiverId = 1 }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedChildId = searchParams.get('child');

    const [caregiver, setCaregiver] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        child_id: preselectedChildId || '',
        date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '16:00',
        comment: ''
    });

    const [preview, setPreview] = useState(null);

    useEffect(() => {
        loadCaregiver();
    }, [caregiverId]);

    useEffect(() => {
        // Auto-preview når værdier ændres
        if (formData.child_id && formData.date && formData.start_time && formData.end_time) {
            loadPreview();
        }
    }, [formData.child_id, formData.date, formData.start_time, formData.end_time]);

    async function loadCaregiver() {
        try {
            const data = await caregiversApi.getById(caregiverId);
            setCaregiver(data);

            // Vælg første barn hvis ingen er valgt
            if (!formData.child_id && data.children?.length > 0) {
                setFormData(prev => ({ ...prev, child_id: String(data.children[0].id) }));
            }
        } catch (error) {
            console.error('Fejl:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadPreview() {
        try {
            const result = await timeEntriesApi.preview({
                child_id: parseInt(formData.child_id),
                date: formData.date,
                start_time: formData.start_time,
                end_time: formData.end_time
            });
            setPreview(result);
        } catch (error) {
            console.error('Preview fejl:', error);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!formData.child_id) {
            alert('Vælg venligst et barn');
            return;
        }

        setSubmitting(true);
        try {
            await timeEntriesApi.create({
                caregiver_id: caregiverId,
                child_id: parseInt(formData.child_id),
                date: formData.date,
                start_time: formData.start_time,
                end_time: formData.end_time,
                comment: formData.comment
            });

            alert('Registrering oprettet!');
            navigate('/barnepige/mine-timer');
        } catch (error) {
            alert('Fejl: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B54A32]"></div>
            </div>
        );
    }

    if (!caregiver?.children?.length) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <NoAccessIcon />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Ingen børn tilknyttet</h2>
                <p className="text-gray-500">
                    Du kan ikke registrere timer da du ikke er tilknyttet nogen børn.
                </p>
            </div>
        );
    }

    const grantExceeded = preview?.grantStatus?.exceeded;
    const grantError = preview?.grantStatus?.error;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Registrer Timer</h2>
                <p className="text-gray-500 mt-1">Udfyld formularen for at registrere dine timer</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                    {/* Barn */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Barn *</label>
                        <select
                            value={formData.child_id}
                            onChange={(e) => setFormData({ ...formData, child_id: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                            required
                        >
                            <option value="">Vælg barn...</option>
                            {caregiver.children.map((child) => (
                                <option key={child.id} value={child.id}>
                                    {child.first_name} {child.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Dato */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Dato *</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                            required
                        />
                    </div>

                    {/* Tid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start tid *</label>
                            <input
                                type="time"
                                value={formData.start_time}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Slut tid *</label>
                            <input
                                type="time"
                                value={formData.end_time}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                                required
                            />
                        </div>
                    </div>

                    {/* Kommentar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Kommentar</label>
                        <textarea
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Valgfri kommentar..."
                        />
                    </div>
                </div>

                {/* Preview */}
                {preview && (
                    <div className={`rounded-xl shadow-sm border-2 p-6 ${
                        grantExceeded || grantError
                            ? 'bg-rose-50 border-rose-200'
                            : 'bg-emerald-50 border-emerald-200'
                    }`}>
                        <h3 className="font-semibold text-gray-900 mb-4">Beregnet timefordeling</h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Normaltimer</div>
                                <div className="text-lg font-bold text-gray-900">{formatHours(preview.allowances.normal_hours)}</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Aftentillæg</div>
                                <div className="text-lg font-bold text-gray-900">{formatHours(preview.allowances.evening_hours)}</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Nattillæg</div>
                                <div className="text-lg font-bold text-gray-900">{formatHours(preview.allowances.night_hours)}</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Lørdagstillæg</div>
                                <div className="text-lg font-bold text-gray-900">{formatHours(preview.allowances.saturday_hours)}</div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Søn-/Helligdag</div>
                                <div className="text-lg font-bold text-gray-900">{formatHours(preview.allowances.sunday_holiday_hours)}</div>
                            </div>
                            <div className="text-center p-3 bg-[#B54A32]/5 rounded-lg border border-[#B54A32]/20">
                                <div className="text-xs text-[#B54A32] mb-1">Total</div>
                                <div className="text-xl font-bold text-[#B54A32]">
                                    {formatHours(preview.allowances.total_hours)}
                                </div>
                            </div>
                        </div>

                        {/* Bevillingsstatus */}
                        {preview.grantStatus && (
                            <div className={`p-4 rounded-lg ${
                                grantExceeded || grantError ? 'bg-rose-100' : 'bg-emerald-100'
                            }`}>
                                {grantError ? (
                                    <div className="text-rose-700">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <WarningIcon />
                                            <span>{grantError}</span>
                                        </div>
                                        {preview.grantStatus.allowedDays && (
                                            <div className="mt-2 text-sm">
                                                Tilladte dage: {preview.grantStatus.allowedDays.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                ) : grantExceeded ? (
                                    <div className="text-rose-700">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <WarningIcon />
                                            <span>Bevilling overskrides!</span>
                                        </div>
                                        <div className="mt-2 text-sm space-y-0.5">
                                            <div>Forbrugt: {formatHours(preview.grantStatus.usedHours)} / {formatHours(preview.grantStatus.grantHours)} timer</div>
                                            <div>Efter registrering: {formatHours(preview.grantStatus.totalAfterNew)} timer</div>
                                            <div>Overskredet med: {formatHours(preview.grantStatus.exceededBy)} timer</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-emerald-700">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <CheckIcon />
                                            <span>Inden for bevilling</span>
                                        </div>
                                        <div className="mt-2 text-sm space-y-0.5">
                                            <div>Forbrugt: {formatHours(preview.grantStatus.usedHours)} / {formatHours(preview.grantStatus.grantHours)} timer</div>
                                            <div>Resterende: {formatHours(preview.grantStatus.remainingHours)} timer</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Submit */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`flex-1 px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                            submitting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : grantExceeded || grantError
                                ? 'bg-rose-600 hover:bg-rose-700'
                                : 'bg-[#B54A32] hover:bg-[#9a3f2b]'
                        }`}
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Indsender...
                            </span>
                        ) : 'Indsend registrering'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/barnepige')}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                    >
                        Annuller
                    </button>
                </div>

                {(grantExceeded || grantError) && (
                    <p className="text-sm text-rose-600 text-center">
                        Bemærk: Registreringen vil blive oprettet, men markeret som overskridelse.
                    </p>
                )}
            </form>
        </div>
    );
}
