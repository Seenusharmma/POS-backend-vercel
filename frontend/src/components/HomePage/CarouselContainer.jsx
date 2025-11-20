import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import CarouselCard from "./CarouselCard";

const CarouselContainer = ({
  foods,
  type,
  onAddToCart,
  autoSlideInterval = 4000,
  emptyMessage = "No items available",
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const autoSlideRef = useRef(null);
  const containerRef = useRef(null);

  // Drag physics state
  const dragState = useRef({
    isDown: false,
    startX: 0,
    lastX: 0,
    lastMoveTime: 0,
    velocity: 0,
    momentumId: null,
  });

  // Smooth next/prev logic
  const scroll = useCallback(
    (direction) => {
      if (foods.length === 0) return;

      setCurrentIndex((prev) =>
        direction === "next"
          ? prev + 1 >= foods.length
            ? 0
            : prev + 1
          : prev - 1 < 0
          ? foods.length - 1
          : prev - 1
      );
    },
    [foods.length]
  );

  // Auto slide
  useEffect(() => {
    if (foods.length <= 1 || isPaused) return;

    autoSlideRef.current = setInterval(() => {
      scroll("next");
    }, autoSlideInterval);

    return () => clearInterval(autoSlideRef.current);
  }, [foods.length, isPaused, scroll, autoSlideInterval]);

  // Pause on hover
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // ========== MOMENTUM DRAG LOGIC ==========
  const startMomentum = () => {
    cancelAnimationFrame(dragState.current.momentumId);

    const momentum = () => {
      const { velocity } = dragState.current;

      // Stop if very slow
      if (Math.abs(velocity) < 0.01) return;

      dragState.current.velocity *= 0.95; // friction
      dragState.current.lastX += dragState.current.velocity;

      // Move based on momentum direction
      if (velocity > 0.5) scroll("prev");
      else if (velocity < -0.5) scroll("next");

      dragState.current.momentumId = requestAnimationFrame(momentum);
    };

    dragState.current.momentumId = requestAnimationFrame(momentum);
  };

  const handleDragStart = (x) => {
    dragState.current.isDown = true;
    dragState.current.startX = x;
    dragState.current.lastX = x;
    dragState.current.lastMoveTime = Date.now();
    dragState.current.velocity = 0;

    setIsPaused(true);
    cancelAnimationFrame(dragState.current.momentumId);
  };

  const handleDragMove = (x) => {
    if (!dragState.current.isDown) return;

    const currentTime = Date.now();
    const dx = x - dragState.current.lastX;
    const dt = currentTime - dragState.current.lastMoveTime;

    dragState.current.velocity = dx / dt; // px per ms
    dragState.current.lastX = x;
    dragState.current.lastMoveTime = currentTime;

    // Threshold drag to change card index
    if (dx > 20) {
      scroll("prev");
      dragState.current.isDown = false;
    } else if (dx < -20) {
      scroll("next");
      dragState.current.isDown = false;
    }
  };

  const handleDragEnd = () => {
    dragState.current.isDown = false;
    startMomentum();
    setTimeout(() => setIsPaused(false), 1200);
  };

  // Mouse handlers
  const handleMouseDown = (e) => handleDragStart(e.pageX);
  const handleMouseMove = (e) => handleDragMove(e.pageX);
  const handleMouseUp = handleDragEnd;
  const handleMouseLeaveDrag = handleDragEnd;

  // Touch handlers
  const handleTouchStart = (e) => handleDragStart(e.touches[0].pageX);
  const handleTouchMove = (e) => handleDragMove(e.touches[0].pageX);
  const handleTouchEnd = handleDragEnd;

  if (foods.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-500 text-sm py-4 h-full">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className="group relative flex-1 h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Navigation arrows - minimal design */}
      {foods.length > 1 && (
        <>
          <button
            onClick={() => scroll("prev")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 
            bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-full shadow-md
            transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95
            border border-gray-200/60 hover:border-gray-300"
          >
            <FaChevronLeft className="text-xs sm:text-sm" />
          </button>

          <button
            onClick={() => scroll("next")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 
            bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 p-2 rounded-full shadow-md
            transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95
            border border-gray-200/60 hover:border-gray-300"
          >
            <FaChevronRight className="text-xs sm:text-sm" />
          </button>
        </>
      )}

      {/* MAIN CARD */}
      <div
        ref={containerRef}
        className="relative h-full w-full overflow-hidden cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeaveDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9, x: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: -50 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.25, 0.46, 0.45, 0.94],
            scale: { duration: 0.4 }
          }}
          className="w-full h-full"
        >
          {foods[currentIndex] ? (
            <CarouselCard
              food={foods[currentIndex]}
              type={type}
              onAddToCart={onAddToCart}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <p>No items available</p>
            </div>
          )}

        </motion.div>
      </div>
    </div>
  );
};

export default CarouselContainer;
