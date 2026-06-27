Workforce CRM — Defenceminia Technologies

A full-stack Employee Performance & Workforce Management System.


Tech Stack

Frontend: React.js, Tailwind CSS (CDN), React Router v6, Lucide Icons

Backend: Python, Flask, Flask-JWT-Extended, Flask-Bcrypt, Flask-CORS

Database: SQLite (via SQLAlchemy)
Features

Auth-JWT login, registration, role-based access
Dashboard-Live stats — attendance, tasks, performance score
Attendance-Daily check-in/out, history, hours worked
Tasks-Create, update, filter by status & priority
Projects-Track teams, milestones, completion %
Leaderboard-Ranked by performance score

Setup & Run

Backend

bashcd backend
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python apps.py               # Runs on http://localhost:5000

Frontend

bashcd frontend
npm install
npm run dev                  # Runs on http://localhost:5173
