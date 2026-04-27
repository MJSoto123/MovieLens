export type Movie = {
  id: number;
  title: string;
  year: number;
  genre: string;
  duration: string;
  rating: number;
  hue: number;
  synopsis: string;
  director: string;
  posterUrl?: string | null;
};

export type Metric = {
  id: "pearson" | "cosine" | "euclidean" | "manhattan";
  name: string;
  short: string;
  description: string;
  eyebrow: string;
  order: number[];
};

export const MOVIES: Movie[] = [
  {
    id: 1,
    title: "La Cordillera del Olvido",
    year: 2024,
    genre: "Drama",
    duration: "2h 14m",
    rating: 4.6,
    hue: 18,
    director: "I. Maeda",
    synopsis: "Un cartógrafo regresa al pueblo donde su padre desapareció hace treinta años.",
  },
  {
    id: 2,
    title: "Neón Pálido",
    year: 2023,
    genre: "Thriller",
    duration: "1h 48m",
    rating: 4.2,
    hue: 280,
    director: "A. Rojas",
    synopsis: "Una traductora simultánea descubre que la conferencia es una fachada.",
  },
  {
    id: 3,
    title: "Hojas de Verano",
    year: 2022,
    genre: "Romance",
    duration: "1h 36m",
    rating: 4.4,
    hue: 95,
    director: "M. Lévi",
    synopsis: "Dos extraños se cruzan en seis veranos consecutivos sin recordarlo.",
  },
  {
    id: 4,
    title: "El Reloj de Arena",
    year: 2024,
    genre: "Sci-Fi",
    duration: "2h 22m",
    rating: 4.7,
    hue: 220,
    director: "K. Yoshida",
    synopsis: "Un físico envejece al revés cada vez que duerme.",
  },
  {
    id: 5,
    title: "Madrugada",
    year: 2021,
    genre: "Drama",
    duration: "1h 52m",
    rating: 4.1,
    hue: 12,
    director: "L. Beltrán",
    synopsis: "Una panadera nocturna cuenta los secretos del barrio en silencio.",
  },
  {
    id: 6,
    title: "Tres Habitaciones",
    year: 2024,
    genre: "Drama",
    duration: "2h 04m",
    rating: 4.5,
    hue: 35,
    director: "S. Ahmadi",
    synopsis: "Tres hermanos heredan una casa con una habitación que nadie recuerda.",
  },
  {
    id: 7,
    title: "Velocidad Terminal",
    year: 2023,
    genre: "Acción",
    duration: "1h 58m",
    rating: 3.9,
    hue: 8,
    director: "R. Caine",
    synopsis: "Un piloto de pruebas debe romper la barrera del sonido sin combustible.",
  },
  {
    id: 8,
    title: "La Geometría del Mar",
    year: 2022,
    genre: "Documental",
    duration: "1h 24m",
    rating: 4.8,
    hue: 195,
    director: "N. Okafor",
    synopsis: "Una matemática mapea las olas como ecuaciones.",
  },
  {
    id: 9,
    title: "Ámbar",
    year: 2024,
    genre: "Drama",
    duration: "1h 41m",
    rating: 4.3,
    hue: 42,
    director: "T. Rivera",
    synopsis: "Una restauradora descubre un mensaje encerrado en una resina del cretácico.",
  },
  {
    id: 10,
    title: "Pulso Inverso",
    year: 2023,
    genre: "Thriller",
    duration: "2h 08m",
    rating: 4.0,
    hue: 320,
    director: "V. Korda",
    synopsis: "Una neuróloga implanta su memoria en una paciente comatosa.",
  },
  {
    id: 11,
    title: "Solsticio",
    year: 2024,
    genre: "Drama",
    duration: "1h 49m",
    rating: 4.4,
    hue: 50,
    director: "E. Tanaka",
    synopsis: "El día más largo del año en una comunidad de pescadores islandeses.",
  },
  {
    id: 12,
    title: "El Jardín de Vidrio",
    year: 2022,
    genre: "Fantasía",
    duration: "2h 11m",
    rating: 4.5,
    hue: 155,
    director: "C. Aurelio",
    synopsis: "Una arquitecta diseña edificios para plantas que ya no existen.",
  },
  {
    id: 13,
    title: "Migración",
    year: 2024,
    genre: "Documental",
    duration: "1h 18m",
    rating: 4.6,
    hue: 30,
    director: "A. Diallo",
    synopsis: "Tres generaciones siguen la misma ruta de aves entre Marruecos y Suecia.",
  },
  {
    id: 14,
    title: "Bajo el Mismo Sol",
    year: 2023,
    genre: "Comedia",
    duration: "1h 32m",
    rating: 4.0,
    hue: 60,
    director: "P. Solano",
    synopsis: "Un equipo de fútbol amateur se prepara para su único partido del año.",
  },
  {
    id: 15,
    title: "Hierro Dulce",
    year: 2024,
    genre: "Drama",
    duration: "2h 17m",
    rating: 4.7,
    hue: 28,
    director: "J. Marlowe",
    synopsis: "Una herrera enseña a su hija a templar el acero y a perdonar.",
  },
  {
    id: 16,
    title: "El Cuarto Movimiento",
    year: 2021,
    genre: "Drama",
    duration: "1h 56m",
    rating: 4.2,
    hue: 250,
    director: "F. Bielski",
    synopsis: "Una directora de orquesta pierde el oído antes del estreno mundial.",
  },
  {
    id: 17,
    title: "Cardumen",
    year: 2024,
    genre: "Sci-Fi",
    duration: "2h 02m",
    rating: 4.4,
    hue: 200,
    director: "Y. Park",
    synopsis: "Una flota de drones autónomos desarrolla algo parecido al miedo.",
  },
  {
    id: 18,
    title: "Las Horas Lentas",
    year: 2022,
    genre: "Romance",
    duration: "1h 39m",
    rating: 4.1,
    hue: 350,
    director: "B. Ostrov",
    synopsis: "Una farmacéutica y un relojero se escriben cartas que nunca envían.",
  },
  {
    id: 19,
    title: "Tundra",
    year: 2023,
    genre: "Thriller",
    duration: "1h 55m",
    rating: 4.3,
    hue: 210,
    director: "H. Eriksson",
    synopsis: "Una expedición ártica encuentra una radio que sólo transmite su propio futuro.",
  },
  {
    id: 20,
    title: "Polvo de Estrella",
    year: 2024,
    genre: "Animación",
    duration: "1h 28m",
    rating: 4.8,
    hue: 285,
    director: "Estudio Mira",
    synopsis: "Una niña recolecta fragmentos de un cometa caído en su patio.",
  },
];

export const METRICS: Metric[] = [
  {
    id: "pearson",
    name: "Coeficiente de Pearson",
    short: "Pearson",
    description: "Compara cómo se relacionan tus variaciones de puntaje con las de otros usuarios.",
    eyebrow: "Recomendación colaborativa centrada en tendencias de gusto",
    order: [4, 15, 1, 20, 12, 8, 6, 13, 11, 17, 9, 3, 19, 16, 14, 5, 2, 18, 10, 7],
  },
  {
    id: "cosine",
    name: "Similitud del coseno",
    short: "Coseno",
    description: "Mide qué tan alineado está tu vector de gustos con el de otros usuarios.",
    eyebrow: "Similitud angular entre patrones de calificación",
    order: [1, 6, 15, 22, 9, 12, 11, 3, 8, 20, 17, 4, 19, 13, 14, 16, 2, 5, 18, 10].filter(
      (id) => id <= 20,
    ),
  },
  {
    id: "euclidean",
    name: "Distancia euclidiana",
    short: "Euclidiana",
    description: "Premia a quienes tienen puntajes cercanos película por película.",
    eyebrow: "Vecinos cercanos por distancia directa",
    order: [6, 1, 5, 11, 15, 9, 3, 12, 8, 14, 18, 20, 4, 17, 19, 2, 16, 13, 7, 10],
  },
  {
    id: "manhattan",
    name: "Distancia Manhattan",
    short: "Manhattan",
    description: "Acumula diferencias absolutas y favorece perfiles consistentes.",
    eyebrow: "Diferencia total acumulada entre usuarios",
    order: [11, 1, 6, 9, 15, 5, 12, 3, 14, 8, 18, 20, 16, 17, 4, 13, 2, 19, 10, 7],
  },
];

export const GENRES = [
  "Todas",
  "Drama",
  "Sci-Fi",
  "Thriller",
  "Romance",
  "Documental",
  "Acción",
  "Comedia",
  "Animación",
  "Fantasía",
] as const;

export function getMoviesForMetric(metricId: Metric["id"]) {
  const metric = METRICS.find((item) => item.id === metricId) ?? METRICS[0];
  return metric.order
    .map((movieId) => MOVIES.find((movie) => movie.id === movieId))
    .filter((movie): movie is Movie => Boolean(movie));
}

export function getMetricById(metricId: string) {
  return METRICS.find((metric) => metric.id === metricId) ?? METRICS[0];
}

export function getMatchScore(metricId: string, movieId: number) {
  const metric = getMetricById(metricId);
  const index = metric.order.indexOf(movieId);
  if (index < 0) {
    return 0;
  }

  const top = 98;
  const bottom = 63;
  const ratio = index / Math.max(metric.order.length - 1, 1);
  return Math.round(top - ratio * (top - bottom));
}

export function parseMovieTitleAndYear(rawTitle: string) {
  const match = rawTitle.match(/\((\d{4})\)\s*$/);
  if (!match) {
    return {
      title: rawTitle,
      year: 0,
    };
  }

  return {
    title: rawTitle.replace(/\s*\(\d{4}\)\s*$/, "").trim(),
    year: Number(match[1]),
  };
}

export function genreLabel(genres: string) {
  if (!genres || genres === "(no genres listed)") {
    return "Sin género";
  }

  return genres.split("|")[0] ?? "Sin género";
}
