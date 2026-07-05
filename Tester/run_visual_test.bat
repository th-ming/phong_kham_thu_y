@echo off
cd /d "d:\QLy Phòng Khám Thú Y\Tester"
npx playwright test test_schedule_gate_visual.spec.ts --headed --timeout=180000 > test_output.log 2>&1
echo Done > test_status.txt
