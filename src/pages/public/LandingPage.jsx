import { Link } from 'react-router-dom';
import { ArrowRight, Building, Users, ShieldCheck, Zap } from 'lucide-react';
import Button from '../../components/ui/Button';
import './LandingPage.css';

export default function LandingPage() {
    return (
        <div className="landing-page">
            <section className="hero">
                <div className="container">
                    <div className="hero-content">

                        <h1>
                            Gestión de Comunidades <br />
                            <span className="gradient-text">Inteligente y Sostenible</span>
                        </h1>
                        <p className="hero-description">
                            Olvídate del papel y los chats desordenados. Eco Vecinos centraliza
                            incidencias, juntas y votaciones en una plataforma diseñada para la
                            tranquilidad de tu hogar.
                        </p>
                        <div className="hero-buttons">
                            <Link to="/login">
                                <Button size="lg">
                                    Empezar ahora <ArrowRight size={18} />
                                </Button>
                            </Link>
                            <Link to="/about">
                                <Button variant="outline" size="lg">
                                    Conocer más
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="features section">
                <div className="container">
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <Zap size={24} />
                            </div>
                            <h3>Incidencias en tiempo real</h3>
                            <p>Reporta averías desde el móvil y sigue su estado hasta la reparación. Sin intermediarios.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <Users size={24} />
                            </div>
                            <h3>Juntas Virtuales</h3>
                            <p>Asiste a las reuniones desde el sofá. Vota decisiones importantes con un solo clic.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <ShieldCheck size={24} />
                            </div>
                            <h3>Transparencia Total</h3>
                            <p>Accede a las actas, cuentas y tablón de anuncios oficial. Todo claro, todo seguro.</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">
                                <Building size={24} />
                            </div>
                            <h3>Multi-Comunidad</h3>
                            <p>¿Tienes una segunda residencia? Gestiona todas tus propiedades desde una única cuenta.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
