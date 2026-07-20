import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import id from '../locales/id';
import en from '../locales/en';

const LanguageContext = createContext();

const translations = { id, en };

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('id'); // default to Indonesian

  useEffect(() => {
    // Load persisted language preference
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('user_language');
        if (savedLanguage && (savedLanguage === 'id' || savedLanguage === 'en')) {
          setLocale(savedLanguage);
        }
      } catch (error) {
        console.log('Error loading language preference:', error);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (lang) => {
    try {
      setLocale(lang);
      await AsyncStorage.setItem('user_language', lang);
    } catch (error) {
      console.log('Error saving language preference:', error);
    }
  };

  // Translate helper
  const t = (key) => {
    const translation = translations[locale];
    return translation[key] !== undefined ? translation[key] : key;
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export default LanguageContext;
