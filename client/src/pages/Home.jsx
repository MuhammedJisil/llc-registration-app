import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const handleGetStarted = () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      navigate('/user/register-llc');
    } else {
      navigate('/register');
    }
  };

  const handleSubmitContactForm = (e) => {
    e.preventDefault();
    
    // Create a mailto link with the user's message and email
    const mailtoLink = `mailto:your-business-email@example.com?subject=Contact Form Submission&body=From: ${email}%0A%0A${encodeURIComponent(message)}`;
    
    // Open the user's email client
    window.location.href = mailtoLink;
    
    // Show the success message
    setFormSubmitted(true);
    
    // Reset form after 3 seconds
    setTimeout(() => {
      setEmail('');
      setMessage('');
      setFormSubmitted(false);
    }, 3000);
  };

  // WhatsApp contact handler
  const handleWhatsAppContact = () => {
    // Replace with your actual WhatsApp number
    window.open('https://wa.me/1234567890', '_blank');
  };

  return (
    <div className="bg-white">
    {/* WhatsApp contact button */}
    <div 
      className="fixed bottom-4 right-4 z-40 bg-green-500 p-3 rounded-full shadow-lg cursor-pointer hover:bg-green-600 transition-colors"
      onClick={handleWhatsAppContact}
    >
      {/* WhatsApp SVG Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="white"
      >
        <path d="M20.52 3.48A11.89 11.89 0 0 0 12 0a11.89 11.89 0 0 0-8.52 3.48A11.89 11.89 0 0 0 0 12c0 2.04.51 4.05 1.49 5.82L0 24l6.3-1.65A11.89 11.89 0 0 0 12 24c3.19 0 6.19-1.24 8.52-3.48A11.89 11.89 0 0 0 24 12c0-3.19-1.24-6.19-3.48-8.52zM12 22c-1.79 0-3.53-.47-5.06-1.37l-.36-.21-3.73.98 1-3.63-.24-.38C2.45 15.36 2 13.71 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.28-7.67c-.29-.15-1.7-.84-1.96-.94s-.46-.15-.66.15-.76.94-.93 1.13-.34.22-.63.07c-.29-.15-1.23-.45-2.34-1.44-.86-.76-1.44-1.7-1.61-1.99s-.02-.44.12-.58c.12-.12.29-.31.44-.46s.19-.26.29-.44.05-.33-.02-.48-.66-1.6-.91-2.19c-.24-.57-.48-.5-.66-.51h-.57c-.2 0-.51.07-.78.33s-1.02 1-1.02 2.43 1.04 2.82 1.19 3.02c.15.19 2.04 3.1 4.95 4.35.69.3 1.23.48 1.65.61.69.22 1.32.19 1.83.11.56-.08 1.7-.7 1.94-1.38.24-.67.24-1.25.17-1.38-.07-.13-.26-.2-.55-.35z"/>
      </svg>
    </div>
      {/* Hero Section */}
      <div id="hero" className="bg-[url('/hero.jpg')] bg-cover bg-center pt-24 pb-16 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1933]/70 to-[#0A1933]/90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
              Premium LLC Registration Services <br/>
              <span className="text-[#FFD700]">in Wyoming and Montana</span>
            </h1>
            <p className="text-lg text-gray-200 mb-8">
              Start your business journey with confidence. Our streamlined LLC formation process makes launching your company simple, fast, and worry-free.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-[#FFD700] to-[#FFC000] text-[#0A1933] hover:from-[#FFC000] hover:to-[#FFD700] text-lg px-8 py-6 font-semibold"
              >
                Start My Business
              </Button>
              <Button
                size="lg"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                variant="outline"
                className="border-[#20B2AA] text-[#20B2AA] hover:bg-[#20B2AA] hover:text-[#0A1933] text-lg px-8 py-6"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="bg-gradient-to-b from-[#0A1933] to-[#193366] text-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Why Choose <span className="text-[#FFD700]">Elite</span> <span className="text-[#20B2AA]">LLC</span>
          </h2>
          <p className="text-gray-300 text-center max-w-2xl mx-auto mb-16">
            We offer comprehensive LLC formation services with unmatched quality and support
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-[#0F264D]/50 p-8 rounded-lg text-center transform transition-transform hover:scale-105 hover:shadow-xl border border-[#20B2AA]/30">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#20B2AA] to-[#193366] text-[#FFD700] mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#20B2AA]">Fast Formation</h3>
              <p className="text-gray-300">
                Get your LLC formed quickly with our streamlined process and expedited filing options. We handle all the paperwork so you don't have to.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-[#0F264D]/50 p-8 rounded-lg text-center transform transition-transform hover:scale-105 hover:shadow-xl border border-[#20B2AA]/30">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#20B2AA] to-[#193366] text-[#FFD700] mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#20B2AA]">100% Compliance</h3>
              <p className="text-gray-300">
                All filings are reviewed by our legal team to ensure complete compliance with Wyoming and Montana state regulations.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-[#0F264D]/50 p-8 rounded-lg text-center transform transition-transform hover:scale-105 hover:shadow-xl border border-[#20B2AA]/30">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#20B2AA] to-[#193366] text-[#FFD700] mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-4.5-8.599A5 5 0 105.5 15H9" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#20B2AA]">Ongoing Support</h3>
              <p className="text-gray-300">
                Access our team of experts for guidance on compliance, taxes, and business growth strategies any time you need assistance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* States Section */}
      <div id="states" className="py-20 bg-gradient-to-b from-[#193366] to-[#0A1933]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-6">
            Specialized Services in <span className="text-[#FFD700]">Wyoming</span> and <span className="text-[#20B2AA]">Montana</span>
          </h2>
          <p className="text-gray-300 text-center max-w-2xl mx-auto mb-16">
            We focus exclusively on these two states to provide expert, specialized service
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Wyoming */}
            <div className="bg-[url('/images/wyoming.jpg')] bg-cover bg-center rounded-lg overflow-hidden relative group">
              <div className="absolute inset-0 bg-[#0A1933]/70 group-hover:bg-[#0A1933]/40 transition-all duration-300"></div>
              <div className="relative p-8 h-full flex flex-col justify-between min-h-80">
                <div>
                  <h3 className="text-3xl font-bold text-[#FFD700] mb-4">Wyoming</h3>
                  <ul className="text-white space-y-2">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-[#FFD700] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      No state income tax
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-[#FFD700] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Low annual fees
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-[#FFD700] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Strong privacy protections
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-[#FFD700] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Asset protection
                    </li>
                  </ul>
                </div>
                <Button 
                  onClick={handleGetStarted}
                  className="bg-[#FFD700] text-[#0A1933] hover:bg-[#FFC000] mt-6 self-start"
                >
                  Form Wyoming LLC
                </Button>
              </div>
            </div>
            
            {/* Montana */}
            <div className="bg-[url('/images/montana.jpg')] bg-cover bg-center rounded-lg overflow-hidden relative group">
              <div className="absolute inset-0 bg-[#0A1933]/70 group-hover:bg-[#0A1933]/40 transition-all duration-300"></div>
              <div className="relative p-8 h-full flex flex-col justify-between min-h-80">
                <div>
                  <h3 className="text-3xl font-bold text-[#20B2AA] mb-4">Montana</h3>
                  <ul className="text-white space-y-2">
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-[#20B2AA] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      No sales tax
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-[#20B2AA] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Business-friendly regulations
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-[#20B2AA] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Low filing fees
                    </li>
                    <li className="flex items-center">
                      <svg className="h-5 w-5 text-[#20B2AA] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Simplified annual reporting
                    </li>
                  </ul>
                </div>
                <Button 
                  onClick={handleGetStarted}
                  className="bg-[#20B2AA] text-[#0A1933] hover:bg-[#1C9E98] mt-6 self-start"
                >
                  Form Montana LLC
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      
      {/* Contact Section */}
<div id="contact" className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white py-16">
  <div className="container mx-auto px-4">
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Contact Us</h2>
      
      <form onSubmit={handleSubmitContactForm} className="bg-[#0F264D]/50 p-8 rounded-lg border border-[#20B2AA]/30">
        <div className="mb-6">
          <label htmlFor="email" className="block text-gray-300 mb-2">Your Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-[#0A1933] border border-[#20B2AA]/50 rounded-md text-white"
            placeholder="your@email.com"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="message" className="block text-gray-300 mb-2">Your Message</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows="4"
            className="w-full px-4 py-2 bg-[#0A1933] border border-[#20B2AA]/50 rounded-md text-white"
            placeholder="How can we help you?"
          ></textarea>
        </div>
        <Button 
          type="submit"
          className="bg-gradient-to-r from-[#20B2AA] to-[#1C9E98] text-white hover:from-[#1C9E98] hover:to-[#20B2AA] w-full"
        >
          Contact Us via Email
        </Button>
      </form>
    </div>
  </div>
</div>
      
      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#0A1933] to-[#193366] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Business?</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of entrepreneurs who have successfully launched their businesses with our specialized Wyoming and Montana LLC services.
          </p>
          <Button
            size="lg"
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-[#FFD700] to-[#FFC000] text-[#0A1933] hover:from-[#FFC000] hover:to-[#FFD700] text-lg px-8 py-6"
          >
            Form Your LLC Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;