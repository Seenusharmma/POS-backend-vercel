import React from "react";
import CarouselContainer from "./CarouselContainer";

const VegCard = ({ vegFoods, onAddToCart, heightClass = "h-[calc((100vh-280px)/2)] md:h-[calc(100vh-240px)]" }) => {
  return (
    <div className={heightClass}>
      <div className="bg-white/90 border border-green-200/50 rounded-2xl overflow-hidden flex flex-col h-full relative shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm hover:border-green-300/60 group">
        {/* Subtle glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-br from-green-100/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 -z-10"></div>
        <CarouselContainer
          foods={vegFoods}
          type="Veg"
          onAddToCart={onAddToCart}
          autoSlideInterval={4000}
          emptyMessage="No vegetarian items available"
        />
      </div>
    </div>
  );
};

export default VegCard;

