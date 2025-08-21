import "../styles/globals.css";
import Navbar from "../components/Navbar";
import ToggleDark from "../components/ToggleDark";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 transition-colors">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <Navbar />
            <ToggleDark />
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
