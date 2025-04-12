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
  Trash2,
  Plus
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
        <Button 
          variant="outline" 
          size="icon" 
          className="relative bg-transparent border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 px-2 py-1 text-xs bg-[#FFD700] text-[#0A1933] border-none"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 bg-[#0A1933] border border-[#20B2AA] text-white p-0 shadow-lg">
        <div className="flex justify-between items-center p-4 border-b border-[#193366]">
          <h3 className="text-lg font-semibold text-[#20B2AA]">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={markAllNotificationsAsRead}
              className="text-[#20B2AA] hover:text-white hover:bg-[#193366]"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-[#20B2AA]" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-400 p-4">
            No notifications
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`mb-2 mx-2 mt-2 border border-[#193366] ${!notification.is_read ? 'bg-[#193366]' : 'bg-[#0A1933]'}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm text-[#FFD700]">
                      {notification.company_name}
                    </CardTitle>
                    {!notification.is_read && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => markNotificationAsRead(notification.id)}
                        className="text-[#20B2AA] hover:text-white hover:bg-[#193366]"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <p className="text-sm text-gray-300">
                    {notification.message}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400">
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                    {notification.is_read ? (
                      <CheckCircle2 className="h-4 w-4 text-[#20B2AA]" />
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
          console.log('LLC Registrations data:', llcResponse.data);
          setLlcRegistrations(llcResponse.data);
        } else {
          setLlcRegistrations([]);
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

  const renderRegistrationButton = (registration) => {
    // Get property values safely with fallbacks for different field names
    const currentStep = getPropertyValue(registration, ['current_step', 'step'], 1);
    const status = getPropertyValue(registration, ['status'], "Draft");
    const stepNumber = parseInt(currentStep);
    const isCompleted = stepNumber === 6;
    
    // Check if this registration was previously at step 6 but now at a lower step
    const wasCompleted = status.toLowerCase() === 'submitted' || 
                         status.toLowerCase() === 'approved' || 
                         status.toLowerCase() === 'pending' || 
                         status.toLowerCase() === 'completed';
    
    // Use "Update Registration" if it was ever completed or is at step 6
    if (isCompleted || wasCompleted) {
      return (
        <Button 
          variant="outline"
          onClick={() => handleUpdateRegistration(registration)}
          className="flex items-center border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
        >
          <Edit className="h-4 w-4 mr-2 sm:mr-0 md:mr-2" />
          <span className="hidden sm:hidden md:inline">Update Registration</span>
        </Button>
      );
    } else {
      return (
        <Button 
          variant="outline"
          onClick={() => handleEditRegistration(registration)}
          className="flex items-center border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
        >
          <Edit className="h-4 w-4 mr-2 sm:mr-0 md:mr-2" />
          <span className="hidden sm:hidden md:inline">Continue Registration</span>
        </Button>
      );
    }
  };

  const getPaymentStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-[#20B2AA] text-white';
      case 'not paid':
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-[#FFD700] text-[#0A1933]';
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
    
    // Get status to check if it was previously completed
    const status = getPropertyValue(registration, ['status'], "Draft");
    const wasCompleted = status.toLowerCase() === 'submitted' || 
                        status.toLowerCase() === 'approved' || 
                        status.toLowerCase() === 'pending' || 
                        status.toLowerCase() === 'completed';
    
    // Navigate to the next step in the form
    // First determine the current step using our helper function
    const currentStep = getPropertyValue(registration, ['current_step', 'step'], 1);
    const nextStep = Math.min(parseInt(currentStep) + 1, 6);
    
    // If it was previously completed, we're actually updating it
    if (wasCompleted) {
      navigate('/user/register-llc', { state: { currentStep: nextStep, isUpdate: true } });
    } else {
      navigate('/user/register-llc', { state: { currentStep: nextStep } });
    }
  };

  const handleUpdateRegistration = (registration) => {
    // Get the user ID from the token
    const token = localStorage.getItem('token');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;
    
    // Store registration ID in localStorage with user-specific key
    localStorage.setItem(`registrationId_${userId}`, registration.id);
    
    // Navigate to the form with the current step and update flag
    const currentStep = getPropertyValue(registration, ['current_step', 'step'], 1);
    navigate('/user/register-llc', { state: { currentStep: parseInt(currentStep), isUpdate: true } });
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
      
      // Detect if user is on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // For mobile devices - open in a new tab/window
        // Create a safe filename
        const safeFileName = (companyName || "LLC").replace(/[^a-z0-9]/gi, '_').toLowerCase();
        
        // Open in new tab with query parameters
        const pdfUrl = `${BASE_URL}/api/llc-registrations/${registrationId}/pdf?userId=${userId}`;
        window.open(pdfUrl, '_blank');
      } else {
        // For desktop - use blob download approach
        const response = await axios.get(`${BASE_URL}/api/llc-registrations/${registrationId}/pdf`, {
          responseType: "blob",
          params: { userId }
        });
        
        // Create a download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        
        // Create a safe filename
        const safeFileName = (companyName || "LLC").replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute("download", `${safeFileName}_Registration_Summary.pdf`);
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
        }, 100);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again or contact support.");
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

  // Updated function to display proper progress message based on status
  const renderProgress = (registration) => {
    const status = getPropertyValue(registration, ['status'], "Draft").toLowerCase();
    const currentStep = getPropertyValue(registration, ['current_step', 'step'], 1);
    const paymentStatus = getPropertyValue(registration, ['payment_status', 'paymentStatus'], "Not Paid").toLowerCase();
    
    // For submitted or pending registrations, show status-based message instead of step
    if (status === 'submitted') {
      return "Registration Submitted - Awaiting Review";
    } else if (status === 'pending') {
      return "Registration Under Review";
    } else if (status === 'approved') {
      return "Registration Approved";
    } else if (status === 'rejected') {
      return "Registration Rejected - Please Update";
    } else if (paymentStatus === 'paid') {
      return "Registration Under Processing";
    } else {
      // For drafts and other statuses, show the current step
      return `Step ${currentStep}: ${renderCurrentStep(currentStep)}`;
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
    <div className="w-full min-h-screen bg-gradient-to-b from-[#0A1933] to-[#193366]">
      <div className="w-full p-4 pt-24 text-white">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-[#FFD700]">Your Dashboard</h1>
            <div className="flex items-center space-x-2 md:space-x-4">
              <NotificationBell />
              <Button 
                onClick={() => navigate('/user/register-llc', { state: { newRegistration: true }})}
                className="bg-[#20B2AA] text-[#0A1933] hover:bg-[#FFD700] hover:text-[#0A1933] flex items-center"
              >
                <Plus className="h-4 w-4 mr-0 md:mr-2" />
                <span className="hidden md:inline">Create New LLC</span>
              </Button>
        </div>
      </div>

      {loading ? (
        <Card className="w-full bg-[#0A1933] border border-[#20B2AA]">
          <CardContent className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#20B2AA]" />
            <p className="ml-2 text-[#20B2AA]">Loading your applications...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="w-full bg-red-900/20 border border-red-500">
          <CardContent className="p-6">
            <p className="text-center text-red-400">{error}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* LLC Registrations Section */}
          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-[#20B2AA]">Your LLC Registrations</h2>
            {llcRegistrations.length === 0 ? (
              <Card className="bg-[#0A1933] border border-[#193366]">
                <CardContent className="pt-6">
                  <p className="text-center text-gray-400 py-4">
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
                    <Card key={registration.id} className="shadow-sm bg-[#0A1933] border border-[#193366]">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-[#FFD700]">{companyName}</CardTitle>
                            <CardDescription className="text-gray-300">
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
                            <p className="font-medium text-[#20B2AA]">State:</p>
                            <p className="text-gray-300">{state}</p>
                          </div>
                          <div>
                            <p className="font-medium text-[#20B2AA]">Filing Fee:</p>
                            <p className="text-gray-300">${typeof filingFee === 'number' ? 
                              filingFee.toFixed(2) : 
                              parseFloat(filingFee).toFixed(2) || '0.00'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-[#20B2AA]">Current Progress:</p>
                            <p className="text-gray-300">{renderProgress(registration)}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {renderRegistrationButton(registration)}
                          
                          {(canDownloadSummary || status.toLowerCase() === 'submitted') && (
  <Button 
    variant="outline"
    onClick={() => downloadSummaryPDF(registration.id, companyName)}
    className="flex items-center border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
    disabled={isDownloading}
  >
    {isDownloading ? (
      <>
        <Loader2 className="h-4 w-4 mr-2 sm:mr-0 md:mr-2 animate-spin" />
        <span className="hidden sm:hidden md:inline">Downloading...</span>
      </>
    ) : (
      <>
        <Download className="h-4 w-4 mr-2 sm:mr-0 md:mr-2" />
        <span className="hidden sm:hidden md:inline">Download Summary</span>
      </>
    )}
  </Button>
)}
                          
                          {/* Only show payment button for completed registrations (Step 6) that aren't paid */}
                          {isPaymentEligible && !isPaid && (
                            <Button 
                              onClick={() => handleCompletePayment(registration)}
                              className="flex items-center bg-[#FFD700] text-[#0A1933] hover:bg-[#20B2AA]"
                            >
                              <CreditCard className="h-4 w-4 mr-2 sm:mr-0 md:mr-2" />
                              <span className="hidden sm:hidden md:inline">Complete Payment</span>
                            </Button>
                          )}
                          
                          {/* Only show Delete button if payment is not completed */}
                          {!isPaid && (
                            <Button 
                              variant="outline"
                              onClick={() => openDeleteDialog(registration)}
                              className="flex items-center border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4 mr-2 sm:mr-0 md:mr-2" />
                              <span className="hidden sm:hidden md:inline">Delete</span>
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
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0A1933] border border-[#20B2AA] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#FFD700]">Delete Registration</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete <strong className="text-[#20B2AA]">{getPropertyValue(registrationToDelete, ['company_name', 'companyName'], "this LLC registration")}</strong>? 
              This action cannot be undone and will permanently remove all related information 
              including documents, addresses, ownership details, and payment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={closeDeleteDialog} 
              disabled={deleteLoading}
              className="bg-[#193366] text-white hover:bg-[#0A1933] border border-[#20B2AA]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRegistration} 
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
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
    </div>
  </div>
  );
};

export default Dashboard;