"use client";
import { Link } from "@/lib/router-shim";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-start justify-center">
      <div className="max-w-4xl w-full mt-12">
        <div className="p-8 rounded-lg border border-yellow-700 bg-black/60">
          <h1 className="text-3xl font-bold text-yellow-400">Privacy Policy</h1>
          <p className="mt-4 text-gray-300">Last updated: Dec 2025</p>

          <section className="mt-6">
            <h2 className="text-xl font-semibold text-yellow-300">
              Introduction
            </h2>
            <p className="text-gray-300 mt-2">
              We respect your privacy and are committed to protecting your
              personal data. This policy explains how we collect, use and store
              information.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-semibold text-yellow-300">
              Data We Collect
            </h2>
            <p className="text-gray-300 mt-2">
              Information you provide (name, email, phone), usage data, and
              analytics to improve our services.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-semibold text-yellow-300">
              How We Use Data
            </h2>
            <p className="text-gray-300 mt-2">
              To provide and maintain our services, communicate updates, and
              improve user experience.
            </p>
          </section>

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
