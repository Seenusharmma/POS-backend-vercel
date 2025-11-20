import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

const ImageCarousel = () => {
  const slides = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
      title: "Delicious Meals",
      desc: "Experience a world of flavor in every bite.",
      btn: "Order Now",
    },
    {
      id: 2,
      image:
        "https://plus.unsplash.com/premium_photo-1661883237884-263e8de8869b?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1189",
      title: "Cozy Ambience",
      desc: "Dine in comfort and style with friends and family.",
      btn: "View Menu",
    },
    {
      id: 3,
      image:
        "https://media.istockphoto.com/id/1155240408/photo/table-filled-with-large-variety-of-food.jpg?s=612x612&w=0&k=20&c=uJEbKmR3wOxwdhQR_36as5WeP6_HDqfU-QmAq63OVEE=",
      title: "Fresh Ingredients",
      desc: "Only the freshest produce goes into every dish.",
      btn: "Order Now",
    },
    {
      id: 4,
      image:
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
      title: "Perfect for Every Occasion",
      desc: "Celebrate life’s moments with our chef’s special menu.",
      btn: "View Menu",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto mt-6 sm:mt-8 md:mt-10 px-3 sm:px-4 md:px-6 lg:px-10">
      <div className="relative">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          effect="fade"
          spaceBetween={0}
          centeredSlides={true}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
            renderBullet: (index, className) => {
              return `<span class="${className} swiper-pagination-bullet-custom"></span>`;
            },
          }}
          loop={true}
          speed={1000}
          allowTouchMove={true}
          className="carousel-swiper rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
          breakpoints={{
            320: {
              slidesPerView: 1,
              spaceBetween: 0,
            },
            640: {
              slidesPerView: 1,
              spaceBetween: 0,
            },
            768: {
              slidesPerView: 1,
              spaceBetween: 0,
            },
            1024: {
              slidesPerView: 1,
              spaceBetween: 0,
            },
          }}
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={slide.id}>
              <div className="relative w-full h-[280px] xs:h-[320px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[650px] overflow-hidden">
                {/* Background Image with Ken Burns Effect */}
                <div className="absolute inset-0">
                  <motion.img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      scale: { duration: 8, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
                      opacity: { duration: 1 },
                    }}
                  />
                </div>

                {/* Professional Multi-layer Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Content Container */}
                <div className="relative h-full flex flex-col justify-center items-start text-left px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
                  <div className="max-w-2xl">
                    {/* Title with Professional Typography */}
                    <motion.h2
                      initial={{ opacity: 0, y: 30, x: -20 }}
                      animate={{ opacity: 1, y: 0, x: 0 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-tight mb-3 sm:mb-4 md:mb-5 drop-shadow-2xl"
                      style={{
                        textShadow: "2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)",
                      }}
                    >
                      {slide.title}
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.4 }}
                      className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-gray-100 mb-4 sm:mb-5 md:mb-6 max-w-xl leading-relaxed font-light"
                      style={{
                        textShadow: "1px 1px 4px rgba(0,0,0,0.8)",
                      }}
                    >
                      {slide.desc}
                    </motion.p>

                    {/* CTA Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    >
                      <Link
                        to={slide.btn === "Order Now" ? "/menu" : "/menu"}
                        className="inline-block"
                      >
                        <motion.button
                          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(248, 190, 82, 0.4)" }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-gradient-to-r from-[#f8be52] to-[#fcc660] text-black font-bold text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-2 group"
                        >
                          <span>{slide.btn}</span>
                          <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                        </motion.button>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Custom Styles */}
      <style>{`
        .carousel-swiper {
          position: relative;
        }
        
        .carousel-swiper .swiper-pagination {
          bottom: 20px !important;
          left: 50% !important;
          transform: translateX(-50%);
          width: auto !important;
        }
        
        .carousel-swiper .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          margin: 0 4px;
          transition: all 0.3s ease;
        }
        
        .carousel-swiper .swiper-pagination-bullet-active {
          background: #f8be52;
          width: 30px;
          border-radius: 5px;
        }
        
        .carousel-swiper .swiper-pagination-bullet-custom {
          width: 12px;
          height: 12px;
          background: rgba(255, 255, 255, 0.6);
          opacity: 1;
          margin: 0 5px;
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        
        .carousel-swiper .swiper-pagination-bullet-custom.swiper-pagination-bullet-active {
          background: #f8be52;
          width: 32px;
          border-radius: 16px;
          box-shadow: 0 0 10px rgba(248, 190, 82, 0.6);
        }
        
        @media (max-width: 640px) {
          .carousel-swiper .swiper-pagination {
            bottom: 15px !important;
          }
          
          .carousel-swiper .swiper-pagination-bullet-custom {
            width: 8px;
            height: 8px;
            margin: 0 3px;
          }
          
          .carousel-swiper .swiper-pagination-bullet-custom.swiper-pagination-bullet-active {
            width: 24px;
          }
        }
        
      `}</style>
    </div>
  );
};

export default ImageCarousel;
