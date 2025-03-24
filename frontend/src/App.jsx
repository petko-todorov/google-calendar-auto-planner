import './App.css';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import googleLoading from './assets/google-loading.gif'
import ProfileImageMenu from './components/ProfileImageMenu';
import Header from './components/Header';

function App() {
    const { isAuthenticated, userData, error, login, logout, loading } = useAuth();

    return (
        <>
            <Header />
            {loading && (
                <>
                    <div className='text-center pt-10 flex justify-center'>
                        <img src={googleLoading} alt="" />
                    </div>
                </>
            )}

            {!loading && (
                <div>
                    {/* {error && <div className="error-message">{error}</div>} */}

                    {!isAuthenticated ? (
                        <LoginPage onLoginSuccess={login} />
                    ) : (
                        <>
                            {/* <ProfileImageMenu userData={userData} /> */}
                            <ProfilePage userData={userData} onLogout={logout} />
                        </>
                    )}
                </div>
            )}
        </>
    );
}

export default App;
