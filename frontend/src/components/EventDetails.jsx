import { Box, Button, Typography } from '@mui/material';

const EventDetails = ({ event }) => {
    const formatTime = (date) => {
        if (!date) return '';
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    return (
        <>
            <Typography variant="h5" component="div" align="center" fontWeight="bold">
                {event.title}
            </Typography>
            <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                    <strong>Time:</strong> {formatTime(event.start)} - {formatTime(event.end)}
                </Typography>

                {event.description && (
                    <Typography variant="body1" gutterBottom>
                        <strong>Description:</strong> {event.description}
                    </Typography>
                )}

                {event.location && (
                    <Typography variant="body1" gutterBottom>
                        <strong>Location:</strong> {event.location}
                    </Typography>
                )}
            </Box>

            {event.url && (
                <Button
                    variant="contained"
                    color="primary"
                    href={event.url}
                    target="_blank"
                    fullWidth
                >
                    Open in Google Calendar
                </Button>
            )}
        </>
    );
};

export default EventDetails;