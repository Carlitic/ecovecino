import { User, Code, Heart, Github } from 'lucide-react';
import Card from '../../components/ui/Card';
import './AboutPage.css';

export default function AboutPage() {
    return (
        <div className="about-page page-wrapper">
            <div className="container">
                <div className="about-header">
                    <h1>Sobre <span className="text-primary">Eco Vecinos</span></h1>
                    <p>Una iniciativa tecnológica para modernizar la convivencia.</p>
                </div>

                <Card className="author-card">
                    <div className="author-avatar">
                        <User size={48} />
                    </div>
                    <h2>Carlos Javier Castaños Blanco</h2>
                    <span className="role-badge">Desarrollador Full Stack & Estudiante DAW</span>

                    <p className="bio">
                        Apasionado por la tecnología y la sostenibilidad. Creé Eco Vecinos como proyecto
                        de 1º de DAW para resolver un problema real: la falta de transparencia y agilidad
                        en las comunidades de vecinos. Mi objetivo es simplificar la vida a las personas
                        mediante software intuitivo y accesible.
                    </p>

                    <div className="social-links">
                        <a href="https://github.com/carlitic" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="GitHub">
                            <Github size={20} />
                        </a>
                    </div>
                </Card>

                <div className="mission-grid">
                    <Card className="mission-card">
                        <Code size={32} className="mission-icon" />
                        <h3>Código Limpio</h3>
                        <p>Desarrollado con las últimas tecnologías web para garantizar velocidad y seguridad.</p>
                    </Card>
                    <Card className="mission-card">
                        <Heart size={32} className="mission-icon" />
                        <h3>Hecho con Pasión</h3>
                        <p>Cada línea de código está pensada para mejorar la experiencia del usuario final.</p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
