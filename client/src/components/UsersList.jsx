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
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '@/lib/config';

const Userslist = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers: 0,
    registeredUsers: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    registrationStatus: 'all', // Ensure this is not an empty string
    page: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Explicitly define registration status options with non-empty values
  const REGISTRATION_STATUS_OPTIONS = [
    { value: 'all', label: 'All Users' },
    { value: 'registered', label: 'Registered Users' },
    { value: 'unregistered', label: 'Unregistered Users' }
  ];

  // Fetch users
  const fetchUsers = async () => {
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

      const response = await fetch(`${BASE_URL}/api/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      
      // Calculate stats
      setStats({
        totalUsers: data.totalUsers,
        newUsers: data.users.filter(user => user.is_new).length,
        registeredUsers: data.users.filter(user => user.registration_count > 0).length
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [filters.search, filters.registrationStatus, filters.page]);

  // Render error message
  if (error) {
    return (
      <div className="p-6 text-red-500">
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{error}</p>
        <Button onClick={() => {
          setError(null);
          fetchUsers();
        }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Users Management</h1>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Registered Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.registeredUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>New Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.newUsers}
              {stats.newUsers > 0 && (
                <Badge variant="destructive" className="ml-2">
                  New
                </Badge>
              )}
            </p>
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
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.full_name}
                      {user.is_new && (
                        <Badge variant="destructive" className="ml-2">
                          New
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.registration_count || 0}</TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString() 
                        : 'Never'}
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