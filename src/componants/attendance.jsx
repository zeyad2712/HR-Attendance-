import React, { useState, useEffect } from 'react';

// This function returns today's date as a string in the format "YYYY-MM-DD".
// It creates a new Date object for the current date and time,
// then converts it to an ISO string (e.g., "2024-06-09T12:34:56.789Z").
// The ISO string is split at the 'T' character, and the first part (the date) is returned.
const getTodayKey = () => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

// This function returns an array of date strings for the last 'n' days, including today.
// Each date is formatted as "YYYY-MM-DD".
// For example, getLastNDates(3) might return ["2024-06-09", "2024-06-08", "2024-06-07"] if today is June 9, 2024.
const getLastNDates = (n) => {
    const dates = [];
    for (let i = 0; i < n; i++) {
        // Create a new Date object for today
        const d = new Date();
        // Subtract 'i' days from today to get the previous dates
        d.setDate(d.getDate() - i);
        // Convert the date to ISO string and take only the date part (before 'T')
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
};

/**
 * Attendance Component Explanation
 * 
 * This React component provides a simple HR attendance system. It allows a user to:
 * - Check in and check out for the current day.
 * - View their attendance history for the last 7 days.
 * - Reset today's attendance (with confirmation).
 * 
 * The component uses localStorage to persist attendance data across browser sessions.
 * 
 * Here's a breakdown of the main parts:
 */

const Attendance = () => {
    // State to track today's attendance (checkIn/checkOut times)
    const [attendance, setAttendance] = useState({ checkIn: null, checkOut: null });
    // State to store the last 7 days' attendance history
    const [history, setHistory] = useState([]);
    // State to control the display of the reset confirmation dialog
    const [showConfirm, setShowConfirm] = useState(false);
    // Today's date in "YYYY-MM-DD" format (used as a key in localStorage)
    const todayKey = getTodayKey();
    // State to store user's current location
    const [location, setLocation] = useState({ lat: null, lon: null, error: null });

    /**
     * useEffect runs whenever todayKey changes (i.e., on mount or at midnight).
     * It loads all attendance data from localStorage, sets today's attendance,
     * and builds the last 7 days' history.
     */
    useEffect(() => {
        const allAttendance = JSON.parse(localStorage.getItem('attendance')) || {};
        setAttendance(allAttendance[todayKey] || { checkIn: null, checkOut: null });
        // Build history for the last 7 days
        const last7 = getLastNDates(7).map(date => ({
            date,
            ...allAttendance[date]
        }));
        setHistory(last7);
    }, [todayKey]);

    /**
     * saveAttendance updates today's attendance in localStorage and state,
     * and refreshes the last 7 days' history.
     */
    const saveAttendance = (data) => {
        const allAttendance = JSON.parse(localStorage.getItem('attendance')) || {};
        allAttendance[todayKey] = data;
        localStorage.setItem('attendance', JSON.stringify(allAttendance));
        setAttendance(data);
        // Update history
        const last7 = getLastNDates(7).map(date => ({
            date,
            ...allAttendance[date]
        }));
        setHistory(last7);
    };

    /**
     * handleCheckIn:
     * - If the user already checked out today, start a new session (reset checkOut).
     * - Otherwise, just set the checkIn time.
     */
    const handleCheckIn = () => {
        const time = new Date().toLocaleTimeString();
        if (attendance.checkOut) {
            saveAttendance({ checkIn: time, checkOut: null });
        } else {
            saveAttendance({ ...attendance, checkIn: time });
        }
    };

    /**
     * handleCheckOut sets the checkOut time for today.
     */
    const handleCheckOut = () => {
        const time = new Date().toLocaleTimeString();
        saveAttendance({ ...attendance, checkOut: time });
    };

    /**
     * handleReset shows the confirmation dialog for resetting today's attendance.
     */
    const handleReset = () => {
        setShowConfirm(true);
    };

    /**
     * confirmReset removes today's attendance from localStorage and state,
     * hides the confirmation dialog, and updates the history.
     */
    const confirmReset = () => {
        const allAttendance = JSON.parse(localStorage.getItem('attendance')) || {};
        delete allAttendance[todayKey];
        localStorage.setItem('attendance', JSON.stringify(allAttendance));
        setAttendance({ checkIn: null, checkOut: null });
        setShowConfirm(false);
        // Update history
        const last7 = getLastNDates(7).map(date => ({
            date,
            ...allAttendance[date]
        }));
        setHistory(last7);
    };

    const calculateDuration = (checkIn, checkOut) => {
        if (!checkIn || !checkOut) return '--';

        try {
            // get today's date in YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];
            // combine date and time for parsing
            const inTime = new Date(`${today} ${checkIn}`);
            const outTime = new Date(`${today} ${checkOut}`);

            // calculate difference in milliseconds
            const diffMs = outTime - inTime;
            if (isNaN(diffMs) || diffMs < 0) return '--';

            // convert to hours and minutes
            const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
            const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);

            return `${diffHrs}h ${diffMins}m`;
        } catch (e) {
            return '--';
        }
    };


    /**
     * The component renders:
     * - Today's date, check-in, and check-out times.
     * - Buttons for check-in, check-out, and reset (with appropriate enable/disable logic).
     * - A confirmation dialog for resetting attendance.
     * - A table showing the last 7 days' attendance history.
     */
    return (
        <div className="card">
            <h1>HR Attendance</h1>
            <p><strong>Date:</strong> {todayKey}</p>
            <p><strong>Check In:</strong> {attendance.checkIn || '--'}</p> {/* Display check-in time or '--' if not checked in */}
            <p><strong>Check Out:</strong> {attendance.checkOut || '--'}</p> {/* Display check-out time or '--' if not checked out */}

            <div className="buttons">
                {/* Check In button is disabled if already checked in and not yet checked out */}
                <button onClick={handleCheckIn} disabled={!!attendance.checkIn && !attendance.checkOut}>Check In</button>
                {/* Check Out button is disabled if not checked in or already checked out */}
                <button onClick={handleCheckOut} disabled={!attendance.checkIn || !!attendance.checkOut}>Check Out</button>
                {/* Reset button always enabled */}
                <button onClick={handleReset} style={{ marginLeft: 8 }}>Reset</button>
            </div>
            {/* Show status messages */}
            {(attendance.checkIn && !attendance.checkOut) && <p style={{ color: 'green' }}>Checked in! Don't forget to check out.</p>}
            {attendance.checkIn && attendance.checkOut && <p style={{ color: 'blue' }}>Attendance complete for today.</p>}

            {/* Confirmation Dialog for Reset */}
            {showConfirm && (
                <div style={{ background: '#fff', border: '1px solid #ccc', padding: 16, marginTop: 16 }}>
                    <p>Are you sure you want to reset today's attendance?</p>
                    <button onClick={confirmReset} style={{ marginRight: 8 }}>Yes, Reset</button>
                    <button onClick={() => setShowConfirm(false)}>Cancel</button>
                </div>
            )}

            {/* Attendance History Table */}
            <h2 style={{ marginTop: 32 }}>Attendance History (Last 7 Days)</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Date</th>
                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Check In</th>
                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Check Out</th>
                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Duration</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((item) => (
                        <tr key={item.date} style={{ background: item.date === todayKey ? '#f0f8ff' : 'inherit' }}>
                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{item.date}</td>
                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{item.checkIn || '--'}</td>
                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{item.checkOut || '--'}</td>
                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{calculateDuration(item.checkIn, item.checkOut)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Attendance;
