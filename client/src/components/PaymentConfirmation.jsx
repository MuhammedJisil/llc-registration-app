import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { BASE_URL } from '@/lib/config';

const PaymentConfirmation = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [paymentDetails, setPaymentDetails] = useState(null);
  
  // Get payment_intent and payment_intent_client_secret from URL
  const paymentIntent = searchParams.get('payment_intent');
  const paymentStatus = searchParams.get('redirect_status');
  
  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem('token');
        // Verify the payment status with your backend
        const response = await axios.post(`${BASE_URL}/api/payments/complete`, {
          paymentId: id,
          stripePaymentId: paymentIntent,
          status: paymentStatus === 'succeeded' ? 'successful' : 'failed'
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setPaymentDetails(response.data);
        setStatus(paymentStatus === 'succeeded' ? 'success' : 'failed');
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('error');
      }
    };
    
    if (paymentIntent && paymentStatus) {
      verifyPayment();
    } else {
      setStatus('error');
    }
  }, [id, paymentIntent, paymentStatus]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#0A1933] to-[#193366] pt-[60px]">
      <div className="container mx-auto py-8 max-w-lg px-4">
        <Card className="bg-[#0A1933]/70 border border-[#20B2AA]/30 shadow-xl text-white">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-xl">
              <span className="text-[#FFD700]">Payment</span>{' '}
              {status === 'success' ? (
                <span className="text-[#20B2AA]">Successful</span>
              ) : (
                <span className="text-[#20B2AA]">Status</span>
              )}
            </CardTitle>
            <CardDescription className="text-gray-300">
              LLC Registration Payment Result
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center py-8 space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-16 w-16 text-[#20B2AA] animate-spin" />
                <p className="text-center text-lg text-gray-300">Verifying your payment...</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-16 w-16 text-green-400" />
                <h3 className="text-xl font-bold text-[#FFD700]">Payment Successful!</h3>
                <p className="text-center text-gray-300">
                  Your LLC registration payment has been processed successfully. You'll receive a confirmation email shortly.
                </p>
              </>
            )}
            
            {status === 'failed' && (
              <>
                <XCircle className="h-16 w-16 text-red-400" />
                <h3 className="text-xl font-bold text-red-300">Payment Failed</h3>
                <p className="text-center text-gray-300">
                  We couldn't process your payment. Please try again or contact support for assistance.
                </p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-16 w-16 text-amber-400" />
                <h3 className="text-xl font-bold text-amber-300">Verification Error</h3>
                <p className="text-center text-gray-300">
                  We couldn't verify your payment status. Please contact support for assistance.
                </p>
              </>
            )}
            
            <div className="pt-6 w-full">
              <Button 
                className="w-full bg-[#20B2AA] hover:bg-[#20B2AA]/80 text-[#0A1933] font-medium" 
                onClick={() => navigate('/user/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentConfirmation;