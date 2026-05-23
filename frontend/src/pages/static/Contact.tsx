import { Link } from "react-router-dom";
import { BRAND_NAME } from "@/utils/constants";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="p-8 rounded-lg border border-yellow-700 bg-black/60">
          <h1 className="text-3xl font-bold text-yellow-400">Contact Us</h1>
          <p className="mt-2 text-gray-300">
            We'd love to hear from you — reach out with any questions or
            partnership requests.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-yellow-300">
                Get in touch
              </h3>
              <p className="mt-2 text-gray-300">
                Email us for support or general enquiries.
              </p>
              <a
                href={`mailto:hello@${BRAND_NAME.toLowerCase().replace(/\s/g, "")}.com`}
                className="inline-block mt-4 bg-yellow-400 text-black font-semibold px-4 py-2 rounded-md"
              >
                Email: hello@{BRAND_NAME.toLowerCase().replace(/\s/g, "")}.com
              </a>

              <div className="mt-6">
                <h4 className="text-sm text-yellow-300 font-semibold">
                  Office
                </h4>
                <p className="text-gray-300 mt-2">
                  {BRAND_NAME} Academy, 123 Sport Avenue, City, Country
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-yellow-300">
                Follow us
              </h3>
              <p className="mt-2 text-gray-300">
                Stay connected on our social channels.
              </p>

              <ul className="mt-4 space-y-2">
                <li>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-300 hover:underline"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-300 hover:underline"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-300 hover:underline"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-yellow-300 hover:underline"
                  >
                    LinkedIn
                  </a>
                </li>
              </ul>

              <div className="mt-6">
                <Link to="/" className="text-sm text-gray-300 hover:underline">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
