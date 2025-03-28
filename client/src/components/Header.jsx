import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BASE_URL } from '@/lib/config';

const Header = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    picture: '',
    role: ''
  });

  // Function to fetch user profile
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
        const profileData = {
          name: data.user.full_name || data.user.username || 'User',
          email: data.user.email,
          picture: data.user.picture || '', // Add picture logic if needed
          role: data.user.role || 'User'
        };

        // Update localStorage
        localStorage.setItem('user_profile', JSON.stringify(profileData));
        
        // Update state
        setUserProfile(profileData);
        setIsAuthenticated(true);
        return true;
      } else {
        console.error('Failed to fetch profile:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      return false;
    }
  };

  useEffect(() => {
    // Listen for custom event that can be triggered after login
    const handleProfileUpdate = async (event) => {
      const token = localStorage.getItem('token');
      if (token) {
        await fetchUserProfile(token);
      }
    };

    // Add event listener
    window.addEventListener('user-logged-in', handleProfileUpdate);

    // Initial authentication check
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    
    const checkAuthentication = async () => {
      if (adminToken) {
        setIsAuthenticated(true);
        setIsAdmin(true);
        
        try {
          const adminData = JSON.parse(localStorage.getItem('adminInfo'));
          
          if (adminData) {
            setUserProfile({
              name: adminData.full_name || adminData.username || 'Admin',
              email: adminData.email || '',
              picture: '',
              role: adminData.role || 'admin'
            });
          }
        } catch (error) {
          console.error('Error parsing admin profile:', error);
        }
      } else if (token) {
        // Attempt to fetch user profile if not already in localStorage
        const storedProfile = localStorage.getItem('user_profile');
        
        if (storedProfile) {
          try {
            const userData = JSON.parse(storedProfile);
            setUserProfile({
              name: userData.name || userData.full_name || 'User',
              email: userData.email || '',
              picture: userData.picture || '',
              role: userData.role || 'User'
            });
            setIsAuthenticated(true);
          } catch (error) {
            console.error('Error parsing user profile:', error);
          }
        } else {
          // If no profile in localStorage, fetch it
          await fetchUserProfile(token);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    checkAuthentication();

    // Cleanup
    return () => {
      window.removeEventListener('user-logged-in', handleProfileUpdate);
    };
  }, []);

  const handleLogout = () => {
    if (isAdmin) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminInfo');
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user_profile');
    }
    
    setIsAuthenticated(false);
    setIsAdmin(false);
    
    // Show logout toast
    toast.success('Logged Out', {
      description: 'You have been successfully logged out'
    });
    
    navigate('/');
  };

  // Get initial for the avatar fallback
  const getInitials = () => {
    if (userProfile.name) {
      return userProfile.name.charAt(0).toUpperCase();
    } else if (userProfile.email) {
      return userProfile.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Format role display text
  const formatRole = (role) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <header className="w-full py-4 border-b border-gray-200 bg-[#0F172A] text-[#F8FAFC]">
      <div className="container mx-auto flex justify-between items-center px-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold flex items-center">
          <span className="text-[#FFD700]">Elite</span>
          <span className="ml-1">LLC</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="text-[#F8FAFC] hover:text-[#FFD700] transition-colors">
            Home
          </Link>
          <Link to="/pricing" className="text-[#F8FAFC] hover:text-[#FFD700] transition-colors">
            Pricing
          </Link>
          <Link to="/about" className="text-[#F8FAFC] hover:text-[#FFD700] transition-colors">
            About
          </Link>
          <Link to="/contact" className="text-[#F8FAFC] hover:text-[#FFD700] transition-colors">
            Contact
          </Link>
        </nav>

        {/* Auth Buttons or User Profile */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none flex items-center">
                <div className="mr-2 text-sm hidden md:flex flex-col items-end">
                  <span className="font-medium">{userProfile.name || 'User'}</span>
                  {userProfile.role && (
                    <span className="text-xs text-[#FFD700]">{formatRole(userProfile.role)}</span>
                  )}
                </div>
                <Avatar className="cursor-pointer border-2 border-[#FFD700]">
                  {userProfile.picture ? (
                    <AvatarImage 
                      src={userProfile.picture} 
                      alt={userProfile.name || 'User'} 
                      referrerPolicy="no-referrer"
                    />
                  ) : null}
                  <AvatarFallback className="bg-[#FFD700] text-[#0F172A]">{getInitials()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0F172A] border border-[#FFD700] text-[#F8FAFC]">
                {isAdmin ? (
                  <DropdownMenuItem 
                    className="hover:bg-[#1E293B] cursor-pointer"
                    onClick={() => navigate('/admin/dashboard')}
                  >
                    Admin Dashboard
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    className="hover:bg-[#1E293B] cursor-pointer"
                    onClick={() => navigate('/dashboard')}
                  >
                    My Account
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  className="hover:bg-[#1E293B] text-red-400 cursor-pointer"
                  onClick={handleLogout}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#0F172A]"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-[#FFD700] text-[#0F172A] hover:bg-[#E6C200]"
              >
                Start My Business
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;