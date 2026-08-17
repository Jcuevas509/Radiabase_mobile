# Radiabase Mobile App

Welcome to the Radiabase Mobile App!

## Table of Contents

1. [Environment](#environment)
2. [Installation](#installation)
3. [Running the App](#running-the-app)
4. [Project Structure](#project-structure)
5. [Key Dependencies](#key-dependencies)
6. [Scripts](#scripts)

Field testers: start at [docs/starter-guide.md](docs/starter-guide.md). API map: [docs/backend-routes.md](docs/backend-routes.md). Product plan: [docs/plans/field-map-roofs.md](docs/plans/field-map-roofs.md).

## Environment

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) v14.0.0 or higher
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Jcuevas509/Radiabase_mobile
   cd Radiabase_mobile
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
   or
   ```bash
   npm install
   ```

## Running the App

To start the development server:
   ```bash
   yarn start
   ```
   or
   ```bash
   npm start
   ```

This will start the Metro Bundler and display a QR code in your terminal. From here, you can:
- Scan the QR code with the Expo Go app on your iOS or Android device to run the app
- Press 'a' to open the app in an Android emulator
- Press 'i' to open the app in an iOS simulator
- Press 'w' to open the app in a web browser

## Project Structure

```
android/         # Android-specific build configurations
app/             # Main application source code
assets/          # Static assets like images and fonts
components/      # Reusable React components
constants/       # Shared constants and data
hooks/           # Custom React hooks
ios/             # iOS-specific build configurations
types/           # TypeScript type definitions
utils/           # Utility functions and helpers
```

## Key Dependencies

- `@react-navigation/drawer` & `@react-navigation/native` - Navigation solution
- `react-native-maps` - Map component for React Native

For a full list of dependencies, please refer to the `package.json` file.

## Scripts

- `yarn start` or `npm start` - Start the Expo development server
- `yarn android` or `npm run android` - Run on Android emulator
- `yarn ios` or `npm run ios` - Run on iOS simulator
- `yarn web` or `npm run web` - Run in web browser
- `yarn test` or `npm test` - Run tests

## Creating a Development Build

To create a development build, follow these steps:

```bash
cd ./Radiabase_mobile
# Ensure you are using Node.js v22.13.1
eas update --branch production
# When prompted, enter an update message.
```

Latest builds are available at:
🔗 Expo Builds https://expo.dev/accounts/visiot-dev/projects/Suntapped-Mobile

### Development Build for iOS Simulator

To run a development build on iOS simulator:

```bash
# Install the Expo Development Client if you haven't already
npx expo install expo-dev-client

# Make sure you have the iOS simulator running (can be launched from Xcode)

# Start the development client
npx expo start --dev-client

# When the Metro Bundler starts, press 'i' to open the app in the iOS simulator
```

Note: You need to have Xcode installed on your Mac to run the iOS simulator.

This README provides a comprehensive guide for setting up, running, and contributing to the Radiabase Mobile App project. If you have any questions or need further clarification, please don't hesitate to reach out to the project maintainers.
