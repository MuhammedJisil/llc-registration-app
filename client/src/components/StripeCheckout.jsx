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
          <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">Registration Details</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-slate-500">Business Name</h4>
                <p className="text-lg font-semibold text-slate-900">{application.companyName}</p>
              </div>
              
              {application.state && (
                <div>
                  <h4 className="text-xs font-medium text-slate-500">State</h4>
                  <p className="text-md font-medium text-slate-800">{application.state}</p>
                </div>
              )}
              
              <div className="mt-4 p-4 bg-primary/10 rounded-md flex justify-between items-center">
                <span className="font-medium flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Registration Fee:
                </span>
                <span className="text-xl font-bold">
                  ${application.stateAmount} USD
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Payment Information</h3>
          <PaymentElement />
        </div>
        
        <div className="flex justify-between pt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
            className="px-5"
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            disabled={!stripe || loading}
            className="px-8 bg-primary hover:bg-primary/90"
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
      <div className="container mx-auto py-12 max-w-lg text-center">
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg mb-6">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4 text-amber-800">Invalid Payment Session</h1>
          <p className="mb-6 text-amber-700">Unable to load payment information. Please try again or contact support.</p>
          <Button onClick={() => window.location.href = '/user/dashboard'} className="w-full">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12 max-w-lg">
      <h1 className="text-3xl font-bold mb-2 text-center text-primary">Complete Your Payment</h1>
      <p className="text-slate-500 mb-8 text-center">Your LLC registration is almost complete</p>
      
      <Card className="border-slate-200 shadow-md">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle className="text-xl">LLC Registration Payment</CardTitle>
          <CardDescription>
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
  );
};

export default StripeCheckout;