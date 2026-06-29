# Custom Rules for Vietnamese Document Formatting and Windows Environment

## 1. Vietnamese Output to Standard Output (stdout)
- **Constraint**: Never output raw Vietnamese characters directly to stdout in scripts executed via PowerShell, Command Prompt, or scheduled tasks (`schtasks`).
- **Reason**: The default Windows terminal encoding (typically Windows-1252 or similar) will cause a `UnicodeEncodeError` when trying to print Vietnamese Unicode characters, crashing the script.
- **Solution**: Always log messages containing Vietnamese to a file with UTF-8 encoding (e.g., `open(..., 'w', encoding='utf-8')`).

## 2. File Locking (PermissionError on .docx)
- **Constraint**: Always terminate active word processors (WPS Office, Microsoft Word) before editing or writing to docx files.
- **Solution**: Execute taskkill commands before writing:
  ```powershell
  taskkill /f /im wps.exe
  taskkill /f /im WINWORD.EXE
  ```
  Ensure a sleep period of at least 2 seconds after killing to release locks.

## 3. WPS Office Executable Path
- **WPS Path**: `C:\Users\84916\AppData\Local\Kingsoft\WPS Office\12.1.0.25180\office6\wps.exe`
- When opening or launching WPS Office, prioritize this path.

## 4. Interactive Desktop Actions and Screen Capturing
- **Constraint**: Terminal-initiated processes cannot interact with the user's active GUI session directly or take screenshots of their desktop (headless session issue).
- **Solution**: Always use the Windows Task Scheduler (`schtasks`) with the `/it` (interactive) flag to execute a batch file or command that starts the GUI application and captures the screen.
- **Capture Method**: Use PowerShell `System.Windows.Forms` and `System.Drawing` or Python's `PIL.ImageGrab` within the scheduled task context.
