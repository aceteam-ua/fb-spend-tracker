import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../firebase';
import { useNavigate } from 'react-router-dom';
import FBSpendTracker from './FBSpendTracker';

const Dashboard = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeAppId, setActiveAppId] = useState('2994373674073993'); // Дефолтный App ID
  const navigate = useNavigate();

  // Устанавливаем активный App ID из списка пользовательских приложений при загрузке
  useEffect(() => {
    if (userData && userData.facebookApps && userData.facebookApps.length > 0) {
      setActiveAppId(userData.facebookApps[0].appId);
    }
  }, [userData]);

  const handleLogout = async () => {
    try {
      setError('');
      setLoading(true);
      
      const result = await logoutUser();
      
      if (result.success) {
        navigate('/login');
      } else {
        setError(result.error || 'Ошибка при выходе');
      }
    } catch (error) {
      setError('Ошибка при выходе: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            Facebook Spend Tracker
          </h1>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {userData?.displayName || currentUser?.email}
            </span>
            
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none"
              disabled={loading}
            >
              {loading ? 'Выход...' : 'Выйти'}
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Основной компонент трекера с активным App ID */}
        <FBSpendTracker appId={activeAppId} />
      </main>
    </div>
  );
};

export default Dashboard;