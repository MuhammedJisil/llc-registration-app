import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; 

import axios from 'axios';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MinusCircle, ArrowRight, ArrowLeft, CheckCircle, Upload, Info, ExternalLink, Flag, Users, FileCheck, Files, Phone, Download, FileText, CreditCard, X, Paperclip, MapPin, Home, Building, Mail, Globe2, Check, AlertCircle, Search, Building2, UserCircle, User, Percent } from "lucide-react";
import { useForm } from "react-hook-form";
import { BASE_URL } from '@/lib/config';
import { toast } from 'sonner';

const steps = [
  { number: 1, label: 'State Selection' },
  { number: 2, label: 'Company Info' },
  { number: 3, label: 'Ownership' },
  { number: 4, label: 'Address' },
  { number: 5, label: 'Documents' },
  { number: 6, label: 'Review' }
];


const AGENCY_NAME = "Mountain West Registered Agents";
const AGENCY_DETAILS = {
  address: "123 Business Way, Suite 200",
  city: "Cheyenne",
  state: "WY",
  zipCode: "82001",
  phone: "(307) 555-1234",
  email: "support@mountainwestagents.com"
};

const RequiredLabel = ({ children }) => (
  <FormLabel className="text-gray-700 font-medium">
    {children} <span className="text-red-500">*</span>
  </FormLabel>
);

const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo (Brazzaville)", "Congo (Kinshasa)", "Costa Rica", "Croatia", "Cuba",
  "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia",
  "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guyana", "Haiti",
  "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait",
  "Latvia", "Lebanon", "Libya", "Malaysia", "Maldives", "Mexico", "Morocco", "Nepal",
  "Netherlands", "New Zealand", "Nigeria", "North Korea", "Norway", "Oman", "Pakistan",
  "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia",
  "Singapore", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden",
  "Switzerland", "Syria", "Thailand", "Turkey", "United Arab Emirates", "United Kingdom",
  "United States", "Venezuela", "Vietnam", "Yemen", "Zimbabwe"
];


const LLCRegistrationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [stateOptions, setStateOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [stateAmount, setStateAmount] = useState(0); // or whatever initial value is appropriate

  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

   // Initialize currentStep from navigation state if available
   const [currentStep, setCurrentStep] = useState(
    location.state?.currentStep ? parseInt(location.state.currentStep) : 1
  );
  
  // Initialize form with useForm
  const form = useForm({
    defaultValues: {
      state: '',
      stateAmount: 0,
      companyName: '',
      companyType: 'LLC',
      category: '',
      owners: [{ fullName: '', ownershipPercentage: '' }],
      address: {
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'United States'
      },
      identificationDocuments: {
        idType: 'passport',
        idFile: null,
        idFileName: '',
        additionalDocuments: []
      },
      paymentStatus: 'unpaid'
    }
  });

  

  // Get form values for easier access
  const formValues = form.watch();

  // Fetch state options and fees
useEffect(() => {
  if (location.state?.newRegistration) {
    startNewRegistration();
  }
  const fetchStateOptions = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/states`);
      console.log('States API response:', response.data); // Debug
      setStateOptions(response.data);
    } catch (error) {
      console.error('Error fetching state options:', error);
      // Set some default values as fallback
     
    }
  };
  
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/categories`);
        setCategoryOptions(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchStateOptions();
    fetchCategories();
  }, []);

    // Add this useEffect to handle state selection after options load
useEffect(() => {
  // If we have state options loaded AND we have a selected state in the form
  // but the amount isn't set, update it
  const currentState = form.getValues('state');
  if (stateOptions.length > 0 && currentState && !stateAmount) {
    handleStateChange(currentState);
  }
}, [stateOptions, form, stateAmount]);

useEffect(() => {
  // Check if this is an update operation vs. continuing registration
  if (location.state && location.state.isUpdate) {
    setIsUpdateMode(true);
  } else {
    setIsUpdateMode(false);
  }
}, [location.state]);




  // Add this useEffect after your other useEffect hooks
  useEffect(() => {
    const loadExistingRegistration = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
    
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id;
        const registrationId = localStorage.getItem(`registrationId_${userId}`);
    
        if (!registrationId) return;
    
        setIsLoading(true);
        const response = await axios.get(
          `${BASE_URL}/api/llc-registrations/${registrationId}?userId=${userId}`, // Pass userId
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
    
        const registrationData = response.data;
        console.log("Fetched Data:", registrationData);
    
        // Update form fields
        Object.keys(registrationData).forEach((key) => {
          if (key !== 'state') { // Handle state separately
            form.setValue(key, registrationData[key]);
          }
        });
    
        // Update nested values separately
        if (registrationData.address) {
          form.setValue("address", registrationData.address);
        }
    
        if (registrationData.owners) {
          form.setValue("owners", registrationData.owners);
        }
    
        if (registrationData.identificationDocuments) {
          form.setValue("identificationDocuments", registrationData.identificationDocuments);
        }
    
        // Important: Set the state value explicitly for the Select component
        if (registrationData.state) {
          // Force the select component to update by explicitly setting its value
          form.setValue('state', registrationData.state, { shouldValidate: true });
          
          // Make sure the amount is also set
          if (registrationData.stateAmount) {
            setStateAmount(parseFloat(registrationData.stateAmount));
            form.setValue('stateAmount', parseFloat(registrationData.stateAmount));
          } else {
            // If there's no amount but there is a state, try to get the amount from options
            const stateOption = stateOptions.find(s => s.name === registrationData.state);
            if (stateOption) {
              const fee = parseFloat(stateOption.fee) || 0;
              setStateAmount(fee);
              form.setValue('stateAmount', fee);
            }
          }
        }
    
        // Set step
        if (registrationData.step) {
          setCurrentStep(parseInt(registrationData.step));
        }
    
        // Load document previews if available
        if (registrationData.identificationDocuments?.idFilePath) {
          setPreviewUrl(registrationData.identificationDocuments.idFilePath);
        }
        
        // Handle additional documents
        if (registrationData.identificationDocuments?.additionalDocuments) {
          console.log("Additional documents from DB:", registrationData.identificationDocuments.additionalDocuments);
          
          // Create properly formatted objects for each document
          const formattedAdditionalDocs = registrationData.identificationDocuments.additionalDocuments.map(doc => {
            // Each doc is an object with fileName and filePath
            return {
              fileName: doc.fileName,
              preview: doc.filePath,  // Use filePath as preview
              url: doc.filePath       // Store the URL for reference
            };
          });
          
          // Update form values with the properly formatted additional documents
          form.setValue('identificationDocuments.additionalDocuments', formattedAdditionalDocs);
        }
    
      } catch (error) {
        console.error('Error loading existing registration:', error);
      } finally {
        setIsLoading(false);
      }
    };
  
    loadExistingRegistration();
  }, [form]); // Add form as a dependency
  

  const handleStateChange = (value) => {
    const selectedState = stateOptions.find(state => state.name === value);
    form.setValue('state', value);
    // Ensure we always have a numeric value, never null or empty string
    const fee = selectedState ? parseFloat(selectedState.fee) : 0;
    form.setValue('stateAmount', fee);
    setStateAmount(fee); // Also update the local state
  };

  const addOwner = () => {
    const currentOwners = form.getValues('owners');
    form.setValue('owners', [...currentOwners, { fullName: '', ownershipPercentage: '' }]);
  };

  const removeOwner = (index) => {
    const currentOwners = form.getValues('owners');
    const updatedOwners = currentOwners.filter((_, i) => i !== index);
    form.setValue('owners', updatedOwners);
  };

 // Updated handleFileUpload function
const handleFileUpload = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Create a local preview URL
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    
    // Save file reference to form state
    form.setValue('identificationDocuments.idFile', file);
    form.setValue('identificationDocuments.idFileName', file.name);
    
    // Display the file preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDFs or other non-image files, show a generic icon/preview
      setPreviewUrl(null); // Clear image preview for PDFs
    }
  }
};

// Updated handleAdditionalDocumentUpload function
const handleAdditionalDocumentUpload = (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) {
    const currentDocs = form.getValues('identificationDocuments.additionalDocuments') || [];
    
    // Create updated list with new files
    const updatedAdditionalDocs = [
      ...currentDocs,
      ...files.map(file => ({
        file,
        fileName: file.name,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      }))
    ];
    
    form.setValue('identificationDocuments.additionalDocuments', updatedAdditionalDocs);
  }
};


const removeAdditionalDocument = (index) => {
    const currentDocs = form.getValues('identificationDocuments.additionalDocuments');
    const updatedDocs = currentDocs.filter((_, i) => i !== index);
    form.setValue('identificationDocuments.additionalDocuments', updatedDocs);
  };

  const handleExitWithoutSaving = () => {
    setIsExitDialogOpen(true);
  };
  
  // Add this function to handle confirmation
  const confirmExit = () => {
    // Navigate back to dashboard without saving
    navigate('/user/dashboard');
  };


// In saveProgress function - modify to use a user-specific key for the registrationId
const saveProgress = async (shouldUpdateExisting = true) => {
  setIsLoading(true);
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
    
    // Get the existing registrationId if available
    const registrationId = localStorage.getItem(`registrationId_${userId}`);
    
    // Track if we're editing an existing registration
    const isEditing = registrationId && shouldUpdateExisting;
    
    // If we have a registrationId, first fetch the current data to get the current status
    let existingStatus = 'draft';
    let highestStepReached = currentStep;
    
    if (isEditing) {
      try {
        const existingRegistration = await axios.get( `${BASE_URL}/api/llc-registrations/${registrationId}?userId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        if (existingRegistration.data) {
          // Get the existing status
          if (existingRegistration.data.status) {
            existingStatus = existingRegistration.data.status;
          }
          
          // Track the highest step the user has reached
          if (existingRegistration.data.step) {
            highestStepReached = Math.max(existingRegistration.data.step, currentStep);
          }
          
          console.log('Fetched existing data:', {
            status: existingStatus,
            existingStep: existingRegistration.data.step,
            currentStep,
            highestStepReached
          });
        }
      } catch (error) {
        console.warn('Could not fetch existing registration, using default status:', error);
      }
    }
    
    // Create a new FormData object
    const formData = new FormData();
    const formValues = form.getValues();
    
    // Determine status based on highest step reached and existing status
    let status = existingStatus;
    
    // Only upgrade the status based on the highest step reached (never downgrade)
    if (highestStepReached >= 6 && ['draft', 'pending'].includes(existingStatus)) {
      status = 'submitted';
    } else if (highestStepReached >= 5 && existingStatus === 'draft') {
      status = 'pending';
    }
    
    console.log('Status determination:', { 
      existingStatus, 
      currentStep,
      highestStepReached,
      newStatus: status,
      keepingExistingStatus: status === existingStatus 
    });
    
    // Prepare JSON data for non-file fields
    const jsonData = {
      id: registrationId, // Include the ID if it exists
      userId,
      updateExisting: shouldUpdateExisting,
      state: formValues.state,
      stateAmount: parseFloat(formValues.stateAmount || stateAmount || 0),
      companyName: formValues.companyName,
      companyType: formValues.companyType,
      category: formValues.category,
      owners: formValues.owners,
      address: formValues.address,
      status: status, // Use the determined status
      step: currentStep,
      highestStepReached: highestStepReached, // Store the highest step reached
      paymentStatus: formValues.paymentStatus,
      // Add metadata about the files but don't include the actual file objects
      identificationDocuments: {
        idType: formValues.identificationDocuments.idType,
        idFileName: formValues.identificationDocuments.idFileName,
        additionalDocuments: formValues.identificationDocuments.additionalDocuments.map(doc => ({
          fileName: doc.fileName
        }))
      }
    };
    
    // Convert the JSON data to a string and append it to the FormData
    formData.append('data', JSON.stringify(jsonData));
    
    // Append ID document if it exists
    if (formValues.identificationDocuments.idFile) {
      formData.append('idDocument', formValues.identificationDocuments.idFile);
    }
    
    // Append additional documents
    if (formValues.identificationDocuments.additionalDocuments && 
        formValues.identificationDocuments.additionalDocuments.length > 0) {
      formValues.identificationDocuments.additionalDocuments.forEach((doc) => {
        if (doc.file) {
          formData.append('additionalDocuments', doc.file);
        }
      });
    }
    
    // Include any existing file paths
    if (formValues.identificationDocuments.idFilePath) {
      formData.append('idFilePath', formValues.identificationDocuments.idFilePath);
    }
    
    // Log the form data keys for debugging
    console.log('FormData keys:', Array.from(formData.keys()));
    
    // Send the request
    const response = await axios.post(`${BASE_URL}/api/llc-registrations`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      }
    });
    
    // If response contains file paths from Cloudinary, update form state
    if (response.data) {
      if (response.data.identificationDocuments?.idFilePath) {
        form.setValue('identificationDocuments.idFilePath', response.data.identificationDocuments.idFilePath);
        // Update preview URL if we received a new one
        setPreviewUrl(response.data.identificationDocuments.idFilePath);
      }
      
      // Handle additional documents paths if returned
      if (response.data.identificationDocuments?.additionalDocuments) {
        const updatedDocs = response.data.identificationDocuments.additionalDocuments.map(doc => ({
          ...doc,
          // Preserve the file object if it exists in our current state
          file: formValues.identificationDocuments.additionalDocuments.find(
            d => d.fileName === doc.fileName
          )?.file || null
        }));
        
        form.setValue('identificationDocuments.additionalDocuments', updatedDocs);
      }
    }
    
    // Store registration ID for future updates
    if (response.data.id && !localStorage.getItem(`registrationId_${userId}`)) {
      localStorage.setItem(`registrationId_${userId}`, response.data.id);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error saving progress:', error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};
// Add this function to validate the current step
const validateCurrentStep = () => {
  switch (currentStep) {
    case 1:
      if (!formValues.state) {
        toast.error("Please select a state before proceeding.");
        return false;
      }
      return true;
      
    case 2:
      if (!formValues.companyName) {
        toast.error("Please enter a company name before proceeding.");
        return false;
      }
      if (!formValues.category) {
        toast.error("Please select a business category before proceeding.");
        return false;
      }
      return true;
      
    case 3:
      for (let i = 0; i < formValues.owners.length; i++) {
        if (!formValues.owners[i].fullName || !formValues.owners[i].ownershipPercentage) {
          toast.error(`Please complete all owner information for Owner ${i + 1}.`);
          return false;
        }
      }
      
      // Validate total ownership percentage equals 100%
      const totalPercentage = formValues.owners.reduce(
        (sum, owner) => sum + Number(owner.ownershipPercentage), 0
      );
      
      if (Math.abs(totalPercentage - 100) > 0.01) {
        toast.error(`Total ownership percentage should equal 100%. Current total: ${totalPercentage}%`);
        return false;
      }
      
      return true;
      
    case 4:
      if (!formValues.address.street || !formValues.address.city || 
          !formValues.address.state || !formValues.address.postalCode) {
            toast.error("Please complete all address fields before proceeding.");
        return false;
      }
      return true;
      
    case 5:
      if (!formValues.identificationDocuments.idFile && !formValues.identificationDocuments.idFileName) {
        toast.error("Please upload your passport before proceeding.");
        return false;
      }
      return true;
      
    default:
      return true;
  }
};

// Update the handleNext function
const handleNext = async (e) => {
  e.preventDefault();
  
  // Validate current step
  if (!validateCurrentStep()) {
    return;
  }
  
  setIsLoading(true);
  try {
    await saveProgress();
    setCurrentStep(currentStep + 1);
  } catch (error) {
    console.error('Error saving progress:', error);
    alert('There was an error saving your progress. Please try again.');
  } finally {
    setIsLoading(false);
  }
};


const handleBack = (e) => {
  e.preventDefault(); // Prevent default form submission
  
  // If we're going back to the state selection step
  if (currentStep === 2) {
    // Force the select to update by re-setting the value
    const currentState = form.getValues('state');
    if (currentState) {
      setTimeout(() => {
        form.setValue('state', currentState, { shouldValidate: true });
      }, 0);
    }
  }
  
  setCurrentStep(currentStep - 1);
};

// Add this function to clear the registration ID
const startNewRegistration = () => {
  const token = localStorage.getItem('token');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.id;
  
  // Clear the stored registration ID
  localStorage.removeItem(`registrationId_${userId}`);
  
  // Reset the form
  form.reset({
    state: '',
    stateAmount: 0,
    companyName: '',
    companyType: 'LLC',
    category: '',
    owners: [{ fullName: '', ownershipPercentage: '' }],
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States'
    },
    identificationDocuments: {
      idType: 'passport',
      idFile: null,
      idFileName: '',
      additionalDocuments: []
    },
    paymentStatus: 'unpaid'
  });
  
  // Reset step
  setCurrentStep(1);
};


const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await saveProgress();
    const token = localStorage.getItem('token');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.id;
    
    // Initialize the payment with your backend
    const response = await axios.post(`${BASE_URL}/api/payments/initialize`, {
      registrationId: localStorage.getItem(`registrationId_${userId}`),
      amount: formValues.stateAmount
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Redirect to the Stripe checkout page with client secret
    navigate(`/user/stripe-checkout/${response.data.paymentId}?clientSecret=${response.data.clientSecret}`);
  } catch (error) {
    console.error('Error submitting form:', error);
    // Show error message to user
    // ...
  } finally {
    setIsLoading(false);
  }
};

  const handleSaveAndExit = async () => {
    try {
      await saveProgress();
      navigate('/user/dashboard');
    } catch (error) {
      console.error('Error saving and exiting:', error);
    }
  };

  const downloadSummaryPDF = async () => {
    setIsLoading(true);
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
      
      const registrationId = localStorage.getItem(`registrationId_${userId}`);
      
      // Create a safe filename
      const safeFileName = (formValues.companyName || "LLC").replace(/[^a-z0-9]/gi, '_').toLowerCase();
      
      // Detect if user is on mobile
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // For mobile devices - open in a new tab/window
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
        link.setAttribute("download", `${safeFileName}_Registration_Summary.pdf`);
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
        }, 100);
        
        // Optional: Additional handling for document URLs
        const documentUrls = response.data.documentUrls || [];
        documentUrls.forEach(doc => {
          if (doc.name.toLowerCase().endsWith('.pdf')) {
            console.log(`PDF Document: ${doc.name}, URL: ${doc.url}`);
          }
        });
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again or contact support.");
      
      // Detailed error logging
      if (error.response) {
        console.error("Server responded with error:", error.response.data);
      } else if (error.request) {
        console.error("No response received from server");
      } else {
        console.error("Error setting up the request:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  // Render steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="w-full shadow-md border border-[#20B2AA]/20 bg-gradient-to-r from-[#0A1933]/5 to-[#193366]/5">
            <CardHeader className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white rounded-t-lg">
              <CardTitle className="flex items-center text-[#FFD700]">
                <span className="mr-2 bg-white rounded-full p-1">
                  <Check className="h-4 w-4 text-[#20B2AA]" />
                </span>
                Step 1: Select State of Formation
              </CardTitle>
              <CardDescription className="text-gray-200">
                Choose the state where you want to register your LLC. The filing fee varies by state.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <div className="space-y-6">
                  <Alert className="border-[#20B2AA] bg-[#20B2AA]/10">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 mr-2 text-[#20B2AA]" />
                      <AlertTitle className="font-medium text-[#0A1933]">Registered Agent Information</AlertTitle>
                    </div>
                    <AlertDescription className="text-[#0A1933]">
                      <div className="pl-6">
                        You are registering under: <strong>{AGENCY_NAME}</strong><br />
                        {AGENCY_DETAILS.address}, {AGENCY_DETAILS.city}, {AGENCY_DETAILS.state} {AGENCY_DETAILS.zipCode}<br />
                        Phone: {AGENCY_DETAILS.phone} | Email: {AGENCY_DETAILS.email}
                      </div>
                    </AlertDescription>
                  </Alert>
                            
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <RequiredLabel>State of Formation</RequiredLabel>
                        <FormControl>
                          <Select
                            value={field.value || ''}
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleStateChange(value);
                            }}
                          >
                            <SelectTrigger className="border-[#20B2AA] focus:ring-[#20B2AA] focus:ring-opacity-50">
                              <SelectValue placeholder="Select a state" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#20B2AA]">
                              {Array.isArray(stateOptions) && stateOptions.length > 0 ? (
                                stateOptions.map((state) => (
                                  <SelectItem key={state.name} value={state.name} className="hover:bg-[#20B2AA]/10">
                                    {state.name} - ${state.fee}
                                  </SelectItem>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-sm flex items-center justify-center text-gray-500">
                                  <Info className="mr-2 h-4 w-4 animate-pulse" />
                                  Loading states...
                                </div>
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription className="text-gray-600">
                          This is the state where your LLC will be legally formed.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  {formValues.state && (
                    <div className="flex justify-center mt-4 transition-all duration-300 ease-in-out">
                      <Badge 
                        variant="outline" 
                        className="text-lg px-6 py-3 border-2 border-[#20B2AA] bg-[#20B2AA]/10 text-[#0A1933] font-medium"
                      >
                        Filing Fee: <span className="text-[#193366] font-bold">${formValues.stateAmount}</span>
                      </Badge>
                    </div>
                  )}
                </div>
              </Form>
            </CardContent>
          </Card>
        );
      
      case 2:
        return (
          <Card className="w-full shadow-md border border-[#20B2AA]/20 bg-gradient-to-r from-[#0A1933]/5 to-[#193366]/5">
            <CardHeader className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white rounded-t-lg">
              <CardTitle className="flex items-center text-[#FFD700]">
                <span className="mr-2 bg-white rounded-full p-1">
                  <CheckCircle className="h-4 w-4 text-[#20B2AA]" />
                </span>
                Step 2: Let's Name Your Business
              </CardTitle>
              <CardDescription className="text-gray-200">
                Choose a unique name for your LLC. Make sure it's available in your selected state.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <RequiredLabel>Company Name</RequiredLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              {...field}
                              placeholder="Enter your desired company name"
                              className="pl-10 border-[#20B2AA] focus:ring-[#20B2AA] focus:ring-opacity-50"
                            />
                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#20B2AA]" />
                          </div>
                        </FormControl>
                        <FormDescription className="text-gray-600">
                          Your company name should end with "LLC", "L.L.C.", or "Limited Liability Company"
                        </FormDescription>
                      </FormItem>
                    )}
                  />
      
                  <FormField
                    control={form.control}
                    name="companyType"
                    render={({ field }) => (
                      <FormItem>
                        <RequiredLabel>Company Type</RequiredLabel>
                        <FormControl>
                          <div className="relative">
                            <Badge 
                              variant="outline" 
                              className="w-full h-10 px-4 flex items-center text-sm border-[#20B2AA] bg-[#20B2AA]/10 text-[#0A1933] font-medium justify-start rounded-md"
                            >
                              <Building2 className="mr-2 h-4 w-4 text-[#20B2AA]" />
                              Limited Liability Company (LLC)
                            </Badge>
                          </div>
                        </FormControl>
                        <FormDescription className="text-gray-600">
                          Your business will be registered as an LLC
                        </FormDescription>
                      </FormItem>
                    )}
                  />
      
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <RequiredLabel>Business Category</RequiredLabel>
                        <FormControl>
                          <Select 
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="border-[#20B2AA] focus:ring-[#20B2AA] focus:ring-opacity-50">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#20B2AA]">
                              {categoryOptions && categoryOptions.map((category) => (
                                <SelectItem key={category.id} value={category.name} className="hover:bg-[#20B2AA]/10">
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription className="text-gray-600">
                          Select the category that best describes your business
                        </FormDescription>
                      </FormItem>
                    )}
                  />
      
                  <Alert className="border-[#FFD700] bg-[#FFD700]/10 mt-6">
                    <AlertCircle className="h-4 w-4 text-[#FFD700]" />
                    <AlertTitle className="font-medium text-[#0A1933] ml-2">Important: Check Name Availability</AlertTitle>
                    <AlertDescription className="space-y-3 pl-6 mt-2 text-[#0A1933]">
                      <p>Before proceeding, please check if your desired company name is available:</p>
                      {formValues.state === 'Wyoming' ? (
                        <a 
                          href="https://wyobiz.wyo.gov/Business/FilingSearch.aspx" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 rounded-md bg-[#193366] text-white hover:bg-[#0A1933] transition-colors"
                        >
                          <Search className="mr-2 h-4 w-4" />
                          Search Wyoming Business Filings
                        </a>
                      ) : formValues.state === 'Montana' ? (
                        <a 
                          href="https://biz.sosmt.gov/search/business" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 rounded-md bg-[#193366] text-white hover:bg-[#0A1933] transition-colors"
                        >
                          <Search className="mr-2 h-4 w-4" />
                          Search Montana Business Filings
                        </a>
                      ) : (
                        <div className="text-amber-600 font-medium italic flex items-center">
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Please select a state first to check name availability.
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              </Form>
            </CardContent>
          </Card>
        );
          
        case 3:
          return (
            <Card className="w-full shadow-md border border-[#20B2AA]/20 bg-gradient-to-r from-[#0A1933]/5 to-[#193366]/5">
              <CardHeader className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white rounded-t-lg">
                <CardTitle className="flex items-center text-[#FFD700]">
                  <span className="mr-2 bg-white rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-[#20B2AA]" />
                  </span>
                  Step 3: Owners of {formValues.companyName || "Your LLC"}
                </CardTitle>
                <CardDescription className="text-gray-200">
                  Provide information about all owners (members) of your LLC and their ownership percentages.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <div className="space-y-6">
                    {formValues.owners && formValues.owners.map((owner, index) => (
                      <div 
                        key={index} 
                        className="p-4 border border-[#20B2AA]/30 rounded-md space-y-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-[#0A1933] flex items-center">
                            <UserCircle className="h-5 w-5 mr-2 text-[#20B2AA]" />
                            Owner {index + 1}
                          </h3>
                          {formValues.owners.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeOwner(index)}
                              className="text-red-500 border-red-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <MinusCircle className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <Separator className="bg-[#20B2AA]/20" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name={`owners.${index}.fullName`}
                            render={({ field }) => (
                              <FormItem>
                                <RequiredLabel>Full Name</RequiredLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      {...field}
                                      placeholder="Enter full legal name"
                                      className="pl-10 border-[#20B2AA] focus:ring-[#20B2AA] focus:ring-opacity-50"
                                    />
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#20B2AA]" />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`owners.${index}.ownershipPercentage`}
                            render={({ field }) => (
                              <FormItem>
                                <RequiredLabel>Ownership Percentage</RequiredLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      placeholder="Enter percentage"
                                      min="0"
                                      max="100"
                                      className="pl-10 pr-8 border-[#20B2AA] focus:ring-[#20B2AA] focus:ring-opacity-50"
                                    />
                                  </FormControl>
                                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#20B2AA]" />
                                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#0A1933] font-medium">%</span>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addOwner}
                      className="w-full border-dashed border-2 border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA]/10 hover:text-[#0A1933] h-12 font-medium"
                    >
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Add Another Owner
                    </Button>
                  </div>
                </Form>
              </CardContent>
            </Card>
          );
        
        case 4:
          return (
            <Card className="w-full shadow-md border border-[#20B2AA]/20 bg-gradient-to-r from-[#0A1933]/5 to-[#193366]/5">
              <CardHeader className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white rounded-t-lg">
                <CardTitle className="flex items-center text-[#FFD700]">
                  <span className="mr-2 bg-white rounded-full p-1">
                    <CheckCircle className="h-4 w-4 text-[#20B2AA]" />
                  </span>
                  Step 4: Residential Address
                </CardTitle>
                <CardDescription className="text-gray-200">
                  Provide the principal residential address for your LLC. This cannot be a P.O. Box.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Alert className="mb-6 border-[#FFD700] bg-[#FFD700]/10">
                  <AlertCircle className="h-4 w-4 text-[#FFD700]" />
                  <AlertTitle className="font-medium text-[#0A1933] ml-2">Important</AlertTitle>
                  <AlertDescription className="text-[#0A1933] pl-6">
                    This must be a physical address. P.O. Boxes are not acceptable for LLC registration.
                  </AlertDescription>
                </Alert>
                
                <Form {...form}>
                  <div className="space-y-6">
                    <div className="bg-white p-5 rounded-md border border-[#20B2AA]/30 shadow-sm">
                      <div className="flex items-center mb-4">
                      <MapPin className="h-5 w-5 mr-2 text-[#20B2AA]" />
                        <h3 className="font-medium text-[#0A1933]">Address Details</h3>
                      </div>
                      
                      <div className="space-y-5">
                        <FormField
                          control={form.control}
                          name="address.street"
                          render={({ field }) => (
                            <FormItem>
                              <RequiredLabel>Street Address</RequiredLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    {...field}
                                    placeholder="Enter street address"
                                    className="pl-10 border-[#20B2AA] focus:ring-[#20B2AA] focus:ring-opacity-50"
                                  />
                                  <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#20B2AA]" />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="address.city"
                          render={({ field }) => (
                            <FormItem>
                              <RequiredLabel>City</RequiredLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    {...field}
                                    placeholder="Enter city"
                                    className="pl-10 border-[#20B2AA] focus:ring-[#20B2AA] focus:ring-opacity-50"
                                  />
                                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#20B2AA]" />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="address.state"
                            render={({ field }) => (
                              <FormItem>
                                <RequiredLabel>State/Province/Region</RequiredLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      {...field}
                                      placeholder="Enter state/province/region"
                                      className="pl-10 border-[#20B2AA] focus:ring-[#20B2AA] focus:ring-opacity-50"
                                    />
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#20B2AA]" />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="address.postalCode"
                            render={({ field }) => (
                              <FormItem>
                                <RequiredLabel>Postal Code</RequiredLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      {...field}
                                      placeholder="Enter postal code"
                                      className="pl-10 border-[#20B2AA] focus:ring-[#20B2AA] focus:ring-opacity-50"
                                    />
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#20B2AA]" />
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="address.country"
                          render={({ field }) => (
                            <FormItem>
                              <RequiredLabel>Country</RequiredLabel>
                              <FormControl>
                                <div className="relative">
                                  <Select 
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <SelectTrigger className="pl-10 border-[#20B2AA] focus:ring-[#20B2AA] focus:ring-opacity-50">
                                      <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-80 overflow-y-auto border-[#20B2AA]">
                                      {countries && countries.map((country) => (
                                        <SelectItem key={country} value={country} className="hover:bg-[#20B2AA]/10">
                                          {country}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Globe2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#20B2AA] z-10" />
                                </div>
                              </FormControl>
                              <FormDescription className="text-gray-600">
                                Select the country where your LLC is primarily located
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </Form>
              </CardContent>
            </Card>
          );
            case 5:
              return (
                <Card className="w-full shadow-md border border-[#20B2AA]/20 bg-gradient-to-r from-[#0A1933]/5 to-[#193366]/5">
                  <CardHeader className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white rounded-t-lg">
                    <CardTitle className="flex items-center text-[#FFD700]">
                      <span className="mr-2 bg-white rounded-full p-1">
                        <CheckCircle className="h-4 w-4 text-[#20B2AA]" />
                      </span>
                      Step 5: Upload Identification Documents
                    </CardTitle>
                    <CardDescription className="text-gray-200">
                      Please upload valid identification documents for verification purposes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Alert className="mb-6 border-[#FFD700] bg-[#FFD700]/10">
                      <AlertCircle className="h-4 w-4 text-[#FFD700]" />
                      <AlertTitle className="font-medium text-[#0A1933] ml-2">Important</AlertTitle>
                      <AlertDescription className="text-[#0A1933] pl-6">
                        For security and compliance, we require a valid passport. Your information is encrypted and protected.
                      </AlertDescription>
                    </Alert>
                    
                    <Form {...form}>
                      <div className="space-y-6">
                        <div className="bg-white p-5 rounded-md border border-[#20B2AA]/30 shadow-sm">
                          <div className="flex items-center mb-4">
                            <FileText className="h-5 w-5 mr-2 text-[#20B2AA]" />
                            <h3 className="font-medium text-[#0A1933]">Identification Details</h3>
                          </div>
                          
                          <div className="space-y-5">
                            {/* Fixed ID Type Display */}
                            <FormItem>
                              <FormLabel className="text-[#0A1933] font-medium flex items-center">
                                ID Type <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input 
                                    value="Passport" 
                                    disabled 
                                    className="pl-10 border-[#20B2AA] bg-gray-50 focus:ring-[#20B2AA] focus:ring-opacity-50"
                                  />
                                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#20B2AA]" />
                                </div>
                              </FormControl>
                              <FormDescription className="text-gray-600">
                                We only accept passport as a valid form of identification.
                              </FormDescription>
                            </FormItem>
            
                            {/* Hidden field to store the value */}
                            <input 
                              type="hidden" 
                              {...form.register("identificationDocuments.idType")} 
                              value="passport" 
                            />
            
                            {/* Passport Upload */}
                            <FormItem>
                              <FormLabel className="text-[#0A1933] font-medium flex items-center">
                                Upload Passport <span className="text-red-500 ml-1">*</span>
                              </FormLabel>
                              <FormControl>
                                <div className="flex flex-col space-y-3">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="flex items-center justify-center h-24 w-full border-dashed border-[#20B2AA] hover:bg-[#20B2AA]/5"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      document.getElementById('idFileUpload').click();
                                    }}
                                  >
                                    <Upload className="h-6 w-6 mr-2 text-[#20B2AA]" />
                                    {formValues.identificationDocuments.idFileName ? 'Change file' : 'Click to upload'}
                                  </Button>
                                  <Input 
                                    id="idFileUpload"
                                    type="file" 
                                    className="hidden" 
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={handleFileUpload}
                                  />
                                  
                                  {/* Document preview section */}
                                  {formValues.identificationDocuments.idFileName && (
                                    <div className="p-3 border rounded-md border-[#20B2AA]/30 bg-white">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center">
                                          <div className="w-10 h-10 flex items-center justify-center bg-[#20B2AA]/10 rounded-md mr-3">
                                            {previewUrl && formValues.identificationDocuments.idFileName.match(/\.(jpg|jpeg|png)$/i) ? (
                                              <img 
                                                src={previewUrl} 
                                                alt="ID Preview" 
                                                className="max-h-10 max-w-10 object-cover rounded"
                                              />
                                            ) : (
                                              <FileText className="w-6 h-6 text-[#20B2AA]" />
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium truncate max-w-xs text-[#0A1933]">{formValues.identificationDocuments.idFileName}</p>
                                            <p className="text-xs text-gray-500">
                                              {/* Show file size if available */}
                                              {formValues.identificationDocuments.idFile && 
                                                `${(formValues.identificationDocuments.idFile.size / (1024 * 1024)).toFixed(2)} MB`}
                                            </p>
                                          </div>
                                        </div>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          className="text-[#0A1933] hover:bg-[#20B2AA]/10 hover:text-[#20B2AA]"
                                          onClick={() => {
                                            form.setValue('identificationDocuments.idFile', null);
                                            form.setValue('identificationDocuments.idFileName', '');
                                            setPreviewUrl(null);
                                          }}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormDescription className="text-gray-600">
                                Upload a clear image or PDF of your passport. Maximum file size: 5MB.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                      
                            {/* Updated Additional Documents Section */}
                            <FormItem>
                              <FormLabel className="text-[#0A1933] font-medium">Additional Supporting Documents (Optional)</FormLabel>
                              <div className="border-2 border-dashed border-[#20B2AA]/50 rounded-lg p-6 w-full flex flex-col items-center justify-center relative bg-white">
                                <Upload className="h-6 w-6 text-[#20B2AA] mb-2" />
                                <p className="text-sm text-[#0A1933] text-center">
                                  Upload any additional documents if required
                                </p>
                                <p className="text-xs text-gray-400 text-center mt-1">
                                  JPG, PNG, or PDF (max 5MB each)
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="absolute inset-0 w-full h-full opacity-0"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('additionalDocs').click();
                                  }}
                                />
                                <Input 
                                  id="additionalDocs"
                                  type="file" 
                                  className="hidden" 
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  multiple
                                  onChange={handleAdditionalDocumentUpload}
                                />
                              </div>
                            </FormItem>
                      
                            {formValues.identificationDocuments.additionalDocuments.length > 0 && (
                              <div className="border rounded-md p-4 border-[#20B2AA]/30 bg-white">
                                <h4 className="font-medium mb-2 text-[#0A1933] flex items-center">
                                  <Paperclip className="h-4 w-4 mr-2 text-[#20B2AA]" />
                                  Additional Documents
                                </h4>
                                <div className="space-y-2">
                                  {formValues.identificationDocuments.additionalDocuments.map((doc, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 hover:bg-[#20B2AA]/5 rounded-md transition-colors">
                                      <div className="flex items-center">
                                        <div className="w-8 h-8 flex items-center justify-center bg-[#20B2AA]/10 rounded-md mr-3">
                                          {doc.preview && doc.fileName.match(/\.(jpg|jpeg|png)$/i) ? (
                                            <img 
                                              src={doc.preview} 
                                              alt="Document Preview" 
                                              className="max-h-8 max-w-8 object-cover rounded"
                                            />
                                          ) : (
                                            <FileText className="w-5 h-5 text-[#20B2AA]" />
                                          )}
                                        </div>
                                        <p className="text-sm truncate max-w-xs text-[#0A1933]">{doc.fileName}</p>
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        type="button"
                                        className="text-[#0A1933] hover:bg-[#20B2AA]/10 hover:text-[#20B2AA]"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          removeAdditionalDocument(index);
                                        }}
                                      >
                                        <MinusCircle className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Form>
                  </CardContent>
                </Card>
              );
case 6:
  return (
    <Card className="w-full shadow-md border border-[#20B2AA]/20 bg-gradient-to-r from-[#0A1933]/5 to-[#193366]/5">
      <CardHeader className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white rounded-t-lg">
        <CardTitle className="flex items-center text-[#FFD700]">
          <span className="mr-2 bg-white rounded-full p-1">
            <CheckCircle className="h-4 w-4 text-[#20B2AA]" />
          </span>
          Step 6: Review Your Information
        </CardTitle>
        <CardDescription className="text-gray-200">
          Please review all the information before proceeding to payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-md border border-[#20B2AA]/30 shadow-sm">
            <div className="flex items-center mb-4">
              <Flag className="h-5 w-5 mr-2 text-[#20B2AA]" />
              <h3 className="font-medium text-[#0A1933]">Step 1: State of Formation</h3>
            </div>
            <div className="pl-7 space-y-1">
              <p className="flex items-center text-[#0A1933]">
                <CheckCircle className="h-3 w-3 mr-2 text-[#20B2AA]" />
                <span className="font-medium">State:</span> 
                <span className="ml-2">{formValues.state}</span>
              </p>
              <p className="flex items-center text-[#0A1933]">
                <CheckCircle className="h-3 w-3 mr-2 text-[#20B2AA]" />
                <span className="font-medium">Filing Fee:</span> 
                <span className="ml-2">${formValues.stateAmount}</span>
              </p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-md border border-[#20B2AA]/30 shadow-sm">
            <div className="flex items-center mb-4">
              <Building2 className="h-5 w-5 mr-2 text-[#20B2AA]" />
              <h3 className="font-medium text-[#0A1933]">Step 2: Company Information</h3>
            </div>
            <div className="pl-7 space-y-1">
              <p className="flex items-center text-[#0A1933]">
                <CheckCircle className="h-3 w-3 mr-2 text-[#20B2AA]" />
                <span className="font-medium">Company Name:</span> 
                <span className="ml-2">{formValues.companyName}</span>
              </p>
              <p className="flex items-center text-[#0A1933]">
                <CheckCircle className="h-3 w-3 mr-2 text-[#20B2AA]" />
                <span className="font-medium">Company Type:</span> 
                <span className="ml-2">{formValues.companyType}</span>
              </p>
              <p className="flex items-center text-[#0A1933]">
                <CheckCircle className="h-3 w-3 mr-2 text-[#20B2AA]" />
                <span className="font-medium">Business Category:</span> 
                <span className="ml-2">{formValues.category}</span>
              </p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-md border border-[#20B2AA]/30 shadow-sm">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 mr-2 text-[#20B2AA]" />
              <h3 className="font-medium text-[#0A1933]">Step 3: Ownership Information</h3>
            </div>
            <div className="pl-7 space-y-3">
              {formValues.owners.map((owner, index) => (
                <div key={index} className="flex items-start">
                  <UserCircle className="h-4 w-4 mr-2 text-[#20B2AA] mt-0.5" />
                  <div>
                    <p className="text-[#0A1933] font-medium">{owner.fullName}</p>
                    <p className="text-gray-600 text-sm">Ownership: {owner.ownershipPercentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-md border border-[#20B2AA]/30 shadow-sm">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 mr-2 text-[#20B2AA]" />
              <h3 className="font-medium text-[#0A1933]">Step 4: Residential Address</h3>
            </div>
            <div className="pl-7 space-y-1">
              <p className="flex items-center text-[#0A1933]">
                <Home className="h-3 w-3 mr-2 text-[#20B2AA]" />
                {formValues.address.street}
              </p>
              <p className="flex items-center text-[#0A1933]">
                <Building className="h-3 w-3 mr-2 text-[#20B2AA]" />
                {formValues.address.city}, {formValues.address.state} {formValues.address.postalCode}
              </p>
              <p className="flex items-center text-[#0A1933]">
                <Globe2 className="h-3 w-3 mr-2 text-[#20B2AA]" />
                {formValues.address.country}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-md border border-[#20B2AA]/30 shadow-sm">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 mr-2 text-[#20B2AA]" />
              <h3 className="font-medium text-[#0A1933]">Step 5: Identification Documents</h3>
            </div>
            <div className="pl-7 space-y-4">
              <p className="flex items-center text-[#0A1933]">
                <CreditCard className="h-3 w-3 mr-2 text-[#20B2AA]" />
                <span className="font-medium">ID Type:</span>
                <span className="ml-2">Passport</span>
              </p>
              
              {/* Document Preview Section */}
              {formValues.identificationDocuments.idFileName && (
                <div>
                  <p className="flex items-center text-[#0A1933] mb-2">
                    <FileCheck className="h-3 w-3 mr-2 text-[#20B2AA]" />
                    <span className="font-medium">Passport Document:</span>
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    {/* Document preview - For image files */}
                    {previewUrl && formValues.identificationDocuments.idFileName.match(/\.(jpg|jpeg|png)$/i) ? (
                      <div className="p-2 bg-[#20B2AA]/5 border-b">
                        <img 
                          src={previewUrl} 
                          alt="ID Document" 
                          className="max-h-40 mx-auto object-contain rounded"
                        />
                      </div>
                    ) : formValues.identificationDocuments.idFileName.match(/\.pdf$/i) ? (
                      /* For PDF files, show a link to Cloudinary */
                      <div className="p-4 bg-[#20B2AA]/5 border-b">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="w-12 h-12 text-[#20B2AA] mb-2" />
                          <a 
                            href={previewUrl || `https://res.cloudinary.com/dtzeedjp7/image/upload/${formValues.identificationDocuments.cloudinaryId || `v${Date.now()}/id_documents/${formValues.identificationDocuments.idFileName}`}`}
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
                      <div className="p-4 bg-[#20B2AA]/5 border-b flex items-center justify-center">
                        <FileText className="w-12 h-12 text-[#20B2AA]" />
                      </div>
                    )}
                    <div className="p-3 flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-[#20B2AA]/10 rounded-md mr-3">
                        {formValues.identificationDocuments.idFileName.match(/\.pdf$/i) ? (
                          <FileText className="w-4 h-4 text-[#20B2AA]" />
                        ) : (
                          <FileText className="w-4 h-4 text-[#20B2AA]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0A1933]">{formValues.identificationDocuments.idFileName}</p>
                        <p className="text-xs text-gray-500">
                          {formValues.identificationDocuments.idFile && 
                            `${(formValues.identificationDocuments.idFile.size / (1024 * 1024)).toFixed(2)} MB`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Additional Documents */}
              {formValues.identificationDocuments.additionalDocuments.length > 0 && (
                <div>
                  <p className="flex items-center text-[#0A1933] mb-2">
                    <Files className="h-3 w-3 mr-2 text-[#20B2AA]" />
                    <span className="font-medium">Additional Documents:</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formValues.identificationDocuments.additionalDocuments.map((doc, index) => (
                      <div key={index} className="border rounded-md overflow-hidden">
                        {/* For image files */}
                        {doc.preview && doc.fileName.match(/\.(jpg|jpeg|png)$/i) ? (
                          <div className="p-2 bg-[#20B2AA]/5 border-b">
                            <img 
                              src={doc.preview} 
                              alt={`Document ${index + 1}`} 
                              className="max-h-32 mx-auto object-contain rounded"
                            />
                          </div>
                        ) : doc.fileName.match(/\.pdf$/i) ? (
                          /* For PDF files, show a link to Cloudinary */
                          <div className="p-4 bg-[#20B2AA]/5 border-b">
                            <div className="flex flex-col items-center justify-center">
                              <FileText className="w-10 h-10 text-[#20B2AA] mb-2" />
                              <a 
                                href={doc.preview || `https://res.cloudinary.com/dtzeedjp7/image/upload/${doc.cloudinaryId || `v${Date.now()}/id_documents/${doc.fileName}`}`}
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
                          <div className="p-4 bg-[#20B2AA]/5 border-b flex items-center justify-center">
                            <FileText className="w-10 h-10 text-[#20B2AA]" />
                          </div>
                        )}
                        <div className="p-2 flex items-center">
                          <div className="w-6 h-6 flex items-center justify-center bg-[#20B2AA]/10 rounded-md mr-2">
                            {doc.fileName.match(/\.pdf$/i) ? (
                              <FileText className="w-3 h-3 text-[#20B2AA]" />
                            ) : (
                              <FileText className="w-3 h-3 text-[#20B2AA]" />
                            )}
                          </div>
                          <p className="text-xs truncate text-[#0A1933]">{doc.fileName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-md border border-[#20B2AA]/30 shadow-sm">
            <div className="flex items-center mb-4">
              <Building2 className="h-5 w-5 mr-2 text-[#20B2AA]" />
              <h3 className="font-medium text-[#0A1933]">Registered Agent Information</h3>
            </div>
            <div className="pl-7 space-y-1">
              <p className="text-[#0A1933] font-medium">{AGENCY_NAME}</p>
              <p className="text-[#0A1933]">{AGENCY_DETAILS.address}, {AGENCY_DETAILS.city}, {AGENCY_DETAILS.state} {AGENCY_DETAILS.zipCode}</p>
              <p className="flex items-center text-[#0A1933]">
                <Phone className="h-3 w-3 mr-2 text-[#20B2AA]" />
                {AGENCY_DETAILS.phone}
              </p>
              <p className="flex items-center text-[#0A1933]">
                <Mail className="h-3 w-3 mr-2 text-[#20B2AA]" />
                {AGENCY_DETAILS.email}
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#0A1933]/10 to-[#20B2AA]/10 p-5 rounded-md border border-[#20B2AA]/30 shadow-sm">
            <div className="flex items-center mb-4">
              <CreditCard className="h-5 w-5 mr-2 text-[#20B2AA]" />
              <h3 className="font-medium text-[#0A1933]">Payment Status</h3>
            </div>
            <div className="pl-7">
              <Badge variant={formValues.paymentStatus === 'paid' ? "success" : "secondary"} className={`${formValues.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-[#FFD700]'} text-white px-3 py-1`}>
                {formValues.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
              </Badge>
              <p className="text-sm mt-2 text-[#0A1933]">
                {formValues.paymentStatus === 'paid' 
                  ? 'Your registration fee has been processed successfully.' 
                  : 'Please complete payment to finalize your LLC registration.'}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="button"
              className="w-full bg-gradient-to-r from-[#0A1933] to-[#193366] hover:from-[#0A1933]/90 hover:to-[#193366]/90 text-white"
              onClick={downloadSummaryPDF}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Registration Summary (PDF)
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
          
          default:
            return null;
        }
      };
    // In your return statement, wrap the entire component with a loading state
    return (
      // Add padding-top to prevent content from going under fixed header
      <div className="max-w-4xl mx-auto p-4 pt-24">
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Processing your request...</p>
            </div>
          </div>
        )}
  
        <Card className="w-full shadow-md">
          {/* Mobile step indicator with more visual appeal */}
          <div className="md:hidden px-4 pt-6 pb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-700">
                Step {currentStep} of {steps.length}
              </div>
              <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200">
                {steps.find(step => step.number === currentStep)?.label}
              </Badge>
            </div>
            
            {/* Mobile progress bar */}
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${(currentStep / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
  
          {/* Desktop progress indicator with circles */}
          <div className="hidden md:block px-8 pt-8 pb-6">
            <div className="relative">
              {/* Progress bar connecting the circles */}
              <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-gray-200">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>
              </div>
              
              {/* Step circles */}
              <div className="relative flex justify-between">
                {steps.map((step) => (
                  <div key={step.number} className="flex flex-col items-center">
                    <div 
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium 
                        ${step.number < currentStep 
                          ? 'bg-blue-500 text-white' 
                          : step.number === currentStep 
                          ? 'bg-blue-500 text-white ring-4 ring-blue-100' 
                          : 'bg-gray-200 text-gray-500'}
                        transition-all duration-200
                      `}
                    >
                      {step.number}
                    </div>
                    <span className={`
                      mt-2 text-xs font-medium 
                      ${step.number <= currentStep ? 'text-blue-700' : 'text-gray-500'}
                    `}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
  
          {/* Content section */}
          <div className="px-4 pb-4">
            {renderStep()}
          </div>
          
          {/* Footer with actions */}
          <CardFooter className="flex justify-between pt-6 pb-6 border-t">
  <div>
    {currentStep > 1 && (
      <Button
        type="button"
        variant="outline"
        onClick={handleBack}
        disabled={isLoading}
        className="border-gray-300 hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Back</span>
      </Button>
    )}
  </div>
  <div className="space-x-2">
    {/* Only show "Save & Exit" when updating a registration */}
    {isUpdateMode ? (
      <Button
        type="button"
        variant="secondary"
        onClick={handleSaveAndExit}
        disabled={isLoading}
        className="bg-gray-100 hover:bg-gray-200 text-gray-800 sm:px-4 px-2"
      >
        <span className="sm:inline hidden">Save & Exit</span>
        <span className="sm:hidden inline">Save</span>
      </Button>
    ) : (
      <Button
        type="button"
        variant="secondary"
        onClick={handleExitWithoutSaving}
        disabled={isLoading}
        className="bg-gray-100 hover:bg-gray-200 text-gray-800 sm:px-4 px-2"
      >
        <span className="sm:inline hidden">Exit</span>
        <span className="sm:hidden inline">Exit</span>
      </Button>
    )}
    
    {currentStep < steps.length ? (
      <Button
        type="button"
        onClick={handleNext}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 rounded-md bg-[#193366] text-white hover:bg-[#0A1933] transition-colors"
      >
        <span className="sm:inline hidden">Next</span>
        <span className="flex items-center">
          <ArrowRight className="h-4 w-4 sm:ml-2" />
        </span>
      </Button>
    ) : (
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading}
        className="bg-green-600 hover:bg-green-700 sm:px-4 px-2 whitespace-nowrap"
      >
        <span className="sm:inline hidden">Proceed to Payment</span>
        <span className="sm:hidden inline">Pay Now</span>
      </Button>
    )}
  </div>
</CardFooter>
        </Card>
        <AlertDialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
      <AlertDialogContent className="bg-[#0A1933] border border-[#20B2AA] text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#FFD700]">Exit Without Saving</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            Are you sure you want to exit without saving your progress? Any unsaved changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="bg-[#193366] text-white hover:bg-[#0A1933] border border-[#20B2AA]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmExit}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Exit Without Saving
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
        
      </div>
    );
};

export default LLCRegistrationForm;