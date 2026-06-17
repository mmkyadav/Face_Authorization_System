import React from 'react';

export default function AuthForm({
  activeTab,
  onTabChange,
  email,
  onEmailChange,
  cameraActive,
  onStartScan,
  onCancelScan,
  isAuthenticating,
  feedback,
  registrationSuccess,
  onGoToLoginAfterRegister,

  // New Registration Fields
  regName,
  onRegNameChange,
  phone,
  onPhoneChange,
  company,
  onCompanyChange,
  role,
  onRoleChange,
  password,
  onPasswordChange,

  // New Password Login Fields
  loginPassword,
  onLoginPasswordChange,
  showPasswordLogin,
  onShowPasswordLoginChange,
  onPasswordLoginSubmit
}) {
  const isEmailValid = (val) => {
    return val.length >= 5 && val.includes('@') && val.includes('.');
  };

  const isRegFormValid = () => {
    return (
      regName.trim().length >= 2 &&
      isEmailValid(email) &&
      password.length >= 4
    );
  };

  const getFeedbackClass = () => {
    if (!feedback || !feedback.type) return 'feedback-msg';
    return `feedback-msg ${feedback.type}`;
  };

  return (
    <div className="form-card">
      {/* Navigation Tabs (Hidden during active scan or successful registration) */}
      {!cameraActive && !showPasswordLogin && !registrationSuccess && (
        <div className="form-tabs">
          <button
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => onTabChange('login')}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => onTabChange('register')}
          >
            Sign Up
          </button>
        </div>
      )}

      <div className="form-bodies">
        {/* SUCCESSFUL REGISTRATION SCREEN */}
        {registrationSuccess ? (
          <div className="form-panel active" style={{ textAlign: 'center', gap: '20px' }}>
            <div className="success-ring-animation" style={{ margin: '0 auto 10px' }}>
              <svg className="checkmark" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
            </div>
            <div className="panel-header">
              <h2>Registration Completed</h2>
              <p style={{ marginTop: '8px' }}>
                Your profile is now securely created.
              </p>
            </div>
            
            <button
              onClick={onGoToLoginAfterRegister}
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: '15px' }}
            >
              <span>Proceed to Sign In</span>
            </button>
          </div>
        ) : (
          <>
            {/* LOGIN PANEL */}
            {activeTab === 'login' && (
              <div className="form-panel active">
                <div className="panel-header">
                  <h2>Sign In</h2>
                  <p>Secure biometric and credential gateway</p>
                </div>

                <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Phase 1: Enter email ID */}
                  {!cameraActive && !showPasswordLogin && (
                    <>
                      <div className="form-group">
                        <label htmlFor="login-email">Email Address</label>
                        <div className="input-wrapper">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          <input
                            type="email"
                            id="login-email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => onEmailChange(e.target.value)}
                            autoComplete="on"
                          />
                        </div>
                      </div>

                      <button
                        onClick={onStartScan}
                        className="btn btn-primary btn-block btn-lg"
                        disabled={!isEmailValid(email)}
                        style={{ marginTop: '5px' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span>Scan Face to Login</span>
                      </button>
                    </>
                  )}

                  {/* Phase 2: Active camera scan, user has option to use password instead */}
                  {cameraActive && !showPasswordLogin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="info-alert">
                        <div className="spinner-small" style={{ width: '14px', height: '14px', flexShrink: 0 }}></div>
                        <div className="text" style={{ fontSize: '12px' }}>
                          <strong>Face scanner active:</strong> Place your face in front of the camera.
                        </div>
                      </div>

                      <button
                        onClick={() => onShowPasswordLoginChange(true)}
                        className="btn btn-block"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)' }}
                      >
                        <span>Login with Password instead</span>
                      </button>

                      <button
                        onClick={onCancelScan}
                        className="btn btn-danger btn-block btn-sm"
                        disabled={isAuthenticating}
                      >
                        <span>Cancel Scan</span>
                      </button>
                    </div>
                  )}

                  {/* Phase 3: Password fallback form */}
                  {showPasswordLogin && (
                    <form onSubmit={onPasswordLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper" style={{ opacity: 0.7 }}>
                          <input type="email" value={email} disabled />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="login-pwd">Password</label>
                        <div className="input-wrapper">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <input
                            type="password"
                            id="login-pwd"
                            placeholder="Enter your password"
                            value={loginPassword}
                            onChange={(e) => onLoginPasswordChange(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-block btn-lg"
                        disabled={isAuthenticating || loginPassword.length < 4}
                      >
                        <span>Sign In with Password</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onShowPasswordLoginChange(false);
                          onStartScan();
                        }}
                        className="btn btn-block btn-sm"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)' }}
                      >
                        <span>Back to Face Recognition</span>
                      </button>
                    </form>
                  )}

                  {feedback && feedback.message && (
                    <div className={getFeedbackClass()} style={{ display: 'block' }}>
                      {feedback.message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* REGISTER PANEL */}
            {activeTab === 'register' && (
              <div className="form-panel active">
                <div className="panel-header">
                  <h2>Create Profile</h2>
                  <p>Register secure credentials and facial authentication</p>
                </div>

                <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {!cameraActive ? (
                    <>
                      <div className="form-group">
                        <label htmlFor="reg-name">Full Name *</label>
                        <div className="input-wrapper">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <input
                            type="text"
                            id="reg-name"
                            placeholder="John Doe"
                            value={regName}
                            onChange={(e) => onRegNameChange(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="reg-email">Email Address *</label>
                        <div className="input-wrapper">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          <input
                            type="email"
                            id="reg-email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => onEmailChange(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="reg-phone">Phone Number</label>
                        <div className="input-wrapper">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <input
                            type="tel"
                            id="reg-phone"
                            placeholder="+1 (555) 123-4567"
                            value={phone}
                            onChange={(e) => onPhoneChange(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="reg-company">Company</label>
                        <div className="input-wrapper">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                          <input
                            type="text"
                            id="reg-company"
                            placeholder="Acme Corp"
                            value={company}
                            onChange={(e) => onCompanyChange(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="reg-role">Designation / Role</label>
                        <div className="input-wrapper">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <input
                            type="text"
                            id="reg-role"
                            placeholder="Software Engineer"
                            value={role}
                            onChange={(e) => onRoleChange(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="reg-pwd">Password *</label>
                        <div className="input-wrapper">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="input-icon">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <input
                            type="password"
                            id="reg-pwd"
                            placeholder="Create password (min 4 chars)"
                            value={password}
                            onChange={(e) => onPasswordChange(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <button
                        onClick={onStartScan}
                        className="btn btn-primary btn-block btn-lg"
                        disabled={!isRegFormValid()}
                        style={{ marginTop: '10px' }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                        <span>Scan Face & Register</span>
                      </button>
                    </>
                  ) : (
                    // Camera active for registration
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="info-alert">
                        <div className="spinner-small" style={{ width: '14px', height: '14px', flexShrink: 0 }}></div>
                        <div className="text" style={{ fontSize: '12px' }}>
                          <strong>Face scanner active:</strong> Place your face in front of the camera.
                        </div>
                      </div>

                      <button
                        onClick={onCancelScan}
                        className="btn btn-danger btn-block btn-sm"
                        disabled={isAuthenticating}
                      >
                        <span>Cancel Scan</span>
                      </button>
                    </div>
                  )}

                  {feedback && feedback.message && (
                    <div className={getFeedbackClass()} style={{ display: 'block' }}>
                      {feedback.message}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
