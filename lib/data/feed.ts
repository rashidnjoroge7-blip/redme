export const FEED_CATEGORIES = [
  "All",
  "Food",
  "Fashion",
  "Travel",
  "Home",
  "Nature",
  "Pets",
  "Books",
  "Beauty",
  "Fitness",
] as const;

export type FeedCategory = (typeof FEED_CATEGORIES)[number];
