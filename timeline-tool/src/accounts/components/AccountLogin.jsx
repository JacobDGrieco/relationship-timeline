import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../styles/master-style.css';

export default function AccountLogin() {
  const [isDark, setIsDark] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const { user, login: loginContext } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const dark = savedTheme === 'dark';
    setIsDark(dark);
    document.body.classList.toggle('dark', dark);
  }, []);

  useEffect(() => {
    if (user) navigate('/');
  }, [user]);

  const API = 'http://localhost:4000/api';

  const login = async () => {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const contentType = res.headers.get('content-type');
    const data = contentType?.includes('application/json') ? await res.json() : {};

    if (res.ok && data.token) {
      loginContext(data.token, data.username);
      navigate('/');
      setUsername('');
      setPassword('');
      setEmail('');
    } else {
      setMessage(data.message || 'Login failed');
    }
  } catch (err) {
    console.error('Login fetch error:', err);
    setMessage('Login failed due to network/server error');
  }
};

  const signup = async () => {
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, email })
      });

      if (res.ok) {
        await login();
      } else {
        const data = await res.json();
        alert(data.message || 'Signup failed');

        setUsername('');
        setPassword('');
        setEmail('');
      }
    } catch (err) {
      console.error(err);
      alert('Signup error');

      setUsername('');
      setPassword('');
      setEmail('');
    }
  };


  return (
    <div className={`login-wrapper ${isDark ? 'dark' : ''}`}>
      <div className="login-box">
        <h2>{isSignup ? 'Create Account' : 'Log In'}</h2>

        {isSignup && (
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
          />
        )}

        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
        />

        <div className="login-buttons">
          {isSignup ? (
            <button onClick={signup}>Sign Up</button>
          ) : (
            <button onClick={login}>Log In</button>
          )}
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          {!isSignup ? (
            <span onClick={() => setIsSignup(true)} style={{ cursor: 'pointer', color: '#007bff' }}>
              Don't have an account? <u>Sign up</u>
            </span>
          ) : (
            <span onClick={() => setIsSignup(false)} style={{ cursor: 'pointer', color: '#007bff' }}>
              Already have an account? <u>Log in</u>
            </span>
          )}
        </div>

        {message && <p className="login-message">{message}</p>}
      </div>
    </div>
  );
}
