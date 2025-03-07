import React, { useState } from 'react';
import { loginUser } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      // Сохраняем настройку "Запомнить меня"
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
      
      const result = await loginUser(email, password);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Ошибка входа');
      }
    } catch (error) {
      setError('Ошибка входа: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
          Вход в Facebook Spend Tracker
        </h2>
        
        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700" htmlFor="password">
              Пароль
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="rememberMe"
              className="w-4 h-4 text-blue-600 border border-gray-300 rounded focus:ring-blue-500"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="ml-2 text-sm text-gray-700" htmlFor="rememberMe">
              Запомнить меня
            </label>
          </div>
          
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Еще нет аккаунта?{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-700">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;