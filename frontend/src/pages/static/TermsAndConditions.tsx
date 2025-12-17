import { Link } from "react-router-dom";

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-start justify-center">
      <div className="max-w-4xl w-full mt-12">
        <div className="p-8 rounded-lg border border-yellow-700 bg-black/60">
          <h1 className="text-3xl font-bold text-yellow-400">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-gray-300">
            Please read these terms and conditions carefully before using our
            service.
          </p>

          <section className="mt-6">
            <h2 className="text-xl font-semibold text-yellow-300">
              Acceptance
            </h2>
            <p className="text-gray-300 mt-2">
              By accessing or using our service you agree to be bound by these
              terms.
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-xl font-semibold text-yellow-300">
              Use of Service
            </h2>
            <p className="text-gray-300 mt-2">
              Users must follow all applicable laws and not misuse the platform.
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
