import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BASE_URL } from '@/lib/config';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Check for auth callback from Google login
    const checkGoogleAuthCallback = async () => {
      const authIntent = localStorage.getItem('auth_intent');
      const token = localStorage.getItem('token');

      if (authIntent === 'login' && token) {
        try {
          // Fetch user profile after Google login
          const profileFetched = await fetchUserProfile(token);
          
          if (profileFetched) {
            toast.success('Login Successful', {
              description: 'You have been logged in successfully'
            });
            navigate('/dashboard');
          }

          // Clear the auth intent
          localStorage.removeItem('auth_intent');
        } catch (error) {
          console.error('Google login callback error:', error);
          toast.error('Login Failed', {
            description: 'Unable to complete login process'
          });
        }
      }
    };

    checkGoogleAuthCallback();
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${BASE_URL}/api/user/profile`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Store user profile in localStorage
        const profileData = {
          id: data.user.id,
          name: data.user.full_name || data.user.username || 'User',
          email: data.user.email,
          role: data.user.role || 'User',
          picture: data.user.picture || '' // Add picture logic if needed
        };

        localStorage.setItem('user_profile', JSON.stringify(profileData));
        
        // Dispatch custom event to update header
        window.dispatchEvent(new Event('user-logged-in'));
        
        return true;
      } else {
        throw new Error(data.message || 'Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Unable to fetch user profile', {
        description: error.message
      });
      return false;
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      
      // Fetch and store user profile
      const profileFetched = await fetchUserProfile(data.token);

      if (profileFetched) {
        toast.success('Login Successful', {
          description: 'You have been logged in successfully'
        });
        navigate('/');
      } else {
        // Fallback navigation if profile fetch fails
        navigate('/');
      }
    } catch (error) {
      toast.error('Login failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Store the intent in localStorage to help AuthCallback know this was a login
    localStorage.setItem('auth_intent', 'login');
    // Use the full URL to the backend endpoint
    window.location.href = `${BASE_URL}/api/auth/google`;
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-r from-[#0A1933] to-[#193366] pt-[60px]">
      {/* Welcome Banner - Left Side */}
      <div className="md:w-1/2 flex flex-col justify-center p-8 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Welcome <span className="text-[#FFD700]">Back</span>
          </h1>
          <p className="text-lg mb-6 text-gray-300">
            Sign in to your account to manage your LLC registrations and access exclusive features.
          </p>
          <div className="bg-[#20B2AA]/10 rounded-lg p-4 border border-[#20B2AA]/30">
            <h3 className="text-[#FFD700] font-semibold text-lg mb-2">Elite LLC Advantages</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#20B2AA]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Fast and secure LLC registration
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#20B2AA]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                All-states coverage
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#20B2AA]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                24/7 expert support
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Login Form - Right Side */}
      <div className="md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md bg-[#0A1933]/70 border border-[#20B2AA]/30 shadow-xl text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">
              <span className="text-[#FFD700]">Elite</span>
              <span className="ml-1 text-[#20B2AA]">LLC</span> Login
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`bg-[#0A1933] border border-gray-600 focus:border-[#20B2AA] text-white ${errors.email ? 'border-red-500' : ''}`}
                  required
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-[#20B2AA] hover:text-[#20B2AA]/80">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`bg-[#0A1933] border border-gray-600 focus:border-[#20B2AA] text-white ${errors.password ? 'border-red-500' : ''}`}
                  required
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#0A1933] font-medium" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0A1933]/70 px-2 text-gray-400">or continue with</span>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mt-4 flex items-center justify-center gap-2 border-gray-600 text-[#0A1933] hover:bg-[#193366] hover:text-white"
              onClick={handleGoogleLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              <span>Sign in with Google</span>
            </Button>

            {/* Admin Login Link */}
            <div className="mt-4 text-center">
              <Link 
                to="/admin/login" 
                className="text-sm text-gray-400 hover:text-[#20B2AA] transition-colors"
              >
                Admin Portal Login
              </Link>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t border-gray-700 pt-4">
            <div className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-[#20B2AA] hover:text-[#20B2AA]/80 font-medium">
                Register now
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;