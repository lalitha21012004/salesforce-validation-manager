import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function App() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const token = urlParams.get('token');
    return (authStatus === 'success' && token) || !!sessionStorage.getItem('sf_token');
  });

  // Helper function to extract auth configurations safely
  const getAuthHeaders = useCallback(() => {
    const token = sessionStorage.getItem('sf_token');
    const instance = sessionStorage.getItem('sf_instance');
    return {
      headers: {
        'x-access-token': token,
        'x-instance-url': instance
      }
    };
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.clear();
    setIsLoggedIn(false);
    setRules([]);
  }, []);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      // Pass credentials explicitly inside standard headers
      const response = await axios.get(
        'https://sf-validation-manager-backend.onrender.com/api/rules',
        getAuthHeaders()
      );
      setRules(response.data);
    } catch (err) {
      console.error("Fetch failed:", err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, handleLogout]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const token = urlParams.get('token');
    const instance = urlParams.get('instance');

    // If returning fresh from OAuth login sequence
    if (authStatus === 'success' && token && instance) {
      sessionStorage.setItem('sf_token', token);
      sessionStorage.setItem('sf_instance', instance);
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Delay slightly to guarantee session storage initialization is fully written
      setTimeout(() => fetchRules(), 100);
    } else {
      // Check if user has an ongoing session already cached locally
      const storedToken = sessionStorage.getItem('sf_token');
      if (storedToken) {
        // Defer the fetch so state updates happen outside the effect body
        setTimeout(fetchRules, 0);
      }
    }
  }, [fetchRules]);

  const handleLogin = () => {
    window.location.href = 'https://sf-validation-manager-backend.onrender.com/auth/login';
  };

  const handleToggle = async (ruleId, currentActive) => {
    try {
      await axios.post(
        'https://sf-validation-manager-backend.onrender.com/api/rules/toggle',
        { ruleId: ruleId, status: !currentActive },
        getAuthHeaders() // Pass authorization headers
      );
      fetchRules();
    } catch {
      alert("Error updating rule status");
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ color: '#0070d2', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
        Salesforce Validation Manager
      </h2>

      {!isLoggedIn ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <button onClick={handleLogin} style={btnStyle}>
            Connect to Salesforce Org
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button onClick={fetchRules} disabled={loading}>
              {loading ? 'Syncing...' : 'Refresh Rules'}
            </button>
            <button onClick={handleLogout} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
              Disconnect
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', background: '#f8f9fa' }}>
                <th style={cellStyle}>Rule Name</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.length > 0 ? (
                rules.map((rule) => (
                  <tr key={rule.Id} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={cellStyle}>{rule.ValidationName}</td>
                    <td style={cellStyle}>
                      <span style={{ color: rule.Active ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                        {rule.Active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <button onClick={() => handleToggle(rule.Id, rule.Active)}>
                        {rule.Active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                    No Account Validation Rules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const btnStyle = { padding: '12px 25px', backgroundColor: '#0070d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' };
const cellStyle = { padding: '12px', borderBottom: '1px solid #eee' };

export default App;