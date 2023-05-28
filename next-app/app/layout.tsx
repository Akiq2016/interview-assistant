import "./globals.css";
import { Inter } from "next/font/google";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Interview Assistant",
  description: "An advanced AI system that conducts personalized interviews, provides targeted feedback, and optimizes performance over time based on user experience.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="mx-auto flex flex-col space-y-4">
          <div>
            <main className="py-8 flex w-full flex-1 flex-col overflow-hidden">
              <div className="mx-auto flex flex-col gap-4">
                <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
                  Interview Assistant
                </h1>
                <div className="flex flex-col gap-4">{children}</div>
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
