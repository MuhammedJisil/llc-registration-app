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

  // Color palette for charts - updated to match brand colors
  const COLORS = ['#20B2AA', '#FFD700', '#4682B4', '#FF8042'];

  // Prepare status distribution data
  const statusDistributionData = stats.registrationsByStatus.map(status => ({
    name: status.status,
    value: parseInt(status.count, 10)  // Ensure numeric value
  }));

  // Render error message
  if (error) {
    return (
      <div className="p-6 bg-[#0A1933] text-red-400 rounded-lg">
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{error}</p>
        <Button 
          onClick={() => {
            setError(null);
            fetchDashboardStats();
          }}
          className="mt-4 bg-[#20B2AA] hover:bg-[#1a9995] text-[#0A1933] font-medium"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A1933] to-[#193366] text-white p-6 pt-24 space-y-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#FFD700]">Admin Dashboard</h1>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Registrations Card */}
          <Card className="bg-gradient-to-br from-[#122042] to-[#193366] border border-[#20B2AA]/30 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#FFD700] text-lg">Total Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                {stats.totalRegistrations?.[0]?.count || 0}
              </p>
              <div className="h-1 w-1/3 bg-[#20B2AA] mt-4 rounded-full"></div>
            </CardContent>
          </Card>

          {/* Users Card */}
          <Card 
            className="bg-gradient-to-br from-[#122042] to-[#193366] border border-[#20B2AA]/30 shadow-lg hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
            onClick={() => navigate('/admin/users')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-[#FFD700] text-lg">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-300">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats.users.total}</p>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-sm text-[#20B2AA]">New Users</p>
                <div className="bg-[#20B2AA]/20 text-[#20B2AA] px-3 py-1 rounded-full text-xs font-medium">
                  +{stats.users.newUsers}
                </div>
              </div>
              <div className="h-1 w-1/3 bg-[#20B2AA] mt-4 rounded-full"></div>
            </CardContent>
          </Card>

          {/* Status Distribution Chart */}
          <Card className="col-span-2 bg-gradient-to-br from-[#122042] to-[#193366] border border-[#20B2AA]/30 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#FFD700] text-lg">Registrations by Status</CardTitle>
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
                    contentStyle={{ backgroundColor: '#0A1933', borderColor: '#20B2AA', color: 'white' }}
                    itemStyle={{ color: 'white' }}
                  />
                  {statusDistributionData.length === 0 && (
                    <text x="50%" y="50%" textAnchor="middle" fill="#20B2AA">
                      No registration status data
                    </text>
                  )}
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                {statusDistributionData.map((entry, index) => (
                  <div 
                    key={entry.name} 
                    className="flex items-center space-x-2"
                  >
                    <div 
                      className="w-4 h-4 rounded-sm" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="capitalize">{entry.name}: <span className="font-medium">{entry.value}</span></span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;