/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import api from "../../utils/axios";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

const Header = () => {
      const [nowPlaying, setNowPlaying] = useState([]);
      const [movieIndex, setMovieIndex] = useState(0);

      const getTrendingData = async () => {
            try {
                  const { data } = await api.get("/movie/now_playing");
                  setNowPlaying(data.results[movieIndex]);
            } catch (error) {
                  console.log(error);
            }
      };

      useEffect(() => {
            const changeMovieIndex = setInterval(() => {
                  setMovieIndex((prev) => (prev + 1) % 20);
            }, 20000);
            getTrendingData();
            return () => clearInterval(changeMovieIndex);
      }, [movieIndex]);
      return (
            <header className="w-full p-5  leading-none font-Stoshi">
                  <section className="overflow-hidden">
                        <motion.h1 initial={{ y: -50 }} animate={{ y: 0, transition: { duration: 0.7, delay: 0.5, ease: "backInOut" } }} className="text-2xl tracking-tighter text-[#d2f5e9]">
                              MoviesFlix
                        </motion.h1>
                        <motion.h4 initial={{ y: 80 }} animate={{ y: 0, transition: { duration: 0.7, delay: 0.5, ease: "backInOut" } }} className="text-white/70">
                              Your Favourite IMBD
                        </motion.h4>
                  </section>
                  <section className="w-full h-[35vh] relative mt-3 overflow-hidden rounded-md">
                        <div className="bottom-0 px-4 text-white rounded-t-md py-3 left-0 bg-gradient-to-t from-zinc-600/70 to-transparent  overflow-hidden backdrop-blur-md  w-full h-[50%] absolute">
                              <h1 className="text-xl font-semibold   tracking-tighter leading-none">{nowPlaying.original_title || nowPlaying.title}</h1>
                              <p className="text-xs mt-2 text-zinc-200 tracking-tighter leading-none">
                                    {nowPlaying.overview && nowPlaying.overview.slice(0, 130)}...
                                    <Link className="text-blue-300" to={`/movie/details/${nowPlaying.id}`}>
                                          see more
                                    </Link>
                              </p>
                              <div className="flex items-center mt-2 gap-2">
                                    <h4 className="backdrop-blur px-3 bg-transparent py-1 rounded-full  w-fit text-xs">⭐Rating: {nowPlaying.vote_average && nowPlaying.vote_average.toFixed(1)}/10</h4>
                                    <h4 className="backdrop-blur px-2  py-1 rounded-full  w-fit text-xs">{nowPlaying.release_date && nowPlaying.release_date.split("-")[0]}</h4>
                              </div>
                        </div>
                        <img className="w-full h-full object-cover object-top" loading="lazy" src={`https://image.tmdb.org/t/p/original${nowPlaying.backdrop_path || nowPlaying.poster_path}`} alt="" />
                  </section>
            </header>
      );
};

export default Header;
