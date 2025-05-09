import { createContext, useState, useEffect, useContext } from 'react';
import { checkAuthStatus, loginWithGoogleCode, logout } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            
            try {
                const data = await checkAuthStatus();
                if (data.is_authenticated) {
                    setIsAuthenticated(true);
                    setUserData(data);
                };
            } catch (error) {
                console.error('Auth initialization error:', error);
                // setError('Failed to initialize authentication.');
            } finally {
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const handleLogin = async (authCode) => {
        try {
            setLoading(true);
            const data = await loginWithGoogleCode(authCode);
            setIsAuthenticated(true);
            setUserData(data.user);
            setError(null);
            return true;
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            setLoading(true);
            await logout();
            setIsAuthenticated(false);
            setUserData(null);
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        isAuthenticated,
        userData,
        error,
        loading,
        login: handleLogin,
        logout: handleLogout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthProvider;
