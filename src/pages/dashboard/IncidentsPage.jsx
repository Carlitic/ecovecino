import { useState, useEffect } from 'react';
import { Plus, Edit, X, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { databases, DB_ID, COLLECTIONS } from '../../lib/appwrite';
import { ID, Query } from 'appwrite';
import './IncidentsPage.css';

export default function IncidentsPage() {
    const { user: currentUser } = useAuth();
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [communities, setCommunities] = useState([]);

    const [incidentData, setIncidentData] = useState({ title: '', description: '', community_id: '' });
    const [editingId, setEditingId] = useState(null);
    const [showResolved, setShowResolved] = useState(false);

    useEffect(() => {
        if (currentUser) {
            fetchIncidents();
            // Appwrite communities logic would go here if needed
        }
    }, [currentUser]);

    const fetchIncidents = async () => {
        try {
            let queries = [];

            // Si no es super admin, filtrar por comunidad (suponiendo que el usuario tenga ese campo)
            // Nota: En Appwrite Auth no hay custom fields por defecto en 'account', 
            // se suelen guardar en una colección 'users' separada o en 'prefs'.
            // Por ahora asumiremos que currentUser tiene community_id si venía de AuthContext modificado.
            if (currentUser?.community_id) {
                queries.push(Query.equal('community_id', currentUser.community_id));
            }

            // Ordenar por fecha de creación descendente
            queries.push(Query.orderDesc('$createdAt'));

            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.INCIDENTS,
                queries
            );

            const data = response.documents.map(doc => ({
                id: doc.$id,
                ...doc
            }));

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
                const updates = {
                    title: incidentData.title,
                    description: incidentData.description
                };

                await databases.updateDocument(
                    DB_ID,
                    COLLECTIONS.INCIDENTS,
                    editingId,
                    updates
                );

                setIncidents(incidents.map(inc =>
                    inc.id === editingId
                        ? { ...inc, ...updates }
                        : inc
                ));
                setEditingId(null);
            } else {
                // Create
                // Usamos el ID de la comunidad del usuario actual como fallback
                // (Adaptar si implementas lógica de super admin)
                const targetCommunityId = currentUser.community_id || 'default_community';

                const newIncident = {
                    title: incidentData.title,
                    description: incidentData.description,
                    status: 'pending',
                    community_id: targetCommunityId,
                    author_id: currentUser.$id, // Appwrite usa $id
                    // created_at es automático en Appwrite ($createdAt)
                };

                const response = await databases.createDocument(
                    DB_ID,
                    COLLECTIONS.INCIDENTS,
                    ID.unique(),
                    newIncident
                );

                setIncidents([{ id: response.$id, ...response }, ...incidents]);
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
                    await databases.deleteDocument(DB_ID, COLLECTIONS.INCIDENTS, id);
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
            await databases.updateDocument(
                DB_ID,
                COLLECTIONS.INCIDENTS,
                incidentId,
                { status: newStatus }
            );
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
                                            {incident.$createdAt ? new Date(incident.$createdAt).toLocaleDateString('es-ES') : ''}
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
