import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FaCheckCircle, FaExclamationCircle, FaKey, FaTools, FaUserCheck } from 'react-icons/fa';

const ID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/;

const Tools = () => {
  // State for Validator Form
  const [valUserId, setValUserId] = useState('');
  const [valPassword, setValPassword] = useState('');
  const [valStatus, setValStatus] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });
  const [valResult, setValResult] = useState('');

  // State for Password Changer Form
  const [chgUserId, setChgUserId] = useState('');
  const [chgOldPass, setChgOldPass] = useState('');
  const [chgNewPass, setChgNewPass] = useState('');
  const [chgConfirmPass, setChgConfirmPass] = useState('');
  const [chgStatus, setChgStatus] = useState<{ text: string; type: 'success' | 'error' | '' }>({
    text: '',
    type: '',
  });
  const [chgResult, setChgResult] = useState('');

  // Helpers
  const validateInput = (id: string, pass: string, requirePassLength = false) => {
    if (!ID_REGEX.test(id.trim())) {
      alert('Invalid User ID format. A valid UUID is expected.');
      return false;
    }
    if (requirePassLength && pass.length < 6) {
      alert('Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  // Handlers
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput(valUserId, valPassword)) return;

    try {
      const response = await fetch('/auth', {
        method: 'GET',
        headers: {
          Authorization: 'Basic ' + btoa(valUserId.trim() + ':' + valPassword),
        },
      });

      setValStatus({
        text: `${response.status} ${response.statusText}`,
        type: response.ok ? 'success' : 'error',
      });

      let authStatus = 'Unknown';
      switch (response.status) {
        case 200:
          authStatus = 'Authenticated';
          break;
        case 204:
          authStatus = 'Unregistered';
          break;
        case 401:
          authStatus = 'Unauthorized';
          break;
        default:
          authStatus = response.statusText;
      }
      setValResult(authStatus);
    } catch (err) {
      setValStatus({ type: 'error', text: (err as Error)?.message });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInput(chgUserId, chgNewPass, true)) return;

    if (chgNewPass !== chgConfirmPass) {
      alert('New password and confirmation do not match.');
      return;
    }

    try {
      const response = await fetch('/auth', {
        method: 'PUT',
        headers: {
          Authorization: 'Basic ' + btoa(chgUserId.trim() + ':' + chgOldPass),
          'Content-Type': 'text/plain',
        },
        body: chgNewPass,
      });

      setChgStatus({
        text: `${response.status} ${response.statusText}`,
        type: response.ok ? 'success' : 'error',
      });

      const text = await response.text();
      setChgResult(text);
    } catch (err) {
      setChgStatus({ type: 'error', text: (err as Error)?.message });
    }
  };

  return (
    <div className="page-wrapper">
      <div className="main-container">
        <header className="page-header">
          <h1>
            <FaTools className="icon-title" /> Toolbox
          </h1>
          <p className="subtitle">Manage your UncivServer account credentials</p>
        </header>

        <div className="cards-grid">
          {/* Card 1: Validator */}
          <div className="glass-card">
            <div className="card-header">
              <FaUserCheck className="card-icon" />
              <h2>User ID Validator</h2>
            </div>

            <form onSubmit={handleValidate}>
              <div className="form-group">
                <label>User ID</label>
                <input
                  type="text"
                  placeholder="Enter your UUID"
                  value={valUserId}
                  onChange={e => setValUserId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Current password"
                  value={valPassword}
                  onChange={e => setValPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Validate Credentials
              </button>
            </form>

            {(valStatus.text || valResult) && (
              <div className={`result-box ${valStatus.type}`}>
                <p className="status-text">
                  {valStatus.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                  {valStatus.text}
                </p>
                {valResult && <p className="result-detail">{valResult}</p>}
              </div>
            )}
          </div>

          {/* Card 2: Password Changer */}
          <div className="glass-card">
            <div className="card-header">
              <FaKey className="card-icon" />
              <h2>Password Changer</h2>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>User ID</label>
                <input
                  type="text"
                  placeholder="Enter your UUID"
                  value={chgUserId}
                  onChange={e => setChgUserId(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Old Password</label>
                <input
                  type="password"
                  placeholder="Leave empty if none"
                  value={chgOldPass}
                  onChange={e => setChgOldPass(e.target.value)}
                />
              </div>
              <div className="row">
                <div className="form-group half">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="New password"
                    value={chgNewPass}
                    onChange={e => setChgNewPass(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group half">
                  <label>Confirm</label>
                  <input
                    type="password"
                    placeholder="Repeat"
                    value={chgConfirmPass}
                    onChange={e => setChgConfirmPass(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-danger">
                Change Password
              </button>
            </form>

            {(chgStatus.text || chgResult) && (
              <div className={`result-box ${chgStatus.type}`}>
                <p className="status-text">
                  {chgStatus.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
                  {chgStatus.text}
                </p>
                {chgResult && <p className="result-detail">{chgResult}</p>}
              </div>
            )}
          </div>
        </div>

        <div className="footer-link">
          <a href="/">← Back to Home</a>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root') as HTMLDivElement;
const root = createRoot(container);
root.render(<Tools />);
