import { DM_Sans, Sawarabi_Mincho } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const sawarabiMincho = Sawarabi_Mincho({
  variable: "--font-sawarabi-mincho",
  weight: "400",
  subsets: ["latin"],
});

export const metadata = {
  title: "PLANET — The Co-Operating System",
  description:
    "Personal trust vault and network client, built by a cooperative, owned by its members.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${sawarabiMincho.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
