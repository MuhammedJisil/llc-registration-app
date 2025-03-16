import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BASE_URL } from '@/lib/config';
import { jwtDecode } from 'jwt-decode';
import { Loader2, FileText, CreditCard, Edit, Trash2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Dashboard = () => {
  const [llcRegistrations, setLlcRegistrations] = useState([]);
  const [otherApplications, setOtherApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
  
        // Fetch all LLC registrations for this user (keeping only this API call)
        const llcResponse = await axios.get(`${BASE_URL}/api/llc-registrations/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (Array.isArray(llcResponse.data)) {
          setLlcRegistrations(llcResponse.data);
          // If you still need otherApplications for rendering purposes, you can set it to the same data
          // or just refactor your components to only use llcRegistrations
          setOtherApplications([]); // Or remove this state entirely if not needed
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

  const handleEditRegistration = (registration) => {
    // Get the user ID from the token
    const token = localStorage.getItem('token');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;
    
    // Store registration ID in localStorage with user-specific key
    localStorage.setItem(`registrationId_${userId}`, registration.id);
    
    // Navigate to the appropriate step in the form
    navigate('/register-llc', { state: { currentStep: registration.step || 1 } });
  };

  const handleViewSummary = (registrationId) => {
    navigate(`/registration-summary/${registrationId}`);
  };

  const handleCompletePayment = (registration) => {
    navigate('/payment', { 
      state: { 
        amount: typeof registration.stateAmount === 'number' ? registration.stateAmount : 0, 
        registrationId: registration.id 
      } 
    });
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
    
    return step && step <= steps.length ? steps[step - 1] : "Unknown";
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
        <Button onClick={() => navigate('/register-llc')}>
          Start New LLC Registration
        </Button>
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
                {llcRegistrations.map((registration) => (
                  <Card key={registration.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{registration.companyName || "Unnamed LLC"}</CardTitle>
                          <CardDescription>
                            Registration #{registration.id} - Started on {formatDate(registration.created_at || registration.updatedAt)}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getStatusColor(registration.status)}>
                            {registration.status ? 
                              registration.status.charAt(0).toUpperCase() + registration.status.slice(1) : 
                              "Draft"}
                          </Badge>
                          <Badge className={getPaymentStatusColor(registration.paymentStatus)}>
                            {registration.paymentStatus ? 
                              registration.paymentStatus.charAt(0).toUpperCase() + registration.paymentStatus.slice(1) : 
                              "Not Paid"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <p className="font-medium text-gray-600">State:</p>
                          <p>{registration.state || "Not selected"}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Filing Fee:</p>
                          <p>${typeof registration.stateAmount === 'number' ? 
                            registration.stateAmount.toFixed(2) : 
                            '0.00'}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Current Progress:</p>
                          <p>Step {registration.step || 1}: {renderCurrentStep(registration.step)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => handleEditRegistration(registration)}
                          className="flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Continue Registration
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleViewSummary(registration.id)}
                          className="flex items-center"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Summary
                        </Button>
                        {(registration.paymentStatus === 'unpaid' || registration.paymentStatus === 'Not Paid') && (
                          <Button 
                            onClick={() => handleCompletePayment(registration)}
                            className="flex items-center"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Complete Payment
                          </Button>
                        )}
                        <Button 
                          variant="outline"
                          onClick={() => openDeleteDialog(registration)}
                          className="flex items-center text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
              Are you sure you want to delete <strong>{registrationToDelete?.companyName || "this LLC registration"}</strong>? 
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