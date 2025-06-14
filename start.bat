@echo off

echo Starting backend server...
start cmd /k "cd /d backend && npm run dev"

echo Starting frontend server...
start cmd /k "cd /d frontend && npm start"
