@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "PORT=4173"
set "HOST=localhost"
set "URL=http://%HOST%:%PORT%/"
set "VERSION=20260729-brand-home-link"
set "EXPECTED_TITLE=VSM7 Workshop Workspace"
set "SERVER_SCRIPT=scripts\vsm7_file_server.py"

if not defined VSM7_WORKSPACE_DIR set "VSM7_WORKSPACE_DIR=%CD%\VSM7-Workspaces"
set "TARGET_URL=%URL%?v=%VERSION%"

rem Reuse an already-running VSM7 file server.
powershell.exe -NoProfile -Command ^
  "try { $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds(); $page = (Invoke-WebRequest -UseBasicParsing -Uri ('%URL%?health=' + $stamp) -TimeoutSec 2).Content; $health = Invoke-RestMethod -Uri '%URL%api/storage/health' -TimeoutSec 2; if ($page -match [regex]::Escape('%EXPECTED_TITLE%') -and $health.mode -eq 'file') { exit 0 } } catch {}; exit 1" ^
  >nul 2>nul

if not errorlevel 1 (
  echo VSM7 is already running in file-backed mode on %URL%
  start "" "%TARGET_URL%"
  exit /b 0
)

rem Do not terminate an unrelated corporate application automatically.
powershell.exe -NoProfile -Command ^
  "if (Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }" ^
  >nul 2>nul

if not errorlevel 1 (
  echo Port %PORT% is already used by another application or an older VSM7 server.
  echo Close that application and run start.bat again.
  echo.
  echo To inspect the port in PowerShell:
  echo   Get-NetTCPConnection -LocalPort %PORT% -State Listen
  pause
  exit /b 1
)

if not exist "%SERVER_SCRIPT%" (
  echo Missing %SERVER_SCRIPT%. Cannot start file-backed VSM7.
  pause
  exit /b 1
)

set "PYTHON_EXE="
set "PYTHON_ARGS="

if defined CONDA_PREFIX (
  if exist "%CONDA_PREFIX%\python.exe" set "PYTHON_EXE=%CONDA_PREFIX%\python.exe"
)

if not defined PYTHON_EXE (
  if exist "%USERPROFILE%\anaconda3\python.exe" set "PYTHON_EXE=%USERPROFILE%\anaconda3\python.exe"
)

if not defined PYTHON_EXE (
  if exist "%LOCALAPPDATA%\anaconda3\python.exe" set "PYTHON_EXE=%LOCALAPPDATA%\anaconda3\python.exe"
)

if not defined PYTHON_EXE (
  if exist "%ProgramData%\anaconda3\python.exe" set "PYTHON_EXE=%ProgramData%\anaconda3\python.exe"
)

if not defined PYTHON_EXE (
  where py >nul 2>nul
  if not errorlevel 1 (
    py -3 -c "import sys; raise SystemExit(0 if sys.version_info.major == 3 else 1)" >nul 2>nul
    if not errorlevel 1 (
      set "PYTHON_EXE=py"
      set "PYTHON_ARGS=-3"
    )
  )
)

if not defined PYTHON_EXE (
  where python >nul 2>nul
  if not errorlevel 1 (
    python -c "import sys; raise SystemExit(0 if sys.version_info.major == 3 else 1)" >nul 2>nul
    if not errorlevel 1 set "PYTHON_EXE=python"
  )
)

if not defined PYTHON_EXE (
  where python3 >nul 2>nul
  if not errorlevel 1 (
    python3 -c "import sys; raise SystemExit(0 if sys.version_info.major == 3 else 1)" >nul 2>nul
    if not errorlevel 1 set "PYTHON_EXE=python3"
  )
)

if not defined PYTHON_EXE (
  echo Python 3 was not found.
  echo Install Python 3 or open an Anaconda Prompt and run this start.bat from there.
  pause
  exit /b 1
)

echo Starting VSM7 from: %CD%
echo Saving workspaces to: %VSM7_WORKSPACE_DIR%
echo Opening %TARGET_URL%
echo Keep this window open while using VSM7. Press Ctrl+C to stop the server.
echo.

rem Open the browser shortly after the foreground server starts.
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command ^
  "Start-Sleep -Milliseconds 900; Start-Process '%TARGET_URL%'"

"%PYTHON_EXE%" %PYTHON_ARGS% "%SERVER_SCRIPT%" --port "%PORT%" --host "%HOST%" --root "%CD%" --workspace-dir "%VSM7_WORKSPACE_DIR%"
set "SERVER_EXIT=%ERRORLEVEL%"

if not "%SERVER_EXIT%"=="0" (
  echo.
  echo VSM7 stopped with error code %SERVER_EXIT%.
  pause
)

exit /b %SERVER_EXIT%
