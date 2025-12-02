import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AppUser } from '../types';
import api from '../utils/api';
import { useToast } from './ToastContext'; // 🟢 Import

interface AuthContextType {
  user: AppUser | null;
  users: AppUser[];
  financialYear: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, year: string) => Promise<void>;
  logout: () => void;
  addUser: (user: AppUser) => Promise<void>;
  updateUser: (user: AppUser) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [financialYear, setFinancialYear] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const toast = useToast(); // 🟢 Init Toast

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const storedSession = localStorage.getItem('authUser');
      const storedYear = localStorage.getItem('authYear');
      
      if (storedSession) {
        const parsedUser = JSON.parse(storedSession);
        setUser(parsedUser);
        
        if (parsedUser.role === 'admin') {
          try {
            const { data } = await api.get('/users');
            setUsers(data);
          } catch (e) {
            console.error("Could not load users on init", e);
          }
        }
      }
      
      if (storedYear) setFinancialYear(storedYear);
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string, year: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      
      setUser(data); 
      setFinancialYear(year);
      
      localStorage.setItem('authUser', JSON.stringify(data));
      localStorage.setItem('authYear', year);
      
      if (data.role === 'admin') {
        await fetchUsers();
      }
      
      toast.success(`Welcome back, ${data.name}!`); // 🟢 Success Toast
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg); // 🟢 Error Toast
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
      setFinancialYear(null);
      setUsers([]);
      localStorage.removeItem('authUser');
      localStorage.removeItem('authYear');
      toast.success("Logged out successfully"); // 🟢 Success Toast
      navigate('/login');
    }
  };

  const addUser = async (userData: AppUser) => {
    try {
      const { data } = await api.post('/users', userData);
      setUsers(prev => [...prev, data]);
      toast.success("User added successfully"); // 🟢
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add user"); // 🟢
    }
  };

  const updateUser = async (userData: AppUser) => {
    try {
      const { data } = await api.put(`/users/${userData.id}`, userData);
      setUsers(prev => prev.map(u => u.id === data.id ? data : u));
      
      if (user && user.id === data.id) {
        const updatedSession = { ...user, ...data, token: user['token' as keyof AppUser] }; 
        setUser(updatedSession);
        localStorage.setItem('authUser', JSON.stringify(updatedSession));
      }
      toast.success("User updated successfully"); // 🟢
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user"); // 🟢
    }
  };

  const deleteUser = async (id: string) => {
    if (user && user.id === id) {
      toast.error("You cannot delete your own account."); // 🟢
      return;
    }
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success("User deleted successfully"); // 🟢
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete user"); // 🟢
    }
  };

  const value = {
    user,
    users,
    financialYear,
    loading,
    error,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    refreshUsers: fetchUsers
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};