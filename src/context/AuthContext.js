import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in from previous session
    const checkLoginStatus = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('logged_in_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          // Sync profile photo from database on startup
          try {
            const res = await fetch(`${API_URL}/api/users/${parsed.email}/profile`);
            if (res.ok) {
              const data = await res.json();
              if (data.profilePhoto) {
                const updated = { ...parsed, profilePhoto: data.profilePhoto };
                setUser(updated);
                await AsyncStorage.setItem('logged_in_user', JSON.stringify(updated));
              }
            }
          } catch (e) {
            console.log('Error syncing profile photo from DB:', e);
          }
        }
      } catch (error) {
        console.log('Error checking auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  // Register new user (hit backend API)
  const registerUser = async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'email_exists') {
          throw new Error('email_exists');
        }
        throw new Error(data.error || 'registration_failed');
      }

      return true;
    } catch (error) {
      console.log('Registration error:', error);
      throw error;
    }
  };

  // Login user (hit backend API)
  const loginUser = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'failed_login') {
          throw new Error('failed_login');
        }
        throw new Error(data.error || 'login_failed');
      }

      const sessionUser = data.user;
      
      // Fetch latest profile photo for user on login
      try {
        const res = await fetch(`${API_URL}/api/users/${sessionUser.email}/profile`);
        if (res.ok) {
          const profileData = await res.json();
          if (profileData.profilePhoto) {
            sessionUser.profilePhoto = profileData.profilePhoto;
          }
        }
      } catch (e) {}

      setUser(sessionUser);
      await AsyncStorage.setItem('logged_in_user', JSON.stringify(sessionUser));
      return true;
    } catch (error) {
      console.log('Login error:', error);
      throw error;
    }
  };

  // Update profile photo in state and storage
  const updateUserProfilePhoto = async (photoBase64) => {
    if (!user) return;
    const updated = { ...user, profilePhoto: photoBase64 };
    setUser(updated);
    await AsyncStorage.setItem('logged_in_user', JSON.stringify(updated));
  };

  // Logout user (clear state and local storage)
  const logoutUser = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('logged_in_user');
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, registerUser, loginUser, logoutUser, updateUserProfilePhoto }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

