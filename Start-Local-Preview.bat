@echo off
title ORB Local Preview
cd /d "%~dp0"
py -3 "%~dp0orb_local_preview.py"
if errorlevel 1 pause
