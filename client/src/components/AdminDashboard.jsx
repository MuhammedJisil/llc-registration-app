import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { Button } from "@/components/ui/button";
import { BASE_URL } from '@/lib/config';
import { useNavigate } from 'react-router-dom';

const REGISTRATION_STATUSES = [
  { value: 'null', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRegistrations: [{ count: 0 }],
    registrationsByStatus: [],
    users: {
      total: 0,
      newUsers: 0
    }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {     
    setLoading(true);     
    setError(null);     
    try {       
      const token = localStorage.getItem('adminToken');       
      if (!token) {         
        throw new Error('No authentication token found');       
      }          
  
      // Fetch dashboard stats
      const response = await fetch(`${BASE_URL}/api/admin/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
  
      const data = await response.json();
  
      setStats(prevStats => ({
        ...prevStats,
        totalRegistrations: data.totalRegistrations || [{ count: 0 }],
        registrationsByStatus: data.registrationsByStatus || [],
        users: {
          total: data.totalUsers[0].count || 0,
          newUsers: data.newUsers[0].count || 0,
          registeredUsers: data.registeredUsers[0].count || 0
        }
      }));
  
    } catch (error) {       
      console.error('Error fetching dashboard stats:', error);       
      setError(error.message);     
    } finally {       
      setLoading(false);     
    }   
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Color palette for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Prepare status distribution data
  const statusDistributionData = stats.registrationsByStatus.map(status => ({
    name: status.status,
    value: parseInt(status.count, 10)  // Ensure numeric value
  }));

  // Render error message
  if (error) {
    return (
      <div className="p-6 text-red-500">
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{error}</p>
        <Button onClick={() => {
          setError(null);
          fetchDashboardStats();
        }}>
          Retry
        </Button>
      </div>
    );
  }

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

        {/* Users Card */}
        <Card 
          className="cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => navigate('/admin/users')}
        >
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-xl">Total Users</p>
              <p className="text-2xl font-bold">{stats.users.total}</p>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-green-600">New Users</p>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                {stats.users.newUsers}
              </div>
            </div>
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
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {statusDistributionData.map((entry, index) => (
                <div 
                  key={entry.name} 
                  className="flex items-center space-x-2"
                >
                  <div 
                    className="w-4 h-4" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;