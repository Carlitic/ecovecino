import { useState, useEffect } from 'react';
import { Plus, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { databases, DB_ID, COLLECTIONS } from '../../lib/appwrite';
import { ID } from 'appwrite';
import './CommunitiesPage.css';

export default function CommunitiesPage() {
    const { user: currentUser } = useAuth();
    const [communities, setCommunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newCommunity, setNewCommunity] = useState({ name: '', address: '' });

    const [editingId, setEditingId] = useState(null);

    // Cargar comunidades desde Appwrite
    useEffect(() => {
        fetchCommunities();
    }, []);

    const fetchCommunities = async () => {
        try {
            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.COMMUNITIES
            );

            const communitiesData = response.documents.map(doc => ({
                id: doc.$id,
                ...doc
            }));
            setCommunities(communitiesData);
        } catch (error) {
            console.error("Error cargando comunidades:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                // Edit mode
                await databases.updateDocument(
                    DB_ID,
                    COLLECTIONS.COMMUNITIES,
                    editingId,
                    {
                        name: newCommunity.name,
                        address: newCommunity.address
                    }
                );

                // Actualizar estado local
                setCommunities(communities.map(c =>
                    c.id === editingId
                        ? { ...c, name: newCommunity.name, address: newCommunity.address }
                        : c
                ));
                setEditingId(null);
            } else {
                // Create mode
                const docData = {
                    name: newCommunity.name,
                    address: newCommunity.address,
                    // created_at: Automático
                    president_id: null // Opcional, Appwrite lo maneja como string null si no se envía o se envía null
                };

                const response = await databases.createDocument(
                    DB_ID,
                    COLLECTIONS.COMMUNITIES,
                    ID.unique(),
                    docData
                );

                // Añadir al estado local
                setCommunities([...communities, {
                    id: response.$id,
                    ...docData
                }]);
            }

            setNewCommunity({ name: '', address: '' });
            setShowForm(false);
        } catch (error) {
            console.error("Error guardando comunidad:", error);
            alert("Error al guardar: " + error.message);
        }
    };

    const handleEdit = (community) => {
        setNewCommunity({ name: community.name, address: community.address });
        setEditingId(community.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta comunidad?')) {
            try {
                await databases.deleteDocument(DB_ID, COLLECTIONS.COMMUNITIES, id);
                setCommunities(communities.filter(c => c.id !== id));
            } catch (error) {
                console.error("Error eliminando:", error);
                alert("Error al eliminar: " + error.message);
            }
        }
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setNewCommunity({ name: '', address: '' });
    };

    if (loading) return <div className="p-4">Cargando comunidades...</div>;

    return (
        <div className="communities-page">
            <div className="page-header">
                <div>
                    <h1>Comunidades</h1>
                    <p>Gestión de comunidades del sistema</p>
                </div>
                <Button onClick={() => {
                    setEditingId(null);
                    setNewCommunity({ name: '', address: '' });
                    setShowForm(!showForm);
                }}>
                    <Plus size={18} /> Nueva comunidad
                </Button>
            </div>

            {showForm && (
                <Card className="community-form">
                    <h3>{editingId ? 'Editar comunidad' : 'Crear nueva comunidad'}</h3>
                    <form className="form-grid" onSubmit={handleSubmit}>
                        <Input
                            label="Nombre de la comunidad"
                            placeholder="Residencial Las Flores"
                            value={newCommunity.name}
                            onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Dirección"
                            placeholder="Calle Mayor 123, Madrid"
                            value={newCommunity.address}
                            onChange={(e) => setNewCommunity({ ...newCommunity, address: e.target.value })}
                            required
                        />
                        <div className="form-actions">
                            <Button type="button" variant="ghost" onClick={handleCancel}>
                                Cancelar
                            </Button>
                            <Button type="submit">{editingId ? 'Guardar cambios' : 'Crear'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="communities-grid">
                {communities.length === 0 ? (
                    <p>No hay comunidades creadas aún.</p>
                ) : (
                    communities.map(community => (
                        <Card key={community.id} className="community-card">
                            <h3>{community.name}</h3>
                            <p className="community-address">{community.address}</p>
                            <div className="community-footer">
                                <span className="community-status">
                                    {community.president_id ? '✓ Con presidente' : '⚠ Sin presidente'}
                                </span>
                                <div className="community-actions">
                                    <button
                                        className="icon-btn"
                                        onClick={() => handleEdit(community)}
                                        title="Editar"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        className="icon-btn delete-btn"
                                        onClick={() => handleDelete(community.id)}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
