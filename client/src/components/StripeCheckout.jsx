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
import { Loader2 } from "lucide-react";
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
        toast({
          title: "Error",
          description: "Failed to load application details.",
          variant: "destructive"
        });
      }
    };
  
    fetchApplicationDetails();
  }, []);
  
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment-confirmation/${id}`,
        },
      });
      
      if (result.error) {
        toast({
          title: "Payment Failed",
          description: result.error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Error",
        description: "An error occurred while processing your payment.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/dashboard');
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {application && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-500">Business Name</h3>
            <p className="text-lg font-semibold">{application.business_name}</p>
            
            <div className="mt-4 p-3 bg-primary/10 rounded-md">
              <div className="flex justify-between items-center">
                <span>Registration Fee:</span>
                <span className="font-semibold">
                  {application.payment_currency === 'INR' ? '₹' : '$'} 
                  {application.payment_amount} 
                  {application.payment_currency}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <PaymentElement />
        
        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          
          <Button 
            type="submit" 
            disabled={!stripe || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
      <div className="container mx-auto py-8 max-w-lg text-center">
        <h1 className="text-2xl font-bold mb-4">Invalid Payment Session</h1>
        <p className="mb-4">Unable to load payment information. Please try again.</p>
        <Button onClick={() => window.location.href = '/dashboard'}>
          Return to Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Payment</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>LLC Registration Payment</CardTitle>
          <CardDescription>
            Please provide your payment details to complete your LLC registration.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeCheckout;