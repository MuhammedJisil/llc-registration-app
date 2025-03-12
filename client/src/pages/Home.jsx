import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Home = () => {
  const navigate = useNavigate();
  
  const handleGetStarted = () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    if (token) {
      // If authenticated, go to dashboard
      navigate('/dashboard');
    } else {
      // If not authenticated, redirect to register
      navigate('/register');
    }
  };

  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[#0F172A] sm:text-5xl mb-6">
            Premium LLC Registration Services Across America
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Start your business journey with confidence. Our streamlined LLC formation process makes launching your company simple, fast, and worry-free.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-[#FFD700] text-[#0F172A] hover:bg-[#E6C200] text-lg px-8 py-6"
            >
              Start My Business
            </Button>
            <Button
              size="lg"
              onClick={() => navigate('/pricing')}
              variant="outline"
              className="border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-[#F8FAFC] text-lg px-8 py-6"
            >
              View Pricing
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-[#0F172A] text-[#F8FAFC] py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose <span className="text-[#FFD700]">Elite LLC</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-lg text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1E293B] text-[#FFD700] mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Formation</h3>
              <p className="text-gray-400">
                Get your LLC formed quickly with our streamlined process and expedited filing options.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="p-6 rounded-lg text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1E293B] text-[#FFD700] mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Compliance</h3>
              <p className="text-gray-400">
                All filings are reviewed by our legal team to ensure complete compliance with state regulations.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="p-6 rounded-lg text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1E293B] text-[#FFD700] mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-4.5-8.599A5 5 0 105.5 15H9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Ongoing Support</h3>
              <p className="text-gray-400">
                Access our team of experts for guidance on compliance, taxes, and business growth.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* States Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-[#0F172A] mb-12">
          Available in All 50 States
        </h2>
        <div className="text-center mb-8">
          <p className="text-gray-600 max-w-2xl mx-auto">
            Form your LLC in any state with our comprehensive nationwide service. Popular states include:
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
          {['Delaware', 'Nevada', 'Wyoming', 'Florida', 'Texas', 'California', 'New York', 'Colorado', 'Washington', 'Arizona', 'Illinois', 'Georgia'].map((state) => (
            <div key={state} className="py-2 px-4 border border-gray-200 rounded-md text-center hover:border-[#FFD700] hover:text-[#0F172A] transition-colors">
              {state}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#0F172A] text-[#F8FAFC] py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Business?</h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who have successfully launched their businesses with Elite LLC.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-[#FFD700] text-[#0F172A] hover:bg-[#E6C200] text-lg px-8 py-6"
          >
            Form Your LLC Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;