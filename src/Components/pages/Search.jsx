import { motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import api from "../../utils/axios";
import { useNavigate } from "react-router-dom";
import GooeySearch from "../../components/ui/gooey-search";

const getMovieTitle = (movie) => movie.name || movie.original_name || movie.original_title || movie.title || "Untitled";

const getSearchLabel = (movie) => `${getMovieTitle(movie)} · ${movie.media_type?.toUpperCase() || "TITLE"}`;

const getSearchImage = (movie) => {
      const imagePath = movie.poster_path || movie.backdrop_path || movie.profile_path;
      return imagePath ? `https://image.tmdb.org/t/p/w92/${imagePath}` : "/noImage.jpg";
};

const Search = () => {
      document.title = "Search For Anything You Love !";
      const [movieData, setMovieData] = useState([]);
      const [searchError, setSearchError] = useState("");
      const requestId = useRef(0);
      const navigate = useNavigate();

      const searchMovies = useCallback(async (searchTerm) => {
            const currentRequest = ++requestId.current;
            try {
                  const { data } = await api.get(`/search/multi?query=${encodeURIComponent(searchTerm.trim())}`);
                  const results = data.results;
                  if (currentRequest === requestId.current) {
                        setMovieData(results);
                        setSearchError("");
                  }
                  return results.slice(0, 5).map((movie) => ({
                        id: movie.id,
                        mediaType: movie.media_type,
                        image: getSearchImage(movie),
                        label: getSearchLabel(movie),
                  }));
            } catch {
                  if (currentRequest === requestId.current) {
                        setMovieData([]);
                        setSearchError("We couldn't load results right now. Try again in a moment.");
                  }
                  return [];
            }
      }, []);

      const handleSelect = useCallback(
            (result) => {
                  const selectedMovie = movieData.find((movie) => movie.id === result.id && movie.media_type === result.mediaType);
                  if (selectedMovie) navigate(`/${selectedMovie.media_type}/details/${selectedMovie.id}`);
            },
            [movieData, navigate],
      );

      const handleClear = useCallback(() => {
            requestId.current += 1;
            setMovieData([]);
            setSearchError("");
      }, []);

      return (
            <>
                  <section className="flex min-h-dvh w-full flex-col items-center overflow-hidden [background-image:var(--bg-gradient)] px-4 pb-28 pt-10 font-primary">
                        <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { ease: "backInOut", duration: 0.5 } }} className="w-full max-w-xl">
                              <GooeySearch onSearch={searchMovies} onSelect={handleSelect} onClear={handleClear} placeholder="e.g. Game of throne" buttonLabel="Search movies, TV shows, people" maxResults={10} />
                        </motion.div>
                        {searchError && <p className="mt-16 text-center text-sm text-primary-foreground/80">{searchError}</p>}
                  </section>
            </>
      );
};

export default Search;
