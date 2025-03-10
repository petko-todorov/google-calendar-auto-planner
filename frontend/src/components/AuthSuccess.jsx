import React, { useEffect } from 'react';

const AuthSuccess = () => {
    useEffect(() => {

        window.opener.checkAuthStatus()
        setTimeout(() => {
            window.close()
        }, 10000)
    }, []);

    return null; // No UI needed
};

export default AuthSuccess;
