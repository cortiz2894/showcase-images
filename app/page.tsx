import BackgroundAnimated from "@/components/BackgroundAnimated/index";
import { Header } from "@/components/Header/index";
import dynamic from "next/dynamic";

const Scene = dynamic(() => import("@/components/Scene"), {
  ssr: false,
});

const MOCK_IMAGES = [
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
  "/images/placeholder.png",
];

export default function Home() {
  return (
    <main>
      {/* <BackgroundAnimated /> */}
      <Header />
      <div className="min-h-screen h-[300vh] bg-black text-white">
        <Scene avatars={MOCK_IMAGES} />
      </div>
    </main>
  );
}
