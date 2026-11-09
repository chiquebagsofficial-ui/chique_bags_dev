import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-blush px-6 text-center">
      <div>
        <p className="eyebrow">Error 404</p>
        <h1 className="h-display mt-3 text-5xl">This page took a wrong turn</h1>
        <p className="mt-4 text-muted">The page you're looking for doesn't exist or has moved.</p>
        <Link href="/" className="btn btn-dark mt-8">Back to home</Link>
      </div>
    </div>
  );
}
