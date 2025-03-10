import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';

function App() {
    const { isAuthenticated, userData, error, login, logout } = useAuth();

    return (
        <div className="app">
            <div className="container">
                <h1>Google Auth Test</h1>
                {error && <div className="error-message">{error}</div>}

                {!isAuthenticated ? (
                    <LoginPage onLoginSuccess={login} />
                ) : (
                    <ProfilePage userData={userData} onLogout={logout} />
                )}
            </div>
        </div>
    );
}

export default App;
