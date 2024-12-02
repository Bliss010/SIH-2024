import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added `useLocation` for redirection
import './Login.css';
import { auth, db } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const navigate = useNavigate();
  const location = useLocation(); // Capture the location state
  const from = location.state?.from?.pathname || '/home'; // Redirect to intended route or dashboard

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    setErrors({ ...errors, [id]: '' });
  };

  const validateForm = () => {
    const newErrors = {
      email: '',
      password: '',
    };

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        // Authenticate user
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);

        // Fetch additional user data from Firestore
        const userDoc = doc(db, 'users', userCredential.user.uid);
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          console.log('User Data:', userData); // Example: { firstName: "John", lastName: "Doe" }
        }

        alert('Login successful!');
        navigate(from, { replace: true }); // Redirect to the intended route
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          alert('User not found. Please sign up.');
        } else if (error.code === 'auth/wrong-password') {
          alert('Invalid password. Please try again.');
        } else {
          alert('Login failed. Please try again.');
        }
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-description">Login to access your solar calculator.</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="name@example.com"
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="********"
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>
            <button type="submit" className="login-button">Login</button>
          </form>
          <p className="login-footer">
            Don’t have an account? <Link to="/signup" className="login-footer-link">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
