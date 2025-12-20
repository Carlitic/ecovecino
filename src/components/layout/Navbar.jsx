import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import './Navbar.css';

export default function Navbar() {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark' ||
                (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
        return false;
    });

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    return (
        <nav className="navbar">
            <div className="navbar-container container">
                <Link to="/" className="navbar-logo">
                    <img src="/logo.png" alt="Eco Vecinos" className="logo-img" />
                    <span>Eco Vecinos</span>
                </Link>

                <div className="navbar-links">
                    <Link to="/" className="nav-link">Inicio</Link>
                    <Link to="/about" className="nav-link">Sobre Nosotros</Link>
                    <button
                        onClick={() => setIsDark(!isDark)}
                        className="theme-toggle"
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <Link to="/login">
                        <Button size="sm">Acceder</Button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
