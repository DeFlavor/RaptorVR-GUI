!define RAPTORVR_FIREWALL_RULE "RaptorVR OpenJDK Platform Binary (Private)"

!macro InstallRaptorVRFirewallRule
  DetailPrint "Allowing the RaptorVR Java server on private networks"
  nsExec::ExecToLog '"$SYSDIR\netsh.exe" advfirewall firewall delete rule name="${RAPTORVR_FIREWALL_RULE}"'
  Pop $0
  nsExec::ExecToLog '"$SYSDIR\netsh.exe" advfirewall firewall add rule name="${RAPTORVR_FIREWALL_RULE}" description="Allows RaptorVR trackers on the local private network" dir=in action=allow program="$INSTDIR\jre\bin\java.exe" enable=yes profile=private remoteip=localsubnet edge=no'
  Pop $0
  ${If} $0 != 0
    DetailPrint "Warning: Windows Firewall rule returned exit code $0"
  ${EndIf}
!macroend

!macro customInstall
  !insertmacro InstallRaptorVRFirewallRule
!macroend

!macro customUnInstall
  ${IfNot} ${isUpdated}
    DetailPrint "Removing the RaptorVR private-network firewall permission"
    nsExec::ExecToLog '"$SYSDIR\netsh.exe" advfirewall firewall delete rule name="${RAPTORVR_FIREWALL_RULE}"'
    Pop $0
  ${EndIf}
!macroend
