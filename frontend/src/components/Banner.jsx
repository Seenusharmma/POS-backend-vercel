import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Apple from "../assets/apple.png";
import Kiwi from "../assets/kiwi.png";
import Leaf from "../assets/leaf.png";
import Lemon from "../assets/lemon.png";
import Tomato from "../assets/tomato.png";

gsap.registerPlugin(ScrollTrigger);

const Banner = () => {
  const leafRef = useRef(null);
  const tomatoRef = useRef(null);
  const lemonRef = useRef(null);
  const appleRef = useRef(null);
  const kiwiRef = useRef(null);

  useEffect(() => {
    const bannerContainer = document.querySelector('.banner-container');
    if (!bannerContainer) return;

    // Scroll-triggered entrance animations
    const fruits = [
      { ref: leafRef, delay: 0 },
      { ref: tomatoRef, delay: 0.1 },
      { ref: lemonRef, delay: 0.2 },
      { ref: appleRef, delay: 0.3 },
      { ref: kiwiRef, delay: 0.4 },
    ];

    fruits.forEach(({ ref, delay }) => {
      if (ref.current) {
        gsap.from(ref.current, {
          opacity: 0,
          scale: 0.3,
          rotation: -180,
          duration: 1.2,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          delay: delay,
        });
      }
    });

    // Scroll-based animations with parallax effect
    const scrollTriggerConfig = {
      trigger: bannerContainer,
      start: "top top",
      end: "bottom top",
      scrub: true,
    };

    // Leaf - Scroll-based floating with rotation
    if (leafRef.current) {
      gsap.to(leafRef.current, {
        y: -30,
        rotation: 20,
        scrollTrigger: scrollTriggerConfig,
      });
    }

    // Tomato - Scroll-based bouncing with scale
    if (tomatoRef.current) {
      gsap.to(tomatoRef.current, {
        y: -40,
        rotation: -15,
        scale: 1.1,
        scrollTrigger: {
          ...scrollTriggerConfig,
          scrub: 1.2,
        },
      });
    }

    // Lemon - Scroll-based spinning and floating
    if (lemonRef.current) {
      gsap.to(lemonRef.current, {
        rotation: 180,
        y: -35,
        scrollTrigger: {
          ...scrollTriggerConfig,
          scrub: 1.5,
        },
      });
    }

    // Apple - Scroll-based floating with rotation and scale
    if (appleRef.current) {
      gsap.to(appleRef.current, {
        y: -45,
        rotation: -12,
        scale: 1.15,
        scrollTrigger: {
          ...scrollTriggerConfig,
          scrub: 1.3,
        },
      });
    }

    // Kiwi - Center scroll-based floating with pulsing scale
    if (kiwiRef.current) {
      gsap.to(kiwiRef.current, {
        y: -50,
        scale: 1.2,
        rotation: 10,
        scrollTrigger: {
          ...scrollTriggerConfig,
          scrub: 1.4,
        },
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.vars?.trigger === bannerContainer) {
          trigger.kill();
        }
      });
      fruits.forEach(({ ref }) => {
        if (ref.current) {
          gsap.killTweensOf(ref.current);
        }
      });
    };
  }, []);

  return (
    <div className="relative container py-20 overflow-hidden banner-container">
      {/* Heading */}
      <div className="text-center mb-12">
        <h1 className="tracking-wider text-3xl sm:text-4xl font-bold text-dark">
          Taste The Variety Difference
        </h1>
      </div>

      {/* Content Section */}
      <div className="space-y-16 relative z-10 px-4 sm:px-12 text-lg leading-relaxed text-gray-800 mt-10">
        {/* Section 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-justify">
              We understand that{" "}
              <span className="text-[#f9b12b] font-semibold">time</span> is the
              most precious ingredient in the modern world. That’s why{" "}
              <span className="text-[#f9b12b] font-semibold">Food Fantasy</span>{" "}
              offers healthy, chef-prepared meals — giving you the freedom to
              enjoy great food without the stress of shopping or cooking.
            </p>
          </div>
        </div>

        {/* Section 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
          <div className="hidden sm:block"></div>
          <div>
            <p className="text-justify mt-6">
              From sizzling appetizers to mouth-watering main courses and{" "}
              <span className="text-[#f9b12b] font-semibold">decadent</span>{" "}
              desserts, every dish is crafted using fresh, locally sourced
              ingredients. Whether you crave something classic or feel
              adventurous, our chefs have something truly{" "}
              <span className="text-[#f9b12b] font-semibold">special</span> for
              you.
            </p>
          </div>
        </div>
      </div>

      {/* Button Section */}
      <div className="flex items-center justify-center mt-16 relative z-10">
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Link
            to="/menu"
            className="bg-orange-500 border border-orange-400 h-[50px] px-8 py-2 
                       text-white text-lg font-bold rounded-lg 
                       shadow-md hover:bg-orange-600 transition-colors"
          >
            Find Your Appetite!
          </Link>
        </motion.div>
      </div>

      {/* Decorative Fruits with GSAP Animations */}
      {/* Leaf */}
      <img
        ref={leafRef}
        src={Leaf}
        alt="Leaf"
        className="absolute top-8 left-6 sm:top-10 sm:left-14 max-w-[120px] sm:max-w-[150px] opacity-90 z-10 pointer-events-none"
      />

      {/* Tomato */}
      <img
        ref={tomatoRef}
        src={Tomato}
        alt="Tomato"
        className="absolute bottom-20 left-6 sm:bottom-24 sm:left-14 max-w-[120px] sm:max-w-[150px] opacity-90 z-10 pointer-events-none"
      />

      {/* Lemon */}
      <img
        ref={lemonRef}
        src={Lemon}
        alt="Lemon"
        className="absolute top-10 right-6 sm:top-12 sm:right-14 max-w-[120px] sm:max-w-[150px] opacity-90 z-10 pointer-events-none"
      />

      {/* Apple */}
      <img
        ref={appleRef}
        src={Apple}
        alt="Apple"
        className="absolute bottom-10 right-6 sm:bottom-14 sm:right-14 max-w-[120px] sm:max-w-[150px] opacity-90 z-10 pointer-events-none"
      />

      {/* Kiwi */}
      <img
        ref={kiwiRef}
        src={Kiwi}
        alt="Kiwi"
        className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 
                   max-w-[150px] sm:max-w-[180px] opacity-90 z-10 pointer-events-none"
      />
    </div>
  );
};

export default Banner;
