import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Detector AI",
  version: packageJson.version,
  copyright: `© ${currentYear}, Detector Studio.`,
  meta: {
    title: "Detector Studio - Brand Recognition Platform",
    description: "Detector Studio is a brand recognition platform that uses AI to detect brands in images and videos.",
  },
  showConfidence: process.env.NEXT_PUBLIC_SHOW_CONFIDENCE === "true",
};
