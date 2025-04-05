import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { 
  Building, 
  Building2, 
  CreditCard, 
  CheckCircle, 
  ExternalLink, 
  Trash2, 
  FileText, 
  Files, 
  Flag, 
  Globe2, 
  Home, 
  Mail, 
  MapPin, 
  Loader2, 
  UserCircle, 
  Users 
} from "lucide-react";

const REGISTRATION_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'submitted', label: 'Submitted' },
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

      const response = await fetch(`${BASE_URL}/api/admin/registrations/${id}/status`, {
        method: 'PATCH',
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
    <div className="p-6 pt-24 space-y-6 bg-gradient-to-r from-[#0A1933] to-[#193366] min-h-screen text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Registration Details</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
          >
            Back
          </Button>
          <AlertDialog 
  open={isDeleteDialogOpen} 
  onOpenChange={setIsDeleteDialogOpen}
>
  <AlertDialogTrigger asChild>
  <Button 
                              variant="outline"
                              className="flex items-center border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4 mr-2 sm:mr-0 md:mr-2" />
                              <span className="hidden sm:hidden md:inline">Delete</span>
                            </Button>
  </AlertDialogTrigger>
  <AlertDialogContent className="bg-[#0A1933] border border-[#20B2AA] text-white">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-[#FFD700]">Delete Registration</AlertDialogTitle>
      <AlertDialogDescription className="text-gray-300">
        Are you sure you want to delete <strong className="text-[#20B2AA]">{registration?.registration?.company_name || "this LLC registration"}</strong>?
        This action cannot be undone and will permanently remove all related information
        including documents, addresses, ownership details, and payment records.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel
        className="bg-[#193366] text-white hover:bg-[#0A1933] border border-[#20B2AA]"
      >
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction 
        onClick={deleteRegistration}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        {loading ? (
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

      {/* First Row - Company Information, Address, Owners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Company Information Card */}
        <Card className="w-full shadow-md border border-[#20B2AA]/20 bg-gradient-to-r from-[#0A1933] to-[#193366]">
          <CardHeader className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white rounded-t-lg border-b border-[#20B2AA]/20">
            <CardTitle className="flex items-center text-[#FFD700]">
              <Building2 className="h-5 w-5 mr-2 text-[#20B2AA]" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <p className="flex items-center text-white">
                <CheckCircle className="h-3 w-3 mr-2 text-[#20B2AA]" />
                <span className="font-medium">Name:</span> 
                <span className="ml-2">{registration.registration.company_name}</span>
              </p>
              <p className="flex items-center text-white">
                <CheckCircle className="h-3 w-3 mr-2 text-[#20B2AA]" />
                <span className="font-medium">Type:</span> 
                <span className="ml-2">{registration.registration.company_type}</span>
              </p>
              <p className="flex items-center text-white">
                <CheckCircle className="h-3 w-3 mr-2 text-[#20B2AA]" />
                <span className="font-medium">State:</span> 
                <span className="ml-2">{registration.registration.state}</span>
              </p>
              <p className="flex items-center text-white">
                <CheckCircle className="h-3 w-3 mr-2 text-[#20B2AA]" />
                <span className="font-medium">Category:</span> 
                <span className="ml-2">{registration.registration.category}</span>
              </p>
              <p className="flex items-center text-white">
                <CheckCircle className="h-3 w-3 mr-2 text-[#20B2AA]" />
                <span className="font-medium">Created at:</span> 
                <span className="ml-2">{new Date(registration.registration.created_at).toLocaleDateString()}</span>
              </p>
              <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-[#20B2AA]/20">
                <span className="font-medium text-white">Status:</span>
                <Select 
                  value={selectedStatus} 
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-[180px] border-[#20B2AA]/30 bg-[#0A1933] text-white">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A1933] border border-[#20B2AA]/30 text-white">
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
                  className="bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#0A1933]"
                >
                  Update Status
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Card */}
        {registration.address && (
          <Card className="w-full shadow-md border border-[#20B2AA]/20 bg-gradient-to-r from-[#0A1933] to-[#193366]">
            <CardHeader className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white rounded-t-lg border-b border-[#20B2AA]/20">
              <CardTitle className="flex items-center text-[#FFD700]">
                <MapPin className="h-5 w-5 mr-2 text-[#20B2AA]" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="flex items-center text-white">
                  <Home className="h-3 w-3 mr-2 text-[#20B2AA]" />
                  {registration.address.street}
                </p>
                <p className="flex items-center text-white">
                  <Building className="h-3 w-3 mr-2 text-[#20B2AA]" />
                  {registration.address.city}, {registration.address.state_province} {registration.address.postal_code}
                </p>
                <p className="flex items-center text-white">
                  <Globe2 className="h-3 w-3 mr-2 text-[#20B2AA]" />
                  {registration.address.country}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Owners Card */}
        <Card className="w-full shadow-md border border-[#20B2AA]/20 bg-gradient-to-r from-[#0A1933] to-[#193366]">
          <CardHeader className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white rounded-t-lg border-b border-[#20B2AA]/20">
            <CardTitle className="flex items-center text-[#FFD700]">
              <Users className="h-5 w-5 mr-2 text-[#20B2AA]" />
              Owners
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {registration.owners.map((owner, index) => (
                <div key={index} className="flex items-start">
                  <UserCircle className="h-4 w-4 mr-2 text-[#20B2AA] mt-0.5" />
                  <div>
                    <p className="text-white font-medium">{owner.full_name}</p>
                    <p className="text-gray-300 text-sm">Ownership: {owner.ownership_percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Documents Card */}
      <div className="grid grid-cols-1 gap-6">
        {/* Documents Card */}
        <Card className="w-full shadow-md border border-[#20B2AA]/20 bg-gradient-to-r from-[#0A1933] to-[#193366]">
          <CardHeader className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white rounded-t-lg border-b border-[#20B2AA]/20">
            <CardTitle className="flex items-center text-[#FFD700]">
              <FileText className="h-5 w-5 mr-2 text-[#20B2AA]" />
              Documents
            </CardTitle>
            <CardDescription className="text-gray-300">
              Identification and additional documents
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* ID Documents */}
              <div>
                <h3 className="font-bold mb-4 text-white flex items-center">
                  <CreditCard className="h-4 w-4 mr-2 text-[#20B2AA]" />
                  ID Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registration.idDocuments.map((doc, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden border-[#20B2AA]/30 shadow-sm bg-[#0A1933]/80">
                      {/* Document preview */}
                      {doc.idFileName.match(/\.(jpg|jpeg|png)$/i) ? (
                        <div className="p-2 bg-[#0A1933] border-b border-[#20B2AA]/20">
                          <a 
                              href={doc.idFilePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#20B2AA] font-medium flex items-center hover:underline"
                            >
                          <img 
                            src={doc.idFilePath} 
                            alt="ID Document" 
                            className="max-h-40 mx-auto object-contain rounded"
                          />
                          </a>
                        </div>
                      ) : doc.idFileName.match(/\.pdf$/i) ? (
                        <div className="p-4 bg-[#0A1933] border-b border-[#20B2AA]/20">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className="w-12 h-12 text-[#20B2AA] mb-2" />
                            <a 
                              href={doc.idFilePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#20B2AA] font-medium flex items-center hover:underline"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View PDF Document
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-[#0A1933] border-b border-[#20B2AA]/20 flex items-center justify-center">
                          <FileText className="w-12 h-12 text-[#20B2AA]" />
                        </div>
                      )}
                      <div className="p-3 flex items-center">
                        <div className="w-8 h-8 flex items-center justify-center bg-[#0A1933] rounded-md mr-3 border border-[#20B2AA]/20">
                          <FileText className="w-4 h-4 text-[#20B2AA]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{doc.idFileName}</p>
                          <p className="text-xs text-gray-300">
                            <span className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1 text-[#20B2AA]" />
                              <span>Type: {doc.idType}</span>
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Documents */}
              <div>
                <h3 className="font-bold mb-4 text-white flex items-center">
                  <Files className="h-4 w-4 mr-2 text-[#20B2AA]" />
                  Additional Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {registration.additionalDocuments.map((doc, index) => (
                    <div key={index} className="border rounded-md overflow-hidden border-[#20B2AA]/30 shadow-sm bg-[#0A1933]/80">
                      {/* For image files */}
                      {doc.fileName.match(/\.(jpg|jpeg|png)$/i) ? (
                        <div className="p-2 bg-[#0A1933] border-b border-[#20B2AA]/20">
                          <a 
                              href={doc.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#20B2AA] text-xs font-medium flex items-center hover:underline"
                            >
                          <img 
                            src={doc.filePath} 
                            alt={`Document ${index + 1}`} 
                            className="max-h-32 mx-auto object-contain rounded"
                          />
                          </a>
                        </div>
                      ) : doc.fileName.match(/\.pdf$/i) ? (
                        <div className="p-4 bg-[#0A1933] border-b border-[#20B2AA]/20">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className="w-10 h-10 text-[#20B2AA] mb-2" />
                            <a 
                              href={doc.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#20B2AA] text-xs font-medium flex items-center hover:underline"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View PDF
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-[#0A1933] border-b border-[#20B2AA]/20 flex items-center justify-center">
                          <FileText className="w-10 h-10 text-[#20B2AA]" />
                        </div>
                      )}
                      <div className="p-2 flex items-center">
                        <div className="w-6 h-6 flex items-center justify-center bg-[#0A1933] rounded-md mr-2 border border-[#20B2AA]/20">
                          <FileText className="w-3 h-3 text-[#20B2AA]" />
                        </div>
                        <p className="text-xs truncate text-white">{doc.fileName}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationDetails;