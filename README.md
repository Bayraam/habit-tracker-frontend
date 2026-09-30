# Habit Tracker - Frontend UI

Client-side Single Page Application (SPA) for the Habit Tracker platform, designed to interact seamlessly with the Spring Boot REST API.

## Tech Stack
- **HTML5 & CSS3:** Responsive UI designed with Bootstrap 5
- **JavaScript (ES6+):** Asynchronous API integration via Fetch API and session management using LocalStorage
- **Tools:** Visual Studio Code, Git

## Project Structure
- `index.html` - Main HTML structure and section layouts
- `app.js` - Core client-side logic, API calls, dynamic DOM manipulation, and state handling
- `.gitignore` - Ignored local and editor configuration files

## Key Features
- User registration and authentication
- Habit creation supporting binary (`YES_NO` / `BOOLEAN`) and `QUANTITATIVE` goal types
- Daily log entry with automatic streak and points calculation
- Interactive league leaderboard
- Virtual reward shop to redeem accumulated points

## Getting Started
1. Ensure the Spring Boot backend service is running on `http://localhost:8080`.
2. Open `index.html` directly in your browser or launch it using VS Code Live Server.