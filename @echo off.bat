@echo off
cd /d "%~dp0"

"C:\Users\User\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".\node_modules\next\dist\bin\next" dev -H 0.0.0.0 -p 3030

pause
