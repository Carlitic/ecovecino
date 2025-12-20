import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Building, KeyRound, Shield } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
// import { mockCommunities } from '../../lib/mockData'; // Removed
import { db } from '../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './LoginPage.css';

import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
    const { login, signup } = useAuth();
    // ...
    const [isLogin, setIsLogin] = useState(true);
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'owner',
        community_id: '',
        unit: ''
    });

    const [communities, setCommunities] = useState([]);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "communities"));
                const comms = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCommunities(comms);
            } catch (error) {
                console.error("Error fetching communities:", error);
            }
        };
        fetchCommunities();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await signup(formData);
            }
            navigate('/dashboard');
        } catch (error) {
            console.error("Authentication error:", error);
            alert("Error de autenticación: " + error.message);
        }
    };

    return (
        <div className="login-page">
            <Card className="login-card">
                <div className="login-header">
                    <h2>{isLogin ? 'Bienvenido de nuevo' : 'Únete a Eco Vecinos'}</h2>
                    <p>{isLogin ? 'Accede a tu comunidad' : 'Gestiona tu comunidad de forma eficiente'}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {!isLogin && (
                        <>
                            <Input
                                label="Nombre completo"
                                type="text"
                                name="name"
                                placeholder="Juan Pérez"
                                value={formData.name}
                                onChange={handleChange}
                                icon={User}
                                required
                            />

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <Input
                                    label="Teléfono"
                                    type="tel"
                                    name="phone"
                                    placeholder="600 000 000"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    icon={Phone}
                                    required
                                />
                                <Input
                                    label="Piso / Puerta"
                                    type="text"
                                    name="unit"
                                    placeholder="Ej: 1º A"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    icon={Building}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Rol en la comunidad <span className="required">*</span></label>
                                <div className="role-selector" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                    <button
                                        type="button"
                                        className={`role-btn ${formData.role === 'president' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, role: 'president' })}
                                    >
                                        <KeyRound size={16} /> Presidente
                                    </button>
                                    <button
                                        type="button"
                                        className={`role-btn ${formData.role === 'owner' ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, role: 'owner' })}
                                    >
                                        <User size={16} /> Vecino
                                    </button>
                                </div>
                            </div>

                            {formData.role === 'owner' && (
                                <div className="input-group" style={{ marginTop: '0.5rem' }}>
                                    <label className="input-label">Comunidad <span className="required">*</span></label>
                                    <div className="input-wrapper">
                                        <Building className="input-icon" size={18} />
                                        <select
                                            name="community_id"
                                            value={formData.community_id}
                                            onChange={handleChange}
                                            required
                                            className="input input-with-icon"
                                        >
                                            <option value="">-- Seleccionar comunidad --</option>
                                            {communities.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <Input
                        label="Correo electrónico"
                        type="email"
                        name="email"
                        placeholder="tu@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        icon={Mail}
                        required
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        icon={Lock}
                        required
                    />

                    <Button type="submit" className="btn-block">
                        {isLogin ? 'Iniciar sesión' : 'Registrarse'}
                    </Button>
                </form>

                <div className="login-footer">
                    <p>
                        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="toggle-btn"
                        >
                            {isLogin ? 'Regístrate' : 'Inicia sesión'}
                        </button>
                    </p>
                </div>
            </Card>
        </div>
    );
}
