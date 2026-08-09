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
