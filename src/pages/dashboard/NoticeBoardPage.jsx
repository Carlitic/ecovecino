import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { databases, DB_ID, COLLECTIONS } from '../../lib/appwrite';
import { ID, Query } from 'appwrite';
import './NoticeBoardPage.css';

export default function NoticeBoardPage() {
    const { user: currentUser } = useAuth(); // Dynamic user
    const [posts, setPosts] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Forms state
    const [showPostForm, setShowPostForm] = useState(false);
    const [showServiceForm, setShowServiceForm] = useState(false);

    // Data state
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [serviceData, setServiceData] = useState({ id: null, name: '', contact: '', phone: '' });

    const [communities, setCommunities] = useState([]);

    useEffect(() => {
        if (currentUser) {
            fetchData();
            // Appwrite communities logic would go here if needed
        }
    }, [currentUser]);

    const fetchData = async () => {
        try {
            const queries = [];
            // Filtro por comunidad si no es super admin (ajustar según tu lógica de roles en Appwrite)
            if (currentUser?.community_id) {
                queries.push(Query.equal('community_id', currentUser.community_id));
            }

            // Para Posts: Ordenar por creación descendente
            const postsQueries = [...queries, Query.orderDesc('$createdAt')];
            // Para Services: Sin orden específico o por nombre
            const servicesQueries = [...queries];

            const [postsRes, servicesRes] = await Promise.all([
                databases.listDocuments(DB_ID, COLLECTIONS.POSTS, postsQueries),
                databases.listDocuments(DB_ID, COLLECTIONS.SERVICES, servicesQueries)
            ]);

            const loadedPosts = postsRes.documents.map(d => ({ id: d.$id, ...d }));
            const loadedServices = servicesRes.documents.map(d => ({ id: d.$id, ...d }));

            setPosts(loadedPosts);
            setServices(loadedServices);
        } catch (error) {
            console.error("Error cargando tablero:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        try {
            const targetCommunityId = currentUser.community_id || 'default_community';

            const newPostData = {
                title: newPost.title,
                content: newPost.content,
                community_id: targetCommunityId,
                author_id: currentUser.$id,
                // created_at: Automático
            };

            const response = await databases.createDocument(
                DB_ID,
                COLLECTIONS.POSTS,
                ID.unique(),
                newPostData
            );

            setPosts([{ id: response.$id, ...response }, ...posts]);

            setNewPost({ title: '', content: '', community_id: '' });
            setShowPostForm(false);
        } catch (error) {
            console.error("Error creando post:", error);
            alert("Error: " + error.message);
        }
    };

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        try {
            const targetCommunityId = currentUser.community_id || 'default_community';

            if (serviceData.id) {
                // Edit
                const { id, ...dataToUpdate } = serviceData;

                // Limpieza de datos no requeridos
                const updates = {
                    name: dataToUpdate.name,
                    contact: dataToUpdate.contact,
                    phone: dataToUpdate.phone
                };

                await databases.updateDocument(
                    DB_ID,
                    COLLECTIONS.SERVICES,
                    id,
                    updates
                );

                setServices(services.map(s => s.id === serviceData.id ? { ...s, ...updates } : s));
            } else {
                // Create
                const newServiceDesc = {
                    name: serviceData.name,
                    contact: serviceData.contact,
                    phone: serviceData.phone,
                    community_id: targetCommunityId
                };

                const response = await databases.createDocument(
                    DB_ID,
                    COLLECTIONS.SERVICES,
                    ID.unique(),
                    newServiceDesc
                );

                setServices([...services, { id: response.$id, ...newServiceDesc }]);
            }
            setServiceData({ id: null, name: '', contact: '', phone: '', community_id: '' });
            setShowServiceForm(false);
        } catch (error) {
            console.error("Error guardando servicio:", error);
            alert("Error: " + error.message);
        }
    };

    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const deletePost = (id) => {
        setModalConfig({
            isOpen: true,
            title: 'Borrar Anuncio',
            message: '¿Estás seguro de que quieres borrar este anuncio?',
            onConfirm: async () => {
                try {
                    await databases.deleteDocument(DB_ID, COLLECTIONS.POSTS, id);
                    setPosts(prev => prev.filter(p => p.id !== id));
                    setModalConfig({ ...modalConfig, isOpen: false });
                } catch (error) {
                    console.error("Error borrando post:", error);
                }
            }
        });
    };

    const deleteService = (id) => {
        setModalConfig({
            isOpen: true,
            title: 'Eliminar Servicio',
            message: '¿Estás seguro de que quieres eliminar este servicio de contacto?',
            onConfirm: async () => {
                try {
                    await databases.deleteDocument(DB_ID, COLLECTIONS.SERVICES, id);
                    setServices(prev => prev.filter(s => s.id !== id));
                    setModalConfig({ ...modalConfig, isOpen: false });
                } catch (error) {
                    console.error("Error borrando servicio:", error);
                }
            }
        });
    };

    const editService = (service) => {
        setServiceData({
            ...service,
            community_id: service.community_id || ''
        });
        setShowServiceForm(true);
    };

    const canManage = currentUser.role === 'president' || currentUser.role === 'super_admin';

    if (loading) return <div className="p-4">Cargando tablero...</div>;

    return (
        <div className="notice-board-page">
            <div className="page-header">
                <div>
                    <h1>Tablón de Anuncios</h1>
                    <p>Información y avisos de la comunidad</p>
                </div>
                {canManage && (
                    <div className="header-actions" style={{ display: 'flex', gap: '1rem' }}>
                        <Button onClick={() => {
                            setServiceData({ id: null, name: '', contact: '', phone: '', community_id: '' });
                            setShowServiceForm(!showServiceForm);
                        }} variant="secondary">
                            <Plus size={18} /> Servicio
                        </Button>
                        <Button onClick={() => {
                            setNewPost({ title: '', content: '', community_id: '' });
                            setShowPostForm(!showPostForm);
                        }}>
                            <Plus size={18} /> Anuncio
                        </Button>
                    </div>
                )}
            </div>

            {showPostForm && (
                <Card className="post-form">
                    <h3>Publicar nuevo anuncio</h3>
                    <form onSubmit={handlePostSubmit} className="form-grid">
                        {currentUser.role === 'super_admin' && (
                            <div className="input-group">
                                <label className="input-label">Comunidad <span className="required">*</span></label>
                                <select
                                    className="input"
                                    value={newPost.community_id}
                                    onChange={(e) => setNewPost({ ...newPost, community_id: e.target.value })}
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
                            placeholder="Ej: Horario de limpieza modificado"
                            value={newPost.title}
                            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                            required
                        />
                        <div className="input-group">
                            <label className="input-label">Contenido <span className="required">*</span></label>
                            <textarea
                                className="input"
                                rows="4"
                                placeholder="Escribe el contenido del anuncio..."
                                value={newPost.content}
                                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <Button type="button" variant="ghost" onClick={() => setShowPostForm(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Publicar</Button>
                        </div>
                    </form>
                </Card>
            )}

            {showServiceForm && (
                <Card className="post-form">
                    <h3>{serviceData.id ? 'Editar Servicio' : 'Nuevo Servicio de Contacto'}</h3>
                    <form onSubmit={handleServiceSubmit} className="form-grid">
                        {currentUser.role === 'super_admin' && (
                            <div className="input-group">
                                <label className="input-label">Comunidad <span className="required">*</span></label>
                                <select
                                    className="input"
                                    value={serviceData.community_id}
                                    onChange={(e) => setServiceData({ ...serviceData, community_id: e.target.value })}
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
                            label="Servicio"
                            placeholder="Ej: Fontanería Urgente"
                            value={serviceData.name}
                            onChange={(e) => setServiceData({ ...serviceData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Nombre Contacto"
                            placeholder="Ej: Pedro Martínez"
                            value={serviceData.contact}
                            onChange={(e) => setServiceData({ ...serviceData, contact: e.target.value })}
                            required
                        />
                        <Input
                            label="Teléfono"
                            placeholder="600 000 000"
                            value={serviceData.phone}
                            onChange={(e) => setServiceData({ ...serviceData, phone: e.target.value })}
                            required
                        />
                        <div className="form-actions">
                            <Button type="button" variant="ghost" onClick={() => {
                                setShowServiceForm(false);
                                setServiceData({ id: null, name: '', contact: '', phone: '', community_id: '' });
                            }}>
                                Cancelar
                            </Button>
                            <Button type="submit">Guardar</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="board-grid">
                <div className="posts-section">
                    <h2>Anuncios</h2>
                    {posts.length === 0 ? <p>No hay anuncios.</p> : (
                        <div className="posts-list">
                            {posts.map(post => (
                                <Card key={post.id} className="post-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h3>{post.title}</h3>
                                        {canManage && (
                                            <button
                                                className="icon-btn delete-btn"
                                                onClick={() => deletePost(post.id)}
                                                title="Borrar anuncio"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <p>{post.content}</p>
                                    <span className="post-date">
                                        {post.$createdAt ? new Date(post.$createdAt).toLocaleDateString('es-ES') : ''}
                                    </span>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <div className="services-section">
                    <h2>Servicios de Contacto</h2>
                    <div className="services-list">
                        {services.map(service => (
                            <Card key={service.id} className="service-card">
                                <div className="service-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <h4>{service.name}</h4>
                                    {canManage && (
                                        <div className="service-actions" style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button className="icon-btn" onClick={() => editService(service)}>
                                                <Edit size={14} />
                                            </button>
                                            <button className="icon-btn delete-btn" onClick={() => deleteService(service.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="service-contact">{service.contact}</p>
                                <a href={`tel:${service.phone} `} className="service-phone">
                                    📞 {service.phone}
                                </a>
                            </Card>
                        ))}
                    </div>
                </div>
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
