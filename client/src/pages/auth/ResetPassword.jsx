import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BASE_URL } from '@/lib/config';
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/auth/validate-reset-token/${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setIsValidToken(true);
        } else {
          toast.error('Invalid or expired token', {
            description: data.message || 'Please request a new password reset link'
          });
        }
      } catch (error) {
        toast.error('Validation failed', {
          description: 'Could not validate reset token'
        });
      } finally {
        setIsValidating(false);
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = newErrors.password || "Password must include at least one uppercase letter";
      }
      if (!/[a-z]/.test(formData.password)) {
        newErrors.password = newErrors.password || "Password must include at least one lowercase letter";
      }
      if (!/[0-9]/.test(formData.password)) {
        newErrors.password = newErrors.password || "Password must include at least one number";
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
        newErrors.password = newErrors.password || "Password must include at least one special character";
      }
    }
    
    // Confirm Password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      toast.success('Password reset successful', {
        description: 'You can now log in with your new password'
      });
      
      navigate('/login');
    } catch (error) {
      toast.error('Reset failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#0A1933] to-[#193366] p-4">
        <Card className="w-full max-w-md bg-[#0A1933]/70 border border-[#20B2AA]/30 shadow-xl text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">
              <span className="text-[#FFD700]">Elite</span>
              <span className="ml-1 text-[#20B2AA]">LLC</span> Reset Password
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              Validating your reset link...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#20B2AA]"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#0A1933] to-[#193366] p-4">
        <Card className="w-full max-w-md bg-[#0A1933]/70 border border-[#20B2AA]/30 shadow-xl text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">
              <span className="text-[#FFD700]">Elite</span>
              <span className="ml-1 text-[#20B2AA]">LLC</span> Reset Failed
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-6">
            <p className="text-sm text-gray-300 mb-4">
              Please request a new password reset link.
            </p>
            <Link to="/forgot-password">
              <Button className="bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#0A1933] font-medium">
                Request New Link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-r from-[#0A1933] to-[#193366] pt-[60px]">
      {/* Security Banner - Left Side */}
      <div className="md:w-1/2 flex flex-col justify-center p-8 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Secure <span className="text-[#FFD700]">Password Reset</span>
          </h1>
          <p className="text-lg mb-6 text-gray-300">
            Create a new secure password for your Elite LLC account to regain access to your dashboard.
          </p>
          <div className="bg-[#20B2AA]/10 rounded-lg p-4 border border-[#20B2AA]/30">
            <h3 className="text-[#FFD700] font-semibold text-lg mb-2">Password Security Tips</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#20B2AA]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Use a unique password you don't use elsewhere
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#20B2AA]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Include a mix of letters, numbers, and symbols
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#20B2AA]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Consider using a passphrase for better security
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reset Form - Right Side */}
      <div className="md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md bg-[#0A1933]/70 border border-[#20B2AA]/30 shadow-xl text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">
              <span className="text-[#FFD700]">Elite</span>
              <span className="ml-1 text-[#20B2AA]">LLC</span> Reset Password
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">New Password</Label>
                <div className='relative'>
                <Input 
                  id="password" 
                  name="password"
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={handleChange}
                  className={`bg-[#0A1933] border border-gray-600 focus:border-[#20B2AA] text-white ${errors.password ? 'border-red-500' : ''}`}
                  required
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                <p className="text-gray-400 text-xs">
                  Password must be at least 8 characters and include uppercase, lowercase, number, and special character
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"} 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`bg-[#0A1933] border border-gray-600 focus:border-[#20B2AA] text-white ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  required
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#0A1933] font-medium" 
                disabled={isLoading}
              >
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>
            
            <div className="mt-4 relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0A1933]/70 px-2 text-gray-400">or</span>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Link to="/forgot-password" className="text-[#20B2AA] hover:text-[#20B2AA]/80 font-medium">
                Request a new reset link
              </Link>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t border-gray-700 pt-4">
            <div className="text-sm text-gray-400">
              Remember your password?{' '}
              <Link to="/login" className="text-[#20B2AA] hover:text-[#20B2AA]/80 font-medium">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;