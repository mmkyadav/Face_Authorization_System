import React from 'react';

export default function Dashboard({ user, onLogout }) {
  const name = user?.name || user?.email || 'User';
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <section id="dashboard-view" className="dashboard-container active">
      <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="profile-avatar">
            <span>{initials}</span>
          </div>
          <div className="profile-details">
            <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{name}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Authorized Session</p>
          </div>
        </div>

        <div className="profile-info-grid" style={{ marginTop: '10px' }}>
          <div className="info-row">
            <span className="info-label">Email Address</span>
            <span className="info-value">{user?.email}</span>
          </div>
          
          {user?.phone && (
            <div className="info-row">
              <span className="info-label">Phone Number</span>
              <span className="info-value">{user.phone}</span>
            </div>
          )}
          
          {user?.company && (
            <div className="info-row">
              <span className="info-label">Company</span>
              <span className="info-value">{user.company}</span>
            </div>
          )}
          
          {user?.role && (
            <div className="info-row">
              <span className="info-label">Designation / Role</span>
              <span className="info-value">{user.role}</span>
            </div>
          )}
        </div>

        <button onClick={onLogout} className="btn btn-danger btn-block" style={{ marginTop: '15px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </section>
  );
}
