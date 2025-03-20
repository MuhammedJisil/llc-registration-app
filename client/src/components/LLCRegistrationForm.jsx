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
import { Badge } from "@/components/ui/badge";
import { PlusCircle, MinusCircle, ArrowRight, ArrowLeft, CheckCircle, Upload, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { BASE_URL } from '@/lib/config';

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
          form.setValue(key, registrationData[key]);
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
  
        // Set state and step
        if (registrationData.state) {
          handleStateChange(registrationData.state);
        }
  
        if (registrationData.step) {
          setCurrentStep(parseInt(registrationData.step));
        }
  
        // Load document previews if available
        if (registrationData.identificationDocuments?.idFilePath) {
          setPreviewUrl(registrationData.identificationDocuments.idFilePath); // Corrected
        }
       // Inside your loadExistingRegistration function
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
    
    // Create a new FormData object
    const formData = new FormData();
    const formValues = form.getValues();
    
    // Get the existing registrationId if available - make it user-specific
    const registrationId = localStorage.getItem(`registrationId_${userId}`);
    
    // Prepare JSON data for non-file fields
    const jsonData = {
      id: registrationId, // Include the ID if it exists
      userId,
      updateExisting: shouldUpdateExisting,
      state: formValues.state,
      stateAmount: parseFloat(stateAmount) || 0,
      companyName: formValues.companyName,
      companyType: formValues.companyType,
      category: formValues.category,
      owners: formValues.owners,
      address: formValues.address,
      status: 'draft',
      step: currentStep,
      paymentStatus: formValues.paymentStatus,
      // Add metadata about the files but don't include the actual file objects
      identificationDocuments: {
        idType: formValues.identificationDocuments.idType,
        idFileName: formValues.identificationDocuments.idFileName,
        // Don't include the file itself here
        additionalDocuments: formValues.identificationDocuments.additionalDocuments.map(doc => ({
          fileName: doc.fileName
          // Don't include the file itself here
        }))
      }
    };
    
    // Convert the JSON data to a string and append it to the FormData
    formData.append('data', JSON.stringify(jsonData));
    
    // Append ID document if it exists - using the field name that matches your backend
    if (formValues.identificationDocuments.idFile) {
      formData.append('idDocument', formValues.identificationDocuments.idFile);
    }
    
    // Append additional documents using the field name that matches your backend
    if (formValues.identificationDocuments.additionalDocuments && 
        formValues.identificationDocuments.additionalDocuments.length > 0) {
      formValues.identificationDocuments.additionalDocuments.forEach((doc) => {
        if (doc.file) {
          formData.append('additionalDocuments', doc.file);
        }
      });
    }
    
    // Include any existing file paths that might have come from the server
    if (formValues.identificationDocuments.idFilePath) {
      formData.append('idFilePath', formValues.identificationDocuments.idFilePath);
    }
    
    // Log the form data keys for debugging (don't log the actual files)
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
    
    // Store registration ID for future updates - make it user-specific
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
        alert("Please select a state before proceeding.");
        return false;
      }
      return true;
      
    case 2:
      if (!formValues.companyName) {
        alert("Please enter a company name before proceeding.");
        return false;
      }
      if (!formValues.category) {
        alert("Please select a business category before proceeding.");
        return false;
      }
      return true;
      
    case 3:
      for (let i = 0; i < formValues.owners.length; i++) {
        if (!formValues.owners[i].fullName || !formValues.owners[i].ownershipPercentage) {
          alert(`Please complete all owner information for Owner ${i + 1}.`);
          return false;
        }
      }
      
      // Validate total ownership percentage equals 100%
      const totalPercentage = formValues.owners.reduce(
        (sum, owner) => sum + Number(owner.ownershipPercentage), 0
      );
      
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert(`Total ownership percentage should equal 100%. Current total: ${totalPercentage}%`);
        return false;
      }
      
      return true;
      
    case 4:
      if (!formValues.address.street || !formValues.address.city || 
          !formValues.address.state || !formValues.address.postalCode) {
        alert("Please complete all address fields before proceeding.");
        return false;
      }
      return true;
      
    case 5:
      if (!formValues.identificationDocuments.idFile && !formValues.identificationDocuments.idFileName) {
        alert("Please upload your passport before proceeding.");
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
      
      navigate('/payment', { 
        state: { 
          amount: formValues.stateAmount, 
          registrationId: localStorage.getItem(`registrationId_${userId}`) 
        } 
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndExit = async () => {
    try {
      await saveProgress();
      navigate('/dashboard');
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
      
      const response = await axios.get(`${BASE_URL}/api/llc-registrations/${registrationId}/pdf`, {
        responseType: "blob",
        params: { userId } // Pass userId as a query parameter
      });
  
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${formValues.companyName || "LLC"}_Registration_Summary.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  

  // Render steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <CardHeader>
              <CardTitle>Step 1: Select State of Formation</CardTitle>
              <CardDescription>
                Choose the state where you want to register your LLC. The filing fee varies by state.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <div className="mb-4">
                  <Alert className="mb-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      <AlertTitle>Registered Agent Information</AlertTitle>
                    </div>
                    <AlertDescription>
                      You are registering under: <strong>{AGENCY_NAME}</strong><br />
                      {AGENCY_DETAILS.address}, {AGENCY_DETAILS.city}, {AGENCY_DETAILS.state} {AGENCY_DETAILS.zipCode}<br />
                      Phone: {AGENCY_DETAILS.phone} | Email: {AGENCY_DETAILS.email}
                    </AlertDescription>
                  </Alert>
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                         <RequiredLabel>State of Formation</RequiredLabel>
                        <FormControl>
                        <Select 
  value={field.value}
  onValueChange={(value) => {
    field.onChange(value);
    handleStateChange(value);
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Select a state" />
  </SelectTrigger>
  <SelectContent>
  {Array.isArray(stateOptions) && stateOptions.length > 0 ? (
    stateOptions.map((state) => (
      <SelectItem key={state.name} value={state.name}>
        {state.name} - ${state.fee}
      </SelectItem>
    ))
  ) : (
    <div className="px-2 py-4 text-sm">Loading states...</div>
  )}
</SelectContent>
</Select>
                        </FormControl>
                        <FormDescription>
                          This is the state where your LLC will be legally formed.
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {formValues.state && (
                    <div className="mt-4">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        Filing Fee: ${formValues.stateAmount}
                      </Badge>
                    </div>
                  )}
                </div>
              </Form>
            </CardContent>
          </>
        );
      
      case 2:
        return (
          <>
            <CardHeader>
              <CardTitle>Step 2: Let's Name Your Business</CardTitle>
              <CardDescription>
                Choose a unique name for your LLC. Make sure it's available in your selected state.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <RequiredLabel>Company Name</RequiredLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            placeholder="Enter your desired company name"
                          />
                        </FormControl>
                        <FormDescription>
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
                          <Select 
                            disabled
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select company type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LLC">LLC</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
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
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoryOptions.map((category) => (
                                <SelectItem key={category.id} value={category.name}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Alert className="mt-6">
                    <AlertTitle>Important: Check Name Availability</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>Before proceeding, please check if your desired company name is available:</p>
                      {formValues.state === 'Wyoming' ? (
                        <p>
                          <a 
                            href="https://wyobiz.wyo.gov/Business/FilingSearch.aspx" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Search Wyoming Business Filings
                          </a>
                        </p>
                      ) : formValues.state === 'Montana' ? (
                        <p>
                          <a 
                            href="https://biz.sosmt.gov/search/business" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Search Montana Business Filings
                          </a>
                        </p>
                      ) : (
                        <p>Please select a state first.</p>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              </Form>
            </CardContent>
          </>
        );
          
        case 3:
          return (
            <>
              <CardHeader>
                <CardTitle>Step 3: Owners of {formValues.companyName || "Your LLC"}</CardTitle>
                <CardDescription>
                  Provide information about all owners (members) of your LLC and their ownership percentages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-6">
                    {formValues.owners.map((owner, index) => (
                      <div key={index} className="p-4 border rounded-md space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Owner {index + 1}</h3>
                          {formValues.owners.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeOwner(index)}
                            >
                              <MinusCircle className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`owners.${index}.fullName`}
                            render={({ field }) => (
                              <FormItem>
                                <RequiredLabel>Full Name</RequiredLabel>
                                <FormControl>
                                  <Input 
                                    {...field}
                                    placeholder="Enter full legal name"
                                  />
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
                                <div className="flex items-center">
                                  <FormControl>
                                    <Input 
                                      {...field}
                                      type="number"
                                      placeholder="Enter percentage"
                                      min="0"
                                      max="100"
                                    />
                                  </FormControl>
                                  <span className="ml-2">%</span>
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
                      className="w-full"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Another Owner
                    </Button>
                  </div>
                </Form>
              </CardContent>
            </>
          );
        
        case 4:
          return (
            <>
              <CardHeader>
                <CardTitle>Step 4: Residential Address</CardTitle>
                <CardDescription>
                  Provide the principal residential address for your LLC. This cannot be a P.O. Box.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="address.street"
                      render={({ field }) => (
                        <FormItem>
                          <RequiredLabel>Street Address</RequiredLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              placeholder="Enter street address"
                            />
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
                            <Input 
                              {...field}
                              placeholder="Enter city"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="address.state"
                        render={({ field }) => (
                          <FormItem>
                            <RequiredLabel>State/Province/Region</RequiredLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                placeholder="Enter state/province/region"
                              />
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
                              <Input 
                                {...field}
                                placeholder="Enter postal code"
                              />
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
                            <Select 
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                              {countries.map((country) => (
                                <SelectItem key={country} value={country}>{country}</SelectItem>
                              ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </CardContent>
            </>
          );
    
          case 5:
            return (
              <>
                <CardHeader>
                  <CardTitle>Step 5: Upload Identification Documents</CardTitle>
                  <CardDescription>
                    Please upload valid identification documents for verification purposes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <div className="space-y-6">
                      <Alert>
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription>
                          For security and compliance, we require a valid passport. Your information is encrypted and protected.
                        </AlertDescription>
                      </Alert>
          
                      {/* Replace the dropdown with a static display */}
                      <FormItem>
                        <FormLabel>ID Type</FormLabel>
                        <FormControl>
                          <Input value="Passport" disabled />
                        </FormControl>
                        <FormDescription>
                          We only accept passport as a valid form of identification.
                        </FormDescription>
                      </FormItem>
          
                      {/* Hidden field to store the value */}
                      <input 
                        type="hidden" 
                        {...form.register("identificationDocuments.idType")} 
                        value="passport" 
                      />
          
                      {/* Separate file upload component */}
                      <FormItem>
  <RequiredLabel>Upload Passport</RequiredLabel>
  <FormControl>
    <div className="flex flex-col space-y-3">
      <Button 
        type="button" 
        variant="outline" 
        className="flex items-center justify-center h-24 w-full"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('idFileUpload').click();
        }}
      >
        <Upload className="h-6 w-6 mr-2" />
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
        <div className="p-3 border rounded-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-md mr-3">
                {previewUrl && formValues.identificationDocuments.idFileName.match(/\.(jpg|jpeg|png)$/i) ? (
                  <img 
                    src={previewUrl} 
                    alt="ID Preview" 
                    className="max-h-10 max-w-10 object-cover rounded"
                  />
                ) : (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium truncate max-w-xs">{formValues.identificationDocuments.idFileName}</p>
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
              onClick={() => {
                form.setValue('identificationDocuments.idFile', null);
                form.setValue('identificationDocuments.idFileName', '');
                setPreviewUrl(null);
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  </FormControl>
  <FormDescription>
    Upload a clear image or PDF of your passport. Maximum file size: 5MB.
  </FormDescription>
  <FormMessage />
</FormItem>
          
                      {/* Updated Additional Documents Section */}
<FormItem>
  <FormLabel>Additional Supporting Documents (Optional)</FormLabel>
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 w-full flex flex-col items-center justify-center relative">
    <Upload className="h-6 w-6 text-gray-400 mb-2" />
    <p className="text-sm text-gray-500 text-center">
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
  <div className="border rounded-md p-4">
    <h4 className="font-medium mb-2">Additional Documents</h4>
    <div className="space-y-2">
      {formValues.identificationDocuments.additionalDocuments.map((doc, index) => (
        <div key={index} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md mr-3">
              {doc.preview && doc.fileName.match(/\.(jpg|jpeg|png)$/i) ? (
                <img 
                  src={doc.preview} 
                  alt="Document Preview" 
                  className="max-h-8 max-w-8 object-cover rounded"
                />
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </div>
            <p className="text-sm truncate max-w-xs">{doc.fileName}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            type="button"
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
                  </Form>
                </CardContent>
              </>
            );
              
        case 6:
          return (
            <>
              <CardHeader>
                <CardTitle>Step 6: Review Your Information</CardTitle>
                <CardDescription>
                  Please review all the information before proceeding to payment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 1: State of Formation</h3>
                    <p><strong>State:</strong> {formValues.state}</p>
                    <p><strong>Filing Fee:</strong> ${formValues.stateAmount}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 2: Company Information</h3>
                    <p><strong>Company Name:</strong> {formValues.companyName}</p>
                    <p><strong>Company Type:</strong> {formValues.companyType}</p>
                    <p><strong>Business Category:</strong> {formValues.category}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 3: Ownership Information</h3>
                    {formValues.owners.map((owner, index) => (
                      <div key={index} className="mb-2">
                        <p><strong>Owner {index + 1}:</strong> {owner.fullName} ({owner.ownershipPercentage}%)</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 4: Residential Address</h3>
                    <p>{formValues.address.street}</p>
                    <p>{formValues.address.city}, {formValues.address.state} {formValues.address.postalCode}</p>
                    <p>{formValues.address.country}</p>
                  </div>
    
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Step 5: Identification Documents</h3>
                    <p><strong>ID Type:</strong> {formValues.identificationDocuments.idType === 'passport' ? 'Passport' : 
                      formValues.identificationDocuments.idType === 'drivers_license' ? "Driver's License" : 
                      "National ID Card"}</p>
                    <p><strong>Document Uploaded:</strong> {formValues.identificationDocuments.idFileName || 'None'}</p>
                    <p><strong>Additional Documents:</strong> {formValues.identificationDocuments.additionalDocuments.length > 0 ? 
                      `${formValues.identificationDocuments.additionalDocuments.length} file(s) uploaded` : 'None'}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Registered Agent Information</h3>
                    <p><strong>{AGENCY_NAME}</strong></p>
                    <p>{AGENCY_DETAILS.address}, {AGENCY_DETAILS.city}, {AGENCY_DETAILS.state} {AGENCY_DETAILS.zipCode}</p>
                    <p>Phone: {AGENCY_DETAILS.phone}</p>
                    <p>Email: {AGENCY_DETAILS.email}</p>
                  </div>
    
                  <div className="border rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold mb-2">Payment Status</h3>
                    <Badge variant={formValues.paymentStatus === 'paid' ? "success" : "secondary"}>
                      {formValues.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                    </Badge>
                    <p className="text-sm mt-2">
                      {formValues.paymentStatus === 'paid' 
                        ? 'Your registration fee has been processed successfully.' 
                        : 'Please complete payment to finalize your LLC registration.'}
                    </p>
                  </div>
    
                  <div className="pt-4">
                    <Button
                      type="button"
                      className="w-full"
                      variant="outline"
                      onClick={downloadSummaryPDF}
                      disabled={isLoading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                        Download Registration Summary (PDF)
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            );
          
          default:
            return null;
        }
      };
    // In your return statement, wrap the entire component with a loading state
return (
  <div className="max-w-4xl mx-auto p-4">
    {isLoading && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Processing your request...</p>
        </div>
      </div>
    )}
    
<Card className="w-full shadow-md">
  {/* Mobile step indicator */}
  <div className="md:hidden px-4 pt-4 pb-2">
    <div className="flex justify-between items-center">
      <div className="text-sm font-medium text-gray-500">
        Step {currentStep} of 6
      </div>
      <Badge variant="outline" className="font-normal">
        {currentStep === 1 ? 'State Selection' :
         currentStep === 2 ? 'Company Info' :
         currentStep === 3 ? 'Ownership' :
         currentStep === 4 ? 'Address' :
         currentStep === 5 ? 'Documents' : 'Review'}
      </Badge>
    </div>
  </div>
  
  {/* Desktop progress bar */}
  <div className="hidden md:block relative pt-4 px-4">
    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
      <div style={{ width: `${(currentStep / 6) * 100}%` }} 
           className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300">
      </div>
    </div>
    <div className="flex justify-between text-xs text-gray-500">
      <span>Start</span>
      <span>Complete</span>
    </div>
  </div>
  
  {renderStep()}
  <CardFooter className="flex justify-between pt-6 border-t">
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
      
      {currentStep < 6 ? (
        <Button 
          type="button" 
          onClick={handleNext}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 sm:px-4 px-2"
        >
          <span className="sm:inline hidden">Next</span>
          <ArrowRight className="h-4 w-4 sm:ml-2" />
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
  </div>
);
};

export default LLCRegistrationForm;