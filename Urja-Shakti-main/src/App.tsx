import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Welcome from './components/Welcome/Welcome';
import Features from './components/Features/Features';
import Services from './components/Services/Services';
import About from './components/About/About';
import CallToAction from './components/CallToAction/CallToAction';
import Footer from './components/Footer/Footer';
import Login from './components/Login/Login';
import Signup from './components/Signup/Signup';
import Dashboard from './components/Dashboard/Dashboard';
import LoggedInHome from './components/LoggedInHome/LoggedInHome';
import Calculator from './components/Calculator/Calculator';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { AuthProvider } from './components/context/AuthContext';
import './App.css';

function PublicHomePage() {
  return (
    <div id="top">
      <Welcome />
      <Features />
      <Services />
      <About />
      <CallToAction />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Header />
        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicHomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home/*"
              element={
                <ProtectedRoute>
                  <LoggedInHomeWrapper />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calculator"
              element={
                <ProtectedRoute>
                  <Calculator />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

/* Wrapper component to handle hash links in LoggedInHome */
function LoggedInHomeWrapper() {
  const location = useLocation();
  return <LoggedInHome key={location.pathname + location.search + location.hash} />;
}
