import { useState, useEffect } from 'react';
import { Plus, Edit, X, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import './IncidentsPage.css';

export default function IncidentsPage() {
    const { user: currentUser } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [communities, setCommunities] = useState([]);

    // State accidentally removed - restoring
    const [incidentData, setIncidentData] = useState({ title: '', description: '', community_id: '' });
    const [editingId, setEditingId] = useState(null);
    const [showResolved, setShowResolved] = useState(false);

    useEffect(() => {
        if (currentUser) {
            fetchIncidents();
            if (currentUser.role === 'super_admin') {
                fetchCommunities();
            }
        }
    }, [currentUser]);

    const fetchCommunities = async () => {
        try {
            const snapshot = await getDocs(collection(db, "communities"));
            setCommunities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching communities:", error);
        }
    };

    const fetchIncidents = async () => {
        try {
            let q;
            // Si es super_admin ve todo, si no, solo su comunidad
            if (currentUser.role === 'super_admin') {
                q = collection(db, "incidents");
            } else {
                q = query(
                    collection(db, "incidents"),
                    where("community_id", "==", currentUser.community_id || "") // Fallback empty string if null
                );
            }

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Ordenamos por fecha (más reciente primero) en cliente para evitar requerir índices compuestos ahora mismo
            data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setIncidents(data);
        } catch (error) {
            console.error("Error cargando incidencias:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                // Update
                const incidentRef = doc(db, "incidents", editingId);
                const updates = {
                    title: incidentData.title,
                    description: incidentData.description
                };

                if (currentUser.role === 'super_admin' && incidentData.community_id) {
                    updates.community_id = incidentData.community_id;
                }

                await updateDoc(incidentRef, updates);

                setIncidents(incidents.map(inc =>
                    inc.id === editingId
                        ? { ...inc, ...updates }
                        : inc
                ));
                setEditingId(null);
            } else {
                // Create
                const targetCommunityId = currentUser.role === 'super_admin'
                    ? incidentData.community_id
                    : currentUser.community_id;

                if (!targetCommunityId) {
                    alert("Debes seleccionar una comunidad");
                    return;
                }

                const newIncident = {
                    title: incidentData.title,
                    description: incidentData.description,
                    status: 'pending',
                    community_id: targetCommunityId,
                    reporter_id: currentUser.uid || currentUser.id, // Fallback for safety
                    created_at: new Date().toISOString()
                };

                const docRef = await addDoc(collection(db, "incidents"), newIncident);
                setIncidents([{ id: docRef.id, ...newIncident }, ...incidents]);
            }

            setIncidentData({ title: '', description: '', community_id: '' });
            setShowForm(false);
        } catch (error) {
            console.error("Error guardando incidencia:", error);
            alert("Error al guardar: " + error.message);
        }
    };

    const handleEdit = (incident) => {
        setIncidentData({
            title: incident.title,
            description: incident.description,
            community_id: incident.community_id
        });
        setEditingId(incident.id);
        setShowForm(true);
    };

    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const handleDelete = (id) => {
        setModalConfig({
            isOpen: true,
            title: 'Eliminar Incidencia',
            message: '¿Estás seguro de que quieres eliminar esta incidencia permanentemente?',
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, "incidents", id));
                    setIncidents(prev => prev.filter(i => i.id !== id));
                    setModalConfig({ ...modalConfig, isOpen: false });
                } catch (error) {
                    console.error("Error eliminando:", error);
                }
            }
        });
    };

    const handleStatusChange = async (incidentId, newStatus) => {
        try {
            await updateDoc(doc(db, "incidents", incidentId), { status: newStatus });
            setIncidents(incidents.map(i =>
                i.id === incidentId ? { ...i, status: newStatus } : i
            ));
        } catch (error) {
            console.error("Error actualizando estado:", error);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'Pendiente', class: 'status-pending' },
            in_progress: { label: 'En progreso', class: 'status-progress' },
            resolved: { label: 'Resuelta', class: 'status-resolved' }
        };
        return badges[status] || badges.pending;
    };

    if (loading) return <div className="p-4">Cargando incidencias...</div>;

    return (
        <div className="incidents-page">
            <div className="page-header">
                <div>
                    <h1>Incidencias</h1>
                    <p>Gestión de incidencias de la comunidad</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showResolved}
                            onChange={(e) => setShowResolved(e.target.checked)}
                        />
                        Ver resueltas
                    </label>
                    <Button onClick={() => {
                        setEditingId(null);
                        setIncidentData({ title: '', description: '', community_id: '' });
                        setShowForm(!showForm);
                    }}>
                        <Plus size={18} /> Nueva incidencia
                    </Button>
                </div>
            </div>

            {showForm && (
                <Card className="incident-form">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3>{editingId ? 'Editar incidencia' : 'Reportar nueva incidencia'}</h3>
                        <button className="icon-btn" onClick={() => setShowForm(false)}><X size={18} /></button>
                    </div>
                    <form className="form-grid" onSubmit={handleSubmit}>
                        {currentUser.role === 'super_admin' && (
                            <div className="input-group">
                                <label className="input-label">Comunidad <span className="required">*</span></label>
                                <select
                                    className="input"
                                    value={incidentData.community_id}
                                    onChange={(e) => setIncidentData({ ...incidentData, community_id: e.target.value })}
                                    required
                                >
                                    <option value="">Selecciona una comunidad</option>
                                    {communities.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <Input
                            label="Título"
                            placeholder="Ej: Ascensor averiado"
                            value={incidentData.title}
                            onChange={(e) => setIncidentData({ ...incidentData, title: e.target.value })}
                            required
                        />
                        <div className="input-group">
                            <label className="input-label">Descripción <span className="required">*</span></label>
                            <textarea
                                className="input"
                                rows="4"
                                placeholder="Describe el problema..."
                                value={incidentData.description}
                                onChange={(e) => setIncidentData({ ...incidentData, description: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">{editingId ? 'Guardar cambios' : 'Reportar'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="incidents-grid">
                {incidents.length === 0 ? (
                    <p>No hay incidencias reportadas.</p>
                ) : (
                    incidents
                        .filter(incident => showResolved || incident.status !== 'resolved')
                        .map(incident => {
                            const badge = getStatusBadge(incident.status);
                            const currentUserUid = currentUser.uid || currentUser.id;
                            const canEdit = currentUser.role === 'super_admin' || currentUser.role === 'president' || currentUserUid === incident.reporter_id;
                            const canDelete = currentUser.role === 'super_admin' || currentUser.role === 'president';

                            return (
                                <Card key={incident.id} className="incident-card">
                                    <div className="incident-header">
                                        <h3>{incident.title}</h3>
                                        <span className={`status-badge ${badge.class}`}>{badge.label}</span>
                                    </div>
                                    <p>{incident.description}</p>
                                    <div className="incident-footer">
                                        <span className="incident-date">
                                            {incident.created_at ? new Date(incident.created_at).toLocaleDateString('es-ES') : ''}
                                        </span>

                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {canEdit && (
                                                <button
                                                    className="icon-btn"
                                                    onClick={() => handleEdit(incident)}
                                                    title="Editar incidencia"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )}

                                            {canDelete && (
                                                <button
                                                    className="icon-btn delete-btn"
                                                    onClick={() => handleDelete(incident.id)}
                                                    title="Eliminar incidencia"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}

                                            {(currentUser.role === 'president' || currentUser.role === 'super_admin') && (
                                                <select
                                                    className="status-select"
                                                    value={incident.status}
                                                    onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                                                >
                                                    <option value="pending">Pendiente</option>
                                                    <option value="in_progress">En progreso</option>
                                                    <option value="resolved">Resuelta</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                )}
            </div>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
            />
        </div>
    );
}
