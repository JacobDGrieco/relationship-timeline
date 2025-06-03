import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Home from './relatime/components/Home.jsx';
import AccountLogin from './accounts/components/AccountLogin.jsx';
import AccountProjects from './accounts/components/AccountProjects.jsx';
import AccountSettings from './accounts/components/AccountSettings.jsx';
import { ProjectProvider } from './relatime/utils/projectContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            <Route path="*" element={<Home />} />
            <Route path="/projects" element={<AccountProjects />} />
            <Route path="/accSettings" element={<AccountSettings />} />
            <Route path="/login" element={<AccountLogin />} />
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);