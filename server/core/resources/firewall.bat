@echo off
:: RaptorVR only needs inbound access to its bundled Java server from the local
:: private network. Outbound traffic is already allowed by Windows by default.
net session >nul 2>&1
if %errorlevel% == 0 (
    echo Running with administrative privileges.
) else (
    echo Requesting administrative privileges for the RaptorVR firewall rule.
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\raptorvr-getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "%~dp0", "runas", 1 >> "%temp%\raptorvr-getadmin.vbs"
    "%temp%\raptorvr-getadmin.vbs"
    exit /B
)

echo Installing the RaptorVR private-network firewall permission...
netsh advfirewall firewall delete rule name="RaptorVR OpenJDK Platform Binary (Private)" >nul 2>&1
netsh advfirewall firewall add rule name="RaptorVR OpenJDK Platform Binary (Private)" description="Allows RaptorVR trackers on the local private network" dir=in action=allow program="%~dp0jre\bin\java.exe" enable=yes profile=private remoteip=localsubnet edge=no

echo Done!
pause
