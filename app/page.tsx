import BodyContent from "./components/BodyContent";
import { getHomeData, getSocialLinks, getProjects, getAboutParagraphs } from "@/lib/data";
import { FeaturedProjects } from "./components/FeaturedProjects";
import { TechMarquee } from "./components/home/TechMarquee";
import { AboutTeaser } from "./components/home/AboutTeaser";
import { ContactCTA } from "./components/home/ContactCTA";

export default async function Home() {
  const homeData = await getHomeData();
  const socialLinks = await getSocialLinks();
  const projects = await getProjects();
  const about = await getAboutParagraphs();

  return (
    <>
      {/* Hero (cinematic canvas is provided site-wide by MainLayout) */}
      <BodyContent homeData={homeData} />

      {/* Tech marquee */}
      <TechMarquee projects={projects || []} />

      {/* About teaser */}
      <AboutTeaser homeData={homeData} about={about} />

      {/* Selected work */}
      <FeaturedProjects projects={projects || []} />

      {/* Closing contact band */}
      <ContactCTA homeData={homeData} socialLinks={socialLinks} />
    </>
  );
}
