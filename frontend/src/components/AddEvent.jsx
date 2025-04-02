import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem } from '@mui/material';
import { addCalendarEvent } from '../services/calendarService';
import { roundToNearestQuarter, generateTimeOptions } from '../utils/timeUtils';
import { fetchNewEventAdded } from '../utils/calendarUtils';


const AddEvent = ({
    open,
    handleClose,
    selectedSlot,
    currentViewMonth,
    calendarRef,
    setEvents,
    setError,
    setLoading
}) => {
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const timeOptions = generateTimeOptions();

    useEffect(() => {
        if (selectedSlot) {
            const currentDate = new Date();

            const roundedStart = roundToNearestQuarter(new Date(currentDate));
            const roundedEnd = new Date(roundedStart.getTime() + 60 * 60 * 1000);

            const startHour = roundedStart.getHours().toString().padStart(2, '0');
            const startMinute = roundedStart.getMinutes().toString().padStart(2, '0');
            const endHour = roundedEnd.getHours().toString().padStart(2, '0');
            const endMinute = roundedEnd.getMinutes().toString().padStart(2, '0');

            setStartTime(`${startHour}:${startMinute}`);
            setEndTime(`${endHour}:${endMinute}`);
        }
    }, [selectedSlot]);

    const handleAddEvent = async () => {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const eventStart = new Date(selectedSlot.start);
        eventStart.setHours(startHour, startMinute, 0, 0);

        const eventEnd = new Date(selectedSlot.end);
        eventEnd.setHours(endHour, endMinute, 0, 0);
        eventEnd.setDate(eventStart.getDate());
        // TODO add error/showing text if no space available
        try {
            const data = await addCalendarEvent({
                summary: 'New Event',
                start: { dateTime: eventStart.toISOString(), timeZone: 'UTC' },
                end: { dateTime: eventEnd.toISOString(), timeZone: 'UTC' },
                description: 'new event',
                // location: 'Online',
            });

            console.log("Event added:", data);
            await fetchNewEventAdded(
                currentViewMonth.current.year,
                currentViewMonth.current.month,
                setEvents,
                setError,
                setLoading
            );
            calendarRef.current.getApi().refetchEvents();
        } catch (error) {
            console.error('Error adding event:', error);
        }

        handleClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
        >
            <DialogTitle>Add Event</DialogTitle>
            <DialogContent>
                <div>
                    <label>Start Time:</label>
                    <Select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        fullWidth
                    >
                        {timeOptions.map(time => (
                            <MenuItem
                                key={time}
                                value={time}
                            >
                                {time}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
                <div>
                    <label>End Time:</label>
                    <Select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        fullWidth>
                        {timeOptions.map(time => (
                            <MenuItem
                                key={time}
                                value={time}
                            >
                                {time}
                            </MenuItem>
                        ))}
                    </Select>
                </div>
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
                >
                    Add Event
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddEvent;
