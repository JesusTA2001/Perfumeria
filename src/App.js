import { useState } from 'react';
import './App.css';
import DashboardAdministrador from './Dashboard/dashboardAdministrador';
import DashboardUsuarios from './Dashboard/dashboardUsuarios';
import Loing from './Auth/Loing';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('store'); // 'store' o 'login'

  if (isAuthenticated) {
    return (
      <DashboardAdministrador
        onLogout={() => {
          setIsAuthenticated(false);
          setCurrentView('store');
        }}
      />
    );
  }

  return currentView === 'store' ? (
    <DashboardUsuarios onNavigateToLogin={() => setCurrentView('login')} />
  ) : (
    <Loing
      onLogin={() => setIsAuthenticated(true)}
      onBackToStore={() => setCurrentView('store')}
    />
  );
}

export default App;

