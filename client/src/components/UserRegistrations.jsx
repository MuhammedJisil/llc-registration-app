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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useNavigate } from 'react-router-dom';
import { BASE_URL } from '@/lib/config';

const PREDEFINED_MESSAGES = [
  { value: 'payment_complete', label: 'Payment Completed' },
  { value: 'registration_process', label: 'Registration in Process' },
  { value: 'documents_required', label: 'Additional Documents Required' },
  { value: 'approved', label: 'Registration Approved' },
  { value: 'rejected', label: 'Registration Rejected' }
];

const UserRegistrations = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    page: 1,
    limit: 10
  });
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState({
    type: 'predefined',
    message: '',
    predefinedMessage: ''
  });
  const [notifications, setNotifications] = useState([]);

  const { userId } = useParams();
  const navigate = useNavigate();

  // Fetch user registrations
  const fetchUserRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const queryParams = new URLSearchParams({
        status: filters.status === 'all' ? '' : filters.status,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      }).toString();

      const response = await fetch(
        `${BASE_URL}/api/admin/users/${userId}/registrations?${queryParams}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user registrations');
      }

      const data = await response.json();
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error('Error fetching user registrations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications for a specific registration
  const fetchRegistrationNotifications = async (registrationId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${BASE_URL}/api/admin/registrations/${registrationId}/notifications`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Send notification
  const sendNotification = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const message = notificationMessage.type === 'predefined' 
        ? notificationMessage.predefinedMessage 
        : notificationMessage.message;

      const response = await fetch(
        `${BASE_URL}/api/admin/registrations/${selectedRegistration.id}/notifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message,
            messageType: notificationMessage.type
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      // Refresh notifications
      await fetchRegistrationNotifications(selectedRegistration.id);

      // Reset notification form
      setNotificationMessage({
        type: 'predefined',
        message: '',
        predefinedMessage: ''
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  useEffect(() => {
    fetchUserRegistrations();
  }, [userId, filters.status, filters.page]);

  // Render error message
  if (error) {
    return (
      <div className="p-6 text-red-500">
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{error}</p>
        <Button onClick={() => {
          setError(null);
          fetchUserRegistrations();
        }}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Registrations</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/users')}
        >
          Back to Users
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Registrations List</CardTitle>
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              {/* Existing status filter */}
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-4">No registrations found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((registration) => (
                  <TableRow key={registration.id}>
                    <TableCell>{registration.company_name}</TableCell>
                    <TableCell>{registration.payment_status}</TableCell>
                    <TableCell>
                      {new Date(registration.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Button 
                        variant="outline"
                        onClick={() => navigate(`/admin/registrations/${registration.id}`)}
                      >
                        View Details
                      </Button>
                      <Dialog 
                        onOpenChange={(open) => {
                          if (open) {
                            fetchRegistrationNotifications(registration.id);
                            setSelectedRegistration(registration);
                          } else {
                            setSelectedRegistration(null);
                            setNotifications([]);
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="secondary">
                            Send Notification
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>
                              Send Notification for {registration.company_name}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            {/* Notification Type Selection */}
                            <div className="grid grid-cols-4 items-center gap-4">
                              <label>Notification Type</label>
                              <Select
                                value={notificationMessage.type}
                                onValueChange={(value) => setNotificationMessage({
                                  ...notificationMessage,
                                  type: value
                                })}
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select Notification Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="predefined">
                                    Predefined Message
                                  </SelectItem>
                                  <SelectItem value="custom">
                                    Custom Message
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Message Selection/Input */}
                            {notificationMessage.type === 'predefined' ? (
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label>Select Message</label>
                                <Select
                                  value={notificationMessage.predefinedMessage}
                                  onValueChange={(value) => setNotificationMessage({
                                    ...notificationMessage,
                                    predefinedMessage: value
                                  })}
                                >
                                  <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select Predefined Message" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PREDEFINED_MESSAGES.map((msg) => (
                                      <SelectItem 
                                        key={msg.value} 
                                        value={msg.label}
                                      >
                                        {msg.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ) : (
                              <div className="grid grid-cols-4 items-center gap-4">
                                <label>Custom Message</label>
                                <Textarea
                                  className="col-span-3"
                                  placeholder="Enter your custom message"
                                  value={notificationMessage.message}
                                  onChange={(e) => setNotificationMessage({
                                    ...notificationMessage,
                                    message: e.target.value
                                  })}
                                />
                              </div>
                            )}

                            {/* Send Button */}
                            <Button 
                              onClick={sendNotification}
                              disabled={
                                notificationMessage.type === 'predefined' 
                                  ? !notificationMessage.predefinedMessage 
                                  : !notificationMessage.message
                              }
                            >
                              Send Notification
                            </Button>

                            {/* Notifications List */}
                            <div className="mt-4">
                              <h3 className="text-lg font-semibold mb-2">
                                Previous Notifications
                              </h3>
                              {notifications.length === 0 ? (
                                <p className="text-muted-foreground">
                                  No previous notifications
                                </p>
                              ) : (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Message</TableHead>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {notifications.map((notification) => (
                                      <TableRow key={notification.id}>
                                        <TableCell>{notification.message}</TableCell>
                                        <TableCell>
                                          {new Date(notification.created_at).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                          {notification.is_read ? 'Read' : 'Unread'}
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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

export default UserRegistrations;