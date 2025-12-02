import React from "react";
import { motion } from "framer-motion";
import { FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import API_BASE from "../../../config/api";

/**
 * Responsive Food Card Component
 * Optimized for mobile + tablets + desktops
 */
const FoodCard = ({ food, onEdit, onDelete, onToggleAvailability }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="
        bg-white 
        rounded-2xl 
        shadow-sm 
        hover:shadow-xl 
        transition-all 
        duration-300 
        overflow-hidden 
        border 
        border-gray-100
        group
        flex flex-col
        h-full
      "
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={
            food.image && food.image.startsWith("http")
              ? food.image
              : food.image
              ? `${API_BASE}${food.image}`
              : "https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Image"
          }
          alt={food.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.src =
              "https://placehold.co/400x300/f3f4f6/9ca3af?text=No+Image";
          }}
        />

        {/* Veg/Non-Veg Badge */}
        <div className="absolute top-3 right-3 z-10">
          <div
            className={`w-6 h-6 rounded-md flex items-center justify-center shadow-lg border-2 border-white ${
              food.type === "Veg"
                ? "bg-green-50"
                : food.type === "Non-Veg"
                ? "bg-red-50"
                : "bg-gray-50"
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${
               food.type === "Veg" ? "bg-green-600" : 
               food.type === "Non-Veg" ? "bg-red-600" : "bg-gray-500"
            }`}></div>
          </div>
        </div>

        {/* Out of Stock Overlay */}
        {!food.available && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
            <span className="bg-white/90 text-gray-900 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg transform -rotate-3 border border-gray-200">
              Out of Stock
            </span>
          </div>
        )}
        
        {/* Quick Actions Overlay (Visible on Hover) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
           <button
              onClick={() => onEdit(food)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-lg transform hover:scale-110"
              title="Edit"
           >
              <FaEdit />
           </button>
           <button
              onClick={() => onDelete(food._id)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg transform hover:scale-110"
              title="Delete"
           >
              <FaTrash />
           </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <div>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-md mb-2 inline-block">
                  {food.category}
                </span>
                <h3 className="font-bold text-lg text-gray-800 leading-tight line-clamp-2 min-h-[3rem]">
                  {food.name}
                </h3>
            </div>
        </div>

        {/* Price Section */}
        <div className="mt-auto pt-4 border-t border-gray-50">
            {food.hasSizes ? (
              <div className="space-y-1.5">
                {/* Half & Full */}
                {food.sizeType === "half-full" && food.halfFull ? (
                  <div className="flex justify-between text-sm">
                    {food.halfFull.Half && (
                      <div className="flex items-center gap-1">
                         <span className="text-gray-500 text-xs font-medium">Half</span>
                         <span className="font-bold text-gray-800">₹{Number(food.halfFull.Half).toFixed(0)}</span>
                      </div>
                    )}
                    {food.halfFull.Full && (
                      <div className="flex items-center gap-1">
                         <span className="text-gray-500 text-xs font-medium">Full</span>
                         <span className="font-bold text-gray-800">₹{Number(food.halfFull.Full).toFixed(0)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard size (S/M/L) */
                  <div className="flex flex-wrap gap-2 text-xs">
                    {food.sizes?.Small && (
                       <span className="bg-gray-50 px-2 py-1 rounded text-gray-600 font-medium border border-gray-100">
                          S: <span className="text-gray-900 font-bold">₹{Number(food.sizes.Small).toFixed(0)}</span>
                       </span>
                    )}
                    {food.sizes?.Medium && (
                       <span className="bg-gray-50 px-2 py-1 rounded text-gray-600 font-medium border border-gray-100">
                          M: <span className="text-gray-900 font-bold">₹{Number(food.sizes.Medium).toFixed(0)}</span>
                       </span>
                    )}
                    {food.sizes?.Large && (
                       <span className="bg-gray-50 px-2 py-1 rounded text-gray-600 font-medium border border-gray-100">
                          L: <span className="text-gray-900 font-bold">₹{Number(food.sizes.Large).toFixed(0)}</span>
                       </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Simple price */
              <div className="flex items-baseline gap-1">
                 <span className="text-sm text-gray-400 font-medium">Price:</span>
                 <span className="font-bold text-xl text-gray-900">
                   ₹{Number(food.price || 0).toFixed(0)}
                 </span>
              </div>
            )}
        </div>
        
        {/* Availability Toggle (Mobile friendly) */}
        <button
          onClick={() => onToggleAvailability(food._id, !food.available)}
          className={`
            w-full mt-4 
            py-2.5 
            rounded-xl 
            font-bold 
            text-xs
            uppercase
            tracking-wide
            transition-all
            flex items-center justify-center gap-2
            ${
              food.available
                ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200 border border-gray-300"
            }
          `}
        >
          {food.available ? <FaCheck /> : <FaTimes />}
          {food.available ? "Available" : "Unavailable"}
        </button>
      </div>
    </motion.div>
  );
};

export default FoodCard;
