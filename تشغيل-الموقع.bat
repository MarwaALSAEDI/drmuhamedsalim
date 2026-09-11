@echo off
cd /d "%~dp0"
start "" http://localhost:3000/admin/
node server.js
pause
