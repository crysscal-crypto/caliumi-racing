import {
  Racing_Sans_One,
  Playfair_Display,
  Old_Standard_TT,
} from "next/font/google";

export const racingFont = Racing_Sans_One({
  subsets: ["latin"],
  weight: "400",
});

export const newsHeadlineFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
});

export const newsBodyFont = Old_Standard_TT({
  subsets: ["latin"],
  weight: ["400", "700"],
});