# Gemini Question & Answer Creator

A Next.js app that turns your documents into question sets. Upload a PDF, DOCX, Markdown or TXT file, pick a difficulty and question count, and Gemini generates questions grounded in the document through a small RAG pipeline. Question sets can be reviewed and exported as JSON, CSV or PDF.

The interface is available in English, Turkish, Dutch and Russian, and questions can be generated in any of these languages.

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router), React 19, TypeScript
- Tailwind CSS 4 and shadcn/ui components
- MongoDB with Mongoose
- Google Gemini (`@google/genai`): `gemini-3.5-flash-lite` for generation, `gemini-embedding-001` / `gemini-embedding-2` for embeddings
- LangChain text splitters for chunking
- `unpdf` and `mammoth` for PDF and DOCX parsing, `pdfmake` for PDF export
- JWT authentication with `jose` (HTTP-only `token` cookie) and `bcrypt` password hashing

## Getting started

### Prerequisites

- Node.js 20 or later
- A MongoDB instance (local via Docker, or MongoDB Atlas)
- A [Gemini API key](https://aistudio.google.com/apikey)

### 1. Install dependencies

```bash
npm install
```

### 2. Start MongoDB (optional, local)

`compose.yml` starts MongoDB 8 on `127.0.0.1:27018` and mongo-express on `http://127.0.0.1:8081` (user `admin`, password `localpassword`):

```bash
docker compose up -d
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and fill it in:

| Variable           | Description                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`      | MongoDB connection string. For the local Docker setup: `mongodb://localadmin:localpassword@127.0.0.1:27018/<db-name>?authSource=admin` |
| `STORAGE_STRATEGY` | Where uploaded files are stored: `local` (the `uploads/` folder) or `database` (in MongoDB). Defaults to `database` on Vercel, otherwise `local`. |
| `JWT_SECRET`       | Secret used to sign authentication tokens.                                                                                            |
| `GEMINI_API_KEY`   | Default Gemini API key. Users can set their own key on the profile page, which takes precedence.                                      |

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account and upload a document.

## Scripts

| Command                          | Description                                                                 |
| -------------------------------- | --------------------------------------------------------------------------- |
| `npm run dev`                    | Start the development server                                                |
| `npm run build`                  | Build for production                                                        |
| `npm run start`                  | Start the production server                                                 |
| `npm run lint`                   | Run ESLint                                                                  |
| `node scripts/clear-db.ts --yes` | Delete every document in the database from `MONGODB_URI` (collections and indexes are kept) |

## How it works

1. **Upload**: `POST /api/upload` accepts one file of up to 1 MiB (`.pdf`, `.docx`, `.md`, `.markdown`, `.txt`) and stores it based on `STORAGE_STRATEGY`.
2. **Generate**: `POST /api/generate` parses and cleans the document, splits it into chunks, embeds the chunks with Gemini, picks the most relevant ones, and asks Gemini for a question set at the requested difficulty (`easy`, `medium`, `hard`, `expert`), count (1–10) and language.
3. **Review & export**: Question sets are saved per user and can be listed, viewed, deleted and exported.

## API

| Method                | Route                 | Description                                        |
| --------------------- | --------------------- | -------------------------------------------------- |
| `POST`                | `/api/auth/signup`    | Create an account                                  |
| `POST`                | `/api/auth/signin`    | Sign in and set the auth cookie                    |
| `POST`                | `/api/auth/signout`   | Clear the auth cookie                              |
| `GET` / `POST`        | `/api/auth/me`        | Get or update the current user (incl. Gemini key)  |
| `POST`                | `/api/upload`         | Upload a document                                  |
| `POST`                | `/api/generate`       | Generate a question set from an uploaded document  |
| `GET` / `DELETE`      | `/api/question`       | List the user's question sets / delete one (`?id=`) |
| `GET`                 | `/api/question/[id]`  | Get a single question set                          |
| `GET`                 | `/api/health`         | Health check                                       |

## Project structure

```
src/
  app/            Pages and API route handlers
  assets/l10n/    English, Turkish, Dutch and Russian translations (see its README)
  components/     App components and shadcn/ui primitives (components/ui)
  hooks/          React hooks
  layouts/        App layout
  lib/            Auth, MongoDB connection, file storage, parsing and RAG
  models/         Mongoose models (User, Document, QuestionSet)
  providers/      Auth, localization and theme providers
scripts/          Maintenance scripts
```

## Localization

Interface strings live in `src/assets/l10n/` (`en.json`, `tr.json`, `nl.json`, `ru.json`). See [src/assets/l10n/README.md](src/assets/l10n/README.md) for how to add new strings.
