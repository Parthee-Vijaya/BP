import { useState, useEffect } from 'react';
import { childrenApi, caregiversApi } from '../../utils/api';
import GrantStatusBadge from '../../components/GrantStatusBadge';
import { translateGrantType, translateWeekday, formatDate } from '../../utils/helpers';

// Icons
const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const SearchIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

// PSP-element validering og formatering
// Format: XX-0000000000-0000 (2 bogstaver - 10 tal - 4 tal)
const PSP_REGEX = /^[A-Za-z]{2}-\d{10}-\d{4}$/;

function validatePspElement(value) {
    if (!value) return { valid: true, error: '' }; // Valgfrit felt
    if (PSP_REGEX.test(value)) {
        return { valid: true, error: '' };
    }
    return { valid: false, error: 'Format: XX-0000000000-0000 (f.eks. XG-0000010031-0003)' };
}

function formatPspElement(value) {
    // Fjern alt undtagen bogstaver og tal
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Indsæt bindestreger automatisk
    let formatted = '';
    if (cleaned.length > 0) {
        formatted = cleaned.substring(0, 2); // Første 2 bogstaver
    }
    if (cleaned.length > 2) {
        formatted += '-' + cleaned.substring(2, 12); // Næste 10 tal
    }
    if (cleaned.length > 12) {
        formatted += '-' + cleaned.substring(12, 16); // Sidste 4 tal
    }

    return formatted;
}

export default function ChildrenPage() {
    const [children, setChildren] = useState([]);
    const [caregivers, setCaregivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState({ open: false, child: null });
    const [formData, setFormData] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [pspError, setPspError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [childrenData, caregiversData] = await Promise.all([
                childrenApi.getAll(),
                caregiversApi.getAll()
            ]);
            setChildren(childrenData);
            setCaregivers(caregiversData);
        } catch (error) {
            console.error('Fejl ved indlæsning:', error);
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal() {
        setFormData({
            first_name: '',
            last_name: '',
            birth_date: '',
            psp_element: '',
            grant_type: 'week',
            grant_hours: 0,
            grant_weekdays: {},
            has_frame_grant: false,
            frame_hours: 0,
            caregiver_ids: []
        });
        setPspError('');
        setEditModal({ open: true, child: null });
    }

    function openEditModal(child) {
        setFormData({
            first_name: child.first_name,
            last_name: child.last_name,
            birth_date: child.birth_date || '',
            psp_element: child.psp_element || '',
            grant_type: child.grant_type,
            grant_hours: child.grant_hours || 0,
            grant_weekdays: child.grant_weekdays || {},
            has_frame_grant: !!child.has_frame_grant,
            frame_hours: child.frame_hours || 0,
            caregiver_ids: child.caregivers?.map(c => c.id) || []
        });
        setPspError('');
        setEditModal({ open: true, child });
    }

    async function handleSave() {
        // Valider PSP-element
        const pspValidation = validatePspElement(formData.psp_element);
        if (!pspValidation.valid) {
            setPspError(pspValidation.error);
            return;
        }

        try {
            if (editModal.child) {
                await childrenApi.update(editModal.child.id, formData);
            } else {
                await childrenApi.create(formData);
            }
            setEditModal({ open: false, child: null });
            loadData();
        } catch (error) {
            alert('Fejl ved gem: ' + error.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Er du sikker på at du vil slette dette barn?')) return;

        try {
            await childrenApi.delete(id);
            loadData();
        } catch (error) {
            alert('Fejl ved sletning: ' + error.message);
        }
    }

    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // Filtrér børn baseret på søgning
    const filteredChildren = children.filter(child => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const fullName = `${child.first_name} ${child.last_name}`.toLowerCase();
        const psp = (child.psp_element || '').toLowerCase();
        return fullName.includes(query) || psp.includes(query);
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Børn</h2>
                    <p className="text-gray-500 mt-1">Administrer børn og deres bevillinger</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B54A32] text-white rounded-lg hover:bg-[#9a3f2b] transition-colors font-medium"
                >
                    <PlusIcon />
                    Opret barn
                </button>
            </div>

            {/* Søgefelt */}
            <div className="relative w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <SearchIcon />
                </div>
                <input
                    type="text"
                    placeholder="Søg barn (navn eller PSP-element)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-full focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B54A32]"></div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Navn</th>
                                <th className="px-4 py-3">Fødselsdato</th>
                                <th className="px-4 py-3">PSP-element</th>
                                <th className="px-4 py-3">Bevillingstype</th>
                                <th className="px-4 py-3">Bevilling</th>
                                <th className="px-4 py-3">Barnepiger</th>
                                <th className="px-4 py-3">Handlinger</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredChildren.map((child) => (
                                <tr key={child.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[#B54A32]/10 rounded-full flex items-center justify-center text-[#B54A32] text-xs font-medium">
                                                {child.first_name?.charAt(0)}{child.last_name?.charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900">{child.first_name} {child.last_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {child.birth_date ? formatDate(child.birth_date) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{child.psp_element || '-'}</td>
                                    <td className="px-4 py-3">
                                        {child.has_frame_grant ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Rammebevilling</span>
                                        ) : (
                                            <span className="text-sm text-gray-600">{translateGrantType(child.grant_type)}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {child.has_frame_grant
                                            ? `${child.frame_hours} timer/år`
                                            : child.grant_type === 'specific_weekdays'
                                            ? 'Pr. ugedag'
                                            : `${child.grant_hours} timer`}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {child.caregivers?.map(c => c.name).join(', ') || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditModal(child)}
                                                className="p-1.5 text-gray-500 hover:text-[#B54A32] hover:bg-[#B54A32]/5 rounded transition-colors"
                                                title="Rediger"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(child.id)}
                                                className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                title="Slet"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {children.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <UserIcon />
                            </div>
                            <p className="text-gray-500">Ingen børn oprettet endnu</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit/Create Modal */}
            {editModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl my-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#B54A32]/10 rounded-full flex items-center justify-center text-[#B54A32]">
                                <UserIcon />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {editModal.child ? 'Rediger barn' : 'Opret barn'}
                            </h3>
                        </div>

                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                            {/* Basic info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fornavn *</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Efternavn *</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fødselsdato</label>
                                    <input
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">PSP-element</label>
                                    <input
                                        type="text"
                                        value={formData.psp_element}
                                        onChange={(e) => {
                                            const formatted = formatPspElement(e.target.value);
                                            setFormData({ ...formData, psp_element: formatted });
                                            const validation = validatePspElement(formatted);
                                            setPspError(validation.valid ? '' : validation.error);
                                        }}
                                        placeholder="XX-0000000000-0000"
                                        maxLength={18}
                                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 ${
                                            pspError
                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                : 'border-gray-200 focus:ring-[#B54A32] focus:border-[#B54A32]'
                                        }`}
                                    />
                                    {pspError && (
                                        <p className="mt-1 text-xs text-red-600">{pspError}</p>
                                    )}
                                    <p className="mt-1 text-xs text-gray-400">Format: XX-0000000000-0000 (f.eks. XG-0000010031-0003)</p>
                                </div>
                            </div>

                            {/* Barnepiger */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tilknyttede barnepiger</label>
                                <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                                    {caregivers.map((cg) => (
                                        <label key={cg.id} className="flex items-center gap-2 py-1.5 px-1 hover:bg-gray-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.caregiver_ids?.includes(cg.id)}
                                                onChange={(e) => {
                                                    const ids = formData.caregiver_ids || [];
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, caregiver_ids: [...ids, cg.id] });
                                                    } else {
                                                        setFormData({ ...formData, caregiver_ids: ids.filter(i => i !== cg.id) });
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-[#B54A32] focus:ring-[#B54A32]"
                                            />
                                            <span className="text-sm text-gray-700">{cg.first_name} {cg.last_name}</span>
                                            <span className="text-xs text-gray-400">({cg.ma_number})</span>
                                        </label>
                                    ))}
                                    {caregivers.length === 0 && (
                                        <div className="text-gray-400 text-sm py-2">Ingen barnepiger oprettet</div>
                                    )}
                                </div>
                            </div>

                            {/* Rammebevilling toggle */}
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.has_frame_grant}
                                        onChange={(e) => setFormData({ ...formData, has_frame_grant: e.target.checked })}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                    <span className="font-medium text-purple-700">Brug rammebevilling</span>
                                </label>
                                {formData.has_frame_grant && (
                                    <div className="mt-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Rammebevilling (timer pr. år)</label>
                                        <input
                                            type="number"
                                            value={formData.frame_hours}
                                            onChange={(e) => setFormData({ ...formData, frame_hours: parseFloat(e.target.value) || 0 })}
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            min="0"
                                            step="0.5"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Normal bevilling (kun hvis ikke rammebevilling) */}
                            {!formData.has_frame_grant && (
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Bevillingstype</label>
                                    <select
                                        value={formData.grant_type}
                                        onChange={(e) => setFormData({ ...formData, grant_type: e.target.value })}
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                                    >
                                        <option value="week">Uge</option>
                                        <option value="month">Måned</option>
                                        <option value="quarter">Kvartal</option>
                                        <option value="half_year">Halvår</option>
                                        <option value="year">År</option>
                                        <option value="specific_weekdays">Specifikke ugedage</option>
                                    </select>

                                    {formData.grant_type === 'specific_weekdays' ? (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Timer pr. ugedag</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {weekdays.map((day) => (
                                                    <div key={day} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-100">
                                                        <input
                                                            type="checkbox"
                                                            checked={(formData.grant_weekdays?.[day] || 0) > 0}
                                                            onChange={(e) => {
                                                                const weekdays = { ...formData.grant_weekdays };
                                                                if (e.target.checked) {
                                                                    weekdays[day] = weekdays[day] || 2;
                                                                } else {
                                                                    weekdays[day] = 0;
                                                                }
                                                                setFormData({ ...formData, grant_weekdays: weekdays });
                                                            }}
                                                            className="rounded border-gray-300 text-[#B54A32] focus:ring-[#B54A32]"
                                                        />
                                                        <span className="w-16 text-sm text-gray-700">{translateWeekday(day)}:</span>
                                                        <input
                                                            type="number"
                                                            value={formData.grant_weekdays?.[day] || 0}
                                                            onChange={(e) => {
                                                                const weekdays = { ...formData.grant_weekdays };
                                                                weekdays[day] = parseFloat(e.target.value) || 0;
                                                                setFormData({ ...formData, grant_weekdays: weekdays });
                                                            }}
                                                            className="w-16 border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                                                            min="0"
                                                            step="0.5"
                                                        />
                                                        <span className="text-xs text-gray-400">timer</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                                Bevilling (timer pr. {translateGrantType(formData.grant_type).toLowerCase()})
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.grant_hours}
                                                onChange={(e) => setFormData({ ...formData, grant_hours: parseFloat(e.target.value) || 0 })}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                                                min="0"
                                                step="0.5"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2.5 bg-[#B54A32] text-white rounded-lg hover:bg-[#9a3f2b] font-medium transition-colors"
                            >
                                Gem
                            </button>
                            <button
                                onClick={() => setEditModal({ open: false, child: null })}
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
