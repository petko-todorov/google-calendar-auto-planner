// import { GoogleLogin } from '@react-oauth/google';

// const LoginPage = ({ onLoginSuccess, onLoginError }) => {
//     return (
//         <div>
//             <h2>Please sign in with Google</h2>
//             <div>
//                 <GoogleLogin
//                     onSuccess={onLoginSuccess}
//                     onError={onLoginError}
//                     theme="outline"
//                     shape="rectangular"
//                     text="signup"
//                     size="medium"
//                     locale="en"
//                     flow="auth-code"
//                 />
//                 <useGoogleLogin 
//             </div>
//         </div>
//     );

// }

// export default LoginPage;


import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import googleIcon from '../assets/google-icon.png';
import { Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAuth } from '../context/AuthContext';


const LoginButton = ({ onLoginSuccess, onLoginError }) => {
    const { error } = useAuth();

    const login = useGoogleLogin({
        flow: 'auth-code', 
        onSuccess: (response) => {
            if (response.code) {
                onLoginSuccess(response.code);
            } else {
                onLoginError(new Error('No authorization code received'));
            }
        },
        onError: (error) => {
            console.error('Google login error:', error);
            onLoginError(error);
        },
        scope: 'profile email https://www.googleapis.com/auth/calendar',
    });

    return (
        <>
            <div className='mt-10 py-10 w-3/5 text-center mx-auto border-2 rounded-3xl backdrop-blur-xs shadow-xl'>
                <img src={googleIcon} alt="Google logo" className="pb-6 mx-auto max-w-[30%]" />
                <h1 className='text-2xl pb-10'>
                    You need to sign in with your Google account
                </h1>
                {error && <div className='text-red-800'>{error}</div>}

                <div className='w-4/5 mx-auto pb-20'>
                    <Button
                        onClick={() => login()}
                        variant="contained"
                        color='primary'
                        startIcon={<GoogleIcon />}
                    >
                        Sign in with Google
                    </Button>
                </div>
            </div >
        </>
    );
};

export default LoginButton;
