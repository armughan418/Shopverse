import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../utils/api";

const Carousel = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const res = await axios.get(api().getCarousel);
        setSlides(res.data.images || []);
      } catch (err) {
        console.error("Failed to load carousel images", err);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () =>
        setCurrent((prev) => (slides.length ? (prev + 1) % slides.length : 0)),
      4000,
    );
    return () => clearInterval(interval);
  }, [slides]);

  const goToSlide = (index) => setCurrent(index);

  const prevSlide = () =>
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);

  if (!slides.length) return null;

  return (
    <div className="relative w-full h-48 sm:h-64 md:h-96 lg:h-[500px] overflow-hidden rounded-xl shadow-lg">
      {slides.map((slide, index) => (
        <div
          key={slide._id || index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.alt || "Slide"}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-black/40 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/60 transition text-xs sm:text-base"
      >
        &#10094;
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-black/40 text-white p-1.5 sm:p-2 rounded-full hover:bg-black/60 transition text-xs sm:text-base"
      >
        &#10095;
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 sm:space-x-2">
        {slides.map((_, index) => (
          <span
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full cursor-pointer transition ${
              index === current ? "bg-white" : "bg-white/50"
            }`}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
