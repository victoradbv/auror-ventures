@echo off
cd /d "%~dp0.."
echo Cleaning Auror Ventures build output and caches...
if exist dist rmdir /s /q dist
if exist .astro rmdir /s /q .astro
if exist node_modules\.vite rmdir /s /q node_modules\.vite
echo Done.
pause
