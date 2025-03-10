import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';

const clientId = "1054962942187-uge626asu54djmb3n7c1nnisi86janqf.apps.googleusercontent.com";

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={clientId}>
            <AuthProvider>
                <App />
            </AuthProvider>
        </GoogleOAuthProvider>
    </StrictMode>
)
