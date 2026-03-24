@echo off
setlocal
set ROOT=%~dp0
python "%ROOT%archive_stage1_legacy.py" "%ROOT%" --apply
pause
