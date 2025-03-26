import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AuthCallback from './components/AuthCallback';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './components/Dashboard';
import LLCRegistrationForm from './components/LLCRegistrationForm';
import StripeCheckout from './components/StripeCheckout';
import PaymentConfirmation from './components/PaymentConfirmation';
import AdminLogin from './pages/auth/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
      <Header />
        <Toaster />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} /> 

          <Route path="/dashboard" element={<Dashboard/>} /> 
          <Route path="/register-llc" element={<LLCRegistrationForm />} />
          <Route path="/stripe-checkout/:id" element={<StripeCheckout />} />
          <Route path="/payment-confirmation/:id" element={<PaymentConfirmation />} />
          
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;