import BodyContent from "./components/BodyContent";
import {
  getHomeDataV2,
  getSocialLinksV2,
  getProjectsV2,
  getAboutParagraphsV2,
} from "./requests/requests";
import { FeaturedProjects } from "./components/FeaturedProjects";
import { TechMarquee } from "./components/home/TechMarquee";
import { AboutTeaser } from "./components/home/AboutTeaser";
import { ContactCTA } from "./components/home/ContactCTA";

export default async function Home() {
  const homeData = await getHomeDataV2();
  const socialLinks = await getSocialLinksV2();
  const projects = await getProjectsV2();
  const about = await getAboutParagraphsV2();

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
