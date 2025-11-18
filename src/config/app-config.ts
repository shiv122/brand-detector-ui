import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "SIQ Live",
  version: packageJson.version,
  copyright: `© ${currentYear}, GSIQ.`,
  meta: {
    title: "SIQ Live Studio - Brand Recognition Platform",
    description: "SIQ Live Studio is a brand recognition platform that uses AI to detect brands in images and videos.",
  },
  showConfidence: process.env.NEXT_PUBLIC_SHOW_CONFIDENCE === "true",
};
