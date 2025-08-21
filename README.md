This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Setup

This project uses Firebase for backend services. You'll need to configure your environment variables to connect to your Firebase project.

1.  **Create a `.env.local` file** in the root of the project.

2.  **Add your Firebase service account credentials** to the `.env.local` file. You can generate a private key in your Firebase project settings under **Project settings > Service accounts**.

    Your `.env.local` file should contain the following variables:

    ```
    # Firebase Admin SDK credentials
    FIREBASE_PROJECT_ID="your-project-id"
    FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...your-private-key...\\n-----END PRIVATE KEY-----\\n"
    FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
    ```

    **Important**: The `FIREBASE_PRIVATE_KEY` from the generated JSON file needs to be formatted as a single line with `\n` as newline characters. The `initializeFirebaseAdmin` function in the code will handle the formatting, so you can copy the key as is.

Once your `.env.local` file is configured, you can proceed to run the development server.

### Running the Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
