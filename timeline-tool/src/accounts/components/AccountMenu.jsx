import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import defaultUserIcon from '../default-user-icon.png';
import '../../styles/master-style.css';

export default function AccountMenu() {
  const [isDark, setIsDark] = useState(false);
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const dark = savedTheme === 'dark';
    setIsDark(dark);
    document.body.classList.toggle('dark', dark);
  }, []);

  return (
    <div className="menuWrapper">
      <button className="menuButton" onClick={() => setOpen(!open)}>
        <img className='avatar' src={user?.icon || defaultUserIcon} alt="User"/>
      </button>

      {open && (
       <div className={`menu-popup ${isDark ? 'dark' : ''}`}>
          {user ? (
            <>
              <div><strong>{user.username}</strong></div>
              <button onClick={() => navigate('/projects')}>Saved Projects</button><br />
              <button onClick={() => alert('Settings not built yet')}>Settings</button><br />
              <button className="logout" onClick={logout}>Logout</button>
            </>
          ) : (
            <button onClick={() => navigate('/login')}>Login / Signup</button>
          )}
        </div>
      )}
    </div>
  );
}