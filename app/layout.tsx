import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource/big-shoulders-display/700";
import "@fontsource/big-shoulders-display/800";
import "@fontsource/schibsted-grotesk/400.css";
import "@fontsource/schibsted-grotesk/500.css";
import "@fontsource/schibsted-grotesk/700.css";
import "./globals.css";
import { BUSINESS, isLive } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Grind Time Rides | Party buses, limos and luxury transportation in Chicago", template: "%s | Grind Time Rides" },
  description: "Party buses, stretch limousines, luxury SUVs, DJ and valet service across Chicago and Chicagoland. Request a quote online.",
  robots: isLive() ? { index: true, follow: true } : { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#000000", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">Skip to content</a>
        {!isLive() && <div className="preview-bar" role="note">Preview of the new Grind Time site. Not live yet.</div>}
        <header className="site-head">
          <div className="wrap">
            <Link href="/" className="brand" aria-label="Grind Time Rides home">
              {/* Placeholder until Ryan supplies the GTR monogram file */}
              <span className="monogram" aria-hidden="true">GTR</span>
              <strong>Grind Time Rides</strong>
            </Link>
            <nav className="nav" aria-label="Main">
              <Link href="/#fleet">Fleet</Link>
              <Link href="/#services">Services</Link>
              <Link href="/quote">Get a quote</Link>
              <a className="call" href={`tel:${BUSINESS.phoneE164}`}>Call or text {BUSINESS.phoneDisplay}</a>
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-foot">
          <div className="wrap">
            <div>
              <p><strong>{BUSINESS.name}</strong></p>
              <p>{BUSINESS.tagline}</p>
              <p>Serving {BUSINESS.area}</p>
            </div>
            <div>
              <p><a href={`tel:${BUSINESS.phoneE164}`}>{BUSINESS.phoneDisplay}</a> (call or text)</p>
              <p><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
