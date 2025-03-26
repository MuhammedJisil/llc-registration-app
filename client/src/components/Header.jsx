import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

  useEffect(() => {
    // Check for authentication - add a console log to debug
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('adminToken');
    
    console.log('Authentication check:', { 
      token: !!token, 
      adminToken: !!adminToken,
      userProfile: localStorage.getItem('user_profile')
    });
    
    if (adminToken) {
      setIsAuthenticated(true);
      setIsAdmin(true);
      
      try {
        const adminData = JSON.parse(localStorage.getItem('adminInfo'));
        console.log('Admin data retrieved:', adminData);
        
        if (adminData) {
          setUserProfile({
            name: adminData.full_name || adminData.username || 'Admin',
            email: adminData.email || '',
            picture: '',  // Admin might not have a picture
            role: adminData.role || 'admin'
          });
        }
      } catch (error) {
        console.error('Error parsing admin profile:', error);
      }
    } else if (token) {
      // Set authenticated state immediately when token exists
      setIsAuthenticated(true);
      setIsAdmin(false);
      
      // Get user profile data from localStorage
      try {
        const userData = JSON.parse(localStorage.getItem('user_profile'));
        console.log('Header retrieved user profile:', userData);
        
        if (userData) {
          // Decode the picture URL if it exists and it's a string
          let pictureUrl = '';
          if (userData.picture && typeof userData.picture === 'string') {
            try {
              pictureUrl = decodeURIComponent(userData.picture);
              console.log('Decoded picture URL:', pictureUrl);
            } catch (e) {
              console.error('Error decoding picture URL:', e);
              pictureUrl = userData.picture; // Use as-is if decoding fails
            }
          }
          
          setUserProfile({
            name: userData.full_name || userData.name || userData.username || 'User',
            email: userData.email || '',
            picture: pictureUrl || '',
            role: userData.role || 'User'
          });
        } else {
          // Even if user_profile is missing, we should still show authenticated UI
          // because we have a token
          setUserProfile({
            name: 'User',
            email: '',
            picture: '',
            role: 'User'
          });
        }
      } catch (error) {
        console.error('Error parsing user profile:', error);
        // Handle the error gracefully by setting default values
        setUserProfile({
          name: 'User',
          email: '',
          picture: '',
          role: 'User'
        });
      }
    } else {
      // No token found, ensure we're in unauthenticated state
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
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
    navigate('/');
    // You might want to add a toast notification here
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

  // Debug output
  console.log('Current auth state:', { isAuthenticated, isAdmin, userProfile });

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