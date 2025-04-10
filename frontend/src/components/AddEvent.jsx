import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, Typography } from '@mui/material';
import { addCalendarEvent } from '../services/calendarService';
import { fetchNewEventAdded } from '../utils/calendarUtils';

const AddEvent = ({
    open,
    handleClose,
    selectedSlot,
    currentViewMonth,
    calendarRef,
    setEvents,
    setError,
    setLoading,
    events,
    setLoadedMonths
}) => {
    const [duration, setDuration] = useState(60);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

    const durationOptions = [
        { value: 15, label: '15 minutes' },
        { value: 30, label: '30 minutes' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1.5 hours' },
        { value: 120, label: '2 hours' }
    ];

    useEffect(() => {
        if (selectedSlot && events) {
            findAvailableSlots();
        }
    }, [selectedSlot, duration, events]);

    const findAvailableSlots = () => {
        const clickedDate = new Date(selectedSlot.start);
        clickedDate.setHours(0, 0, 0, 0);

        const existingEvents = events
            .filter(event => {
                const eventStart = new Date(event.start?.dateTime || event.start?.date);
                return eventStart.toDateString() === clickedDate.toDateString();
            })
            .map(event => ({
                start: new Date(event.start?.dateTime || event.start?.date),
                end: new Date(event.end?.dateTime || event.end?.date),
            }))
            .sort((a, b) => a.start - b.start);

        const slots = [];
        let currentTime = new Date(clickedDate);
        currentTime.setHours(9, 0, 0, 0); // Default start: 9 AM

        const endOfSearch = new Date(clickedDate);
        endOfSearch.setHours(17, 0, 0, 0); // Default end: 5 PM

        while (currentTime < endOfSearch) {
            const slotEnd = new Date(currentTime.getTime() + duration * 60000);
            if (slotEnd > endOfSearch) break;

            const isAvailable = !existingEvents.some(event =>
                currentTime < event.end && slotEnd > event.start
            );

            if (isAvailable) {
                slots.push({ start: new Date(currentTime), end: new Date(slotEnd) });
                currentTime = slotEnd;
            } else {
                const nextEvent = existingEvents.find(e => e.start >= currentTime);
                currentTime = nextEvent ? new Date(nextEvent.end) : endOfSearch;
            }
        }

        setAvailableSlots(slots);
    };

    const handleAddEvent = async () => {
        if (availableSlots.length === 0) return;

        const selectedSlot = availableSlots[selectedSlotIndex];

        try {
            //  TODO change this
            const data = await addCalendarEvent({
                summary: 'New Event',
                start: { dateTime: selectedSlot.start.toISOString(), timeZone: 'UTC' },
                end: { dateTime: selectedSlot.end.toISOString(), timeZone: 'UTC' },
                description: 'new event',
            });

            await fetchNewEventAdded(
                currentViewMonth.current.year,
                currentViewMonth.current.month,
                setEvents,
                setError,
                setLoading
            );

            await setLoadedMonths(
                currentViewMonth.current.year,
                currentViewMonth.current.month,
            );

            calendarRef.current.getApi().refetchEvents();
        } catch (error) {
            console.error('Error adding event:', error);
        };

        handleClose();
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
        >
            <DialogTitle>
                Add Event
            </DialogTitle>
            <DialogContent>
                <div className="mb-6">
                    <Typography variant="subtitle1">Event Duration:</Typography>
                    <Select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        fullWidth
                    >
                        {durationOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </div>

                {availableSlots.length > 0 ? (
                    <div>
                        <Typography
                            variant="subtitle1">
                            Available Time Slots:
                        </Typography>
                        <Select
                            value={selectedSlotIndex}
                            onChange={(e) => setSelectedSlotIndex(e.target.value)}
                            fullWidth
                        >
                            {availableSlots.map((slot, index) => (
                                <MenuItem key={index} value={index}>
                                    {formatTime(slot.start)} - {formatTime(slot.end)}
                                </MenuItem>
                            ))}
                        </Select>
                    </div>
                ) : (
                    <Typography color="error">
                        No available slots found for this duration on the selected day.
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="error">
                    Cancel
                </Button>
                <Button
                    onClick={handleAddEvent}
                    color="primary"
                    disabled={availableSlots.length === 0}
                >
                    Add Event
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddEvent;