# Windows Code Signing Configuration

This project is configured to sign Windows executables using signtool.exe during the Electron build process.

## Prerequisites

1. **Windows SDK**: signtool.exe comes with the Windows SDK. Install it from:
   - Visual Studio (includes Windows SDK)
   - Standalone Windows SDK: https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/

2. **Code Signing Certificate**: You need a valid code signing certificate in one of these formats:
   - `.pfx` file (most common)
   - `.p12` file
   - Certificate installed in Windows Certificate Store

3. **signtool.exe in PATH**: Ensure signtool.exe is accessible from your PATH. Common locations:
   ```
   C:\Program Files (x86)\Windows Kits\10\bin\10.0.xxxxx.0\x64\signtool.exe
   ```

## Configuration

### Environment Variables

Set these environment variables before building:

```bash
# Required: Path to your certificate file
WINDOWS_CERTIFICATE_FILE=C:\path\to\your\certificate.pfx

# Optional: Certificate password (if your certificate is password-protected)
WINDOWS_CERTIFICATE_PASSWORD=your_password_here

# Optional: Timestamp server URL (defaults to DigiCert)
WINDOWS_TIMESTAMP_URL=http://timestamp.digicert.com
```

### Windows PowerShell Example

```powershell
$env:WINDOWS_CERTIFICATE_FILE="C:\certs\mycert.pfx"
$env:WINDOWS_CERTIFICATE_PASSWORD="mypassword"
npm run electron:build:win
```

### Windows Command Prompt Example

```cmd
set WINDOWS_CERTIFICATE_FILE=C:\certs\mycert.pfx
set WINDOWS_CERTIFICATE_PASSWORD=mypassword
npm run electron:build:win
```

### For CI/CD (GitHub Actions, etc.)

Store certificate details as secrets and use them in your workflow:

```yaml
- name: Build and Sign Windows App
  env:
    WINDOWS_CERTIFICATE_FILE: ${{ secrets.WINDOWS_CERT_FILE }}
    WINDOWS_CERTIFICATE_PASSWORD: ${{ secrets.WINDOWS_CERT_PASSWORD }}
  run: npm run electron:build:win
```

## How It Works

1. The `sign.js` script is called by electron-builder for each file that needs signing
2. It uses signtool.exe with the following parameters:
   - `/f`: Certificate file path
   - `/p`: Certificate password (if provided)
   - `/fd sha256`: Use SHA-256 for file digest
   - `/tr`: Timestamp server URL
   - `/td sha256`: Use SHA-256 for timestamp
   - `/v`: Verbose output

3. Files signed include:
   - The main executable (.exe)
   - DLL files (when `signDlls: true`)
   - The installer (NSIS setup file)

## Troubleshooting

### "signtool not found"
- Add Windows SDK bin directory to your PATH
- Or use the full path in the sign.js script

### "No certificate file specified"
- Set the `WINDOWS_CERTIFICATE_FILE` environment variable
- The build will continue without signing (with a warning)

### Certificate password issues
- If your certificate doesn't have a password, don't set `WINDOWS_CERTIFICATE_PASSWORD`
- If it does, make sure the password is correct

### Timestamp server issues
- Try alternative timestamp servers:
  - `http://timestamp.digicert.com`
  - `http://timestamp.sectigo.com`
  - `http://timestamp.comodoca.com`

## Verify Signing

After building, verify the signature:

```powershell
signtool verify /pa "dist\Starchild Music Setup 0.3.0.exe"
```

Or right-click the .exe file → Properties → Digital Signatures tab
