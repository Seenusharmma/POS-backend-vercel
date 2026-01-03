import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaReceipt,
  FaChevronDown,
  FaChevronUp,
  FaShare,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";

const OrderHistoryCard = ({ orderGroup, onViewSlip }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const firstOrder = orderGroup[0];
  const totalAmount = orderGroup.reduce((sum, o) => sum + (o.price || 0), 0);
  const orderDate = new Date(firstOrder.createdAt);
  const orderId = firstOrder._id?.slice(-8).toUpperCase() || "ORDER";

  // Handle share
  const handleShare = async (e) => {
    e.stopPropagation();
    const shareText = `Order #${orderId} from FoodFantasy\nTotal: ₹${totalAmount.toFixed(2)}\nDate: ${orderDate.toLocaleDateString()}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order #${orderId}`,
          text: shareText,
        });
        toast.success("Order shared!");
      } catch (error) {
        if (error.name !== "AbortError") {
          navigator.clipboard.writeText(shareText);
          toast.success("Copied to clipboard!");
        }
      }
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  // Status Colors
  const getStatusColor = (status) => {
    switch (status) {
      case "Order": return "bg-amber-100 text-amber-700 border-amber-200";
      case "Preparing": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Served": return "bg-purple-100 text-purple-700 border-purple-200";
      case "Completed": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

const statusSteps = [
    { label: "Ordered", icon: "📝", color: "amber" },
    { label: "Preparing", icon: "👨‍🍳", color: "blue" },
    { label: "Served", icon: "🍽️", color: "purple" },
    { label: "Completed", icon: "✅", color: "emerald" },
  ];

  const getStatusStep = (status) => {
      const map = { "Order": 0, "Preparing": 1, "Served": 2, "Completed": 3 };
      return map[status] || 0;
  };

  const currentStep = getStatusStep(firstOrder.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 group"
    >
      {/* Card Header (clickable to expand) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 cursor-pointer relative"
      >
        <div className="flex justify-between items-start mb-4">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-gray-500 text-xs uppercase tracking-wider">#{orderId}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor(firstOrder.status)}`}>
                        {firstOrder.status}
                    </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {orderGroup.length} Item{orderGroup.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <FaClock className="text-gray-400 text-xs" />
                    {orderDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {orderDate.toLocaleTimeString(undefined, { hour: '2-digit', minute:'2-digit' })}
                </p>
            </div>
            <div className="text-right">
                <span className="block text-xl font-extrabold text-gray-900">₹{totalAmount.toFixed(0)}</span>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-md mt-1 inline-block">Paid</span>
            </div>
        </div>

        {/* Mini Progress Bar (Visible even when collapsed) */}
        <div className="flex items-center gap-1 mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            {statusSteps.map((step, idx) => (
                <div 
                    key={idx}
                    className={`h-full flex-1 transition-all duration-500 ${idx <= currentStep ? `bg-${step.color}-500` : 'bg-transparent'}`}
                />
            ))}
        </div>
        
        {/* Expand Icon */}
        <div className="absolute bottom-1 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400">
            {isExpanded ? <FaChevronUp/> : <FaChevronDown/>}
        </div>
      </div>

      {/* Expanded Actions & Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 bg-gray-50/50"
          >
            <div className="p-5 space-y-5">
              
              {/* Detailed Progress */}
               <div className="flex justify-between relative px-2">
                 {/* Line */}
                 <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-200 -z-10" />
                 
                  {statusSteps.map((step, idx) => {
                      const isAccomplished = idx <= currentStep;
                      // Dynamic color class mapping
                      const colorMap = {
                          amber: "text-amber-600 border-amber-600 bg-amber-50",
                          blue: "text-blue-600 border-blue-600 bg-blue-50",
                          purple: "text-purple-600 border-purple-600 bg-purple-50",
                          emerald: "text-emerald-600 border-emerald-600 bg-emerald-50"
                      };

                      return (
                        <div key={idx} className="flex flex-col items-center gap-1 bg-gray-50 px-1">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] transition-all ${isAccomplished ? colorMap[step.color] : "border-gray-300 bg-white text-gray-300"}`}>
                                {isAccomplished ? step.icon : null}
                            </div>
                            <span className={`text-[10px] font-medium ${isAccomplished ? "text-gray-800" : "text-gray-400"}`}>{step.label}</span>
                        </div>
                      )
                  })}
               </div>

              {/* Items List */}
              <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Order Details</h4>
                  {orderGroup.map((item) => (
                      <div key={item._id} className="flex justify-between items-center group/item hover:bg-white hover:shadow-sm p-2 rounded-lg transition-all">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-lg">🍲</div>
                              <div>
                                  <p className="text-sm font-semibold text-gray-800">{item.foodName}</p>
                                  <p className="text-xs text-gray-500">{item.quantity} x ₹{item.price ? (item.price/item.quantity).toFixed(0) : 0} {item.selectedSize && `• ${item.selectedSize}`}</p>
                              </div>
                          </div>
                          <span className="font-bold text-sm text-gray-900">₹{item.price}</span>
                      </div>
                  ))}
              </div>

               {/* Location */}
               {!firstOrder.isInRestaurant && firstOrder.deliveryLocation && (
                    <div className="flex gap-2 items-start bg-blue-50 p-3 rounded-lg border border-blue-100">
                        <FaMapMarkerAlt className="text-blue-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-blue-700 mb-0.5">Delivery Address</p>
                            <p className="text-xs text-blue-800 leading-relaxed">{firstOrder.deliveryLocation?.address || "Address not available"}</p>
                        </div>
                    </div>
               )}

              {/* Actions Footer */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                 <button 
                    onClick={handleShare}
                    className="flex justify-center items-center gap-2 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
                 >
                     <FaShare /> Share
                 </button>
                 <button 
                    onClick={(e) => { e.stopPropagation(); onViewSlip(orderGroup); }}
                    className="flex justify-center items-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
                 >
                     <FaReceipt /> Receipt
                 </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OrderHistoryCard;
