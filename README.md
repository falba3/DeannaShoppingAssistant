This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

---

### Telegram Webhook Setup for Local Development

1.  **Start your Next.js development server:**
    ```bash
    npm run dev
    ```
    This will typically run on `http://localhost:3000`.

2.  **Expose your local server to the internet using ngrok:**
    If you don't have ngrok installed, you can download it from [ngrok.com](https://ngrok.com/download).
    Run the following command in a new terminal:
    ```bash
    ngrok http 3000
    ```
    ngrok will provide you with a public URL (e.g., `https://xxxx-xxxx-xxxx-xxxx.ngrok-free.app`).

3.  **Set the Telegram Webhook:**
    Use the provided `setWebhook.ts` script to tell Telegram where to send updates. Replace `YOUR_NGROK_URL` with the URL ngrok provided, followed by `/api/telegram-webhook`.
    ```bash
    npx ts-node scripts/setWebhook.ts YOUR_NGROK_URL/api/telegram-webhook
    ```
    Example:
    ```bash
    npx ts-node scripts/setWebhook.ts https://xxxx-xxxx-xxxx-xxxx.ngrok-free.app/api/telegram-webhook
    ```
    You might need to install `ts-node` if you haven't already:
    ```bash
    npm install -g ts-node
    ```

4.  **Test your bot:**
    Open Telegram and interact with your bot. It should now be receiving updates via the webhook.

5.  **Important:**
    *   When your `ngrok` tunnel changes (e.g., after restarting ngrok), you *must* run the `setWebhook.ts` script again with the new ngrok URL.
    *   To remove the webhook (e.g., when deploying to production or switching to polling), run:
        ```bash
        npx ts-node scripts/setWebhook.ts delete
        ```
