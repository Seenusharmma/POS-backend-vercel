import React, { useState, useEffect, useRef } from "react";
import { FaPhone, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import API_BASE from "../../config/api";
import Slider1 from "../../assets/Slider!.webp";
import Slider2 from "../../assets/Slider2.webp";
import Hero from "../../assets/hero.png";
import Apple from "../../assets/apple.png";

const OfferZone = ({ isMobile = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  // Default slider images (fallback if no offers)
  const defaultSlides = [
    { image: Slider1, title: "Special Combo", discount: "30% OFF" },
    { image: Slider2, title: "Weekend Special", discount: "25% OFF" },
    { image: Hero, title: "Family Pack", discount: "40% OFF" },
    { image: Apple, title: "Fresh Delights", discount: "20% OFF" },
  ];

  // Fetch active offers from API
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/offers/active`);
        if (res.data && res.data.length > 0) {
          // Transform offers to match slide format
          const offerSlides = res.data.map((offer) => ({
            image: offer.image || Slider1, // Use offer image or fallback
            title: offer.title,
            discount: offer.description, // Use description as discount text
          }));
          setOffers(offerSlides);
        } else {
          // No offers, use default slides
          setOffers(defaultSlides);
        }
      } catch (error) {
        console.error("Error fetching offers:", error);
        // On error, use default slides
        setOffers(defaultSlides);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  // Use offers or default slides
  const slides = offers.length > 0 ? offers : defaultSlides;

  // Auto-play slider
  useEffect(() => {
    if (isPaused || loading) return;

    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change slide every 4 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, slides.length, loading]);

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

  // Touch handlers for mobile swipe
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      goToNext();
    }
    if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-400/50 rounded-xl sm:rounded-2xl overflow-hidden shadow-md h-[120px] sm:h-[140px] md:h-[160px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div
      className="bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-400/50 rounded-xl sm:rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 relative h-[120px] sm:h-[140px] md:h-[160px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
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
                  
                  {/* Content - Responsive */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 z-10">
                    <motion.h3
                      initial={{ y: 10, opacity: 0, scale: 0.9 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
                      className="text-sm sm:text-xl md:text-3xl lg:text-4xl font-black text-white mb-1 sm:mb-2 md:mb-3 text-center
                               tracking-tight leading-tight
                               drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]
                               [text-shadow:_0_2px_10px_rgba(0,0,0,0.8)] sm:[text-shadow:_0_2px_20px_rgba(0,0,0,0.9),0_0_30px_rgba(255,255,255,0.3)]
                               uppercase"
                    >
                      {slide.title}
                    </motion.h3>
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 200 }}
                      className="relative"
                    >
                      {/* Discount Badge - Responsive */}
                      <div className="relative inline-block">
                        <div className="absolute inset-0 bg-yellow-400/30 blur-xl rounded-full"></div>
                        <span className="relative text-xs sm:text-lg md:text-2xl lg:text-3xl font-black text-yellow-300 
                                       drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] sm:drop-shadow-[0_3px_10px_rgba(0,0,0,0.7)]
                                       [text-shadow:_0_0_15px_rgba(255,255,0,0.5),0_2px_8px_rgba(0,0,0,0.8)] sm:[text-shadow:_0_0_20px_rgba(255,255,0,0.6),0_3px_12px_rgba(0,0,0,0.9)]
                                       tracking-wider px-2 py-0.5 sm:px-3 sm:py-1
                                       border-2 border-yellow-300/50 rounded-md sm:rounded-lg
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

        {/* Navigation Arrows - Responsive */}
        <button
          onClick={goToPrevious}
          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 active:bg-white/40 text-white p-1.5 sm:p-2 rounded-full transition-all duration-200 z-20 hover:scale-110 active:scale-95 touch-manipulation min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
          aria-label="Previous slide"
        >
          <FaChevronLeft className="text-xs sm:text-sm" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 active:bg-white/40 text-white p-1.5 sm:p-2 rounded-full transition-all duration-200 z-20 hover:scale-110 active:scale-95 touch-manipulation min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
          aria-label="Next slide"
        >
          <FaChevronRight className="text-xs sm:text-sm" />
        </button>

        {/* Navigation Dots - Responsive */}
        <div className="absolute bottom-2 sm:bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 sm:gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 touch-manipulation ${
                index === currentSlide
                  ? "w-6 sm:w-8 bg-white shadow-lg"
                  : "w-1.5 sm:w-2 bg-white/50 hover:bg-white/70 active:bg-white/80 hover:w-2 sm:hover:w-3"
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

      {/* Phone Number - Bottom Right - Responsive */}
      <div className="absolute bottom-1.5 sm:bottom-2 right-2 sm:right-3 flex items-center gap-1 sm:gap-1.5 text-white/90 text-[9px] sm:text-[10px] md:text-xs font-medium z-20">
        <FaPhone className="text-blue-300 text-[9px] sm:text-[10px] md:text-xs" />
        <span className="hidden sm:inline">123-456-7890</span>
        <span className="sm:hidden">Call</span>
      </div>
    </div>
  );
};

export default OfferZone;
