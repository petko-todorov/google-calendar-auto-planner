import { fetchCalendarEvents } from '../services/calendarService';

export const fetchNewEventAdded = async (year, month, setEvents, setError, setLoading) => {
    try {
        setLoading(true);
        const data = await fetchCalendarEvents(year, month);
        setEvents(data.events || []);
        setError(null);
    } catch (err) {
        console.error('Failed to load calendar events:', err);
        setError('Failed to load calendar events');
    } finally {
        setLoading(false);
    }
};
