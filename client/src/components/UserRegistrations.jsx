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
import { Eye, ChevronDown, ChevronUp } from 'lucide-react';

// Predefined message templates
const PREDEFINED_MESSAGES = [
  { 
    value: 'payment_complete', 
    label: 'Payment Completed', 
    message: 'Your payment for the registration has been successfully processed. Thank you for your cooperation.'
  },
  { 
    value: 'registration_process', 
    label: 'Registration in Process', 
    message: 'Your registration is currently under review. We will update you on the status shortly.'
  },
  { 
    value: 'documents_required', 
    label: 'Additional Documents Required', 
    message: 'We require additional documentation to proceed with your registration. Please submit the necessary documents at your earliest convenience.'
  },
  { 
    value: 'approved', 
    label: 'Registration Approved', 
    message: 'Congratulations! Your registration has been approved. Welcome aboard!'
  },
  { 
    value: 'rejected', 
    label: 'Registration Rejected', 
    message: 'We regret to inform you that your registration has been rejected. Please contact our support team for more information.'
  }
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
    predefinedMessage: '',
    selectedPredefinedKey: ''
  });
  const [notifications, setNotifications] = useState([]);
  const [userEmail, setUserEmail] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const { userId } = useParams();
  const navigate = useNavigate();

  // Toggle expanded row for mobile view
  const toggleRowExpansion = (registrationId) => {
    setExpandedRows(prev => ({
      ...prev,
      [registrationId]: !prev[registrationId]
    }));
  };

  // Fetch user email
  const fetchUserEmail = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user email');
      }

      const userData = await response.json();
      setUserEmail(userData.email);
      return userData.email;
    } catch (error) {
      console.error('Error fetching user email:', error);
      return null;
    }
  };

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

  // Method to open email client
  const sendEmailViaClient = async () => {
    // If userEmail is not set, try to fetch it first
    const email = userEmail || await fetchUserEmail();

    if (!email) {
      console.error('No email found for the user');
      return;
    }

    // Prepare the message
    const message = notificationMessage.type === 'predefined' 
      ? notificationMessage.selectedPredefinedKey 
        ? PREDEFINED_MESSAGES.find(m => m.value === notificationMessage.selectedPredefinedKey)?.message 
        : ''
      : notificationMessage.message;

    // Construct email parameters
    const subject = encodeURIComponent('Registration Update');
    const body = encodeURIComponent(message);

    // Open default email client
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  // Send in-app notification
  const sendInAppNotification = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const message = notificationMessage.type === 'predefined' 
        ? notificationMessage.selectedPredefinedKey 
          ? PREDEFINED_MESSAGES.find(m => m.value === notificationMessage.selectedPredefinedKey)?.message 
          : ''
        : notificationMessage.message;

      // Make sure selectedRegistration is not null
      if (!selectedRegistration || !selectedRegistration.id) {
        console.error('No registration selected');
        return;
      }

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
        predefinedMessage: '',
        selectedPredefinedKey: ''
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  useEffect(() => {
    fetchUserRegistrations();
    fetchUserEmail();
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
    <div className="p-6 pt-24 space-y-6 bg-gradient-to-r from-[#0A1933] to-[#193366] min-h-screen text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white">User Registrations</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate('/admin/users')}
          className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
        >
          Back
        </Button>
      </div>

      <Card className="bg-gradient-to-r from-[#0A1933] to-[#193366] border border-[#20B2AA] shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-xl text-[#FFD700]">Registrations List</CardTitle>
            <Select 
              value={filters.status} 
              onValueChange={(value) => setFilters({...filters, status: value})}
            >
              <SelectTrigger className="w-full md:w-[180px] border-[#20B2AA] text-white bg-[#0A1933]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#0A1933] border-[#20B2AA] text-white">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-4">No registrations found</div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#20B2AA] hover:bg-transparent">
                      <TableHead className="text-[#20B2AA] ">Company Name</TableHead>
                      <TableHead className="text-[#20B2AA] ">Payment Status</TableHead>
                      <TableHead className="text-[#20B2AA] ">Created At</TableHead>
                      <TableHead className="text-[#20B2AA] ">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((registration) => (
                      <TableRow key={registration.id} className="border-b border-[#193366] hover:bg-[#193366]">
                        <TableCell className="text-white">{registration.company_name}</TableCell>
                        <TableCell className="text-white">{registration.payment_status}</TableCell>
                        <TableCell className="text-white">
                          {new Date(registration.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="flex space-x-2">
                          <Button 
                            variant="outline"
                            onClick={() => navigate(`/admin/registrations/${registration.id}`)}
                            className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
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
                                setNotificationMessage({
                                  type: 'predefined',
                                  message: '',
                                  predefinedMessage: '',
                                  selectedPredefinedKey: ''
                                });
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="secondary" className="bg-[#FFD700] text-[#0A1933] hover:bg-[#FFD700]/80">
                                Send Notification
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px] bg-[#0A1933] border border-[#20B2AA] text-white">
                              <DialogHeader>
                                <DialogTitle className="text-[#FFD700]">
                                  Send Notification for {registration.company_name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                {/* Notification Type Selection */}
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <label className="text-[#20B2AA]">Notification Type</label>
                                  <Select
                                    value={notificationMessage.type}
                                    onValueChange={(value) => setNotificationMessage({
                                      ...notificationMessage,
                                      type: value
                                    })}
                                  >
                                    <SelectTrigger className="col-span-3 border-[#20B2AA] bg-[#0A1933] text-white">
                                      <SelectValue placeholder="Select Notification Type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A1933] border-[#20B2AA] text-white">
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
                                    <label className="text-[#20B2AA]">Select Message</label>
                                    <Select
                                      value={notificationMessage.selectedPredefinedKey}
                                      onValueChange={(value) => setNotificationMessage({
                                        ...notificationMessage,
                                        selectedPredefinedKey: value
                                      })}
                                    >
                                      <SelectTrigger className="col-span-3 border-[#20B2AA] bg-[#0A1933] text-white">
                                        <SelectValue placeholder="Select Predefined Message" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-[#0A1933] border-[#20B2AA] text-white">
                                        {PREDEFINED_MESSAGES.map((msg) => (
                                          <SelectItem 
                                            key={msg.value} 
                                            value={msg.value}
                                          >
                                            {msg.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-[#20B2AA]">Custom Message</label>
                                    <Textarea
                                      className="col-span-3 border-[#20B2AA] bg-[#0A1933] text-white"
                                      placeholder="Enter your custom message"
                                      value={notificationMessage.message}
                                      onChange={(e) => setNotificationMessage({
                                        ...notificationMessage,
                                        message: e.target.value
                                      })}
                                    />
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                  <Button 
                                    onClick={sendInAppNotification}
                                    disabled={
                                      notificationMessage.type === 'predefined' 
                                        ? !notificationMessage.selectedPredefinedKey 
                                        : !notificationMessage.message
                                    }
                                    className="flex-1 bg-[#20B2AA] text-[#0A1933] hover:bg-[#20B2AA]/80"
                                  >
                                    Send In-App Notification
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={sendEmailViaClient}
                                    disabled={
                                      notificationMessage.type === 'predefined' 
                                        ? !notificationMessage.selectedPredefinedKey 
                                        : !notificationMessage.message
                                    }
                                    className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
                                  >
                                    Open Email Client
                                  </Button>
                                </div>

                                {/* Notifications List */}
                                <div className="mt-4">
                                  <h3 className="text-lg font-semibold mb-2 text-[#FFD700]">
                                    Previous Notifications
                                  </h3>
                                  {notifications.length === 0 ? (
                                    <p className="text-gray-400">
                                      No previous notifications
                                    </p>
                                  ) : (
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-b border-[#20B2AA] hover:bg-transparent">
                                          <TableHead className="text-[#20B2AA] hover:bg-transparent">Message</TableHead>
                                          <TableHead className="text-[#20B2AA] hover:bg-transparent">Date</TableHead>
                                          <TableHead className="text-[#20B2AA] hover:bg-transparent">Status</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {notifications.map((notification) => (
                                          <TableRow key={notification.id} className="border-b border-[#193366]">
                                            <TableCell className="text-white">{notification.message}</TableCell>
                                            <TableCell className="text-white">
                                              {new Date(notification.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-white">
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
              </div>
              
              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {registrations.map((registration) => (
                  <div key={registration.id} className="bg-[#193366] rounded-lg border border-[#20B2AA] overflow-hidden">
                    <div 
                      className="p-4 flex justify-between items-center cursor-pointer"
                      onClick={() => toggleRowExpansion(registration.id)}
                    >
                      <div className="font-medium text-[#FFD700]">{registration.company_name}</div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="p-1 h-8 w-8 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/registrations/${registration.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4 text-[#20B2AA]" />
                        </Button>
                        {expandedRows[registration.id] ? (
                          <ChevronUp className="h-5 w-5 text-[#20B2AA]" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-[#20B2AA]" />
                        )}
                      </div>
                    </div>
                    
                    {expandedRows[registration.id] && (
                      <div className="px-4 pb-4 pt-2 border-t border-[#20B2AA]/30 space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-[#20B2AA]">Payment Status:</div>
                          <div className="text-sm">{registration.payment_status}</div>
                          
                          <div className="text-sm text-[#20B2AA]">Created At:</div>
                          <div className="text-sm">{new Date(registration.created_at).toLocaleDateString()}</div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Dialog 
                            onOpenChange={(open) => {
                              if (open) {
                                fetchRegistrationNotifications(registration.id);
                                setSelectedRegistration(registration);
                              } else {
                                setSelectedRegistration(null);
                                setNotifications([]);
                                setNotificationMessage({
                                  type: 'predefined',
                                  message: '',
                                  predefinedMessage: '',
                                  selectedPredefinedKey: ''
                                });
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="secondary" size="sm" className="w-full bg-[#FFD700] text-[#0A1933] hover:bg-[#FFD700]/80">
                                Send Notification
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95%] bg-[#0A1933] border border-[#20B2AA] text-white">
                              <DialogHeader>
                                <DialogTitle className="text-[#FFD700]">
                                  Send Notification for {registration.company_name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                {/* Notification Type Selection */}
                                <div className="grid grid-cols-1 gap-2">
                                  <label className="text-[#20B2AA]">Notification Type</label>
                                  <Select
                                    value={notificationMessage.type}
                                    onValueChange={(value) => setNotificationMessage({
                                      ...notificationMessage,
                                      type: value
                                    })}
                                  >
                                    <SelectTrigger className="border-[#20B2AA] bg-[#0A1933] text-white">
                                      <SelectValue placeholder="Select Notification Type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#0A1933] border-[#20B2AA] text-white">
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
                                  <div className="grid grid-cols-1 gap-2">
                                    <label className="text-[#20B2AA]">Select Message</label>
                                    <Select
                                      value={notificationMessage.selectedPredefinedKey}
                                      onValueChange={(value) => setNotificationMessage({
                                        ...notificationMessage,
                                        selectedPredefinedKey: value
                                      })}
                                    >
                                      <SelectTrigger className="border-[#20B2AA] bg-[#0A1933] text-white">
                                        <SelectValue placeholder="Select Predefined Message" />
                                      </SelectTrigger>
                                      <SelectContent className="bg-[#0A1933] border-[#20B2AA] text-white">
                                        {PREDEFINED_MESSAGES.map((msg) => (
                                          <SelectItem 
                                            key={msg.value} 
                                            value={msg.value}
                                          >
                                            {msg.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 gap-2">
                                    <label className="text-[#20B2AA]">Custom Message</label>
                                    <Textarea
                                      className="border-[#20B2AA] bg-[#0A1933] text-white"
                                      placeholder="Enter your custom message"
                                      value={notificationMessage.message}
                                      onChange={(e) => setNotificationMessage({
                                        ...notificationMessage,
                                        message: e.target.value
                                      })}
                                    />
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex flex-col space-y-2">
                                  <Button 
                                    onClick={sendInAppNotification}
                                    disabled={
                                      notificationMessage.type === 'predefined' 
                                        ? !notificationMessage.selectedPredefinedKey 
                                        : !notificationMessage.message
                                    }
                                    className="bg-[#20B2AA] text-[#0A1933] hover:bg-[#20B2AA]/80"
                                  >
                                    Send In-App Notification
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={sendEmailViaClient}
                                    disabled={
                                      notificationMessage.type === 'predefined' 
                                        ? !notificationMessage.selectedPredefinedKey 
                                        : !notificationMessage.message
                                    }
                                    className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
                                  >
                                    Open Email Client
                                  </Button>
                                </div>

                                {/* Previous Notifications */}
                                <div className="mt-2">
                                  <h3 className="text-lg font-semibold mb-2 text-[#FFD700]">
                                    Previous Notifications
                                  </h3>
                                  {notifications.length === 0 ? (
                                    <p className="text-gray-400">
                                      No previous notifications
                                    </p>
                                  ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {notifications.map((notification) => (
                                        <div key={notification.id} className="border-b border-[#20B2AA]/30 pb-2">
                                          <p className="text-sm">{notification.message}</p>
                                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                                            <span>{notification.is_read ? 'Read' : 'Unread'}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRegistrations;