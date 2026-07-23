"use client";
import { Link } from "@/lib/router-shim";
import { BRAND_NAME } from "@/utils/constants";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="p-8 rounded-lg border border-yellow-700 bg-black/60">
          <h1 className="text-3xl font-bold text-yellow-400">
            About {BRAND_NAME}
          </h1>
          <p className="mt-4 text-gray-300">
            {BRAND_NAME} is dedicated to helping athletes reach their full
            potential through professional coaching, structured programs, and a
            supportive community. We combine data-driven training with
            experienced coaches to provide a best-in-class learning environment.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-yellow-300">
                Our Mission
              </h3>
              <p className="text-gray-300 mt-2">
                To empower athletes with world-class coaching and measurable
                progress.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-300">
                Our Values
              </h3>
              <ul className="text-gray-300 mt-2 list-disc list-inside space-y-1">
                <li>Excellence</li>
                <li>Integrity</li>
                <li>Community</li>
                <li>Growth</li>
              </ul>
            </div>
          </div>

          <div className="mt-8">
            <Link
              to="/"
              className="inline-block bg-yellow-400 text-black font-semibold px-5 py-2 rounded-md"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
