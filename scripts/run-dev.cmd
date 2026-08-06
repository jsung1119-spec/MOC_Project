@echo off
setlocal
set "PATH=%~dp0..\.runtime\node-v22.22.0-win-x64;%SystemRoot%\System32;%SystemRoot%"
cd /d "%~dp0.."
call ".runtime\node-v22.22.0-win-x64\npm.cmd" run dev > ".devserver.out.log" 2> ".devserver.err.log"
