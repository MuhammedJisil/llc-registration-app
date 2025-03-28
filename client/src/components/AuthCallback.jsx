import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    // Use a more robust check to prevent multiple processing
    if (processed || localStorage.getItem('auth_processed')) {
      console.log('Authentication already processed');
      return;
    }

    const handleAuth = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (!token) {
          toast.error('Authentication failed', {
            description: 'Could not retrieve authentication token'
          });
          navigate('/login');
          return;
        }

        // Store token and mark as processed
        localStorage.setItem('token', token);
        localStorage.setItem('auth_processed', 'true');

        // Extract user profile
        const userEmail = params.get('email');
        const userName = params.get('name');
        const userPicture = decodeURIComponent(params.get('picture') || '');

        const userProfile = {
          email: userEmail || '',
          name: userName || '',
          picture: userPicture || ''
        };

        localStorage.setItem('user_profile', JSON.stringify(userProfile));

        // Get the auth intent
        const authIntent = localStorage.getItem('auth_intent') || 'login';

        // Show toast based on intent
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

        // Set processed state
        setProcessed(true);

        // Navigate after a short delay
        setTimeout(() => {
          navigate('/');
          
          // Clear the processed flag after navigation
          localStorage.removeItem('auth_processed');
        }, 100);

      } catch (error) {
        console.error('Authentication callback error:', error);
        toast.error('Authentication failed', {
          description: error.message
        });
        navigate('/login');
      }
    };

    // Only call handleAuth if not already processed
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