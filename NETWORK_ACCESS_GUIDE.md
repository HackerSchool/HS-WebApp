# 📱 Network Access Guide

Guide to access the Hacker League web app from other devices on your network (like your phone).

## 🚀 Quick Start

### Step 1: Find Your PC's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually "Wireless LAN adapter Wi-Fi")

Example output:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 10.160.158.173
```

**Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```

### Step 2: Update API Configuration

Edit `src/config/api.config.js`:

```javascript
// Change this line:
const HOST = 'localhost';

// To your PC's IP:
const HOST = '10.160.158.173';
```

### Step 3: Configure React Dev Server

Create a `.env` file in the `HS-WebApp` folder:

```bash
HOST=0.0.0.0
```

Or copy from example:
```bash
cp .env.example .env
# Then uncomment the HOST line
```

### Step 4: Configure Windows Firewall

**Option A: Add firewall rules (recommended)**
```bash
# Allow React dev server (port 3000)
netsh advfirewall firewall add rule name="React Dev Server" dir=in action=allow protocol=TCP localport=3000

# Allow Flask API (port 8080)
netsh advfirewall firewall add rule name="Flask API" dir=in action=allow protocol=TCP localport=8080

# Allow Node backend (port 5000)
netsh advfirewall firewall add rule name="Node Backend" dir=in action=allow protocol=TCP localport=5000
```

**Option B: Temporarily disable firewall (not recommended)**
```bash
netsh advfirewall set allprofiles state off
```

### Step 5: Start All Servers

```bash
# Start Flask API (HS-API)
cd path/to/HS-API
flask run --host=0.0.0.0 --port 8080

# Start Node backend
cd HS-WebApp/backend
npm start

# Start React frontend
cd HS-WebApp
npm start
```

### Step 6: Access from Your Phone

Make sure your phone is on the **same Wi-Fi network**, then open:

```
http://10.160.158.173:3000
```

Replace `10.160.158.173` with your actual IP address.

## 🔍 Troubleshooting

### Can't access from phone?

1. **Check both devices are on same network:**
   - PC: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Phone: Settings → Wi-Fi → Check connected network

2. **Test connectivity:**
   ```bash
   # From your phone's browser:
   http://YOUR_PC_IP:8080/health
   ```

3. **Verify firewall rules:**
   ```bash
   netsh advfirewall firewall show rule name=all | findstr "3000 8080 5000"
   ```

4. **Check if ports are listening:**
   ```bash
   netstat -an | findstr "3000 8080 5000"
   ```

### React app loads but API calls fail?

- Make sure you updated `src/config/api.config.js` with your IP
- Verify Flask API is running with `--host=0.0.0.0`
- Check firewall allows port 8080

### WebSocket not connecting?

- Node backend must be running
- Firewall must allow port 5000
- Check browser console for WebSocket errors

## 🌐 Alternative: Using Environment Variables

Instead of editing `api.config.js`, you can use environment variables:

Create `.env` file:
```bash
REACT_APP_API_URL=http://10.160.158.173:8080
REACT_APP_BACKEND_URL=http://10.160.158.173:5000/api
REACT_APP_WS_URL=ws://10.160.158.173:5000
HOST=0.0.0.0
```

This overrides the defaults without changing code!

## 📝 Notes

- Remember to change back to `localhost` for normal development
- Firewall rules persist after reboot
- Environment variables only work if set before `npm start`
- `.env` files are gitignored (won't be committed)

## 🔒 Security

- Only allow network access on trusted networks
- Don't expose these ports on public networks
- Re-enable firewall after testing
- Use HTTPS/WSS in production


