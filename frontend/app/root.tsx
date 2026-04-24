import "./app.css";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let status: number | undefined;
  let title = "Something went wrong";
  let description =
    "We couldn't complete that request. Try again, or head home and continue from there.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (error.status === 404) {
      title = "Page not found";
      description =
        "This URL doesn't match any page in the app. Check for typos, or go back to your task list.";
    } else {
      title = error.statusText || `Error ${error.status}`;
      description =
        error.data && typeof error.data === "object" && "message" in error.data
          ? String((error.data as { message?: unknown }).message)
          : "The server returned an error for this route.";
    }
  } else if (error instanceof Error) {
    description = import.meta.env.DEV ? error.message : description;
    if (import.meta.env.DEV) stack = error.stack;
  }

  const is404 = status === 404;

  return (
    <div className="app-error-root min-h-dvh flex flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="app-error-header shrink-0 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            Todo
          </span>
          <Link
            to="/"
            className="text-sm font-medium text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400"
          >
            All tasks
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-20">
        <div
          className="w-full max-w-md rounded-xl border bg-white px-8 py-10 text-center dark:bg-slate-900"
          style={{
            borderColor: "var(--app-surface-border)",
            boxShadow: "var(--app-surface-shadow)",
          }}
        >
          {status != null && (
            <p
              className="mb-2 font-mono text-5xl font-bold tabular-nums leading-none text-slate-200 dark:text-slate-800 sm:text-6xl"
              aria-hidden
            >
              {status}
            </p>
          )}
          <h1 className="text-balance text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
            {title}
          </h1>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex min-h-10 min-w-[7.5rem] items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {is404 ? "Back to tasks" : "Go home"}
            </Link>
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => window.history.back()}
            >
              Go back
            </button>
          </div>
        </div>

        {stack && (
          <div className="mt-8 w-full max-w-2xl rounded-xl border border-amber-200/90 bg-amber-50/90 p-4 text-left dark:border-amber-900/50 dark:bg-amber-950/40">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200/90">
              Dev stack trace
            </p>
            <pre className="max-h-64 overflow-auto rounded-lg bg-white/80 p-3 text-xs leading-relaxed text-slate-800 dark:bg-slate-950 dark:text-slate-300">
              <code>{stack}</code>
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
