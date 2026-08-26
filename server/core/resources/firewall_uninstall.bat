@echo off
net session >nul 2>&1
if %errorlevel% == 0 (
    echo Running with administrative privileges.
) else (
    echo Requesting administrative privileges to remove RaptorVR firewall rules.
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\raptorvr-getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "%~dp0", "runas", 1 >> "%temp%\raptorvr-getadmin.vbs"
    "%temp%\raptorvr-getadmin.vbs"
    exit /B
)

echo Removing RaptorVR firewall rules...
netsh advfirewall firewall delete rule name="RaptorVR OpenJDK Platform Binary (Private)"

rem Remove rules left by earlier RaptorVR builds that still used SlimeVR names.
for %%R in (
    "SlimeVR UDP 35903 incoming"
    "SlimeVR UDP 35903 outgoing"
    "SlimeVR UDP 6969 incoming"
    "SlimeVR UDP 6969 outgoing"
    "SlimeVR TCP 21110 incoming"
    "SlimeVR TCP 21110 outgoing"
    "SlimeVR OpenJDK Platform incoming"
    "SlimeVR OpenJDK Platform outgoing"
    "SlimeVR UDP 8266 incoming"
    "SlimeVR UDP 8266 outgoing"
) do netsh advfirewall firewall delete rule name=%%R >nul 2>&1

echo Done!
pause
