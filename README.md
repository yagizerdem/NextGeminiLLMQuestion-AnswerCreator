This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Local MongoDB

Start MongoDB and mongo-express with Docker Compose:

```bash
docker compose up -d
```

Add the `MONGODB_URI` from `.env.example` to `.env` (or `.env.local`).
The MongoDB connection is established when the application calls
`connectToDatabase()` from `src/lib/mongodb.ts`.

Open [http://localhost:8081](http://localhost:8081) for mongo-express.
Its local development login is `admin` / `localpassword`. The MongoDB and
mongo-express credentials in the Compose file are for local development only;
both ports are bound to localhost. MongoDB data persists in the `mongo_data`
Docker volume. Stop the services with `docker compose down`; do not add `-v`
unless you intend to delete the stored data.

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

## UI components

The project uses Tailwind CSS and shadcn/ui. Available components are in
`src/components/ui` and can be imported using the `@/components/ui` alias.
For example:

```tsx
import { Button } from "@/components/ui/button";
```

Add or update components with the [shadcn CLI](https://ui.shadcn.com/docs/cli).
The theme follows the system preference by default.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
