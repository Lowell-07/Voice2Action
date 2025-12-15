
# Voice2Action - A Next.js & Firebase Studio Project

This is a Next.js application built within Firebase Studio. It's designed to be a full-stack platform for reporting and tracking civic issues, powered by Firebase for the backend and Genkit for AI features.

## Getting Started Locally

To run this project on your local machine (e.g., in VS Code), follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- A Firebase project with Firestore enabled.
- A Google Cloud project with the Gemini API enabled.

### 1. Install Dependencies

First, open a terminal in the project's root directory and install the required packages:

```bash
npm install
```

### 2. Configure Environment Variables

The application requires API keys and project details for Firebase and Google AI (Genkit) to function.

1.  Create a new file named `.env` in the root of your project folder.
2.  Copy the following content into the `.env` file and replace the placeholder values with your actual credentials from your Firebase and Google Cloud projects.

```env
# Firebase Client SDK Configuration (find these in your Firebase project settings)
NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"

# Google AI (Genkit) API Key (find this in your Google Cloud console)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

**Note:** The `.env` file contains sensitive information and is listed in `.gitignore`, so it will not be committed to your repository.

### 3. Run the Development Servers

This project requires two separate terminal sessions to run both the web application and the AI services.

**Terminal 1: Run the Next.js App**

This command starts the main web application.

```bash
npm run dev
```

By default, the application will be available at `http://localhost:9002`.

**Terminal 2: Run the Genkit AI Server**

This command starts the local server that handles AI-powered tasks like department suggestions. The Next.js app communicates with this server.

```bash
npm run genkit:dev
```

This will start the Genkit development UI, typically on `http://localhost:4000`.

### You're all set!

With both servers running, you can now open `http://localhost:9002` in your browser to use the Voice2Action application. Any AI-related actions on the website will be handled by your local Genkit server.
