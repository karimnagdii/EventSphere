@echo off

echo Starting backend server...
start cmd /k "cd /d C:\Users\user\Desktop\event-portal-new\backup\backend && npm run dev"

echo Starting frontend server...
start cmd /k "cd /d C:\Users\user\Desktop\event-portal-new\backup\frontend && npm start"
