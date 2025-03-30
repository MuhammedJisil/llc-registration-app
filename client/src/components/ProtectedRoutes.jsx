import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// User Protected Route Component
export const UserProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userProfile = localStorage.getItem('user_profile');
      
      if (token && userProfile) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
    
    // Listen for authentication changes
    window.addEventListener('user-logged-in', checkAuth);
    window.addEventListener('user-logged-out', checkAuth);
    
    return () => {
      window.removeEventListener('user-logged-in', checkAuth);
      window.removeEventListener('user-logged-out', checkAuth);
    };
  }, []);

  if (isLoading) {
    // You can replace this with a loading spinner or component
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page with return path
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

// Admin Protected Route Component
export const AdminProtectedRoute = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check if admin is authenticated
    const checkAdminAuth = () => {
      const adminToken = localStorage.getItem('adminToken');
      const adminInfo = localStorage.getItem('adminInfo');
      
      if (adminToken && adminInfo) {
        setIsAdminAuthenticated(true);
      } else {
        setIsAdminAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAdminAuth();
    
    // Listen for authentication changes
    const handleLogin = (e) => {
      if (e.detail?.isAdmin) {
        checkAdminAuth();
      }
    };
    
    window.addEventListener('user-logged-in', handleLogin);
    window.addEventListener('admin-logged-out', checkAdminAuth);
    
    return () => {
      window.removeEventListener('user-logged-in', handleLogin);
      window.removeEventListener('admin-logged-out', checkAdminAuth);
    };
  }, []);

  if (isLoading) {
    // You can replace this with a loading spinner or component
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAdminAuthenticated) {
    // Redirect to admin login page with return path
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};