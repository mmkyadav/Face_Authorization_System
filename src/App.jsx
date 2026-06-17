import React, { useState, useEffect } from 'react';
import WebcamView from './components/WebcamView.jsx';
import AuthForm from './components/AuthForm.jsx';
import Dashboard from './components/Dashboard.jsx';

let modelsLoadingStarted = false;

const API_BASE = '';

export default function App() {
  // Theme & Authentication
  const [theme, setTheme] = useState(() => localStorage.getItem('facelogger-theme') || 'dark');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);

  // Navigation & UI Tabs
  const [activeTab, setActiveTab] = useState('login');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: '' });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Input Fields - Registration
  const [regName, setRegName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');

  // Input Fields - Login Password fallback
  const [loginPassword, setLoginPassword] = useState('');
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

  // Biometrics & Model Status
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  // Sync theme to body element
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('facelogger-theme', theme);
  }, [theme]);

  // Load session and models on mount
  useEffect(() => {
    checkSession();
    loadModels();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const checkSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/me`);
      const data = await res.json();
      if (data.authenticated) {
        setSessionUser(data);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.error('Session check error:', err);
    }
  };

  const loadModels = async () => {
    if (modelsLoadingStarted) return;
    modelsLoadingStarted = true;
    
    try {
      const MODEL_PATH = '/models';
      let checkCount = 0;
      while (!window.faceapi && checkCount < 30) {
        await new Promise(resolve => setTimeout(resolve, 200));
        checkCount++;
      }

      if (!window.faceapi) {
        throw new Error('face-api.js failed to load.');
      }

      // Load models concurrently in the background
      await Promise.all([
        window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_PATH),
        window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
        window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH)
      ]);

      setModelsLoaded(true);
    } catch (error) {
      console.error('Error loading face-api models:', error);
      setFeedback({
        type: 'error',
        message: 'Could not load neural networks. Please check weights.'
      });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCameraActive(false);
    setShowPasswordLogin(false);
    setRegistrationSuccess(false);
    setFeedback({ type: null, message: '' });
    // Reset inputs
    setRegName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setRole('');
    setPassword('');
    setLoginPassword('');
  };

  const startScan = async () => {
    setFeedback({ type: null, message: '' });
    
    if (activeTab === 'login') {
      // Validate email exists first
      try {
        const res = await fetch(`${API_BASE}/api/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() })
        });
        
        if (!res.ok) {
          setFeedback({ type: 'error', message: 'User not registered.' });
          return;
        }
      } catch (err) {
        setFeedback({ type: 'error', message: 'Connection error. Please try again.' });
        return;
      }
    }
    
    setCameraActive(true);
    setShowPasswordLogin(false);
  };

  const cancelScan = () => {
    setCameraActive(false);
    setFeedback({ type: 'info', message: 'Scanning cancelled.' });
  };

  const handleTimeout = () => {
    setCameraActive(false);
    setFeedback({ type: 'error', message: 'Verification timeout: 30 seconds exceeded. Please try again.' });
  };

  // Called when face is captured successfully in WebcamView
  const handleFaceDescriptorReady = (descriptor) => {
    if (activeTab === 'login') {
      handleFaceLogin(descriptor);
    } else {
      handleFaceRegister(descriptor);
    }
  };

  // Login via Face descriptor
  const handleFaceLogin = async (descriptor) => {
    setIsAuthenticating(true);
    setFeedback({ type: 'info', message: 'Verifying face...' });

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          descriptor: descriptor
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'Identity verified!' });
        await checkSession(); // Reload session user details
        
        setTimeout(() => {
          setIsAuthenticated(true);
          setCameraActive(false);
          setIsAuthenticating(false);
          setFeedback({ type: null, message: '' });
        }, 1000);
      } else {
        throw new Error(data.detail || 'User not registered.');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setCameraActive(false);
      setFeedback({ type: 'error', message: err.message || 'Face not recognized.' });
      setIsAuthenticating(false);
    }
  };

  // Login via standard Password
  const handlePasswordLogin = async (e) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    setFeedback({ type: 'info', message: 'Signing in...' });

    try {
      const res = await fetch(`${API_BASE}/api/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: loginPassword
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: 'Signed in successfully!' });
        await checkSession();
        
        setTimeout(() => {
          setIsAuthenticated(true);
          setShowPasswordLogin(false);
          setIsAuthenticating(false);
          setFeedback({ type: null, message: '' });
        }, 1000);
      } else {
        throw new Error(data.detail || 'Incorrect password.');
      }
    } catch (err) {
      console.error('Password Login Error:', err);
      setFeedback({ type: 'error', message: err.message });
      setIsAuthenticating(false);
    }
  };

  // Register user (Face + Credentials)
  const handleFaceRegister = async (descriptor) => {
    setIsAuthenticating(true);
    setFeedback({ type: 'info', message: 'Creating profile...' });

    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: regName.trim(),
          phone: phone.trim(),
          company: company.trim(),
          role: role.trim(),
          password: password,
          descriptor: descriptor
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setCameraActive(false);
        setRegistrationSuccess(true);
        setIsAuthenticating(false);
        setFeedback({ type: null, message: '' });
      } else {
        throw new Error(data.detail || 'Failed to complete registration.');
      }
    } catch (err) {
      console.error('Registration Error:', err);
      setCameraActive(false);
      setFeedback({ type: 'error', message: err.message });
      setIsAuthenticating(false);
    }
  };

  const handleGoToLoginAfterRegister = () => {
    setRegistrationSuccess(false);
    setActiveTab('login');
    setFeedback({ type: null, message: '' });
    setEmail('');
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/logout`, { method: 'POST' });
      if (res.ok) {
        setIsAuthenticated(false);
        setSessionUser(null);
        setEmail('');
        setFeedback({ type: null, message: '' });
        setRegistrationSuccess(false);
        setCameraActive(false);
        setShowPasswordLogin(false);
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <>
      <div className="glow-sphere glow-sphere-1"></div>
      <div className="glow-sphere glow-sphere-2"></div>

      {/* Clean Minimalist Loading Overlay */}
      {!modelsLoaded && (
        <div className="modal-overlay">
          <div className="loader-card">
            <div className="spinner-small"></div>
            <h2>Facelogger</h2>
            <p>Initializing secure biometric engine...</p>
          </div>
        </div>
      )}

      <div className="app-container">
        <header className="app-header">
          <div className="logo-area">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M8 11h8" />
                <path d="M12 8v6" />
              </svg>
            </div>
            <h1>Facelogger</h1>
          </div>
          <div className="header-actions">
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? (
                // Sun Icon
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                // Moon Icon
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <main className="main-content">
          {isAuthenticated ? (
            <Dashboard
              user={sessionUser}
              onLogout={handleLogout}
            />
          ) : (
            <section className={`auth-grid ${cameraActive ? 'camera-on' : 'camera-off'}`}>
              {cameraActive && (
                <WebcamView
                  modelsLoaded={modelsLoaded}
                  cameraActive={cameraActive}
                  isAuthenticating={isAuthenticating}
                  onFaceDescriptorReady={handleFaceDescriptorReady}
                  activeTab={activeTab}
                  onTimeout={handleTimeout}
                />
              )}

              <AuthForm
                activeTab={activeTab}
                onTabChange={handleTabChange}
                email={email}
                onEmailChange={setEmail}
                cameraActive={cameraActive}
                onStartScan={startScan}
                onCancelScan={cancelScan}
                isAuthenticating={isAuthenticating}
                feedback={feedback}
                registrationSuccess={registrationSuccess}
                onGoToLoginAfterRegister={handleGoToLoginAfterRegister}
                
                // Registration inputs
                regName={regName}
                onRegNameChange={setRegName}
                phone={phone}
                onPhoneChange={setPhone}
                company={company}
                onCompanyChange={setCompany}
                role={role}
                onRoleChange={setRole}
                password={password}
                onPasswordChange={setPassword}

                // Password fallback inputs
                loginPassword={loginPassword}
                onLoginPasswordChange={setLoginPassword}
                showPasswordLogin={showPasswordLogin}
                onShowPasswordLoginChange={setShowPasswordLogin}
                onPasswordLoginSubmit={handlePasswordLogin}
              />
            </section>
          )}
        </main>

        <footer className="app-footer">
          <p>Facelogger &copy; 2026. Secure Passwordless Identity Hub.</p>
        </footer>
      </div>
    </>
  );
}
