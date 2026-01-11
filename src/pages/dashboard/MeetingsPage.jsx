import { useState, useEffect } from 'react';
import { Plus, Video, Calendar as CalendarIcon, MapPin, Clock, X, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { databases, DB_ID, COLLECTIONS } from '../../lib/appwrite';
import { ID, Query } from 'appwrite';
import './MeetingsPage.css';

export default function MeetingsPage() {
    const { user: currentUser } = useAuth();
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeMeeting, setActiveMeeting] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [newMeeting, setNewMeeting] = useState({ title: '', description: '', date: '', time: '', location: '' });

    useEffect(() => {
        if (currentUser) {
            fetchMeetings();
        }
    }, [currentUser]);

    const fetchMeetings = async () => {
        try {
            let queries = [];

            if (currentUser?.community_id) {
                queries.push(Query.equal('community_id', currentUser.community_id));
            }

            // Ordenar por fecha del campo 'date' descendente
            queries.push(Query.orderDesc('date'));

            const response = await databases.listDocuments(
                DB_ID,
                COLLECTIONS.MEETINGS,
                queries
            );

            const data = response.documents.map(doc => ({
                id: doc.$id,
                ...doc
            }));

            setMeetings(data);
        } catch (error) {
            console.error("Error loading meetings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const meetingData = {
                title: newMeeting.title,
                description: newMeeting.description,
                date: newMeeting.date, // Asegurarse de que el formato sea compatible con DateTime de Appwrite (ISO)
                time: newMeeting.time,
                location: newMeeting.location || 'Virtual (Videollamada)',
                community_id: currentUser.community_id || 'default_community',
                // created_by: currentUser.$id // Usaremos author_id si existe en el esquema, o no lo enviamos si no
            };

            const response = await databases.createDocument(
                DB_ID,
                COLLECTIONS.MEETINGS,
                ID.unique(),
                meetingData
            );

            setMeetings([{ id: response.$id, ...response }, ...meetings]);

            setNewMeeting({ title: '', description: '', date: '', time: '', location: '' });
            setShowForm(false);
        } catch (error) {
            console.error("Error creating meeting:", error);
            alert("Error: " + error.message);
        }
    };

    const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const handleDelete = (id) => {
        setModalConfig({
            isOpen: true,
            title: 'Cancelar Junta',
            message: '¿Estás seguro de que quieres cancelar esta junta? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    await databases.deleteDocument(DB_ID, COLLECTIONS.MEETINGS, id);
                    setMeetings(prev => prev.filter(m => m.id !== id));
                    setModalConfig({ ...modalConfig, isOpen: false });
                } catch (error) {
                    console.error("Error deleting meeting:", error);
                }
            }
        });
    };

    if (loading) return <div className="p-4">Cargando juntas...</div>;

    if (activeMeeting) {
        return (
            <div className="video-call-container">
                <div className="video-header">
                    <h2>Junta en curso: {activeMeeting.title}</h2>
                    <Button variant="secondary" onClick={() => setActiveMeeting(null)}>
                        <X size={18} /> Salir de la junta
                    </Button>
                </div>
                <div className="video-frame">
                    <iframe
                        src={`https://meet.jit.si/eco-vecinos-${activeMeeting.id}`}
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        title="Videollamada"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="meetings-page">
            <div className="page-header">
                <div>
                    <h1>Juntas de Vecinos</h1>
                    <p>Próximas reuniones de la comunidad</p>
                </div>
                {(currentUser.role === 'president' || currentUser.role === 'super_admin') && (
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus size={18} /> Convocar junta
                    </Button>
                )}
            </div>

            {showForm && (
                <Card className="meeting-form" style={{ marginBottom: '2rem' }}>
                    <h3>Convocar nueva junta</h3>
                    <form className="form-grid" onSubmit={handleSubmit}>
                        <Input
                            label="Título"
                            placeholder="Ej: Junta Ordinaria"
                            value={newMeeting.title}
                            onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                            required
                        />
                        <div className="input-group">
                            <label className="input-label">Descripción</label>
                            <textarea
                                className="input"
                                rows="3"
                                value={newMeeting.description}
                                onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                            />
                        </div>
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label="Fecha"
                                type="date"
                                value={newMeeting.date}
                                onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                                required
                            />
                            <Input
                                label="Hora"
                                type="time"
                                value={newMeeting.time}
                                onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                                required
                            />
                        </div>
                        <Input
                            label="Ubicación"
                            placeholder="Dejar vacío para solo virtual"
                            value={newMeeting.location}
                            onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                        />
                        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit">Convocar</Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="meetings-grid">
                {meetings.length === 0 ? <p>No hay juntas programadas.</p> : (
                    meetings.map(meeting => (
                        <Card key={meeting.id} className="meeting-card">
                            <div className="meeting-date-badge">
                                <span className="month">DIC</span>
                                <span className="day">{meeting.date ? new Date(meeting.date).getDate() : '?'}</span>
                            </div>
                            <div className="meeting-content">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3>{meeting.title}</h3>
                                    {(currentUser.role === 'president' || currentUser.role === 'super_admin') && (
                                        <button
                                            className="icon-btn delete-btn"
                                            onClick={() => handleDelete(meeting.id)}
                                            title="Cancelar junta"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <p>{meeting.description}</p>
                                <div className="meeting-details">
                                    <div className="detail-item">
                                        <Clock size={16} />
                                        <span>{meeting.time}</span>
                                    </div>
                                    <div className="detail-item">
                                        <MapPin size={16} />
                                        <span>{meeting.location}</span>
                                    </div>
                                </div>
                                <Button
                                    className="join-btn"
                                    onClick={() => setActiveMeeting(meeting)}
                                >
                                    <Video size={18} /> Unirse a videollamada
                                </Button>
                            </div>
                        </Card>
                    ))
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
