import { API_BASE_URL } from '../api/api.js';

const currentUrl = `${API_BASE_URL}/api`;

export const checkAuthStatus = async () => {
    const response = await fetch(`${currentUrl}/user-info/`, {
        method: 'GET',
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to check authentication status');
    };
    return await response.json();
};

export const loginWithGoogleCode = async (code) => {
    const response = await fetch(`${API_BASE_URL}/api/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code }),
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to login with Google');
    };
    return await response.json();
};

export const logout = async () => {
    await fetch(`${currentUrl}/logout/`, {
        method: 'POST',
        credentials: 'include'
    });
    return true;
};

