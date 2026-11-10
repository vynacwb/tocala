type RankingPointsInput = {
  profileRating?: number;
  profileReviewCount?: number;
  reviewRatings?: number[];
  demoReviewRatings?: number[];
};

/** Total star points, using stored review rows when available and profile aggregates as a fallback. */
export function getRankingPoints({
  profileRating = 0,
  profileReviewCount = 0,
  reviewRatings = [],
  demoReviewRatings = [],
}: RankingPointsInput) {
  const validReviewRatings = reviewRatings.filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
  const validDemoRatings = demoReviewRatings.filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
  const realPoints = validReviewRatings.length > 0
    ? validReviewRatings.reduce((sum, rating) => sum + rating, 0)
    : Math.round(Math.max(0, profileRating) * Math.max(0, profileReviewCount));

  return realPoints + validDemoRatings.reduce((sum, rating) => sum + rating, 0);
}
