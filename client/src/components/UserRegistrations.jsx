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
import { Eye, ChevronDown, ChevronUp, Download, Loader2, Upload, FileText, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';

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

const FileUploadDialog = ({ registration, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please select a JPEG, PNG, or PDF file');
        setFile(null);
        return;
      }
      
      if (selectedFile.size > maxSize) {
        setError('File size must be less than 5MB');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.post(
        `${BASE_URL}/api/admin/registrations/${registration.id}/files`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        setFile(null);
        onSuccess();
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0A1933] border border-[#20B2AA] text-white">
        <DialogHeader>
          <DialogTitle className="text-[#FFD700]">
            Upload File for {registration.company_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#20B2AA] rounded-lg cursor-pointer bg-[#0A1933] hover:bg-[#193366]"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-[#20B2AA] mb-2" />
                <p className="mb-2 text-sm text-[#20B2AA]">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">
                  PDF, JPG or PNG (MAX. 5MB)
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </label>
          </div>
          
          {file && (
            <div className="flex items-center justify-between p-2 bg-[#193366] rounded border border-[#20B2AA]">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-[#20B2AA]" />
                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="h-8 w-8 p-0 text-[#20B2AA] hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          
          <div className="flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-[#20B2AA] text-[#0A1933] hover:bg-[#20B2AA]/80"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  <span>Upload</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FilesList = ({ registration }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  
  const fetchFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `${BASE_URL}/api/admin/registrations/${registration.id}/files`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setFiles(response.data.files || []);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };
  
  const getFileType = (file) => {
    // Check file_url to determine if it's an image or PDF
    if (file.file_url.includes('/image/upload/')) {
      return 'image';
    } else if (file.file_name.toLowerCase().endsWith('.pdf')) {
      return 'pdf';
    }
    return 'other';
  };

  const handleDeleteFile = async (fileId) => {
    setIsDeleting(fileId);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `${BASE_URL}/api/admin/files/${fileId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      // Remove file from list
      setFiles(files.filter(file => file.id !== fileId));
    } catch (err) {
      console.error('Error deleting file:', err);
      alert('Failed to delete file');
    } finally {
      setIsDeleting(null);
    }
  };
  
  const handleFileUpdate = async (fileId, newFile) => {
    try {
      setIsDeleting(fileId); // Reuse loading state
      
      const formData = new FormData();
      formData.append('file', newFile);
      
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.put(
        `${BASE_URL}/api/admin/files/${fileId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        // Refresh file list
        fetchFiles();
      }
    } catch (err) {
      console.error('Error updating file:', err);
      alert('Failed to update file');
    } finally {
      setIsDeleting(null);
    }
  };
  
  // File update handler with input
  const initiateFileUpdate = (fileId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.jpg,.jpeg,.png';
    fileInput.onchange = (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        // Validate file
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(selectedFile.type)) {
          alert('Please select a JPEG, PNG, or PDF file');
          return;
        }
        
        if (selectedFile.size > maxSize) {
          alert('File size must be less than 5MB');
          return;
        }
        
        handleFileUpdate(fileId, selectedFile);
      }
    };
    fileInput.click();
  };
  
  useEffect(() => {
    if (registration.id) {
      fetchFiles();
    }
  }, [registration.id]);

  // Preview file dialog
  const FilePreviewDialog = ({ file }) => {
    const fileType = getFileType(file);
    
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[#20B2AA]"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl bg-[#0A1933] border border-[#20B2AA] text-white">
          <DialogHeader>
            <DialogTitle className="text-[#FFD700]">
              {file.file_name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {fileType === 'image' ? (
              <img 
                src={file.file_url} 
                alt={file.file_name} 
                className="max-h-96 max-w-full object-contain rounded"
              />
            ) : fileType === 'pdf' ? (
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-[#20B2AA]" />
                <p className="mb-4">PDF Document: {file.file_name}</p>
                <Button
                  onClick={() => window.open(file.file_url, '_blank')}
                  className="bg-[#20B2AA] text-[#0A1933] hover:bg-[#20B2AA]/80"
                >
                  Open PDF
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-[#20B2AA]" />
                <p className="mb-4">File: {file.file_name}</p>
                <Button
                  onClick={() => window.open(file.file_url, '_blank')}
                  className="bg-[#20B2AA] text-[#0A1933] hover:bg-[#20B2AA]/80"
                >
                  Open File
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
        >
          <FileText className="h-4 w-4 mr-2" />
          View Files
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-[#0A1933] border border-[#20B2AA] text-white">
        <DialogHeader>
          <DialogTitle className="text-[#FFD700]">
            Files for {registration.company_name}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-[#20B2AA]" />
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              <p>{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={fetchFiles}
                className="mt-2 border-[#20B2AA] text-[#20B2AA]"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No files uploaded for this registration</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map(file => (
                <div key={file.id} className="flex justify-between items-center p-3 bg-[#193366] rounded border border-[#20B2AA]/30">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-[#20B2AA]" />
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px]">{file.file_name}</p>
                      <p className="text-xs text-gray-400">{new Date(file.uploaded_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <FilePreviewDialog file={file} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => initiateFileUpdate(file.id)}
                      className="h-8 w-8 p-0 text-[#20B2AA]"
                      disabled={isDeleting === file.id}
                    >
                      <RefreshCw className={`h-4 w-4 ${isDeleting === file.id ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      className="h-8 w-8 p-0 text-[#20B2AA] hover:text-red-500"
                      disabled={isDeleting === file.id}
                    >
                      {isDeleting === file.id ? 
                        <Loader2 className="h-4 w-4 animate-spin" /> : 
                        <Trash2 className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-center mt-4">
            <FileUploadDialog 
              registration={registration}
              onSuccess={fetchFiles}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
  const [isDownloading, setIsDownloading] = useState(false);

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

  // Client-side function to download PDF
  const downloadSummaryPDF = async (registrationId, companyName) => {
    setIsDownloading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error("Authentication token is missing. Please log in again.");
      }
      
      // Detect if user is on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Make sure userId is available (from useParams or context)
      if (!userId) {
        throw new Error("User ID is required for this operation");
      }
      
      // Create a safe filename
      const safeFileName = (companyName || "LLC").replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      if (isMobile) {
        // For mobile devices - open in a new tab/window with token in query parameter
        const pdfUrl = `${BASE_URL}/api/admin/registrations/${registrationId}/pdf?userId=${userId}&token=${encodeURIComponent(adminToken)}`;
        window.open(pdfUrl, '_blank');
      } else {
        // For desktop - use axios with blob response type
        const response = await axios.get(
          `${BASE_URL}/api/admin/registrations/${registrationId}/pdf`, 
          {
            responseType: "blob",
            params: { userId },
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          }
        );
        
        // Create a download link
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${safeFileName}_Registration_Summary.pdf`);// Completing the downloadSummaryPDF function from where it left off:
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
          alert(`Failed to download PDF: ${error.message}`);
        } finally {
          setIsDownloading(false);
        }
      };
      
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
                                <Button 
                                  variant="outline"
                                  onClick={() => downloadSummaryPDF(registration.id, registration.company_name)}
                                  className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
                                  disabled={isDownloading}
                                >
                                  {isDownloading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      <span>Downloading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="h-4 w-4 mr-2" />
                                      <span>Download PDF</span>
                                    </>
                                  )}
                                </Button>
                                {/* File components */}
                                <FileUploadDialog 
                                  registration={registration}
                                  onSuccess={() => {}}
                                />
                                <FilesList registration={registration} />
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
                                {/* Add FileUploadDialog and FilesList for mobile view */}
                                <FileUploadDialog 
                                  registration={registration}
                                  onSuccess={() => {}}
                                />
                                <FilesList registration={registration} />
                                <Button 
                                  variant="outline"
                                  size="sm" 
                                  onClick={() => downloadSummaryPDF(registration.id, registration.company_name)}
                                  className="w-full border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933]"
                                  disabled={isDownloading}
                                >
                                  {isDownloading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      <span>Downloading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="h-4 w-4 mr-2" />
                                      <span>Download PDF</span>
                                    </>
                                  )}
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