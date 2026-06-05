@echo off
title REXI AUTO SYNC - SQL SERVER LOCAL TO SUPABASE
cls

echo ====================================================================
echo      REXI AUTO SYNC - SQL SERVER LOCAL TO SUPABASE
echo ====================================================================
echo.
echo Script nay tu dong copy du lieu tu SQL Server local len Supabase.
echo Neu sua truc tiep tren Supabase, lan sync sau co the bi ghi de boi local.
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File scripts\start_auto_sync_local_sqlserver_to_supabase.ps1 -IntervalSeconds 300

pause
