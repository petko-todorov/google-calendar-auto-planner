import { API_BASE_URL } from '../api/api.js';

const currentUrl = `${API_BASE_URL}/api`;

export const checkAuthStatus = async () => {
    const response = await fetch(`${currentUrl}/user-info/`, {
        method: 'GET',
        credentials: 'include'
    });
    return await response.json();
};

export const loginWithGoogle = async (credential) => {
    const response = await fetch(`${currentUrl}/login/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential }),
        credentials: 'include'
    });
    return await response.json();
};

export const logout = async () => {
    await fetch(`${currentUrl}/logout/`, {
        method: 'POST',
        credentials: 'include'
    });
    return true;
};