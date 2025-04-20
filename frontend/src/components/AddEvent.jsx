import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, Typography, TextField, DialogContentText } from '@mui/material';
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
    const inputRef = useRef(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

    const durationOptions = [
        { value: 15, label: '15 minutes' },
        { value: 30, label: '30 minutes' },
        { value: 60, label: '1 hour' },
        { value: 90, label: '1.5 hours' },
        { value: 120, label: '2 hours' }
    ];

    const [duration, setDuration] = useState(durationOptions[2].value);
    const [summary, setSummary] = useState('');

    useEffect(() => {
        if (selectedSlot && events) {
            findAvailableSlots();
        }
    }, [selectedSlot, duration, events]);

    useEffect(() => {
        if (open) {
            const frame = requestAnimationFrame(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            });
            return () => cancelAnimationFrame(frame); 
        }
    }, [open]);

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
        currentTime.setHours(9, 0, 0, 0);

        const endOfSearch = new Date(clickedDate);
        endOfSearch.setHours(17, 0, 0, 0);

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
        setSelectedSlotIndex(0);
    };

    const handleAddEvent = async () => {
        if (availableSlots.length === 0) return;

        const selectedSlot = availableSlots[selectedSlotIndex];

        try {
            if (!summary) return;

            setLoading(true);

            await addCalendarEvent({
                summary: summary,
                start: { dateTime: selectedSlot.start.toISOString(), timeZone: 'UTC' },
                end: { dateTime: selectedSlot.end.toISOString(), timeZone: 'UTC' },
                description: '',
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
            setError(error);
        } finally {
            setLoading(false);
        }

        handleClose();
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
        >
            <DialogTitle
                align='center'
                sx={{ fontWeight: 'bold' }}
            >
                Add Event {}
            </DialogTitle>
            <DialogContentText  
                sx={{ fontWeight: 'bold' }}
                align='center'  
                variant='h6'    
            >
                {formatDate(selectedSlot.start)}
            </DialogContentText>
            <DialogContent>
                <Typography
                    variant="subtitle1"
                >
                    Summary:
                </Typography>
                <TextField
                    inputRef={inputRef}
                    sx={{ mb: 2 }}
                    onChange={(e) => setSummary(e.target.value)}
                    helperText={summary === '' ? 'Enter a summary for the event' : ''}
                    error={summary === ''}
                    placeholder='Event Summary...'
                    value={summary}
                />
                <Typography
                    variant="subtitle1"
                >
                    Event Duration:
                </Typography>
                <Select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    fullWidth
                    sx={{ mb: 2 }}
                >
                    {durationOptions.map(option => (
                        <MenuItem key={option.value} value={option.value}>
                            {option.label}
                        </MenuItem>
                    ))}
                </Select>

                {availableSlots.length > 0 ? (
                    <>
                        <Typography
                            variant="subtitle1"
                        >
                            Available Time Slots:
                        </Typography>
                        <Select
                            value={selectedSlotIndex}
                            onChange={(e) => setSelectedSlotIndex(Number(e.target.value))}
                            fullWidth
                        >
                            {availableSlots.map((slot, index) => (
                                <MenuItem key={index} value={index}>
                                    {formatTime(slot.start)} - {formatTime(slot.end)}
                                </MenuItem>
                            ))}
                        </Select>
                    </>
                ) : (
                    <Typography
                        color="error"
                    >
                        No available slots found for this duration on the selected day.
                    </Typography>
                )}

            </DialogContent>
            <DialogActions>
                <Button
                    onClick={handleClose}
                    color="error"
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleAddEvent}
                    color="primary"
                    disabled={availableSlots.length === 0 || summary === ''}
                    variant="contained"
                >
                    Add Event
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddEvent;