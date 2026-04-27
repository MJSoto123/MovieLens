// Cinescape — mock movie data
// Posters: per-movie tonal gradient + monospace placeholder (no hand-drawn SVG)

window.MOVIES = [
  { id: 1,  title: "La Cordillera del Olvido", year: 2024, genre: "Drama", duration: "2h 14m", rating: 4.6, hue: 18,  tone: "warm",   director: "I. Maeda",         synopsis: "Un cartógrafo regresa al pueblo donde su padre desapareció hace treinta años." },
  { id: 2,  title: "Neón Pálido",              year: 2023, genre: "Thriller", duration: "1h 48m", rating: 4.2, hue: 280, tone: "cool",   director: "A. Rojas",         synopsis: "Una traductora simultánea descubre que la conferencia es una fachada." },
  { id: 3,  title: "Hojas de Verano",          year: 2022, genre: "Romance", duration: "1h 36m", rating: 4.4, hue: 95,  tone: "fresh",  director: "M. Lévi",          synopsis: "Dos extraños se cruzan en seis veranos consecutivos sin recordarlo." },
  { id: 4,  title: "El Reloj de Arena",        year: 2024, genre: "Sci-Fi",  duration: "2h 22m", rating: 4.7, hue: 220, tone: "cool",   director: "K. Yoshida",       synopsis: "Un físico envejece al revés cada vez que duerme." },
  { id: 5,  title: "Madrugada",                year: 2021, genre: "Drama",   duration: "1h 52m", rating: 4.1, hue: 12,  tone: "warm",   director: "L. Beltrán",       synopsis: "Una panadera nocturna cuenta los secretos del barrio en silencio." },
  { id: 6,  title: "Tres Habitaciones",        year: 2024, genre: "Drama",   duration: "2h 04m", rating: 4.5, hue: 35,  tone: "warm",   director: "S. Ahmadi",        synopsis: "Tres hermanos heredan una casa con una habitación que nadie recuerda." },
  { id: 7,  title: "Velocidad Terminal",       year: 2023, genre: "Acción",  duration: "1h 58m", rating: 3.9, hue: 8,   tone: "warm",   director: "R. Caine",         synopsis: "Un piloto de pruebas debe romper la barrera del sonido sin combustible." },
  { id: 8,  title: "La Geometría del Mar",     year: 2022, genre: "Documental", duration: "1h 24m", rating: 4.8, hue: 195, tone: "cool", director: "N. Okafor",        synopsis: "Una matemática mapea las olas como ecuaciones." },
  { id: 9,  title: "Ámbar",                    year: 2024, genre: "Drama",   duration: "1h 41m", rating: 4.3, hue: 42,  tone: "warm",   director: "T. Rivera",        synopsis: "Una restauradora descubre un mensaje encerrado en una resina del cretácico." },
  { id: 10, title: "Pulso Inverso",            year: 2023, genre: "Thriller", duration: "2h 08m", rating: 4.0, hue: 320, tone: "cool",   director: "V. Korda",         synopsis: "Una neuróloga implanta su memoria en una paciente comatosa." },
  { id: 11, title: "Solsticio",                year: 2024, genre: "Drama",   duration: "1h 49m", rating: 4.4, hue: 50,  tone: "warm",   director: "E. Tanaka",        synopsis: "El día más largo del año en una comunidad de pescadores islandeses." },
  { id: 12, title: "El Jardín de Vidrio",      year: 2022, genre: "Fantasía", duration: "2h 11m", rating: 4.5, hue: 155, tone: "fresh",  director: "C. Aurelio",       synopsis: "Una arquitecta diseña edificios para plantas que ya no existen." },
  { id: 13, title: "Migración",                year: 2024, genre: "Documental", duration: "1h 18m", rating: 4.6, hue: 30,  tone: "warm",  director: "A. Diallo",        synopsis: "Tres generaciones siguen la misma ruta de aves entre Marruecos y Suecia." },
  { id: 14, title: "Bajo el Mismo Sol",        year: 2023, genre: "Comedia", duration: "1h 32m", rating: 4.0, hue: 60,  tone: "warm",   director: "P. Solano",        synopsis: "Un equipo de fútbol amateur se prepara para su único partido del año." },
  { id: 15, title: "Hierro Dulce",             year: 2024, genre: "Drama",   duration: "2h 17m", rating: 4.7, hue: 28,  tone: "warm",   director: "J. Marlowe",       synopsis: "Una herrera enseña a su hija a templar el acero y a perdonar." },
  { id: 16, title: "El Cuarto Movimiento",     year: 2021, genre: "Drama",   duration: "1h 56m", rating: 4.2, hue: 250, tone: "cool",   director: "F. Bielski",       synopsis: "Una directora de orquesta pierde el oído antes del estreno mundial." },
  { id: 17, title: "Cardumen",                 year: 2024, genre: "Sci-Fi",  duration: "2h 02m", rating: 4.4, hue: 200, tone: "cool",   director: "Y. Park",          synopsis: "Una flota de drones autónomos desarrolla algo parecido al miedo." },
  { id: 18, title: "Las Horas Lentas",         year: 2022, genre: "Romance", duration: "1h 39m", rating: 4.1, hue: 350, tone: "warm",   director: "B. Ostrov",        synopsis: "Una farmacéutica y un relojero se escriben cartas que nunca envían." },
  { id: 19, title: "Tundra",                   year: 2023, genre: "Thriller", duration: "1h 55m", rating: 4.3, hue: 210, tone: "cool",   director: "H. Eriksson",      synopsis: "Una expedición ártica encuentra una radio que sólo transmite su propio futuro." },
  { id: 20, title: "Polvo de Estrella",        year: 2024, genre: "Animación", duration: "1h 28m", rating: 4.8, hue: 285, tone: "cool",  director: "Estudio Mira",     synopsis: "Una niña recolecta fragmentos de un cometa caído en su patio." },
  { id: 21, title: "El Ladrón de Trenes",      year: 2023, genre: "Acción",  duration: "2h 06m", rating: 4.0, hue: 15,  tone: "warm",   director: "G. Petrov",        synopsis: "El último viaje del Transiberiano. Un solo pasajero. Un único objetivo." },
  { id: 22, title: "Mientras Caen las Hojas",  year: 2022, genre: "Drama",   duration: "1h 47m", rating: 4.5, hue: 25,  tone: "warm",   director: "K. Hansen",        synopsis: "Una jardinera y un escritor intercambian cartas durante un otoño largo." },
  { id: 23, title: "Resonancia",               year: 2024, genre: "Sci-Fi",  duration: "2h 19m", rating: 4.6, hue: 175, tone: "fresh",  director: "D. Aoki",          synopsis: "Un ingeniero de sonido captura la voz de su madre antes de que él nazca." },
  { id: 24, title: "El Silbador",              year: 2023, genre: "Thriller", duration: "1h 51m", rating: 4.2, hue: 240, tone: "cool",   director: "R. Vásquez",       synopsis: "Un denunciante vive en un departamento sin ventanas durante 400 días." },
  { id: 25, title: "Coral",                    year: 2024, genre: "Documental", duration: "1h 22m", rating: 4.7, hue: 170, tone: "fresh", director: "I. Nakahara",      synopsis: "El último arrecife vivo del Pacífico, filmado en tiempo real." },
  { id: 26, title: "La Última Función",        year: 2022, genre: "Drama",   duration: "2h 08m", rating: 4.3, hue: 340, tone: "warm",   director: "C. Werner",        synopsis: "Un cine de barrio cierra. Su proyeccionista se niega a salir." },
  { id: 27, title: "Vuelo Nocturno",           year: 2024, genre: "Romance", duration: "1h 44m", rating: 4.1, hue: 230, tone: "cool",   director: "M. Albright",      synopsis: "Dos pasajeros reservan accidentalmente la misma ventana cada miércoles." },
  { id: 28, title: "Hambre Lenta",             year: 2023, genre: "Drama",   duration: "1h 58m", rating: 4.5, hue: 22,  tone: "warm",   director: "P. Kowalski",      synopsis: "Una chef de un pueblo minero cocina con lo que la tierra le devuelve." }
];

// Métrica → orden de IDs (mock distinto por métrica)
window.METRICS = [
  {
    id: "user-sim",
    name: "Similitud por usuarios",
    short: "Por usuarios similares",
    desc: "Recomienda lo que ven personas con tu gusto.",
    icon: "users",
    order: [4, 12, 23, 8, 17, 6, 1, 25, 20, 11, 15, 9, 22, 18, 16, 13, 5, 26, 28, 3, 2, 14, 7, 19, 10, 24, 27, 21]
  },
  {
    id: "movie-sim",
    name: "Similitud por películas",
    short: "Por películas que viste",
    desc: "Encuentra films cercanos a tus favoritos.",
    icon: "film",
    order: [1, 6, 15, 22, 9, 28, 5, 26, 11, 16, 18, 27, 3, 14, 12, 8, 25, 23, 4, 13, 17, 20, 2, 19, 10, 24, 7, 21]
  },
  {
    id: "popularity",
    name: "Popularidad",
    short: "Lo más visto ahora",
    desc: "Las películas con más actividad esta semana.",
    icon: "flame",
    order: [20, 4, 7, 21, 25, 12, 17, 15, 1, 6, 23, 13, 8, 11, 26, 9, 22, 28, 5, 16, 18, 2, 27, 14, 3, 19, 10, 24]
  },
  {
    id: "top-rated",
    name: "Mejor rating promedio",
    short: "Mejor calificadas",
    desc: "Ordenadas por puntuación de la comunidad.",
    icon: "star",
    order: [8, 20, 25, 4, 15, 23, 13, 12, 6, 22, 28, 1, 11, 9, 17, 26, 16, 5, 14, 19, 24, 18, 7, 27, 3, 10, 2, 21]
  },
  {
    id: "genre",
    name: "Género favorito · Drama",
    short: "Tu género favorito",
    desc: "Más profundo en lo que ya amas: Drama.",
    icon: "compass",
    order: [1, 5, 6, 9, 11, 15, 16, 22, 26, 28, 18, 3, 27, 12, 8, 13, 25, 4, 23, 17, 20, 14, 2, 19, 10, 24, 7, 21]
  },
  {
    id: "hybrid",
    name: "Recomendación híbrida",
    short: "Híbrida balanceada",
    desc: "Mezcla colaborativa, contenido y popularidad.",
    icon: "sparkles",
    order: [4, 1, 20, 12, 15, 8, 6, 23, 25, 11, 22, 9, 17, 26, 13, 28, 5, 16, 18, 3, 27, 14, 7, 21, 2, 19, 10, 24]
  }
];

// Match score por (metric, movie) — determinista
window.matchScore = function(metricId, movieId) {
  const m = window.METRICS.find(x => x.id === metricId);
  if (!m) return 0;
  const idx = m.order.indexOf(movieId);
  if (idx < 0) return 0;
  // 99 → ~62 across the list
  const top = 99;
  const bottom = 62;
  const t = idx / (m.order.length - 1);
  return Math.round(top - t * (top - bottom));
};
