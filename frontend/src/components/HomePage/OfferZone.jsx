import React, { useState, useEffect, useRef } from "react";
import { FaPhone, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Slider1 from "../../assets/Slider!.webp";
import Slider2 from "../../assets/Slider2.webp";
import Hero from "../../assets/hero.png";
import Apple from "../../assets/apple.png";

const OfferZone = ({ isMobile = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // Slider images
  const slides = [
    { image: Slider1, title: "Special Combo", discount: "30% OFF" },
    { image: Slider2, title: "Weekend Special", discount: "25% OFF" },
    { image: Hero, title: "Family Pack", discount: "40% OFF" },
    { image: Apple, title: "Fresh Delights", discount: "20% OFF" },
  ];

  // Auto-play slider
  useEffect(() => {
    if (isPaused) return;

    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, slides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    // Reset auto-play
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  if (isMobile) {
    return (
      <div className="h-[120px]">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-400/50 rounded-2xl overflow-hidden h-full shadow-md hover:shadow-lg transition-all duration-300 relative">
          {/* Slider Container */}
          <div className="relative h-full w-full">
            <AnimatePresence mode="wait">
              {slides.map((slide, index) => {
                if (index !== currentSlide) return null;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    <div className="relative h-full w-full">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/80 via-orange-500/70 to-orange-600/80"></div>
                      {/* Content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 z-10">
                        <motion.h3
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.4 }}
                          className="text-sm font-extrabold text-white mb-1.5 text-center tracking-wide
                                   drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]
                                   [text-shadow:_0_2px_10px_rgba(0,0,0,0.8)]"
                        >
                          {slide.title}
                        </motion.h3>
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.4, type: "spring" }}
                          className="relative"
                        >
                          <span className="text-[11px] font-black text-yellow-300 
                                        drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]
                                        [text-shadow:_0_0_15px_rgba(255,255,0,0.5),0_2px_8px_rgba(0,0,0,0.8)]
                                        tracking-wider">
                            {slide.discount}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Navigation Dots */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5 z-20">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/50 hover:bg-white/70"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-400/50 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 relative h-[140px] sm:h-[160px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slider Container */}
      <div className="relative h-full w-full">
        <AnimatePresence mode="wait">
          {slides.map((slide, index) => {
            if (index !== currentSlide) return null;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <div className="relative h-full w-full">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-600/85 via-orange-500/75 to-orange-600/85"></div>
                  
                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
                    <motion.h3
                      initial={{ y: 20, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
                      className="text-xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 text-center
                               tracking-tight leading-tight
                               drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]
                               [text-shadow:_0_2px_20px_rgba(0,0,0,0.9),0_0_30px_rgba(255,255,255,0.3)]
                               uppercase"
                    >
                      {slide.title}
                    </motion.h3>
                    <motion.div
                      initial={{ scale: 0, opacity: 0, rotate: -10 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 200 }}
                      className="relative"
                    >
                      {/* Discount Badge */}
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full"></div>
                        <span className="relative text-lg sm:text-2xl md:text-3xl font-black text-yellow-300 
                                       drop-shadow-[0_3px_10px_rgba(0,0,0,0.7)]
                                       [text-shadow:_0_0_20px_rgba(255,255,0,0.6),0_3px_12px_rgba(0,0,0,0.9)]
                                       tracking-wider px-3 py-1
                                       border-2 border-yellow-300/50 rounded-lg
                                       bg-gradient-to-br from-yellow-400/20 to-yellow-500/20
                                       backdrop-blur-sm">
                          {slide.discount}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-full transition-all duration-200 z-20 hover:scale-110 active:scale-95"
          aria-label="Previous slide"
        >
          <FaChevronLeft className="text-xs sm:text-sm" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-1.5 sm:p-2 rounded-full transition-all duration-200 z-20 hover:scale-110 active:scale-95"
          aria-label="Next slide"
        >
          <FaChevronRight className="text-xs sm:text-sm" />
        </button>

        {/* Navigation Dots */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-white shadow-lg"
                  : "w-2 bg-white/50 hover:bg-white/70 hover:w-3"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
          <motion.div
            key={currentSlide}
            className="h-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "linear" }}
          />
        </div>
      </div>

      {/* Phone Number - Bottom Right */}
      <div className="absolute bottom-2 right-3 flex items-center gap-1.5 text-white/90 text-[10px] sm:text-xs font-medium z-20">
        <FaPhone className="text-blue-300 text-[10px] sm:text-xs" />
        <span>123-456-7890</span>
      </div>
    </div>
  );
};

export default OfferZone;
