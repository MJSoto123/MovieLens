from __future__ import annotations

import argparse
from pathlib import Path
import sys


PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.service.services.recommendation_service import RecommendationEngine


DEFAULT_RATINGS_PATH = Path("data/raw/ml-latest-small/ratings.csv")
DEFAULT_MOVIES_PATH = Path("data/raw/ml-latest-small/movies.csv")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Ejecuta el recomendador user-based kNN sobre MovieLens Small."
    )
    parser.add_argument("--user-id", type=int, required=True, help="Usuario objetivo.")
    parser.add_argument(
        "--k",
        type=int,
        default=5,
        help="Cantidad de vecinos más cercanos a usar.",
    )
    parser.add_argument(
        "--metric",
        type=str,
        default="pearson",
        choices=["euclidean", "manhattan", "cosine", "pearson"],
        help="Métrica de distancia/similitud.",
    )
    parser.add_argument(
        "--min-common-items",
        type=int,
        default=3,
        help="Mínimo de ítems co-calificados para considerar vecino.",
    )
    parser.add_argument(
        "--min-predicted-rating",
        type=float,
        default=3.5,
        help="Umbral mínimo de rating predicho para recomendar.",
    )
    parser.add_argument(
        "--top-n",
        type=int,
        default=10,
        help="Cantidad máxima de recomendaciones a mostrar.",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    engine = RecommendationEngine(
        ratings_path=DEFAULT_RATINGS_PATH,
        movies_path=DEFAULT_MOVIES_PATH,
    )

    neighbors = engine.get_neighbors(
        target_user_id=args.user_id,
        k=args.k,
        metric=args.metric,
        min_common_items=args.min_common_items,
    )

    recommendations = engine.get_recommendations(
        target_user_id=args.user_id,
        k=args.k,
        metric=args.metric,
        min_common_items=args.min_common_items,
        min_predicted_rating=args.min_predicted_rating,
        top_n=args.top_n,
    )

    print("=" * 80)
    print(f"Usuario objetivo: {args.user_id}")
    print(f"Métrica: {args.metric}")
    print(f"k vecinos: {args.k}")
    print(f"Mínimo co-calificados: {args.min_common_items}")
    print(f"Umbral de gusto: {args.min_predicted_rating}")
    print("=" * 80)

    print("\nVecinos más cercanos:")
    if not neighbors:
        print("- No se encontraron vecinos válidos.")
    else:
        for index, neighbor in enumerate(neighbors, start=1):
            print(
                f"{index}. userId={neighbor['user_id']} | "
                f"score={neighbor['score']:.4f} | "
                f"co-calificados={neighbor['common_items']}"
            )

    print("\nRecomendaciones:")
    if not recommendations:
        print("- No se encontraron recomendaciones para esos parámetros.")
    else:
        for index, recommendation in enumerate(recommendations, start=1):
            print(
                f"{index}. movieId={recommendation['movie_id']} | "
                f"title={recommendation['title']} | "
                f"predicted_rating={recommendation['predicted_rating']:.4f} | "
                f"vecinos_apoyo={recommendation['supporting_neighbors']}"
            )


if __name__ == "__main__":
    main()
