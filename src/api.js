const API_BASE_URL = 'http://localhost:8080/api';

export const api = {
    // Autentifikacija / Korisnici (ako imaš)
    login: (credentials) => fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    }),

    // Navike
    getHabits: (userId) => fetch(`${API_BASE_URL}/habits/user/${userId}`),

    createHabit: (userId, payload) => fetch(`${API_BASE_URL}/habits?userId=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }),

    deleteHabit: (habitId) => fetch(`${API_BASE_URL}/habits/${habitId}`, {
        method: 'DELETE'
    }),

    logHabit: (habitId, payload) => fetch(`${API_BASE_URL}/habits/${habitId}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }),

    getHabitLogs: (habitId) => fetch(`${API_BASE_URL}/habits/${habitId}/logs`)
};