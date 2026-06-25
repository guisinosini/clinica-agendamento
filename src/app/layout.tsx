import type { Metadata } from "next";
import "./globals.css";
import { ReservationProvider } from "@/context/ReservationContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Clínica de Psicologia — Gestão de Salas",
  description: "Sistema de agendamento de salas de atendimento para profissionais de saúde.",
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
