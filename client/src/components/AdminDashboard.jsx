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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { BASE_URL } from '@/lib/config';

const REGISTRATION_STATUSES = [
  { value: 'null', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

const AdminDashboard = () => {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState({
    totalRegistrations: [{ count: 0 }],
    registrationsByStatus: [],
    registrationsByMonth: [],
    recentRegistrations: []
  });
  const [filters, setFilters] = useState({
    status: 'null',
    search: '',
    page: 1,
    limit: 10
  });
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch registrations
  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Convert 'null' to empty string for API call
      const actualStatus = filters.status === 'null' ? '' : filters.status;

      const queryParams = new URLSearchParams({
        status: actualStatus,
        search: filters.search,
        page: filters.page,
        limit: filters.limit
      }).toString();

      const response = await fetch(`${BASE_URL}/api/admin/registrations?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch registrations');
      }

      const data = await response.json();
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      const response = await fetch(`${BASE_URL}/api/admin/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Dashboard Stats Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch dashboard stats');
      }
  
      const data = await response.json();
      console.log('Dashboard Stats Received:', data); // Log the received data
      
      // Add some validation
      if (!data.totalRegistrations || !data.registrationsByStatus) {
        console.warn('Incomplete dashboard stats received');
      }
  
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch registration details
  const fetchRegistrationDetails = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${BASE_URL}/api/admin/registrations/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch registration details');
      }

      const data = await response.json();
      setSelectedRegistration(data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching registration details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update registration status
  const updateRegistrationStatus = async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${BASE_URL}/api/admin/registrations/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update registration status');
      }
      
      fetchRegistrations();
      fetchDashboardStats();
    } catch (error) {
      console.error('Error updating registration status:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    fetchDashboardStats();
  }, [filters.status, filters.search, filters.page]);

  // Color palette for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Render error message
  if (error) {
    return (
      <div className="p-6 text-red-500">
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{error}</p>
        <Button onClick={() => {
          setError(null);
          fetchRegistrations();
          fetchDashboardStats();
        }}>
          Retry
        </Button>
      </div>
    );
  }

  // Prepare status distribution data
  const statusDistributionData = stats.registrationsByStatus.map(status => ({
    name: status.status,
    value: parseInt(status.count, 10)  // Ensure numeric value
  }));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.totalRegistrations?.[0]?.count || 0}
            </p>
          </CardContent>
        </Card>

        {/* Status Distribution Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Registrations by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
            <PieChart>
      <Pie
        data={statusDistributionData}
        cx="50%"
        cy="50%"
        labelLine={false}
        outerRadius={80}
        fill="#8884d8"
        dataKey="value"
      >
        {statusDistributionData.map((entry, index) => (
          <Cell 
            key={`cell-${entry.name}`} 
            fill={COLORS[index % COLORS.length]} 
          />
        ))}
      </Pie>
      <Tooltip 
        formatter={(value, name) => [value, `Status: ${name}`]}
      />
      {statusDistributionData.length === 0 && (
        <text x="50%" y="50%" textAnchor="middle" fill="gray">
          No registration status data
        </text>
      )}
    </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>LLC Registrations</CardTitle>
            <div className="flex space-x-2">
              <Input 
                placeholder="Search..." 
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
              <Select 
                value={filters.status} 
                onValueChange={(value) => setFilters({...filters, status: value})}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  {REGISTRATION_STATUSES.map((status) => (
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
                  <TableHead>Company Name</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>{reg.company_name}</TableCell>
                    <TableCell>{reg.user_name}</TableCell>
                    <TableCell>{reg.state}</TableCell>
                    <TableCell>{reg.status}</TableCell>
                    <TableCell>{new Date(reg.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => fetchRegistrationDetails(reg.id)}
                        >
                          View Details
                        </Button>
                        <Select 
                          onValueChange={(status) => updateRegistrationStatus(reg.id, status)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Update Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {REGISTRATION_STATUSES.filter(s => s.value !== 'null')
                              .map((status) => (
                                <SelectItem 
                                  key={status.value} 
                                  value={status.value}
                                >
                                  {status.label}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Registration Details Modal */}
      {selectedRegistration && (
        <Dialog 
          open={isDetailsModalOpen} 
          onOpenChange={setIsDetailsModalOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registration Details</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold">Company Information</h3>
                <p>Name: {selectedRegistration.registration.company_name}</p>
                <p>Type: {selectedRegistration.registration.company_type}</p>
                <p>State: {selectedRegistration.registration.state}</p>
                <p>Status: {selectedRegistration.registration.status}</p>
              </div>
              <div>
                <h3 className="font-bold">Owners</h3>
                {selectedRegistration.owners.map((owner, index) => (
                  <p key={index}>
                    {owner.full_name} - {owner.ownership_percentage}%
                  </p>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminDashboard;