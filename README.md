# Daily Code Challenge

This is a [Next.js](https://nextjs.org) project designed to help developers improve their coding skills through daily challenges. It was bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## New Code Execution Server

We have introduced a new project called **Code Execution Server**. This server allows users to run their code submissions in a secure environment, providing instant feedback on their solutions.

### Tech Stack

-   **Node.js**: For server-side execution.
-   **Docker**: To create isolated environments for different programming languages.
-   **Express**: To handle API requests.
-   **MongoDB**: For storing user submissions and profiles.

## Getting Started

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application in action.

You can start editing the main page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Features

-   Daily coding challenges to enhance your programming skills.
-   User profiles to track progress and submissions.
-   Community feedback on coding solutions.
-   Support for multiple programming languages.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
