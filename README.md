This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Local MongoDB

Start MongoDB and mongo-express with Docker Compose:

```bash
docker compose up -d
```

Set `MONGODB_URI` in `.env` (or `.env.local`) using the MongoDB credentials
from `compose.yml`. When running Next.js on the host, use port `27018` and
`authSource=admin`:

```text
mongodb://<mongo-user>:<mongo-password>@127.0.0.1:27018/<database>?authSource=admin
```

Restart the development server after changing the environment file.
The MongoDB connection is established when the application calls
`connectToDatabase()` from `src/lib/mongodb.ts`.

Open [http://localhost:8081](http://localhost:8081) for mongo-express.
Its local development login is `admin` / `localpassword`. The MongoDB and
mongo-express credentials in the Compose file are for local development only;
both ports are bound to localhost. MongoDB data persists in the `mongo_data`
Docker volume. Stop the services with `docker compose down`; do not add `-v`
unless you intend to delete the stored data.

Local file storage uses the `uploads` directory in the project root. The
directory is created on first use and ignored by Git. Saving a file with an
existing name overwrites it.

`POST /api/upload` requires a signed-in user and a multipart form field named
`file`. It accepts files with PDF, DOCX, MD, Markdown or TXT extensions up to
10 MiB. The extension is checked, not the file's contents. With
`STORAGE_STRATEGY=local`, the file is stored in `uploads`; with
`STORAGE_STRATEGY=database`, its contents are stored in MongoDB. Both strategies
create a document record.

`DocParser` accepts file contents as a `Buffer`. Its PDF and DOCX methods are
asynchronous; TXT and Markdown methods read UTF-8 text synchronously. PDF page
counts come from the document, and DOCX counts come from its stored metadata
and may be outdated. Files without a page count return `pages: 0`. Markdown is
returned as source text; scanned PDFs require OCR.
Call `cleanText` to normalize line breaks and remove control characters and
excess blank lines before chunking; parsing does not clean text automatically.
`RagService.index` splits text asynchronously into chunks of up to 1,000
characters with no overlap. Each chunk includes its document ID, filename
and index, and uses the document ID and index as its stable ID.
`SimpleVectorStore.addDocuments` generates retrieval-document embeddings with
Gemini's `gemini-embedding-001`, falling back to `gemini-embedding-2` on model
availability, quota or server errors. When switching models, it re-embeds all
stored documents to keep vectors compatible, which can incur additional API
usage. `embeddingModel` identifies the model to use for search queries. Document
text is sent to Gemini; embeddings are not persisted between instances or restarts.
`similaritySearch` embeds the query with the stored model and returns up to
`topK` chunks ordered by cosine similarity. If that model is unavailable, the
search fails rather than comparing embeddings from incompatible models.
`RagService.generateQuestionWitRag` uses retrieved chunks to generate open-ended
questions in batches with Gemini. It validates the response and checks that
source excerpts appear in the supplied chunks; this does not independently verify
the correctness of the generated answers or scores. Document text is sent to
Gemini. Multiple-choice options are empty and `distractor_quality_score` is `0`
because distractors do not apply. This method is not yet called by the questions
endpoint.

Question requests use the user's Gemini API key when available, otherwise
`GEMINI_API_KEY` from the server environment. A model-list request checks the
key's access before processing; it does not guarantee access to a specific model.

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
