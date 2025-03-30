import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    picture: '',
    role: ''
  });

  // Function to scroll to section (used when on homepage)
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to handle navigation menu clicks
  // If on homepage ('/'), scroll to section, otherwise navigate to homepage
  const handleNavigation = (sectionId) => {
    if (location.pathname === '/') {
      scrollToSection(sectionId);
    } else {
      navigate('/');
      // Setting a small timeout to allow the page to load before scrolling
      setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Function to fetch user profile
  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${process.env.BASE_URL || ''}/api/user/profile`, {
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
          picture: data.user.picture || '',
          role: data.user.role || 'User'
        };

        localStorage.setItem('user_profile', JSON.stringify(profileData));
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
    const handleProfileUpdate = async () => {
      const token = localStorage.getItem('token');
      const adminToken = localStorage.getItem('adminToken');
      
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
        await fetchUserProfile(token);
      }
    };

    window.addEventListener('user-logged-in', handleProfileUpdate);

    const checkAuthentication = async () => {
      const token = localStorage.getItem('token');
      const adminToken = localStorage.getItem('adminToken');
      
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
          await fetchUserProfile(token);
        }
      } else {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    checkAuthentication();

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
    
    toast.success('Logged Out', {
      description: 'You have been successfully logged out'
    });
    
    navigate('/');
  };

  const getInitials = () => {
    if (userProfile.name) {
      return userProfile.name.charAt(0).toUpperCase();
    } else if (userProfile.email) {
      return userProfile.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const formatRole = (role) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // User profile dropdown component - reused in both mobile and desktop
  const UserProfileDropdown = ({ isMobile = false }) => (
    <DropdownMenu>
      <DropdownMenuTrigger className={`focus:outline-none flex items-center ${isMobile ? 'w-full justify-end' : ''}`}>
        <div className={`mr-2 text-sm flex flex-col ${isMobile ? '' : 'items-end'}`}>
          <span className="font-medium">{userProfile.name || 'User'}</span>
          {userProfile.role && (
            <span className="text-xs text-[#FFD700]">{formatRole(userProfile.role)}</span>
          )}
        </div>
        <Avatar className="cursor-pointer border-2 border-[#20B2AA]">
          {userProfile.picture ? (
            <AvatarImage 
              src={userProfile.picture} 
              alt={userProfile.name || 'User'} 
              referrerPolicy="no-referrer"
            />
          ) : null}
          <AvatarFallback className="bg-[#20B2AA] text-[#0A1933]">{getInitials()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#0A1933] border border-[#20B2AA] text-white">
        {isAdmin ? (
          <DropdownMenuItem 
            className="hover:bg-[#193366] cursor-pointer"
            onClick={() => navigate('/admin/dashboard')}
          >
            Admin Dashboard
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            className="hover:bg-[#193366] cursor-pointer"
            onClick={() => navigate('/user/dashboard')}
          >
            My Account
          </DropdownMenuItem>
        )}
        <DropdownMenuItem 
          className="hover:bg-[#193366] text-red-400 cursor-pointer"
          onClick={handleLogout}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="fixed w-full py-3 z-50 bg-gradient-to-r from-[#0A1933] to-[#193366] text-white shadow-lg">
      <div className="container mx-auto flex justify-between items-center px-4">
        {/* Logo */}
        <div className="text-2xl font-bold flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-[#FFD700]">Elite</span>
          <span className="ml-1 text-[#20B2AA]">LLC</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          <button 
            onClick={() => handleNavigation('hero')}
            className="text-white hover:text-[#FFD700] transition-colors"
          >
            Home
          </button>
          <button 
            onClick={() => handleNavigation('features')} 
            className="text-white hover:text-[#FFD700] transition-colors"
          >
            Features
          </button>
          <button 
            onClick={() => handleNavigation('states')} 
            className="text-white hover:text-[#FFD700] transition-colors"
          >
            States
          </button>
          <button 
            onClick={() => handleNavigation('contact')} 
            className="text-white hover:text-[#FFD700] transition-colors"
          >
            Contact
          </button>
        </nav>

        {/* Auth Buttons or User Profile - Desktop */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <UserProfileDropdown />
          ) : (
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
            >
              Sign In
            </Button>
          )}
        </div>
        
        {/* Mobile User Profile - always shown instead of hamburger menu */}
        <div className="md:hidden flex items-center">
          {isAuthenticated ? (
            <UserProfileDropdown isMobile={true} />
          ) : (
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933] text-sm py-1 px-3"
              size="sm"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;