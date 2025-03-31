import { API_BASE_URL } from '../api/api.js';

const currentUrl = `${API_BASE_URL}/api`;

export const fetchCalendarEvents = async (year, month) => {
    try {
        let url = `${currentUrl}/calendar/`;
        if (year && month) {
            url += `?year=${year}&month=${month}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch calendar events');
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        throw error;
    }
};


export const fetchCsrfToken = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/get-csrf-token/`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch CSRF token');
        }

        const data = await response.json();
        return data.csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
        return null;
    }
};

export const addCalendarEvent = async (eventData) => {
    try {
        const csrfToken = await fetchCsrfToken();

        if (!csrfToken) {
            throw new Error('Unable to retrieve CSRF token');
        }

        const response = await fetch(`${API_BASE_URL}/api/calendar/add-event`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify(eventData)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error Response:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
            });

            throw new Error(`Failed to add event: ${errorText || response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Comprehensive Error Adding Calendar Event:', error);
        throw error;
    }
};