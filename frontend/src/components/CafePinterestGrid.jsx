// src/components/CafePinterestGrid.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import img1 from "../assets/bloom.jpg";
import img2 from "../assets/center.jpg";
import img3 from "../assets/frontview.jpg";
import img4 from "../assets/side.jpg";
import img5 from "../assets/side2.jpg";
import img6 from "../assets/frontview1.jpg";

const images = [img1, img2, img3, img4, img5, img6];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const CafePinterestGrid = () => {
  const [viewImage, setViewImage] = useState(null);

  return (
    <div className="min-h-screen w-full bg-white px-2 pt-4 pb-8">
      <div className="w-full max-w-5xl mx-auto font-[Poppins]">
        Click Your Snapshot📷

        <h1 className="text-orange-500 text-xl font-bold text-gray-900 px-1 mb-4">
          Food Fantasy
        </h1>

        {/* Pinterest Masonry Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="
            columns-2
            sm:columns-2
            lg:columns-3
            xl:columns-4
            gap-2
          "
        >
          {images.map((src, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              onClick={() => setViewImage(src)}
              className="
                mb-2
                rounded-lg
                overflow-hidden
                bg-white
                shadow
                border border-gray-200
                cursor-pointer
                transition-all
                hover:scale-[1.02]
              "
            >
              <img
                src={src}
                alt=""
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </motion.div>

        {/* =======================
           FULLSCREEN IMAGE VIEWER
        ======================== */}
        <AnimatePresence>
          {viewImage && (
            <motion.div
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewImage(null)}
            >
              {/* Close Button */}
              <button
                className="absolute top-5 right-5 text-white text-3xl font-bold"
                onClick={() => setViewImage(null)}
              >
                ✕
              </button>

              <motion.img
                src={viewImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] rounded-lg"
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.7 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CafePinterestGrid;
