import { GoogleLogin } from '@react-oauth/google';

const LoginPage = ({ onLoginSuccess, onLoginError }) => {
    return (
        <div>
            <h2>Please sign in with Google</h2>
            <div>
                <GoogleLogin
                    onSuccess={onLoginSuccess}
                    onError={onLoginError}
                    useOneTap
                    theme="outline"
                    shape="rectangular"
                    text="signup"
                    size="medium"
                    locale="en"
                />
            </div>
        </div>
    );

}

export default LoginPage;