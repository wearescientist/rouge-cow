@echo off
setlocal
set REPO=%~1
if "%REPO%"=="" set REPO=.
python "%~dp0cleanup_project.py" "%REPO%"
pause
