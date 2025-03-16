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
 // First, update your useEffect to handle errors better and check the data format:
useEffect(() => {
  const fetchStateOptions = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/states`);
      console.log('States API response:', response.data); // Debug
      setStateOptions(response.data);
    } catch (error) {
      console.error('Error fetching state options:', error);
      // Set some default values as fallback
      setStateOptions([
        { name: 'Wyoming', fee: 100.00 },
        { name: 'Montana', fee: 70.00 }
      ]);
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
      
      form.setValue('identificationDocuments.idFile', file);
      form.setValue('identificationDocuments.idFileName', file.name);
    }
  };

  const handleAdditionalDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const currentDocs = form.getValues('identificationDocuments.additionalDocuments');
      const updatedAdditionalDocs = [
        ...currentDocs,
        ...files.map(file => ({
          file,
          fileName: file.name
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
const saveProgress = async () => {
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
    const data = new FormData();
    const formData = form.getValues();
    
    // Get the existing registrationId if available - make it user-specific
    const registrationId = localStorage.getItem(`registrationId_${userId}`);
    
    // Append non-file data as JSON
    const jsonData = {
      id: registrationId, // Include the ID if it exists
      userId,
      state: formData.state,
      stateAmount: parseFloat(stateAmount) || 0,
      companyName: formData.companyName,
      companyType: formData.companyType,
      category: formData.category,
      owners: formData.owners,
      address: formData.address,
      status: 'draft',
      step: currentStep,
      paymentStatus: formData.paymentStatus
    };
    
    data.append('data', JSON.stringify(jsonData));
    
    // Append files as before...
    
    // Send the request
    const response = await axios.post(`${BASE_URL}/api/llc-registrations`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      }
    });
    
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

const handleNext = async (e) => {
  e.preventDefault(); // Prevent default form submission
  await saveProgress();
  setCurrentStep(currentStep + 1);
};


const handleBack = (e) => {
  e.preventDefault(); // Prevent default form submission
  setCurrentStep(currentStep - 1);
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
      const registrationId = localStorage.getItem("registrationId");
      const userId = localStorage.getItem("userId"); // Ensure userId is available
  
      const response = await axios.get(`${BASE_URL}/api/llc-registrations/${registrationId}/pdf?userId=${userId}`, {
        responseType: "blob", // Important: Set response type to blob for PDFs
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
                        <FormLabel>State of Formation</FormLabel>
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
                        <FormLabel>Company Name</FormLabel>
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
                        <FormLabel>Company Type</FormLabel>
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
                        <FormLabel>Business Category</FormLabel>
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
                                <FormLabel>Full Name</FormLabel>
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
                                <FormLabel>Ownership Percentage</FormLabel>
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
                          <FormLabel>Street Address</FormLabel>
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
                          <FormLabel>City</FormLabel>
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
                            <FormLabel>State/Province/Region</FormLabel>
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
                            <FormLabel>Postal Code</FormLabel>
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
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Select 
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="United States">United States</SelectItem>
                                <SelectItem value="Canada">Canada</SelectItem>
                                {/* Add more countries as needed */}
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
                        <FormLabel>Upload Passport</FormLabel>
                        <FormControl>
                          <div className="flex flex-col">
                            <Button 
                              type="button" 
                              variant="outline" 
                              className="flex items-center justify-center h-24 w-full"
                              onClick={(e) => {
                                e.preventDefault(); // Prevent form submission
                                document.getElementById('idFileUpload').click();
                              }}
                            >
                              <Upload className="h-6 w-6 mr-2" />
                              Click to upload
                            </Button>
                            <Input 
                              id="idFileUpload"
                              type="file" 
                              className="hidden" 
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={handleFileUpload}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
          
                      <FormItem>
                        <FormLabel>Additional Supporting Documents (Optional)</FormLabel>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 w-full flex flex-col items-center justify-center relative">
                          <Upload className="h-6 w-6 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500 text-center">
                            Upload any additional documents if required
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            className="absolute inset-0 w-full h-full opacity-0"
                            onClick={(e) => {
                              e.preventDefault(); // Prevent form submission
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
                              <div key={index} className="flex justify-between items-center">
                                <p className="text-sm truncate max-w-xs">{doc.fileName}</p>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault(); // Prevent form submission
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
    
      return (
        <div className="max-w-4xl mx-auto p-4">
          <Card className="w-full">
            {renderStep()}
            <CardFooter className="flex justify-between pt-6">
      <div>
        {currentStep > 1 && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleBack}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
      </div>
      <div className="space-x-2">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={handleSaveAndExit}
          disabled={isLoading}
        >
          Save & Exit
        </Button>
        
        {currentStep < 6 ? (
          <Button 
            type="button" 
            onClick={handleNext}
            disabled={isLoading}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            Proceed to Payment
          </Button>
        )}
      </div>
    </CardFooter>
      </Card>
    </div>
  );
};

export default LLCRegistrationForm;