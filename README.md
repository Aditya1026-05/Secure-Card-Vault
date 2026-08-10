# Secure Card Vault (CardVault)

Secure Card Vault is a premium, high-security React Native & Expo mobile application designed to securely store and scan your credit/debit cards, membership cards, library cards, and student IDs locally on your device.

---

## Key Features

*   **Dynamic Card Layouts:** 
    *   **Bank Cards:** Look and feel like real physical credit/debit cards, displaying a signature strip, CVV number, and expiry date. Barcodes are hidden by default for maximum realism.
    *   **ID Cards (Student & Library):** Front face dynamically shows both the holder's Name and Roll No / ID. The back face features a large, scanner-optimized off-white ticket containing a full-size barcode.
*   **Compliant Code 39 Symbology:** The app encodes roll numbers and ID values using mathematically correct **Code 39 barcode standards** (including start/stop delimiters `*`). You can scan the barcode on the back view with any physical turnstile or scan app, and it will decode instantly to your actual ID number.
*   **Biometric Decryption (Face ID / Passcode):** Vault details can be locked behind your device's biometric sensors. Click the eye icon on bank cards to authenticate and reveal secure details.
*   **On-Device Storage:** All vault details are saved strictly in your device's local memory using React Native's asynchronous storage. No data is ever uploaded to external servers.
*   **Dynamic Island & Live Activities:** Show active membership/loyalty cards in your Dynamic Island (expandable by long-pressing to view centered card details and a large scanner barcode) and as a sleek, functional ticket on the Lock Screen for quick scans.

---

## Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [pnpm](https://pnpm.io/) (installed globally via `npm i -g pnpm`)
*   For iOS builds: macOS with Xcode and CocoaPods installed.

### Installation
1.  Navigate into the `cardvault` directory:
    ```bash
    cd artifacts/cardvault
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Running Locally
To launch the Expo development bundler:
```bash
pnpm run dev
# or
npx expo start
```
Use the **Expo Go** client app on your physical iPhone or Android device to scan the QR code displayed in the terminal to launch the app instantly.

---

## Biometric Decryption & Face ID Setup

To protect sensitive credit/debit card numbers and CVV codes, CardVault includes hardware biometrics integration. Here is how to configure and test it properly:

### 1. Activating it in the App
1.  Launch the app and click the **Gear Icon** in the top right corner of the screen to open the **System Settings** menu.
2.  Find the **Biometric Decryption** toggle (fingerprint icon).
3.  Switch it **ON** (the toggle will turn green).
4.  Close settings. Bank card details on the back view will now be masked (`••••` and `•••`) and require authentication.

---

### 2. Testing Face ID in the iOS Simulator (Mac)
When running on the simulator, Apple's security framework defaults to the passcode prompt unless Face ID is manually simulated and enrolled:

1.  Make sure the **iOS Simulator window** is active.
2.  Look at the very top of your Mac screen (the system menu bar).
3.  Go to: **Features** ➔ **Face ID** ➔ click **Enrolled** (a checkmark will appear).
4.  In the CardVault app, flip a bank card to the back face and tap the **eye icon**.
5.  When the Face ID circle overlay appears on the phone screen:
    *   Go back to the top Mac menu bar: **Features** ➔ **Face ID** ➔ select **Matching Face** (to simulate a successful scan) or **Non-matching Face** (to simulate a fail).

---

### 3. Testing on a Physical iPhone (Expo Go Passcode Fallback)
If you are previewing the app using **Expo Go** on your physical iPhone:
*   **Why it asks for your lock screen Passcode:** Expo Go is a pre-compiled generic shell app downloaded from the App Store. Apple's sandboxing rules do not permit generic third-party containers to access your raw Face ID hardware sensor directly.
*   **The Fallback:** iOS automatically falls back to prompting for your **iPhone lock screen passcode**. Entering your passcode will successfully authorize and decrypt details.
*   **To enable real Face ID on your device:** You must compile a custom **Development Build** which binds your unique permissions directly into the compiled app binary.

To build and run a native standalone build on your device:
```bash
npx expo run:ios
# or for Android
npx expo run:android
```

---

## Configuration & Permissions

The biometric permissions are configured in `app.json` under `ios.infoPlist` and the `plugins` array to ensure CocoaPods compiles the correct entitlements:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSFaceIDUsageDescription": "Allow CardVault to use Face ID to securely reveal your credit and debit card information."
      }
    },
    "plugins": [
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow CardVault to use Face ID to securely reveal your credit and debit card information."
        }
      ]
    ]
  }
}
```

---

## Dynamic Island & Live Activities (iOS)

CardVault features a native iOS Swift target extension integration that enables Live Activities and Dynamic Island support.

### How it Works
1.  **Compact View (Home Screen):** Set to `EmptyView()` so the Dynamic Island remains in its **normal, default black pill state** when not expanded (no text/icon leak) to avoid stretching.
2.  **Expanded View (Long Press):** Displays the **Card Title centered** at the top, a **large scan-ready barcode** (height `68` or custom) centered below, and the holder's ID number.
3.  **Lock Screen View:** Displays a **sleek scanner ticket** (card color, card name, and barcode) on the Lock Screen and Notification Center for easy scanning.
4.  **Auto-foreground Synchronization:** Includes an `AppState` listener in the `useLiveActivitySync` hook. If you close the app from recent tasks (force-quit) and open it again, the app automatically restarts the Live Activity for the active card as soon as the app transitions to the active foreground state.

### Security Constraints
*   **Payment Card Block:** Credit and debit cards **cannot** be activated or displayed in the Dynamic Island / Lock Screen. If a user drops a payment card into the active zone, the app displays a warning popup: *"For your security, payment cards (Credit/Debit) cannot be set as active or shown in the Dynamic Island."*
*   **Biometric Settings Guard:** Activating or deactivating the *Biometric Decryption* settings switch requires device biometric authentication (Face ID or Passcode confirmation) to prevent unauthorized setting changes.

### Running & Compiling via Xcode
Because this uses a native Swift target widget extension, you must compile it via Xcode:

1.  Open the workspace:
    ```bash
    open ios/CardVault.xcworkspace
    ```
2.  Select the top-level **`CardVault`** blue project file in the left sidebar.
3.  Go to the **`Signing & Capabilities`** tab at the top.
4.  Under Targets, select the **`CardVault`** target and select your **`Team`** in the dropdown.
5.  Under Targets, select the **`widget`** target and select the **same `Team`** in the dropdown.
6.  Connect your physical iPhone or choose a simulator, and press **`Cmd + R`** (or click the Play button) to build and run.

### Controlling the Live Activity
*   **Activate:** Drag and drop any membership, gym, library, or student ID card to the **Active zone** at the top of the home screen stack.
*   **Deactivate:** Tap the red **`DEACTIVATE`** button inside the active drop target zone in the app to immediately terminate the Live Activity session, restoring the Dynamic Island and Lock Screen to their default unoccupied states.
