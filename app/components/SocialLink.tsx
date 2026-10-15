import { SocialLinkType } from "./types/types"
import { Globe, Mail } from "lucide-react"
import {
  FacebookIcon,
  GithubIcon,
  InstagramIcon,
  LinkedinIcon,
  TikTokIcon,
  TwitterIcon,
  YoutubeIcon,
} from "./BrandIcons"

export const iconMap: Record<string, React.ComponentType<any>> = {
  linkedin: LinkedinIcon,
  github: GithubIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  youtube: YoutubeIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  mail: Mail,
  globe: Globe,
}

const SocialLink = ({item}:{item: SocialLinkType}) => {
  const Icon = iconMap[item.icon] || Globe;
  return (
    <a href={item.link} target="_blank" aria-label={item.name} className="block w-full h-full flex items-center justify-center text-foreground" rel="noreferrer">
      <Icon size={24} />
    </a>
  )
}

export default SocialLink;