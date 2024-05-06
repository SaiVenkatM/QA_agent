import { type AppType } from "next/app";
import { Inter, Lato } from "next/font/google";

import { api } from "@/lib/api";
import "~/styles/globals.css";

import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <main className={inter.className}>
    <ClerkProvider  {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
    </main>
  );
}


export default api.withTRPC(MyApp);
