@echo off
echo ============================================
echo Construction Management Frontend Setup
echo ============================================
echo.

echo Installing dependencies...
call npm install

echo.
echo ============================================
echo Setup completed successfully!
echo ============================================
echo.
echo To start the development server, run:
echo   npm start
echo.
echo The application will be available at:
echo   http://localhost:8989
echo.
echo Backend API should be running at:
echo   http://localhost:8000/api
echo.
pause
