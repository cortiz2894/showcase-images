'use client'

import BackgroundAnimated from "@/components/BackgroundAnimated/index";
import Footer from "@/components/Footer";
import { Header } from "@/components/Header/index";
import OverlayHeader from "@/components/OverlayHeader";
import { Leva } from "leva";
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("@/components/Scene"), {
  ssr: false,
});

const MOCK_IMAGES = [
  "/images/1.png",
  "/images/2.png",
  "/images/3.png",
  "/images/4.png",
  "/images/5.png",
  "/images/1.png",
  "/images/2.png",
  "/images/3.png",
  "/images/4.png",
  "/images/5.png",
  "/images/1.png",
  "/images/2.png",
  "/images/3.png",
  "/images/4.png",
  "/images/5.png",
  "/images/1.png",
  "/images/2.png",
  "/images/3.png",
  "/images/4.png",
  "/images/5.png",
];



export default function Home() {
  return (
    <main>
      {/* <BackgroundAnimated /> */}
      {/* <Header /> */}
      <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <OverlayHeader />
    </div>
      <div className="h-screen bg-black text-white">
        <Scene avatars={MOCK_IMAGES} />
      </div>
      <Footer />
    </main>
  );
}
