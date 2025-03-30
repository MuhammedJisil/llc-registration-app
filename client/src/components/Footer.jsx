import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
   <footer className="bg-[#0A1933] text-white py-10">
   <div className="container mx-auto px-4">
     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
       <div>
         <h3 className="text-xl font-semibold mb-4">
           <span className="text-[#FFD700]">Elite</span> <span className="text-[#20B2AA]">LLC</span>
         </h3>
         <p className="text-gray-400">
           Premium LLC formation services specialized in Wyoming and Montana business entities.
         </p>
       </div>
       <div>
         <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
         <ul className="space-y-2">
           <li>
             <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
           </li>
           <li>
             <a href="#states" className="text-gray-400 hover:text-white transition-colors">States</a>
           </li>
           <li>
             <a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a>
           </li>
         </ul>
       </div>
       <div>
         <h4 className="text-lg font-semibold mb-4">Contact</h4>
         <ul className="space-y-2 text-gray-400">
           <li>Email: info@elitellc.com</li>
           <li>Phone: (555) 123-4567</li>
           <li>Hours: Mon-Fri 9AM - 5PM MST</li>
         </ul>
       </div>
     </div>
     <div className="border-t border-[#193366] mt-8 pt-8 text-center text-gray-500 text-sm">
       <p>© {new Date().getFullYear()} Elite LLC. All rights reserved.</p>
     </div>
   </div>
 </footer>
  );
};

export default Footer;