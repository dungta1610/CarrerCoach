import type { Metadata } from "next";
import { Roboto, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./context/LanguageContext";
import { UserProfileProvider } from "./context/UserProfileContext";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

const body = Roboto({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-body",
});
const heading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Career Coach - Interview Warmup & Career Guidance",
  description: "AI-powered career guidance and interview preparation platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${body.variable} ${heading.variable} font-sans antialiased bg-white text-slate-900`}
      >
        <LanguageProvider>
          <UserProfileProvider>
            {/* <div className="fixed top-4 right-4 z-50">
              <LanguageSwitcher />
            </div> */}
            {children}
          </UserProfileProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
