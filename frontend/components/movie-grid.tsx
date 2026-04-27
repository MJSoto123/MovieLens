import { RecommendationCard } from "@/components/poster-card";
import type { Movie } from "@/lib/mock-data";

export function MovieGrid({
  movies,
  getScore,
  showImage = true,
}: {
  movies: Movie[];
  getScore: (movieId: number) => number;
  showImage?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {movies.map((movie) => (
        <RecommendationCard key={movie.id} movie={movie} score={getScore(movie.id)} showImage={showImage} />
      ))}
    </div>
  );
}
