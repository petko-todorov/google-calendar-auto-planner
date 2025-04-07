import { useState, useRef } from 'react';
import { fetchCalendarEvents } from '../services/calendarService';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { lineSpinner } from 'ldrs'
import AddEvent from './AddEvent';
import EventDetailsDialog from './EventDetailsDialog';

lineSpinner.register()

const CalendarEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();
    const calendarRef = useRef(null);
    const [loadedMonths, setLoadedMonths] = useState({});
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventDialogOpen, setEventDialogOpen] = useState(false); // New state for dialog

    const currentViewMonth = useRef({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    });

    const loadEventsForMonth = async (year, month) => {
        const cacheKey = `${year}-${month}`;

        if (loadedMonths[cacheKey]) {
            setEvents(loadedMonths[cacheKey]);
            return;
        }

        if (!isAuthenticated) return;

        try {
            setLoading(true);
            const data = await fetchCalendarEvents(year, month);
            const monthEvents = data.events || [];

            setLoadedMonths(prev => ({
                ...prev,
                [cacheKey]: monthEvents
            }));

            setEvents(monthEvents);

            setError(null);
        } catch (err) {
            console.error('Failed to load calendar events:', err);
            setError('Failed to load calendar events');
        } finally {
            setLoading(false);
        };
    };

    const handleDatesSet = (dateInfo) => {
        const viewDate = dateInfo.view.currentStart;
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth() + 1;
        currentViewMonth.current = { year, month };
        loadEventsForMonth(year, month);
    };

    const handleEventClick = (info) => {
        info.jsEvent.preventDefault();
        info.jsEvent.stopPropagation();

        setSelectedEvent(info.event);
        setEventDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setEventDialogOpen(false);
        setSelectedEvent(null);

        const { year, month } = currentViewMonth.current;
        loadEventsForMonth(year, month);
    };

    const handleAddEvent = () => {
        setOpenModal(true);
    };

    const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        description: event.description || '',
        location: event.location || '',
        url: event.htmlLink,
    }));

    if (!isAuthenticated) {
        return <div>Please log in to view your calendar events</div>;
    }

    return (
        <div className="h-3/5">
            {loading && (
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <l-line-spinner
                        size="140"
                        stroke="7"
                        speed="1"
                        color="#fbfcfc"
                    />
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className={loading ? 'opacity-20 pointer-events-none' : ''}>
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    firstDay={1}
                    headerToolbar={{
                        left: 'addEventButton addEventButton2',
                        center: 'title',
                        right: 'today prev,next'
                    }}
                    customButtons={{
                        addEventButton: {
                            text: 'Add Event',
                            click: () => {
                                console.log(123);
                            }
                        },
                        addEventButton2: {
                            text: 'One Click Add Event',
                            click: handleAddEvent,
                            className: selectedSlot ? '' : 'opacity-50 pointer-events-none'
                        }
                    }}
                    aspectRatio={2.27}
                    events={formattedEvents}
                    eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                    slotLabelFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    }}
                    dayMaxEvents={true}
                    selectable={true}
                    select={(selectedInfo) => {
                        const startTime = selectedInfo.startStr;
                        const endTime = selectedInfo.endStr;

                        setSelectedSlot({
                            start: new Date(startTime),
                            end: new Date(endTime)
                        });
                    }}
                    eventClick={handleEventClick}
                    datesSet={handleDatesSet}
                />

                <EventDetailsDialog
                    open={eventDialogOpen}
                    selectedEvent={selectedEvent}
                    handleClose={handleCloseDialog}
                    currentViewMonth={currentViewMonth}
                    calendarRef={calendarRef}
                    setEvents={setEvents}
                    setError={setError}
                    setLoading={setLoading}
                />
            </div>

            {selectedSlot && openModal && (
                <AddEvent
                    open={openModal}
                    handleClose={() => setOpenModal(false)}
                    selectedSlot={selectedSlot}
                    loadEventsForMonth={loadEventsForMonth}
                    currentViewMonth={currentViewMonth}
                    calendarRef={calendarRef}
                    setEvents={setEvents}
                    setError={setError}
                    setLoading={setLoading}
                    events={events}
                />
            )}
        </div>
    );
};

export default CalendarEvents;