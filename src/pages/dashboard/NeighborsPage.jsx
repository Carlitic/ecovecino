import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { databases, DB_ID, COLLECTIONS } from '../../lib/appwrite';
import { ID, Query } from 'appwrite';
import './NeighborsPage.css';

export default function NeighborsPage() {
    const { user: currentUser } = useAuth();
    const [neighbors, setNeighbors] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    // Initialize state
    const [newNeighbor, setNewNeighbor] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'owner',
        unit: '',
        linked_owner_id: ''
    });

    const [communities, setCommunities] = useState([]);

    // Filter available owners for the select dropdown
    const availableOwners = neighbors.filter(n => n.role === 'owner' || n.role === 'president');

    useEffect(() => {
        if (currentUser) {
            fetchNeighbors();
            if (currentUser.role === 'super_admin') {
                fetchCommunities();
            }
        }
    }, [currentUser]);

    const fetchCommunities = async () => {
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.COMMUNITIES
            );
            setCommunities(response.documents.map(doc => ({ id: doc.$id, ...doc })));
        } catch (error) {
            console.error("Error fetching communities:", error);
        }
    };

    const fetchNeighbors = async () => {
        try {
            if (!currentUser.community_id && currentUser.role !== 'super_admin') {
                setLoading(false);
                return;
            }

            let queries = [];

            if (currentUser.role !== 'super_admin') {
                queries.push(Query.equal('community_id', currentUser.community_id || ""));
            }

            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.USERS, // Usando la colección 'users' para listar vecinos
                queries
            );

            const data = response.documents.map(doc => ({
                id: doc.$id,
                ...doc
            }));

            // Filter out super_admins from the list locally (si existieran en esa tabla)
            setNeighbors(data.filter(u => u.role !== 'super_admin'));
        } catch (error) {
            console.error("Error loading neighbors:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const targetCommunityId = currentUser.role === 'super_admin'
                ? newNeighbor.community_id
                : currentUser.community_id;

            if (currentUser.role === 'super_admin' && !targetCommunityId) {
                alert("Debes seleccionar una comunidad");
                return;
            }

            if (newNeighbor.id) {
                // Edit existing
                const updateData = {
                    name: newNeighbor.name,
                    phone: newNeighbor.phone,
                    role: newNeighbor.role,
                    unit: newNeighbor.unit,
                    linked_owner_id: newNeighbor.role === 'tenant' ? newNeighbor.linked_owner_id : null
                };

                if (currentUser.role === 'super_admin') {
                    updateData.community_id = targetCommunityId;
                }

                await databases.updateDocument(
                    DB_ID,
                    COLLECTIONS.USERS,
                    newNeighbor.id,
                    updateData
                );

                setNeighbors(neighbors.map(n =>
                    n.id === newNeighbor.id ? { ...n, ...updateData, email: newNeighbor.email } : n
                ));
            } else {
                // Create new "placeholder" user
                const neighborData = {
                    name: newNeighbor.name,
                    email: newNeighbor.email,
                    phone: newNeighbor.phone,
                    role: newNeighbor.role,
                    unit: newNeighbor.unit,
                    linked_owner_id: newNeighbor.role === 'tenant' ? newNeighbor.linked_owner_id : null,
                    community_id: targetCommunityId,
                    // created_at: Automático
                };

                const response = await databases.createDocument(
                    DB_ID,
                    COLLECTIONS.USERS,
                    ID.unique(),
                    neighborData
                );

                setNeighbors([...neighbors, { id: response.$id, ...neighborData }]);
            }

            setNewNeighbor({ name: '', email: '', phone: '', role: 'owner', unit: '', linked_owner_id: '', community_id: '' });
            setShowForm(false);
        } catch (error) {
            console.error("Error saving neighbor:", error);
            alert("Error: " + error.message);
        }
    };

    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const handleDelete = (id) => {
        setModalConfig({
            isOpen: true,
            title: 'Eliminar Vecino',
            message: '¿Estás seguro de que quieres eliminar a este vecino? Esta acción borrará sus datos.',
            onConfirm: async () => {
                try {
                    await databases.deleteDocument(DB_ID, COLLECTIONS.USERS, id);
                    setNeighbors(prev => prev.filter(n => n.id !== id));
                    setModalConfig({ ...modalConfig, isOpen: false });
                } catch (error) {
                    console.error("Error deleting neighbor:", error);
                }
            }
        });
    };

    // Helper to find owner name by ID
    const getOwnerName = (id) => {
        const owner = neighbors.find(n => n.id.toString() === id.toString());
        return owner ? owner.name : 'Desconocido';
    };

    const getCommunityName = (id) => {
        const c = communities.find(c => c.id === id);
        return c ? c.name : 'Sin comunidad';
    };

    if (loading) return <div className="p-4">Cargando vecinos...</div>;

    return (
        <div className="neighbors-page">
            <div className="page-header">
                <div>
                    <h1>Vecinos</h1>
                    <p>Gestión de residentes de la comunidad</p>
                </div>
                {(currentUser.role === 'president' || currentUser.role === 'super_admin') && (
                    <Button onClick={() => {
                        setNewNeighbor({
                            name: '', email: '', phone: '', role: 'owner', unit: '', linked_owner_id: '',
                            community_id: ''
                        });
                        setShowForm(!showForm);
                    }}>
                        <Plus size={18} /> Añadir vecino
                    </Button>
                )}
            </div>

            {showForm && (
                <Card className="neighbor-form">
                    <h3>{newNeighbor.id ? 'Editar vecino' : 'Añadir nuevo vecino'}</h3>
                    <form className="form-grid" onSubmit={handleSubmit}>
                        {currentUser.role === 'super_admin' && (
                            <div className="input-group">
                                <label className="input-label">Comunidad <span className="required">*</span></label>
                                <select
                                    className="input"
                                    value={newNeighbor.community_id || ''}
                                    onChange={(e) => setNewNeighbor({ ...newNeighbor, community_id: e.target.value })}
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
                            label="Nombre completo"
                            placeholder="Juan Pérez"
                            value={newNeighbor.name}
                            onChange={(e) => setNewNeighbor({ ...newNeighbor, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="juan@example.com"
                            value={newNeighbor.email}
                            onChange={(e) => setNewNeighbor({ ...newNeighbor, email: e.target.value })}
                            required
                        />
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="Teléfono"
                                type="tel"
                                placeholder="600 000 000"
                                value={newNeighbor.phone}
                                onChange={(e) => setNewNeighbor({ ...newNeighbor, phone: e.target.value })}
                                required
                            />
                            <Input
                                label="Piso / Puerta"
                                placeholder="Ej: 1º A"
                                value={newNeighbor.unit}
                                onChange={(e) => setNewNeighbor({ ...newNeighbor, unit: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="input-group">
                                <label className="input-label">Tipo <span className="required">*</span></label>
                                <select
                                    className="input"
                                    value={newNeighbor.role}
                                    onChange={(e) => setNewNeighbor({ ...newNeighbor, role: e.target.value })}
                                    required
                                >
                                    <option value="owner">Propietario</option>
                                    <option value="tenant">Inquilino</option>
                                    {currentUser.role === 'super_admin' && (
                                        <option value="president">Presidente</option>
                                    )}
                                </select>
                            </div>

                            {newNeighbor.role === 'tenant' && (
                                <div className="input-group">
                                    <label className="input-label">Propietario Asociado <span className="required">*</span></label>
                                    <select
                                        className="input"
                                        value={newNeighbor.linked_owner_id}
                                        onChange={(e) => setNewNeighbor({ ...newNeighbor, linked_owner_id: e.target.value })}
                                        required={newNeighbor.role === 'tenant'}
                                    >
                                        <option value="">Seleccionar propietario...</option>
                                        {availableOwners.map(owner => (
                                            <option key={owner.id} value={owner.id}>
                                                {owner.name} ({owner.unit || 'Sin piso asignado'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Añadir</Button>
                        </div>
                    </form>
                </Card>
            )}

            <Card className="neighbors-table-card">
                <table className="neighbors-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Piso</th>
                            {currentUser.role === 'super_admin' && <th>Comunidad</th>}
                            <th>Contacto</th>
                            <th>Tipo</th>
                            {(currentUser.role === 'president' || currentUser.role === 'super_admin') && (
                                <th>Acciones</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {neighbors.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>No hay vecinos registrados.</td></tr>
                        ) : (
                            neighbors.map(neighbor => (
                                <tr key={neighbor.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{neighbor.name}</div>
                                        {neighbor.role === 'tenant' && neighbor.linked_owner_id && (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Prop: {getOwnerName(neighbor.linked_owner_id)}
                                            </div>
                                        )}
                                    </td>
                                    <td>{neighbor.unit || '-'}</td>
                                    {currentUser.role === 'super_admin' && (
                                        <td>{getCommunityName(neighbor.community_id)}</td>
                                    )}
                                    <td>
                                        <div>{neighbor.email}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{neighbor.phone}</div>
                                    </td>
                                    <td>
                                        <span className={`type-badge ${neighbor.role}`}>
                                            {neighbor.role === 'president' ? 'Presidente' :
                                                neighbor.role === 'owner' ? 'Propietario' : 'Inquilino'}
                                        </span>
                                    </td>
                                    {(currentUser.role === 'president' || currentUser.role === 'super_admin') && (
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                <button
                                                    className="icon-btn"
                                                    onClick={() => {
                                                        setNewNeighbor({
                                                            id: neighbor.id,
                                                            name: neighbor.name,
                                                            email: neighbor.email,
                                                            phone: neighbor.phone,
                                                            role: neighbor.role,
                                                            unit: neighbor.unit || '',
                                                            linked_owner_id: neighbor.linked_owner_id || '',
                                                            community_id: neighbor.community_id || ''
                                                        });
                                                        setShowForm(true);
                                                    }}
                                                    title="Editar vecino"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="icon-btn delete-btn"
                                                    onClick={() => handleDelete(neighbor.id)}
                                                    title="Eliminar vecino"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>

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
