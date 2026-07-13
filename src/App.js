import { useState } from 'react';
import './App.css';
import DashboardAdministrador from './Dashboard/dashboardAdministrador';
import DashboardUsuarios from './Dashboard/dashboardUsuarios';
import Loing from './Auth/Loing';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [currentView, setCurrentView] = useState('store'); // 'store' o 'login'

  if (isAuthenticated) {
    return (
      <DashboardAdministrador
        loggedUser={loggedUser}
        onLogout={() => {
          setIsAuthenticated(false);
          setLoggedUser(null);
          setCurrentView('store');
        }}
      />
    );
  }

  return currentView === 'store' ? (
    <DashboardUsuarios onNavigateToLogin={() => setCurrentView('login')} />
  ) : (
    <Loing
      onLogin={(user) => {
        setIsAuthenticated(true);
        setLoggedUser(user);
      }}
      onBackToStore={() => setCurrentView('store')}
    />
  );
}

export default App;

