# Building Student Fee Collector App Locally

This guide explains how to build the app on your local machine using Expo CLI and a code editor.

## Prerequisites

Before you start, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **npm or yarn** (comes with Node.js)
   - Verify: `npm --version`

3. **Git** (optional, for cloning the project)
   - Download from: https://git-scm.com/

4. **Code Editor** (any of these)
   - Visual Studio Code (recommended): https://code.visualstudio.com/
   - WebStorm
   - Sublime Text
   - Any text editor

5. **Expo CLI** (will be installed in Step 2)

---

## Step 1: Set Up Your Project Locally

### Option A: Clone from Git (if you have a repository)
```bash
git clone <your-repository-url>
cd student-fee-collector-app
```

### Option B: Download Project Files
1. Download all project files from the Manus platform
2. Extract to a folder on your computer
3. Open terminal/command prompt in that folder

---

## Step 2: Install Dependencies

Open terminal in your project folder and run:

```bash
npm install
```

This will install all required packages including:
- React Native
- Expo
- TypeScript
- Testing libraries
- And other dependencies

**Time required:** 5-10 minutes (depends on internet speed)

---

## Step 3: Set Up Environment Variables

Create a `.env` file in your project root with your Supabase credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://gtjjklulfzkwqjvoqclg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0amprbHVsZnprd3Fqdm9xY2xnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTI4MjcsImV4cCI6MjA4OTY4ODgyN30.S3zxW1VQwJNxebjYCV8FSZb97_goMypPyO_p06bIDrc
```

---

## Step 4: Run Development Server

Start the development server:

```bash
npm run dev
```

This will:
- Start Metro bundler
- Start the backend server
- Display a QR code for mobile testing

**Output will show:**
```
Metro Bundler started on http://localhost:8081
API Server started on http://localhost:3000
Scan QR code with Expo Go app to test on your phone
```

---

## Step 5: Test on Mobile Device

### Option A: Using Expo Go (Easiest)

1. **Install Expo Go** on your phone
   - iOS: Download from App Store
   - Android: Download from Google Play Store

2. **Scan QR Code**
   - Open Expo Go app
   - Tap "Scan QR code"
   - Scan the code shown in your terminal
   - App will load on your phone

### Option B: Using Web Browser

Open in your browser:
```
http://localhost:8081
```

---

## Step 6: Build for Production

### For Android APK

```bash
npm run build:android
```

Or use Expo CLI directly:

```bash
npx eas build --platform android
```

**What you need:**
- Expo account (free): https://expo.dev/
- Login: `npx eas login`

**Build time:** 10-20 minutes

**Output:** APK file ready to install on Android devices

### For iOS (Mac only)

```bash
npm run build:ios
```

Or:

```bash
npx eas build --platform ios
```

**Requirements:**
- macOS computer
- Xcode installed
- Apple Developer account (paid)

---

## Step 7: Install APK on Android Device

1. **Download APK** from Expo dashboard after build completes
2. **Transfer to your Android phone** (USB, email, cloud storage, etc.)
3. **On your phone:**
   - Open file manager
   - Find the APK file
   - Tap to install
   - Allow installation from unknown sources if prompted
4. **Launch the app** from your home screen

---

## Common Commands

```bash
# Start development server
npm run dev

# Run tests
npm test

# Check TypeScript errors
npm run check

# Format code
npm run format

# Lint code
npm run lint

# Build for Android
npx eas build --platform android

# Build for iOS
npx eas build --platform ios

# Build for web
npm run build
```

---

## Troubleshooting

### Issue: "npm: command not found"
**Solution:** Node.js not installed. Download from https://nodejs.org/

### Issue: Port 8081 already in use
**Solution:** Kill the process or use different port:
```bash
npm run dev -- --port 8082
```

### Issue: "EXPO_PUBLIC_SUPABASE_URL not set"
**Solution:** Create `.env` file with your Supabase credentials (see Step 3)

### Issue: "Cannot find module 'expo'"
**Solution:** Run `npm install` again

### Issue: Build fails with "crypto.getRandomValues()"
**Solution:** Already fixed in latest version. Update your project files.

### Issue: QR code not scanning
**Solution:**
- Ensure phone is on same WiFi as computer
- Try opening link directly: `http://<your-computer-ip>:8081`
- Restart Expo Go app

---

## Project Structure

```
student-fee-collector-app/
├── app/                    # App screens and routing
├── components/             # Reusable components
├── lib/                    # Services and utilities
├── assets/                 # Images and fonts
├── package.json            # Dependencies
├── app.config.ts           # Expo configuration
├── tailwind.config.js      # Tailwind CSS config
└── .env                    # Environment variables
```

---

## Next Steps

1. **Test on your phone** using Expo Go
2. **Make changes** in your code editor
3. **Save files** - app will hot-reload
4. **When ready**, build APK for production
5. **Install on devices** and test thoroughly

---

## Support & Resources

- **Expo Documentation:** https://docs.expo.dev/
- **React Native Docs:** https://reactnative.dev/
- **Supabase Docs:** https://supabase.com/docs
- **Tailwind CSS:** https://tailwindcss.com/

---

## Building on Different Operating Systems

### Windows
- Use Command Prompt or PowerShell
- Same commands as above
- Can build for Android only (not iOS)

### macOS
- Use Terminal
- Can build for both Android and iOS
- iOS requires Xcode

### Linux
- Use Terminal
- Can build for Android only (not iOS)

---

## Tips for Success

✅ **Do:**
- Keep `.env` file secure (don't commit to git)
- Test on real device before publishing
- Keep dependencies updated: `npm update`
- Use version control (git) for your code

❌ **Don't:**
- Commit `.env` file to git
- Modify `app.config.ts` bundle ID
- Build without testing first
- Share your Supabase API keys

---

## Video Tutorial Alternative

If you prefer video guides:
1. Search "Expo React Native Build Guide" on YouTube
2. Follow official Expo tutorial: https://docs.expo.dev/tutorial/create-your-first-app/

---

**Questions?** Refer to the official Expo documentation or check the project README.md file.
