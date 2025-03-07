import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, getUserData } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Создаем контекст аутентификации
export const AuthContext = createContext();

// Хук для использования контекста аутентификации
export const useAuth = () => {
  return useContext(AuthContext);
};

// Провайдер контекста аутентификации
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Эффект для отслеживания состояния аутентификации
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Загружаем дополнительные данные пользователя из Firestore
        const response = await getUserData(user.uid);
        if (response.success) {
          setUserData(response.data);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    // Отписка при размонтировании компонента
    return unsubscribe;
  }, []);

  // Значение контекста
  const value = {
    currentUser,
    userData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};