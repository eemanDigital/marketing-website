import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Lookbook from "@/components/Lookbook";
import Story from "@/components/Story";
import Essentials from "@/components/Essentials";
import Shop from "@/components/Shop";
import Press from "@/components/Press";
import Reviews from "@/components/Reviews";
import Care from "@/components/Care";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <Lookbook />
      <Story />
      <Essentials />
      <Shop />
      <Press />
      <Reviews />
      <Care />
    </>
  );
}