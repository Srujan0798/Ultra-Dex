import { rootAuthLoader } from '@clerk/remix/ssr.server';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';
import { ClerkApp } from '@clerk/remix';
import './tailwind.css';

export const meta: MetaFunction = () => [
  { title: 'Remix SaaS' },
  { name: 'description', content: 'Production-ready Remix SaaS template' },
];

export const loader = (args: LoaderFunctionArgs) => rootAuthLoader(args);

function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-gray-900 text-white">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default ClerkApp(App);
