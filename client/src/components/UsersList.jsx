import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '@/lib/config';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Userslist = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers: 0,
    registeredUsers: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    registrationStatus: 'all',
    page: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState({});
  const navigate = useNavigate();

  // Registration status options
  const REGISTRATION_STATUS_OPTIONS = [
    { value: 'all', label: 'All Users' },
    { value: 'registered', label: 'Registered Users' },
    { value: 'unregistered', label: 'Unregistered Users' }
  ];

  // Toggle expansion for mobile view
  const toggleUserExpansion = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Fetch users and notifications
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Modify query params logic to handle 'all' status
      const queryParams = new URLSearchParams({
        search: filters.search,
        registrationStatus: filters.registrationStatus === 'all' ? '' : filters.registrationStatus,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      }).toString();

      // Fetch users
      const usersResponse = await fetch(`${BASE_URL}/api/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const userData = await usersResponse.json();
      setUsers(userData.users || []);
      
      // Set stats from backend calculation
      setStats({
        totalUsers: userData.stats.total_users,
        newUsers: userData.stats.new_users,
        registeredUsers: userData.stats.registered_users
      });

      // Fetch notifications
      const notificationsResponse = await fetch(`${BASE_URL}/api/admin/admin-notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!notificationsResponse.ok) {
        const errorData = await notificationsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch notifications');
      }

      const notificationsData = await notificationsResponse.json();
      setNotifications(notificationsData.notifications || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE_URL}/api/admin/admin-notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state to remove or mark as read
      setNotifications(notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, is_read: true } 
          : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    filters.search, 
    filters.registrationStatus, 
    filters.page
  ]);

  // Error handling
  if (error) {
    return (
      <div className="p-6 text-red-500 bg-[#0A1933]">
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{error}</p>
        <Button 
          onClick={() => {
            setError(null);
            fetchData();
          }}
          className="bg-[#20B2AA] hover:bg-[#1a9e97] text-[#0A1933] mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 pt-20 space-y-6 bg-gradient-to-r from-[#0A1933] to-[#193366] min-h-screen text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="text-[#FFD700]">Users</span>
        </h1>
        
        {/* Notifications Panel */}
        <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="relative border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
            >
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-h-96 overflow-y-auto p-0 bg-[#193366] border border-[#20B2AA] text-white">
            <div className="p-4 border-b border-[#20B2AA] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#20B2AA]">Notifications</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsNotificationOpen(false)}
                className="text-white hover:bg-[#0A1933]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-gray-700 flex justify-between items-center ${!notif.is_read ? 'bg-[#0A1933]' : ''}`}
                >
                  <div>
                    <p className="font-bold text-[#FFD700]">{notif.full_name}</p>
                    <p className="text-sm text-gray-300">{notif.message}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => markNotificationAsRead(notif.id)}
                      className="hover:bg-[#0A1933]"
                    >
                      <CheckCircle className="h-5 w-5 text-[#20B2AA]" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-[#0A1933] to-[#193366] border border-[#20B2AA] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#20B2AA]">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {stats.totalUsers}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-[#0A1933] to-[#193366] border border-[#20B2AA] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#20B2AA]">Registered Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {stats.registeredUsers}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-[#0A1933] to-[#193366] border border-[#20B2AA] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[#20B2AA]">New Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white flex items-center">
              {stats.newUsers}
              {stats.newUsers > 0 && (
                <Badge variant="destructive" className="ml-2 bg-[#FFD700] text-[#0A1933]">
                  New
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-gradient-to-r from-[#0A1933] to-[#193366] border border-[#20B2AA] text-white">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <CardTitle className="text-[#FFD700]">Users List</CardTitle>
            <div className="flex flex-col sm:flex-row w-full md:w-auto space-y-2 sm:space-y-0 sm:space-x-2">
              <Input 
                placeholder="Search users..." 
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="bg-[#0A1933] border-[#20B2AA] text-white placeholder:text-gray-400"
              />
              <Select 
                value={filters.registrationStatus} 
                onValueChange={(value) => setFilters({...filters, registrationStatus: value})}
              >
                <SelectTrigger className="w-full sm:w-[200px] bg-[#0A1933] border-[#20B2AA] text-white">
                  <SelectValue placeholder="Filter by Registration" />
                </SelectTrigger>
                <SelectContent className="bg-[#193366] border border-[#20B2AA] text-white">
                  {REGISTRATION_STATUS_OPTIONS.map((status) => (
                    <SelectItem 
                      key={status.value} 
                      value={status.value}
                      className="hover:bg-[#0A1933] cursor-pointer"
                    >
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-[#20B2AA]">Loading...</div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#20B2AA] hover:bg-transparent">
                      <TableHead className="text-[#20B2AA]">Name</TableHead>
                      <TableHead className="text-[#20B2AA]">Email</TableHead>
                      <TableHead className="text-[#20B2AA]">Registration Count</TableHead>
                      <TableHead className="text-[#20B2AA]">Created At</TableHead>
                      <TableHead className="text-[#20B2AA]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-b border-gray-700">
                        <TableCell>
                          <div className="flex items-center">
                            {user.full_name}
                            {user.is_new_user && (
                              <Badge variant="destructive" className="ml-2 bg-[#FFD700] text-[#0A1933]">
                                New
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.registration_count || 0}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.registration_count > 0 ? (
                            <Button 
                              variant="outline" 
                              onClick={() => navigate(`/admin/users/${user.id}/registrations`)}
                              className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
                            >
                              View Registrations
                            </Button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {users.map((user) => (
                  <Collapsible 
                    key={user.id} 
                    open={expandedUsers[user.id]} 
                    onOpenChange={() => toggleUserExpansion(user.id)}
                    className="border border-[#20B2AA] rounded-md overflow-hidden"
                  >
                    <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-[#193366]">
                      <div className="flex items-center">
                        <div>
                          <span className="font-medium">{user.full_name}</span>
                          {user.is_new_user && (
                            <Badge variant="destructive" className="ml-2 bg-[#FFD700] text-[#0A1933]">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                      {expandedUsers[user.id] ? <ChevronUp className="h-5 w-5 text-[#20B2AA]" /> : <ChevronDown className="h-5 w-5 text-[#20B2AA]" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 bg-[#0A1933] space-y-2">
                      <div>
                        <span className="text-sm text-[#20B2AA]">Email:</span>
                        <p>{user.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-[#20B2AA]">Registration Count:</span>
                        <p>{user.registration_count || 0}</p>
                      </div>
                      <div>
                        <span className="text-sm text-[#20B2AA]">Created At:</span>
                        <p>{new Date(user.created_at).toLocaleDateString()}</p>
                      </div>
                      {user.registration_count > 0 && (
                        <div className="pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/admin/users/${user.id}/registrations`)}
                            className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933] w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" /> View
                          </Button>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Userslist;