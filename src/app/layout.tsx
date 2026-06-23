import type { Metadata } from "next";
import "./globals.css";
import { ReservationProvider } from "@/context/ReservationContext";

export const metadata: Metadata = {
  title: "Clínica - Gestão de Salas",
  description: "Sistema de agendamento de salas de atendimento para profissionais.",
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
          {children}
        </ReservationProvider>
      </body>
    </html>
  );
}
