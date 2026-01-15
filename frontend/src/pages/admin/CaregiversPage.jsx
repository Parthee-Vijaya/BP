import { useState, useEffect } from 'react';
import { caregiversApi, childrenApi } from '../../utils/api';

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

const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

export default function CaregiversPage() {
    const [caregivers, setCaregivers] = useState([]);
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState({ open: false, caregiver: null });
    const [formData, setFormData] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [caregiversData, childrenData] = await Promise.all([
                caregiversApi.getAll(),
                childrenApi.getAll()
            ]);
            setCaregivers(caregiversData);
            setChildren(childrenData);
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
            ma_number: '',
            child_ids: []
        });
        setEditModal({ open: true, caregiver: null });
    }

    function openEditModal(caregiver) {
        setFormData({
            first_name: caregiver.first_name,
            last_name: caregiver.last_name,
            ma_number: caregiver.ma_number,
            child_ids: caregiver.children?.map(c => c.id) || []
        });
        setEditModal({ open: true, caregiver });
    }

    async function handleSave() {
        try {
            if (editModal.caregiver) {
                await caregiversApi.update(editModal.caregiver.id, formData);
            } else {
                await caregiversApi.create(formData);
            }
            setEditModal({ open: false, caregiver: null });
            loadData();
        } catch (error) {
            alert('Fejl ved gem: ' + error.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Er du sikker på at du vil slette denne barnepige?')) return;

        try {
            await caregiversApi.delete(id);
            loadData();
        } catch (error) {
            alert('Fejl ved sletning: ' + error.message);
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Barnepiger</h2>
                    <p className="text-gray-500 mt-1">Administrer barnepiger og deres tilknytninger</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B54A32] text-white rounded-lg hover:bg-[#9a3f2b] transition-colors font-medium"
                >
                    <PlusIcon />
                    Opret barnepige
                </button>
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
                                <th className="px-4 py-3">MA-nummer</th>
                                <th className="px-4 py-3">Tilknyttede børn</th>
                                <th className="px-4 py-3">Handlinger</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {caregivers.map((caregiver) => (
                                <tr key={caregiver.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[#B54A32]/10 rounded-full flex items-center justify-center text-[#B54A32] text-xs font-medium">
                                                {caregiver.first_name?.charAt(0)}{caregiver.last_name?.charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900">{caregiver.first_name} {caregiver.last_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                            {caregiver.ma_number}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">
                                        {caregiver.children?.map(c => c.name).join(', ') || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditModal(caregiver)}
                                                className="p-1.5 text-gray-500 hover:text-[#B54A32] hover:bg-[#B54A32]/5 rounded transition-colors"
                                                title="Rediger"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(caregiver.id)}
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

                    {caregivers.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <UsersIcon />
                            </div>
                            <p className="text-gray-500">Ingen barnepiger oprettet endnu</p>
                        </div>
                    )}
                </div>
            )}

            {/* Edit/Create Modal */}
            {editModal.open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#B54A32]/10 rounded-full flex items-center justify-center text-[#B54A32]">
                                <UsersIcon />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {editModal.caregiver ? 'Rediger barnepige' : 'Opret barnepige'}
                            </h3>
                        </div>

                        <div className="space-y-4">
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

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">MA-nummer *</label>
                                <input
                                    type="text"
                                    value={formData.ma_number}
                                    onChange={(e) => setFormData({ ...formData, ma_number: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#B54A32] focus:border-[#B54A32]"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tilknyttede børn</label>
                                <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                                    {children.map((child) => (
                                        <label key={child.id} className="flex items-center gap-2 py-1.5 px-1 hover:bg-gray-50 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.child_ids?.includes(child.id)}
                                                onChange={(e) => {
                                                    const ids = formData.child_ids || [];
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, child_ids: [...ids, child.id] });
                                                    } else {
                                                        setFormData({ ...formData, child_ids: ids.filter(i => i !== child.id) });
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-[#B54A32] focus:ring-[#B54A32]"
                                            />
                                            <span className="text-sm text-gray-700">{child.first_name} {child.last_name}</span>
                                        </label>
                                    ))}
                                    {children.length === 0 && (
                                        <div className="text-gray-400 text-sm py-2">Ingen børn oprettet</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2.5 bg-[#B54A32] text-white rounded-lg hover:bg-[#9a3f2b] font-medium transition-colors"
                            >
                                Gem
                            </button>
                            <button
                                onClick={() => setEditModal({ open: false, caregiver: null })}
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
