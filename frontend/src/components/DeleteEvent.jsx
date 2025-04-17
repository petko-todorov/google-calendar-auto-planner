import { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import EventDetails from './EventDetails';
import { deleteCalendarEvent } from '../services/calendarService';
import { fetchNewEventAdded } from '../utils/calendarUtils';

const DeleteEvent = ({
    open,
    selectedEvent,
    handleClose,
    currentViewMonth,
    calendarRef,
    setEvents,
    setError,
    setLoading,
    setLoadedMonths
}) => {
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const handleDeleteClick = () => {
        setShowDeleteConfirmation(true);
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirmation(false);
    };

    const handleDeleteEvent = async () => {
        try {
            await deleteCalendarEvent(selectedEvent.id);
            setShowDeleteConfirmation(false);
            handleClose();
        } catch (error) {
            console.error('Error deleting event:', error);
        }

        try {
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
            console.error('Error deleting event:', error);
        }
    };

    if (showDeleteConfirmation) {
        return (
            <DeleteConfirmationDialog
                open={open}
                eventTitle={selectedEvent?.title}
                onCancel={handleCancelDelete}
                onConfirm={handleDeleteEvent}
                events={setEvents}
                setLoadedMonths={setLoadedMonths}
            />
        );
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xs"
            fullWidth
        >
            {selectedEvent && (
                <>
                    <DialogTitle>
                        <EventDetails event={selectedEvent} />
                    </DialogTitle>
                    <DialogActions>
                        <Button
                            onClick={handleClose}
                            color="primary"
                        >
                            Close
                        </Button>
                        <Button
                            onClick={handleDeleteClick}
                            color="error"
                            variant="contained"
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

export default DeleteEvent;