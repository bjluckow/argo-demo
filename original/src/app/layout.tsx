import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@blueprintjs/icons/lib/css/blueprint-icons.css";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "ARGO",
    description: "Media webcrawling suite",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="bg-orange-400 bg-[radial-gradient(169.40%_89.55%_at_94.76%_6.29%,rgba(0,0,0,0.40)_30%,rgba(255,255,255,0.00)_75%)] px-2 py-2 text-4xl caret-transparent">
                    <h1 className="ml-2 w-fit rounded-md border-2 border-white bg-transparent p-2 font-bold text-white shadow-2xl">
                        ARGO
                    </h1>
                </div>
                <div className="bp5-dark text-white">
                    <NavBar />
                </div>
                <div className="bp5-dark text-white"> {children}</div>
            </body>
        </html>
    );
}
