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
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '@/lib/config';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const navigate = useNavigate();

  // Registration status options
  const REGISTRATION_STATUS_OPTIONS = [
    { value: 'all', label: 'All Users' },
    { value: 'registered', label: 'Registered Users' },
    { value: 'unregistered', label: 'Unregistered Users' }
  ];

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
      <div className="p-6 text-red-500">
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{error}</p>
        <Button onClick={() => {
          setError(null);
          fetchData();
        }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users Management</h1>
        
        {/* Notifications Panel */}
        <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-h-96 overflow-y-auto p-0">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsNotificationOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b flex justify-between items-center ${!notif.is_read ? 'bg-blue-50' : ''}`}
                >
                  <div>
                    <p className="font-bold">{notif.full_name}</p>
                    <p className="text-sm text-gray-600">{notif.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => markNotificationAsRead(notif.id)}
                    >
                      <CheckCircle className="h-5 w-5 text-green-500" />
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
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Registered Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.registeredUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>New Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.newUsers}
              {stats.newUsers > 0 && (
                <Badge variant="destructive" className="ml-2">
                  New
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Users List</CardTitle>
            <div className="flex space-x-2">
              <Input 
                placeholder="Search users..." 
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
              <Select 
                value={filters.registrationStatus} 
                onValueChange={(value) => setFilters({...filters, registrationStatus: value})}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Registration" />
                </SelectTrigger>
                <SelectContent>
                  {REGISTRATION_STATUS_OPTIONS.map((status) => (
                    <SelectItem 
                      key={status.value} 
                      value={status.value}
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
            <div className="text-center py-4">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registration Count</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {user.full_name}
                        {user.is_new_user && (
                          <Badge variant="destructive" className="ml-2">
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
                      <Button 
                        variant="outline" 
                        onClick={() => navigate(`/admin/users/${user.id}/registrations`)}
                        disabled={user.registration_count === 0}
                      >
                        View Registrations
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Userslist;