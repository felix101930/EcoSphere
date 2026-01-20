@echo off
echo ========================================
echo Code Comment Quality Checker
echo ========================================
echo.
echo Analyzing backend code comments...
echo.

cd ecosphere-backend
node scripts/check-comment-quality.js

echo.
echo ========================================
echo Check complete!
echo See CODE_COMMENT_STANDARDS.md for guidelines
echo ========================================
pause
