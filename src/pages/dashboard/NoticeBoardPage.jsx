import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
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

    const fetchData = async () => {
        try {
            if (!currentUser.community_id && currentUser.role !== 'super_admin') {
                setLoading(false);
                return;
            }

            let postsQuery, servicesQuery;

            if (currentUser.role === 'super_admin') {
                postsQuery = collection(db, "posts");
                servicesQuery = collection(db, "services");
            } else {
                postsQuery = query(collection(db, "posts"), where("community_id", "==", currentUser.community_id));
                servicesQuery = query(collection(db, "services"), where("community_id", "==", currentUser.community_id));
            }

            const [postsSnap, servicesSnap] = await Promise.all([
                getDocs(postsQuery),
                getDocs(servicesQuery)
            ]);

            const loadedPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Ordenar por fecha descending
            loadedPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setPosts(loadedPosts);
            setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error("Error cargando tablero:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        try {
            const targetCommunityId = currentUser.role === 'super_admin'
                ? newPost.community_id
                : currentUser.community_id;

            if (!targetCommunityId) {
                alert("Debes seleccionar una comunidad");
                return;
            }

            const newPostData = {
                title: newPost.title,
                content: newPost.content,
                community_id: targetCommunityId,
                author_id: currentUser.uid || currentUser.id,
                created_at: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, "posts"), newPostData);
            setPosts([{ id: docRef.id, ...newPostData }, ...posts]);

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
            const targetCommunityId = currentUser.role === 'super_admin'
                ? serviceData.community_id
                : currentUser.community_id;

            if (!targetCommunityId) {
                alert("Debes seleccionar una comunidad");
                return;
            }

            if (serviceData.id) {
                // Edit
                const docRef = doc(db, "services", serviceData.id);
                const { id, ...dataToUpdate } = serviceData;

                // Allow updating community if super_admin
                if (currentUser.role === 'super_admin') {
                    dataToUpdate.community_id = targetCommunityId;
                }

                await updateDoc(docRef, dataToUpdate);

                setServices(services.map(s => s.id === serviceData.id ? { ...s, ...dataToUpdate, community_id: targetCommunityId } : s));
            } else {
                // Create
                const newServiceDesc = {
                    name: serviceData.name,
                    contact: serviceData.contact,
                    phone: serviceData.phone,
                    community_id: targetCommunityId
                };
                const docRef = await addDoc(collection(db, "services"), newServiceDesc);
                setServices([...services, { id: docRef.id, ...newServiceDesc }]);
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
                    await deleteDoc(doc(db, "posts", id));
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
                    await deleteDoc(doc(db, "services", id));
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
                                        {post.created_at ? new Date(post.created_at).toLocaleDateString('es-ES') : ''}
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
