import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { 
  Edit,
  Download,
  Bell, 
  Loader2, 
  CheckCircle2, 
  EyeOff,
  CreditCard,
  Trash2
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { BASE_URL } from '@/lib/config';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent,  
} from "@/components/ui/card";

import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog,  
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogFooter, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogCancel, 
  AlertDialogAction 
} from "@/components/ui/alert-dialog";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(response.data.notifications);
      setUnreadCount(
        response.data.notifications.filter(n => !n.is_read).length
      );
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${BASE_URL}/api/notifications/${notificationId}/read`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true } 
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${BASE_URL}/api/notifications/read-all`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 px-2 py-1 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={markAllNotificationsAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-500 p-4">
            No notifications
          </p>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`mb-2 ${!notification.is_read ? 'bg-blue-50' : ''}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm">
                      {notification.company_name}
                    </CardTitle>
                    {!notification.is_read && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                    {notification.is_read ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

const Dashboard = () => {
  const [llcRegistrations, setLlcRegistrations] = useState([]);
  const [otherApplications, setOtherApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
  
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id;
  
        // Fetch all LLC registrations for this user
        const llcResponse = await axios.get(`${BASE_URL}/api/llc-registrations/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (Array.isArray(llcResponse.data)) {
          console.log('LLC Registrations data:', llcResponse.data); // Debug log
          setLlcRegistrations(llcResponse.data);
          setOtherApplications([]);
        } else {
          setLlcRegistrations([]);
          setOtherApplications([]);
        }
  
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };
  
    fetchAllUserData();
  }, [navigate]);
  
  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'not paid':
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to safely get property value with fallbacks
  const getPropertyValue = (obj, paths, defaultValue = null) => {
    // Support multiple possible property paths
    if (Array.isArray(paths)) {
      for (const path of paths) {
        const value = path.split('.').reduce((o, key) => o && o[key] !== undefined ? o[key] : undefined, obj);
        if (value !== undefined) return value;
      }
      return defaultValue;
    }
    
    // Single property path
    return paths.split('.').reduce((o, key) => o && o[key] !== undefined ? o[key] : undefined, obj) ?? defaultValue;
  };

  const handleEditRegistration = (registration) => {
    // Get the user ID from the token
    const token = localStorage.getItem('token');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;
    
    // Store registration ID in localStorage with user-specific key
    localStorage.setItem(`registrationId_${userId}`, registration.id);
    
    // Navigate to the next step in the form
    // First determine the current step using our helper function
    const currentStep = getPropertyValue(registration, ['current_step', 'step'], 1);
    const nextStep = Math.min(parseInt(currentStep) + 1, 6);
    
    navigate('/user/register-llc', { state: { currentStep: nextStep } });
  };

  const handleUpdateRegistration = (registration) => {
    // Get the user ID from the token
    const token = localStorage.getItem('token');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;
    
    // Store registration ID in localStorage with user-specific key
    localStorage.setItem(`registrationId_${userId}`, registration.id);
    
    // Navigate to the form with the current step
    const currentStep = getPropertyValue(registration, ['current_step', 'step'], 1);
    navigate('/user/register-llc', { state: { currentStep: parseInt(currentStep) } });
  };

  const downloadSummaryPDF = async (registrationId, companyName) => {
    setIsDownloading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("User authentication token is missing. Please log in again.");
      }
      
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;
      
      if (!userId) {
        throw new Error("User ID not found in token. Please log in again.");
      }
      
      const response = await axios.get(`${BASE_URL}/api/llc-registrations/${registrationId}/pdf`, {
        responseType: "blob",
        params: { userId } // Pass userId as a query parameter
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${companyName || "LLC"}_Registration_Summary.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

 const handleCompletePayment = async (registration) => {
  try {
    // Get the token and decode it to get the user ID
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;
    
    // Try both possible property names for the filing fee
    const filingFee = getPropertyValue(registration, ['filing_fee', 'stateAmount'], 0);
    const amount = typeof filingFee === 'number' ? filingFee : parseFloat(filingFee) || 0;
    
    // Initialize the payment with your backend
    const response = await axios.post(`${BASE_URL}/api/payments/initialize`, {
      registrationId: registration.id,
      amount: amount
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Redirect to the Stripe checkout page with client secret
    navigate(`/user/stripe-checkout/${response.data.paymentId}?clientSecret=${response.data.clientSecret}`);
  } catch (error) {
    console.error('Error initializing payment:', error);
    // You could add error handling here, such as displaying an error message to the user
    setError('Failed to initialize payment. Please try again.');
  }
};

  const openDeleteDialog = (registration) => {
    setRegistrationToDelete(registration);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setRegistrationToDelete(null);
  };

  const handleDeleteRegistration = async () => {
    if (!registrationToDelete) return;
    
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.id;
      
      await axios.delete(`${BASE_URL}/api/llc-registrations/${registrationToDelete.id}?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove the deleted registration from state
      setLlcRegistrations(prevRegistrations => 
        prevRegistrations.filter(reg => reg.id !== registrationToDelete.id)
      );
      
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting registration:', error);
      setError('Failed to delete registration. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderCurrentStep = (step) => {
    const steps = [
      "State Selection", 
      "Business Name", 
      "Ownership", 
      "Address", 
      "Documentation", 
      "Review"
    ];
    
    const stepNumber = parseInt(step);
    return !isNaN(stepNumber) && stepNumber > 0 && stepNumber <= steps.length ? 
      steps[stepNumber - 1] : "Unknown";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Dashboard</h1>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          <Button onClick={() => navigate('/user/register-llc', { state: { newRegistration: true }})}>
            Create New LLC
          </Button>
        </div>
      </div>

      {loading ? (
        <Card className="w-full">
          <CardContent className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="ml-2 text-gray-500">Loading your applications...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="w-full bg-red-50">
          <CardContent className="p-6">
            <p className="text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* LLC Registrations Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your LLC Registrations</h2>
            {llcRegistrations.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500 py-4">
                    You haven't started any LLC registrations yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {llcRegistrations.map((registration) => {
                  // Get property values safely with fallbacks for different field names
                  const companyName = getPropertyValue(registration, ['company_name', 'companyName'], "Unnamed LLC");
                  const currentStep = getPropertyValue(registration, ['current_step', 'step'], 1);
                  const filingFee = getPropertyValue(registration, ['filing_fee', 'stateAmount'], 0);
                  const state = getPropertyValue(registration, ['state'], "Not selected");
                  const status = getPropertyValue(registration, ['status'], "Draft");
                  const paymentStatus = getPropertyValue(registration, ['payment_status', 'paymentStatus'], "Not Paid");
                  const createdAt = getPropertyValue(registration, ['created_at', 'createdAt', 'updatedAt'], null);
                  
                  // Parse step to number for comparisons
                  const stepNumber = parseInt(currentStep);
                  
                  // Check if all steps are completed (step 6 is the final review step)
                  const isCompleted = stepNumber === 6;
                  // Check if at least 5 steps are completed (eligible for summary download)
                  const canDownloadSummary = stepNumber >= 5;
                  // Check if payment is eligible (registration is in step 6)
                  const isPaymentEligible = stepNumber === 6;
                  // Check if payment status is paid
                  const isPaid = paymentStatus.toLowerCase() === 'paid';

                  return (
                    <Card key={registration.id} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{companyName}</CardTitle>
                            <CardDescription>
                              Registration #{registration.id} - Started on {formatDate(createdAt)}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Badge className={getStatusColor(status)}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                            <Badge className={getPaymentStatusColor(paymentStatus)}>
                              {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <p className="font-medium text-gray-600">State:</p>
                            <p>{state}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Filing Fee:</p>
                            <p>${typeof filingFee === 'number' ? 
                              filingFee.toFixed(2) : 
                              parseFloat(filingFee).toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Current Progress:</p>
                            {isPaid ? (
                              <p>Registration Under Processing</p>
                            ) : (
                              <p>Step {currentStep}: {renderCurrentStep(currentStep)}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {isCompleted ? (
                            <Button 
                              variant="outline"
                              onClick={() => handleUpdateRegistration(registration)}
                              className="flex items-center"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Update Registration
                            </Button>
                          ) : (
                            <Button 
                              variant="outline"
                              onClick={() => handleEditRegistration(registration)}
                              className="flex items-center"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Continue Registration
                            </Button>
                          )}
                          
                          {canDownloadSummary && (
                            <Button 
                              variant="outline"
                              onClick={() => downloadSummaryPDF(registration.id, companyName)}
                              className="flex items-center"
                              disabled={isDownloading}
                            >
                              {isDownloading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Downloading...
                                </>
                              ) : (
                                <>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Summary
                                </>
                              )}
                            </Button>
                          )}
                          
                          {/* Only show payment button for completed registrations (Step 6) that aren't paid */}
                          {isPaymentEligible && !isPaid && (
                            <Button 
                              onClick={() => handleCompletePayment(registration)}
                              className="flex items-center"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Complete Payment
                            </Button>
                          )}
                          
                          {/* Only show Delete button if payment is not completed */}
                          {!isPaid && (
                            <Button 
                              variant="outline"
                              onClick={() => openDeleteDialog(registration)}
                              className="flex items-center text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Only show separator and legacy section if there are legacy applications */}
          {otherApplications.length > 0 && (
            <>
              <Separator />
              
              {/* Legacy Applications Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Other Applications</h2>
                <div className="grid grid-cols-1 gap-6">
                  {otherApplications.map((app) => (
                    <Card key={app.id} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{app.business_name}</CardTitle>
                            <CardDescription>
                              Application #{app.id} - Submitted on {formatDate(app.created_at)}
                            </CardDescription>
                          </div>
                          <Badge className={getStatusColor(app.status)}>
                            {app.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-600">Business Address:</p>
                            <p>{app.business_address || "N/A"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Industry:</p>
                            <p>{app.industry_type || "N/A"}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Payment Status:</p>
                            <p>{app.payment_status || "N/A"}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => navigate(`/applications/${app.id}`)}
                          >
                            View Details
                          </Button>
                          {app.payment_status === 'Not Paid' && (
                            <Button onClick={() => navigate(`/applications/${app.id}/payment`)}>
                              Complete Payment
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{getPropertyValue(registrationToDelete, ['company_name', 'companyName'], "this LLC registration")}</strong>? 
              This action cannot be undone and will permanently remove all related information 
              including documents, addresses, ownership details, and payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeDeleteDialog} disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRegistration} 
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Registration"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;