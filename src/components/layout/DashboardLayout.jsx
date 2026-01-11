import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, Building, Users, AlertCircle, Calendar, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './DashboardLayout.css';

export default function DashboardLayout() {
    const { user: currentUser, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Redirect to login if no user
    if (!currentUser) return <Navigate to="/login" replace />;

    const isActive = (path) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getPanelTitle = () => {
        switch (currentUser.role) {
            case 'super_admin': return 'Panel de Administración';
            case 'president': return 'Panel de Presidencia';
            default: return 'Área de Vecinos';
        }
    };

    const NAV_ITEMS = [
        { path: '/dashboard', label: 'Tablón', icon: MessageSquare, roles: ['super_admin', 'president', 'owner', 'tenant'] },
        { path: '/dashboard/communities', label: 'Comunidades', icon: Building, roles: ['super_admin'] },
        { path: '/dashboard/neighbors', label: 'Vecinos', icon: Users, roles: ['super_admin', 'president'] },
        { path: '/dashboard/incidents', label: 'Incidencias', icon: AlertCircle, roles: ['super_admin', 'president', 'owner', 'tenant'] },
        { path: '/dashboard/meetings', label: 'Juntas', icon: Calendar, roles: ['super_admin', 'president', 'owner', 'tenant'] },
    ];

    const filteredNavItems = NAV_ITEMS.filter(item => item.roles.includes(currentUser.role));

    return (
        <div className="dashboard-layout">
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Eco Vecinos" className="sidebar-logo" />
                    <div className="user-info">
                        <p className="user-name">{currentUser.name}</p>
                        <span className="panel-badge">{getPanelTitle()}</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {filteredNavItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="nav-item logout-btn">
                        <LogOut size={20} />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <Outlet />
            </main>
        </div>
    );
}
