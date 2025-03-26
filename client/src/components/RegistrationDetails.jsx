import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useParams, useNavigate } from 'react-router-dom';
import { BASE_URL } from '@/lib/config';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const REGISTRATION_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

const RegistrationDetails = () => {
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch registration details
  const fetchRegistrationDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${BASE_URL}/api/admin/registrations/${id}/details`, {
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
      setRegistration(data);
      setSelectedStatus(data.registration.status);
    } catch (error) {
      console.error('Error fetching registration details:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update registration status
  const updateRegistrationStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${BASE_URL}/api/admin/registrations/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...registration.registration,
          status: selectedStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update registration status');
      }

      fetchRegistrationDetails();
    } catch (error) {
      console.error('Error updating registration status:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete registration
  const deleteRegistration = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${BASE_URL}/api/admin/registrations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete registration');
      }

      navigate('/admin/users');
    } catch (error) {
      console.error('Error deleting registration:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrationDetails();
  }, [id]);

  // Render error message
  if (error) {
    return (
      <div className="p-6 text-red-500">
        <h2 className="text-2xl font-bold">Error</h2>
        <p>{error}</p>
        <Button onClick={() => {
          setError(null);
          fetchRegistrationDetails();
        }}>
          Retry
        </Button>
      </div>
    );
  }

  // Loading state
  if (loading || !registration) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Registration Details</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <AlertDialog 
            open={isDeleteDialogOpen} 
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Registration</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the registration.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteRegistration}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {registration.registration.company_name}</p>
              <p><strong>Type:</strong> {registration.registration.company_type}</p>
              <p><strong>State:</strong> {registration.registration.state}</p>
              <p><strong>Category:</strong> {registration.registration.category}</p>
              <p><strong>Created at:</strong> {new Date(registration.registration.created_at).toLocaleDateString()}</p>
              <div className="flex items-center space-x-2">
                <strong>Status:</strong>
                <Select 
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
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
                <Button 
                  size="sm" 
                  onClick={updateRegistrationStatus}
                  disabled={selectedStatus === registration.registration.status}
                >
                  Update Status
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        {registration.address && (
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{registration.address.street}</p>
              <p>{registration.address.city}, {registration.address.state_province} {registration.address.postal_code}</p>
              <p>{registration.address.country}</p>
            </CardContent>
          </Card>
        )}

        {/* Owners */}
        <Card>
          <CardHeader>
            <CardTitle>Owners</CardTitle>
          </CardHeader>
          <CardContent>
            {registration.owners.map((owner, index) => (
              <div key={index} className="mb-2">
                <p><strong>Name:</strong> {owner.full_name}</p>
                <p><strong>Ownership:</strong> {owner.ownership_percentage}%</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold mb-2">ID Documents</h3>
                {registration.idDocuments.map((doc, index) => (
                  <div key={index} className="mb-2">
                    <p><strong>Type:</strong> {doc.idType}</p>
                    <p><strong>File:</strong> {doc.idFileName}</p>
                    <a 
                      href={doc.idFilePath} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-bold mb-2">Additional Documents</h3>
                {registration.additionalDocuments.map((doc, index) => (
                  <div key={index} className="mb-2">
                    <p><strong>File:</strong> {doc.fileName}</p>
                    <a 
                      href={doc.filePath} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationDetails;