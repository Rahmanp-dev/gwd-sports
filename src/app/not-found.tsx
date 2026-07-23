import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center">
        <div className="inline-block px-6 py-8 rounded-lg border border-yellow-600 bg-black/60">
          <h1 className="text-6xl font-extrabold text-yellow-400">404</h1>
          <h2 className="mt-4 text-2xl font-semibold">Page Not Found</h2>
          <p className="mt-2 text-gray-300">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold px-8 py-3 rounded-md shadow-md hover:opacity-95 transition"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
