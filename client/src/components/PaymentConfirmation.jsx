import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const PaymentConfirmation = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [application, setApplication] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  
  // Get the payment_intent and payment_intent_client_secret from URL
  const payment_intent = searchParams.get('payment_intent');
  const payment_intent_client_secret = searchParams.get('payment_intent_client_secret');
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // First fetch application details
        const applicationResponse = await axios.get(`/api/llc-applications/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setApplication(applicationResponse.data);
        
        // Then verify the payment with Stripe
        if (payment_intent && payment_intent_client_secret) {
          const paymentResponse = await axios.post(
            '/api/verify-payment',
            {
              payment_intent,
              payment_intent_client_secret,
              application_id: id
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          setPaymentIntent(paymentResponse.data);
          setStatus(paymentResponse.data.status === 'succeeded' ? 'success' : 'error');
        } else {
          // If no payment_intent in URL, check the application payment status
          const paymentStatusResponse = await axios.get(`/api/llc-applications/${id}/payment-status`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          setPaymentIntent(paymentStatusResponse.data);
          setStatus(paymentStatusResponse.data.status === 'succeeded' ? 'success' : 'error');
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
      }
    };
    
    verifyPayment();
  }, [id, payment_intent, payment_intent_client_secret]);
  
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  
  const handleTryAgain = () => {
    // Navigate back to the payment page
    navigate(`/checkout/${id}`);
  };
  
  return (
    <div className="container mx-auto py-8 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' ? 'Verifying Payment' :
             status === 'success' ? 'Payment Successful' : 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center text-center">
          {status === 'loading' && (
            <div className="py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg">Verifying your payment, please wait...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Your LLC Registration is Confirmed!</h2>
              
              {application && (
                <div className="mb-6 w-full max-w-sm">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-gray-700 mb-2">Order Summary</h3>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Business Name:</span>
                      <span className="font-medium">{application.business_name}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Registration State:</span>
                      <span className="font-medium">{application.selected_state}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Amount Paid:</span>
                      <span className="font-medium">
                        {application.payment_currency === 'INR' ? '₹' : '$'} 
                        {application.payment_amount} 
                        {application.payment_currency}
                      </span>
                    </div>
                    {paymentIntent && (
                      <div className="flex justify-between text-sm mb-1">
                        <span>Payment ID:</span>
                        <span className="font-medium">{paymentIntent.id.substring(0, 8)}...</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Our team will begin processing your LLC registration. 
                    You can track the progress of your application on your dashboard.
                  </p>
                </div>
              )}
            </div>
          )}
          
          {status === 'error' && (
            <div className="py-8">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Payment Failed</h2>
              
              <p className="text-gray-600 mb-6">
                Unfortunately, we couldn't complete your payment. Please try again or contact support if the issue persists.
              </p>
              
              {paymentIntent && paymentIntent.error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-left">
                  <p className="text-sm text-red-600">{paymentIntent.error}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="justify-center pb-6">
          {status === 'loading' ? (
            <Button disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait...
            </Button>
          ) : status === 'success' ? (
            <Button onClick={handleGoToDashboard}>
              Go to Dashboard
            </Button>
          ) : (
            <div className="flex space-x-4">
              <Button variant="outline" onClick={handleGoToDashboard}>
                Go to Dashboard
              </Button>
              <Button onClick={handleTryAgain}>
                Try Again
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentConfirmation;