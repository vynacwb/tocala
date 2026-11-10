import { getRankingPoints } from "@/lib/ranking-points";

export type ArtistRankingInput = {
  id: string;
  name: string;
  rating: number;
  reviews: number;
};

export type ArtistRatingRow = { artistId: string; rating: number };
export type RankedArtist<T extends ArtistRankingInput> = T & {
  rankingPosition: number;
  rankingPoints: number;
  average: number;
  reviewCount: number;
};

export function rankArtists<T extends ArtistRankingInput>(
  artists: T[],
  realRatings: ArtistRatingRow[] = [],
  demoRatings: ArtistRatingRow[] = [],
): RankedArtist<T>[] {
  return artists
    .map((artist) => {
      const artistRatings = realRatings.filter((row) => row.artistId === artist.id);
      const artistDemoRatings = demoRatings.filter((row) => row.artistId === artist.id);
      const reviewCount = artistRatings.length > 0 ? artistRatings.length : Math.max(0, artist.reviews);
      const rankingPoints = getRankingPoints({
        profileRating: artist.rating,
        profileReviewCount: reviewCount,
        reviewRatings: artistRatings.map((row) => row.rating),
        demoReviewRatings: artistDemoRatings.map((row) => row.rating),
      });
      const allReviews = (artistRatings.length > 0 ? artistRatings.length : reviewCount) + artistDemoRatings.length;
      return { artist, rankingPoints, average: allReviews ? rankingPoints / allReviews : 0, reviewCount: allReviews };
    })
    .sort((a, b) => b.rankingPoints - a.rankingPoints || b.average - a.average || b.reviewCount - a.reviewCount || a.artist.name.localeCompare(b.artist.name, "pt-BR"))
    .map(({ artist, rankingPoints, average, reviewCount }, index) => ({
      ...artist,
      rankingPosition: index + 1,
      rankingPoints,
      average,
      reviewCount,
    }));
}
