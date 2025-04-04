import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { BASE_URL } from '@/lib/config';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
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
      const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to request password reset');
      }

      setSubmitted(true);
      toast.success('Reset link sent', {
        description: 'Please check your email for password reset instructions'
      });
    } catch (error) {
      toast.error('Request failed', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-r from-[#0A1933] to-[#193366] pt-[60px]">
      {/* Left Side */}
      <div className="md:w-1/2 flex flex-col justify-center p-8 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Password <span className="text-[#FFD700]">Recovery</span>
          </h1>
          <p className="text-lg mb-6 text-gray-300">
            We understand that things happen. Let us help you regain access to your Elite LLC account.
          </p>
          <div className="bg-[#20B2AA]/10 rounded-lg p-4 border border-[#20B2AA]/30">
            <h3 className="text-[#FFD700] font-semibold text-lg mb-2">Recovery Process</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#20B2AA]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Enter your registered email address
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#20B2AA]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Receive a secure reset link via email
              </li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2 text-[#20B2AA]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Create a new secure password
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md bg-[#0A1933]/70 border border-[#20B2AA]/30 shadow-xl text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">
              <span className="text-[#FFD700]">Elite</span>
              <span className="ml-1 text-[#20B2AA]">LLC</span> Password Reset
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              {!submitted
                ? "Enter your email and we'll send you a link to reset your password"
                : "Reset instructions have been sent to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email Address</Label>
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
                <Button 
                  type="submit" 
                  className="w-full bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#0A1933] font-medium" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-[#20B2AA]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-300">
                  Please check your inbox for the password reset instructions.
                </p>
                <p className="text-gray-400 text-sm">
                  If you don't see the email within a few minutes, check your spam folder.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center border-t border-gray-700 pt-4">
            <div className="text-sm text-gray-400">
              Remember your password?{' '}
              <Link to="/login" className="text-[#20B2AA] hover:text-[#20B2AA]/80 font-medium">
                Back to login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;