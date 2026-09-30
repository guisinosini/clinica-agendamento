import type { Metadata } from "next";
import "./globals.css";
import { ReservationProvider } from "@/context/ReservationContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Instituto NeuroVida | Clínica de Neuropsicologia",
  description: "Mais compreensão, mais direção, mais vida!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <ReservationProvider>
          <Navbar />
          <main>
            {children}
          </main>
        </ReservationProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
