// Импортируем необходимые функции из Firebase
// Импортируем необходимые функции из Firebase
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Конфигурация Firebase
// ВАЖНО: Вставьте сюда свои настройки Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAOX5BqJ-eqWARQdCMmbXBpzaEoijMGQlk",
    authDomain: "fb-spend-tracker.firebaseapp.com",
    projectId: "fb-spend-tracker",
    storageBucket: "fb-spend-tracker.firebasestorage.app",
    messagingSenderId: "442413459404",
    appId: "1:442413459404:web:ba872c1c82d8c5ca221f69",
    measurementId: "G-2F5X227NF3"  
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Функции для работы с аутентификацией
export const registerUser = async (email, password, displayName) => {
  try {
    // Создаем нового пользователя
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Сохраняем дополнительную информацию в Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email,
      displayName,
      createdAt: new Date(),
      facebookApps: [],
    });
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Error during registration:", error);
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Error during login:", error);
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Error during logout:", error);
    return { success: false, error: error.message };
  }
};

// Функции для работы с пользовательскими данными
export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    return { success: false, error: error.message };
  }
};

// Функции для работы с Facebook App ID
export const addFacebookApp = async (userId, appId, appName) => {
  try {
    const userDoc = doc(db, "users", userId);
    const userData = await getDoc(userDoc);
    
    if (userData.exists()) {
      const facebookApps = userData.data().facebookApps || [];
      
      // Проверяем, нет ли уже такого App ID
      if (!facebookApps.some(app => app.appId === appId)) {
        facebookApps.push({
          appId,
          appName,
          addedAt: new Date(),
        });
        
        await updateDoc(userDoc, { facebookApps });
        return { success: true };
      } else {
        return { success: false, error: "This Facebook App ID is already added" };
      }
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error) {
    console.error("Error adding Facebook App:", error);
    return { success: false, error: error.message };
  }
};

export const removeFacebookApp = async (userId, appId) => {
  try {
    const userDoc = doc(db, "users", userId);
    const userData = await getDoc(userDoc);
    
    if (userData.exists()) {
      let facebookApps = userData.data().facebookApps || [];
      facebookApps = facebookApps.filter(app => app.appId !== appId);
      
      await updateDoc(userDoc, { facebookApps });
      return { success: true };
    } else {
      return { success: false, error: "User not found" };
    }
  } catch (error) {
    console.error("Error removing Facebook App:", error);
    return { success: false, error: error.message };
  }
};

export { auth, db };