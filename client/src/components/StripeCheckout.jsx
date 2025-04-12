import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Loader2, AlertCircle, DollarSign } from "lucide-react";
import { BASE_URL } from '@/lib/config';
import { jwtDecode } from 'jwt-decode'; 

// Replace with your Stripe publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clientSecret = searchParams.get('clientSecret');
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState(null);
  const [isFormComplete, setIsFormComplete] = useState(false);
  
  const stripe = useStripe();
  const elements = useElements();
  
  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn("No token found, skipping fetch.");
          return;
        }
  
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.id;
  
        const registrationId = localStorage.getItem(`registrationId_${userId}`);
        if (!registrationId) {
          console.warn("No registration ID found, skipping fetch.");
          return;
        }
  
        const response = await axios.get(
          `${BASE_URL}/api/llc-registrations/${registrationId}?userId=${userId}`, 
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
  
        setApplication(response.data);
      } catch (error) {
        console.error("Error fetching application details:", error);
        toast.error("Failed to load application details.");
      }
    };
  
    fetchApplicationDetails();
  }, []);

  useEffect(() => {
    if (!elements) return;

    const onChange = (event) => {
      setIsFormComplete(event.complete);
    };

    const element = elements.getElement('payment');
    element.on('change', onChange);

    return () => {
      element.off('change', onChange);
    };
  }, [elements]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    if (!isFormComplete) {
      toast.error("Please complete all required payment details before proceeding.");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/user/payment-confirmation/${id}`,
        },
      });
      
      if (result.error) {
        toast.error(result.error.message);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error("An error occurred while processing your payment.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/user/dashboard');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {application && (
          <div className="mb-6 bg-[#0A1933]/50 p-4 rounded-lg border border-[#20B2AA]/30">
            <h3 className="text-sm font-medium text-[#20B2AA] uppercase tracking-wide mb-2">Registration Details</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-gray-400">Business Name</h4>
                <p className="text-lg font-semibold text-white">{application.companyName}</p>
              </div>
              
              {application.state && (
                <div>
                  <h4 className="text-xs font-medium text-gray-400">State</h4>
                  <p className="text-md font-medium text-gray-300">{application.state}</p>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-[#FFD700]/10 rounded-md flex justify-between items-center">
                <span className="font-medium flex items-center text-gray-300">
                  <DollarSign className="w-4 h-4 mr-1 text-[#FFD700]" />
                  Registration Fee:
                </span>
                <span className="text-xl font-bold text-[#FFD700]">
                  ${application.stateAmount} USD
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-[#0A1933]/70 p-4 rounded-lg border border-[#20B2AA]/30">
          <h3 className="text-sm font-medium text-[#20B2AA] uppercase tracking-wide mb-4">Payment Information</h3>
          <PaymentElement />
        </div>
        
        <div className="flex justify-between pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
            className="px-5 border-gray-600 text-white hover:bg-[#0A1933] hover:text-gray-300"
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            disabled={!stripe || loading}
            className="px-8 bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#0A1933] font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay Now'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

const StripeCheckout = () => {
  const [searchParams] = useSearchParams();
  const clientSecret = searchParams.get('clientSecret');
  
  if (!clientSecret) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#0A1933] to-[#193366] pt-[60px]">
        <div className="container mx-auto py-12 max-w-lg text-center px-4">
          <Card className="bg-[#0A1933]/70 border border-amber-500/30 shadow-xl text-white">
            <CardContent className="pt-6">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4 text-amber-400">Invalid Payment Session</h1>
              <p className="mb-6 text-gray-300">Unable to load payment information. Please try again or contact support.</p>
              <Button 
                onClick={() => window.location.href = '/user/dashboard'} 
                className="w-full bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#0A1933] font-medium"
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#0A1933] to-[#193366] pt-[60px]">
      <div className="container mx-auto py-12 max-w-lg px-4">
        <h1 className="text-3xl font-bold mb-2 text-center text-white">
          <span className="text-[#FFD700]">Complete</span> Your <span className="text-[#20B2AA]">Payment</span>
        </h1>
        <p className="text-gray-300 mb-8 text-center">Your LLC registration is almost complete</p>
        
        <Card className="bg-[#0A1933]/70 border border-[#20B2AA]/30 shadow-xl text-white">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-xl">
              <span className="text-[#FFD700]">LLC</span> <span className="text-[#20B2AA]">Registration</span> Payment
            </CardTitle>
            <CardDescription className="text-gray-300">
              Please provide your payment details to complete your registration.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StripeCheckout;