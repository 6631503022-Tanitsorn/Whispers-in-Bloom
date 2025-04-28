import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEMES = {
  default: {
    primary: '#FF6B6B',
    secondary: '#FFE5E5',
    background: ['#FFE5E5', '#F8F8F8'],
  },
  sunset: {
    primary: '#FF9F1C',
    secondary: '#FFE5D9',
    background: ['#FFE5D9', '#F8F8F8'],
  },
  ocean: {
    primary: '#06D6A0',
    secondary: '#E5FFF9',
    background: ['#E5FFF9', '#F8F8F8'],
  },
  lavender: {
    primary: '#B388FF',
    secondary: '#F3E5FF',
    background: ['#F3E5FF', '#F8F8F8'],
  },
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('appTheme');
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const updateTheme = async (theme) => {
    try {
      setCurrentTheme(theme);
      await AsyncStorage.setItem('appTheme', theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        theme: THEMES[currentTheme],
        updateTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}; 