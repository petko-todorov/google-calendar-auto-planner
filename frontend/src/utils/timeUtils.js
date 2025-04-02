export const generateTimeOptions = () => {
    const times = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            times.push(`${hour}:${minute}`);
        }
    }
    return times;
};

export const roundToNearestQuarter = (date) => {
    const minutes = date.getMinutes();
    const remainder = minutes % 15;
    date.setMinutes(minutes - remainder);
    return date;
};
