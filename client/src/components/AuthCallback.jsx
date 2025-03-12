import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // Only process once to prevent duplicate toasts
    if (processed) return;
    console.log('Auth callback URL parameters:', location.search);
    
    const handleAuth = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      
      if (!token) {
        toast.error('Authentication failed', {
          description: 'Could not retrieve authentication token'
        });
        navigate('/login');
        return;
      }
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Extract and store user profile data if available
      const userEmail = params.get('email');
      const userName = params.get('name');
     // Change this line in your handleAuth function
const userPicture = decodeURIComponent(params.get('picture') || '');
      
      if (userEmail || userName || userPicture) {
        const userProfile = {
          email: userEmail || '',
          name: userName || '',
          picture: userPicture || ''
        };
        
        // Store the user profile in localStorage
        localStorage.setItem('user_profile', JSON.stringify(userProfile));
        console.log('Saved user profile to localStorage:', userProfile);
      }
      
      // Get the auth intent from localStorage (set by Login/Register components)
      const authIntent = localStorage.getItem('auth_intent') || 'login';
      
      // Create toast message based on the stored intent
      if (authIntent === 'register') {
        toast.success('Registration successful', {
          description: 'Your account has been created!'
        });
      } else {
        toast.success('Login successful', {
          description: 'Welcome back!'
        });
      }
      
      // Clear the auth intent
      localStorage.removeItem('auth_intent');
      
      // Mark as processed to prevent duplicates
      setProcessed(true);
      
      // Navigate to home page after a small delay
      setTimeout(() => {
        navigate('/');
      }, 100);
    };
    
    handleAuth();
  }, [navigate, location, processed]);

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Processing authentication...</h2>
        <p className="text-gray-500">Please wait while we log you in</p>
      </div>
    </div>
  );
};

export default AuthCallback;