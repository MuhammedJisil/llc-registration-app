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
import UsersList from './components/UsersList';
import UserRegistrations from './components/UserRegistrations';
import RegistrationDetails from './components/RegistrationDetails';
import { UserProtectedRoute, AdminProtectedRoute } from './components/ProtectedRoutes';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Toaster />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth-callback" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* User Protected Routes */}
          <Route 
            path="/user/dashboard" 
            element={
              <UserProtectedRoute>
                <Dashboard />
              </UserProtectedRoute>
            } 
          />
          <Route 
            path="/user/register-llc" 
            element={
              <UserProtectedRoute>
                <LLCRegistrationForm />
              </UserProtectedRoute>
            } 
          />
          <Route 
            path="/user/stripe-checkout/:id" 
            element={
              <UserProtectedRoute>
                <StripeCheckout />
              </UserProtectedRoute>
            } 
          />
          <Route 
            path="/user/payment-confirmation/:id" 
            element={
              <UserProtectedRoute>
                <PaymentConfirmation />
              </UserProtectedRoute>
            } 
          />
          
          {/* Admin Protected Routes */}
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminProtectedRoute>
                <UsersList />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/users/:userId/registrations" 
            element={
              <AdminProtectedRoute>
                <UserRegistrations />
              </AdminProtectedRoute>
            } 
          />
          <Route 
            path="/admin/registrations/:id" 
            element={
              <AdminProtectedRoute>
                <RegistrationDetails />
              </AdminProtectedRoute>
            } 
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;