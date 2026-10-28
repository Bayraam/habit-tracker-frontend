# Habit Tracker - Frontend

A React single-page application for tracking daily habits, connected to a Spring Boot REST API.

## Tech Stack

- React + Vite
- Tailwind CSS
- Fetch API for backend communication

## Getting Started

### Prerequisites

- Node.js 18 or newer
- The backend running locally (see below)

### Installation

```bash
git clone https://github.com/Bayraam/habit-tracker-frontend
cd habit-tracker-frontend
npm install
```

### Run the development server

```bash
npm run dev
```

The app will be available at http://localhost:5173

### Build for production

```bash
npm run build
```

## Backend

This frontend requires the Habit Tracker backend:
https://github.com/Bayraam/habit-tracker

The API base URL is configured in `src/api.js`.

## Project Structure

```
src/
├── App.jsx      # Main application component
├── api.js       # API calls to the backend
├── main.jsx     # Entry point
└── index.css    # Global styles (Tailwind)
```