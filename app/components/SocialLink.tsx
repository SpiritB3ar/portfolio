import { SocialLinkType } from "./types/types"
import { Linkedin, Globe, Mail, Github, Instagram, Twitter, Youtube } from "lucide-react"

const TikTokIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.77a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.2z"/>
  </svg>
)

export const iconMap: Record<string, React.ComponentType<any>> = {
  linkedin: Linkedin,
  github: Github,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
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