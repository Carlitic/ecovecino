import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import DashboardLayout from './components/layout/DashboardLayout';
import LandingPage from './pages/public/LandingPage';
import AboutPage from './pages/public/AboutPage';
import LoginPage from './pages/public/LoginPage';
import NoticeBoardPage from './pages/dashboard/NoticeBoardPage';
import IncidentsPage from './pages/dashboard/IncidentsPage';
import MeetingsPage from './pages/dashboard/MeetingsPage';
import NeighborsPage from './pages/dashboard/NeighborsPage';
import CommunitiesPage from './pages/dashboard/CommunitiesPage';

function App() {
  return (
    <Routes>
      {/* Public routes with Navbar */}
      <Route path="/" element={<><Navbar /><LandingPage /></>} />
      <Route path="/about" element={<><Navbar /><AboutPage /></>} />
      <Route path="/login" element={<><Navbar /><LoginPage /></>} />

      {/* Dashboard routes */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<NoticeBoardPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="meetings" element={<MeetingsPage />} />
        <Route path="neighbors" element={<NeighborsPage />} />
        <Route path="communities" element={<CommunitiesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
