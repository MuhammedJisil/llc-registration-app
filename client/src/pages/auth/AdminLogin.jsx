import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { BASE_URL } from '@/lib/config';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${BASE_URL}/api/admin/login`, {
        username,
        password
      });
      
      // Store the token and admin info in localStorage
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('adminInfo', JSON.stringify(response.data.admin));
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

      // Ensure event is dispatched AFTER localStorage is updated
      setTimeout(() => {
        // Make sure we pass detail with the event
        const event = new CustomEvent('user-logged-in');
        window.dispatchEvent(event);
        
        // Redirect after a slight delay to ensure event processing
        navigate('/');
      }, 100);
       toast.success('Login Successful', {
                description: 'You have been logged in successfully'
              });
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#0A1933] to-[#193366] pt-[60px]">
      <div className="w-full max-w-md px-4">
        <Card className="w-full bg-[#0A1933]/70 border border-[#20B2AA]/30 shadow-xl text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">
              <span className="text-[#FFD700]">Admin</span> 
              <span className="ml-1 text-[#20B2AA]">Portal</span>
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              Enter your credentials to access the admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 bg-red-900/20 border border-red-500 text-red-300">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-300">Username</Label>
                <Input 
                  id="username"
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bg-[#0A1933] border border-gray-600 focus:border-[#20B2AA] text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="bg-[#0A1933] border border-gray-600 focus:border-[#20B2AA] text-white pr-10"
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
              </div>
              <Button 
                type="submit" 
                className="w-full bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#0A1933] font-medium mt-2" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-gray-700 pt-4">
            <div className="text-sm text-gray-400">
              Admin Portal | © {new Date().getFullYear()} Your Company
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}