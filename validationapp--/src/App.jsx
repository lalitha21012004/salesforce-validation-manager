import { useState, useEffect } from 'react';
import axios from 'axios';

// Cross-origin session support
axios.defaults.withCredentials = true;

function App() {
  // 1. Initialize all state at the very top of the component
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 2. Define the metadata fetcher (Human approach: define it before using it)
  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://sf-validation-manager-backend.onrender.com/api/rules');
      setRules(response.data);
    } catch (err) {
      console.error("Fetch failed:", err);
      // If we get a 401, the session is dead, so logout the UI
      if (err.response && err.response.status === 401) {
        setIsLoggedIn(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Side Effect: Check auth status on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');

    if (authStatus === 'success') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoggedIn(true);

      window.history.replaceState({}, document.title, window.location.pathname);
      fetchRules(); // This call is now safe because fetchRules is defined above
    }
  }, []); // Run once on load

  const handleLogin = () => {
    window.location.href = 'https://sf-validation-manager-backend.onrender.com/auth/login';
  };

  const handleToggle = async (ruleId, currentActive) => {
    try {
      await axios.post('https://sf-validation-manager-backend.onrender.com/api/rules/toggle', {
        ruleId: ruleId,
        status: !currentActive
      });
      fetchRules(); // Refresh data from SF
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
          <button onClick={fetchRules} disabled={loading} style={{ marginBottom: '20px' }}>
            {loading ? 'Syncing...' : 'Refresh Rules'}
          </button>

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

// Minimal styles for a professional look
const btnStyle = { padding: '12px 25px', backgroundColor: '#0070d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' };
const cellStyle = { padding: '12px', borderBottom: '1px solid #eee' };

export default App;