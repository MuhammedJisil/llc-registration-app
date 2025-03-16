import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Header = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    picture: ''
  });

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    if (token) {
      setIsAuthenticated(true);
      
      // Get user profile data from localStorage
      try {
        const userData = JSON.parse(localStorage.getItem('user_profile'));
        console.log('Header retrieved user profile:', userData);
        
        if (userData) {
          // Decode the picture URL if it exists
          let pictureUrl = '';
          if (userData.picture) {
            try {
              pictureUrl = decodeURIComponent(userData.picture);
              console.log('Decoded picture URL:', pictureUrl);
            } catch (e) {
              console.error('Error decoding picture URL:', e);
              pictureUrl = userData.picture; // Use as-is if decoding fails
            }
          }
          
          setUserProfile({
            name: userData.name || 'User',
            email: userData.email || '',
            picture: pictureUrl
          });
        }
      } catch (error) {
        console.error('Error parsing user profile:', error);
      }
    }
  }, []);
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_profile');
    setIsAuthenticated(false);
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
  <span className="mr-2 text-sm hidden md:block">
    {userProfile.name || userProfile.email || 'User'}
  </span>
  <Avatar className="cursor-pointer border-2 border-[#FFD700]">
    <AvatarImage 
      src={userProfile.picture} 
      alt={userProfile.name || 'User'} 
      referrerPolicy="no-referrer"
    />
    <AvatarFallback className="bg-[#FFD700] text-[#0F172A]">{getInitials()}</AvatarFallback>
  </Avatar>
</DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0F172A] border border-[#FFD700] text-[#F8FAFC]">
                <DropdownMenuItem 
                  className="hover:bg-[#1E293B] cursor-pointer"
                  onClick={() => navigate('/dashboard')}
                >
                  My Account
                </DropdownMenuItem>
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