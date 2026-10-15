import { siFacebook, siGithub, siInstagram, siX, siYoutube } from "simple-icons";

type BrandIconProps = { size?: number; className?: string };

const makeBrandIcon = (path: string) => {
    return function BrandIcon({ size = 24, className }: BrandIconProps) {
        return (
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="currentColor"
                className={className}
                aria-hidden="true"
            >
                <path d={path} />
            </svg>
        );
    };
};

// LinkedIn / X are no longer shipped by lucide-react or simple-icons,
// so their (widely-used, stable) paths live here.
const LINKEDIN_PATH =
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z";
const X_PATH =
    "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z";
const TIKTOK_PATH =
    "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.77a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.2z";

export const GithubIcon = makeBrandIcon(siGithub.path);
export const LinkedinIcon = makeBrandIcon(LINKEDIN_PATH);
export const InstagramIcon = makeBrandIcon(siInstagram.path);
export const TwitterIcon = makeBrandIcon(X_PATH);
export const YoutubeIcon = makeBrandIcon(siYoutube.path);
export const FacebookIcon = makeBrandIcon(siFacebook.path);
export const TikTokIcon = makeBrandIcon(TIKTOK_PATH);
