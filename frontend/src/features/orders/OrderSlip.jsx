import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaDownload, FaShare, FaCheckCircle } from "react-icons/fa";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import toast, { Toaster } from "react-hot-toast";

const OrderSlip = ({ 
  isOpen, 
  onClose, 
  orders, 
  totalAmount, 
  tableNumber, 
  selectedChairsCount,
  isInRestaurant,
  userName,
  userEmail,
  orderDate
}) => {
  const slipRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;
  
  // If no orders, show a message
  if (!orders || orders.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        >
          <div className="text-center">
            <p className="text-gray-600 mb-4">No order data available</p>
            <button
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Calculate totals
  const subtotal = orders.reduce((sum, order) => sum + (order.price || 0), 0);
  const gst = subtotal * 0.05;
  const total = subtotal + gst;

  // Format date
  const formattedDate = orderDate 
    ? new Date(orderDate).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  // Generate Order ID - handle both _id and id fields
  const firstOrder = orders[0] || {};
  const orderId = firstOrder._id 
    ? firstOrder._id.slice(-8).toUpperCase() 
    : firstOrder.id 
    ? firstOrder.id.slice(-8).toUpperCase()
    : "ORDER" + Date.now().toString().slice(-8);


  // Download as PDF
  const handleDownloadPDF = async () => {
    if (!slipRef.current) {
      toast.error("Order slip content not available");
      return;
    }
    
    setIsGenerating(true);
    try {
      // Wait a bit to ensure the element is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const element = slipRef.current;
      if (!element) {
        throw new Error("Element not found");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        allowTaint: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      if (!canvas) {
        throw new Error("Failed to generate canvas");
      }

      const imgData = canvas.toDataURL("image/png");
      
      if (!imgData || imgData === "data:," || imgData.length < 100) {
        throw new Error("Failed to generate image data");
      }

      // Calculate dimensions - use A4 format
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth; // Maintain aspect ratio
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calculate position to center if needed
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const widthRatio = pageWidth / pdfWidth;
      const heightRatio = pageHeight / pdfHeight;
      const ratio = Math.min(widthRatio, heightRatio);
      
      const finalWidth = pdfWidth * ratio;
      const finalHeight = pdfHeight * ratio;
      const xOffset = (pageWidth - finalWidth) / 2;
      const yOffset = 0;

      // Add image to PDF
      pdf.addImage(imgData, "PNG", xOffset, yOffset, finalWidth, finalHeight);

      // Save PDF
      pdf.save(`OrderSlip_${orderId}_${Date.now()}.pdf`);
      toast.success("PDF downloaded successfully!");
      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(`Failed to generate PDF: ${error.message || "Unknown error"}`);
      setIsGenerating(false);
    }
  };

  // Download as Image
  const handleDownloadImage = async () => {
    if (!slipRef.current) {
      toast.error("Order slip content not available");
      return;
    }
    
    setIsGenerating(true);
    try {
      // Wait a bit to ensure the element is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const element = slipRef.current;
      if (!element) {
        throw new Error("Element not found");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        allowTaint: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      if (!canvas) {
        throw new Error("Failed to generate canvas");
      }

      const imgData = canvas.toDataURL("image/png");
      
      if (!imgData || imgData === "data:," || imgData.length < 100) {
        throw new Error("Failed to generate image data");
      }

      const link = document.createElement("a");
      link.download = `OrderSlip_${orderId}_${Date.now()}.png`;
      link.href = imgData;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Image downloaded successfully!");
      setIsGenerating(false);
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error(`Failed to generate image: ${error.message || "Unknown error"}`);
      setIsGenerating(false);
    }
  };

  // Share functionality
  const handleShare = async () => {
    if (!slipRef.current) {
      toast.error("Order slip content not available");
      return;
    }

    setIsGenerating(true);
    try {
      // Wait a bit to ensure the element is fully rendered
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const element = slipRef.current;
      if (!element) {
        throw new Error("Element not found");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        allowTaint: false,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      if (!canvas) {
        throw new Error("Failed to generate canvas");
      }

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("Failed to generate image for sharing");
          setIsGenerating(false);
          return;
        }

        try {
          if (navigator.share) {
            const file = new File([blob], `OrderSlip_${orderId}.png`, {
              type: "image/png",
            });

            // Check if Web Share API supports files
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: `Order Slip - ${orderId}`,
                text: `Order from FoodFantasy - Total: ₹${total.toFixed(2)}`,
                files: [file],
              });
              toast.success("Order slip shared successfully!");
              setIsGenerating(false);
            } else {
              // Fallback: share text
              const shareData = {
                title: `Order Slip - ${orderId}`,
                text: `Order from FoodFantasy - Total: ₹${total.toFixed(2)}\nOrder ID: ${orderId}`,
              };
              if (navigator.canShare(shareData)) {
                await navigator.share(shareData);
                toast.success("Order details shared!");
                setIsGenerating(false);
              } else {
                // Copy to clipboard as fallback
                try {
                  await navigator.clipboard.writeText(
                    `Order Slip - ${orderId}\nOrder from FoodFantasy - Total: ₹${total.toFixed(2)}`
                  );
                  toast.success("Order details copied to clipboard!");
                  setIsGenerating(false);
                } catch (err) {
                  console.error("Clipboard error:", err);
                  handleDownloadImage();
                }
              }
            }
          } else {
            // Fallback: copy image to clipboard or download
            try {
              if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                  new ClipboardItem({ "image/png": blob }),
                ]);
                toast.success("Order slip copied to clipboard!");
                setIsGenerating(false);
              } else {
                // Final fallback: download
                handleDownloadImage();
              }
            } catch (err) {
              console.error("Clipboard error:", err);
              // Final fallback: download
              handleDownloadImage();
            }
          }
        } catch (error) {
          console.error("Error sharing:", error);
          toast.error("Sharing failed. Downloading instead...");
          // Fallback to download
          handleDownloadImage();
        }
      }, "image/png");
    } catch (error) {
      console.error("Error generating share image:", error);
      toast.error(`Failed to share: ${error.message || "Unknown error"}`);
      setIsGenerating(false);
    }
  };

  return (
    <>
    <Toaster />
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-800">📄 Order Slip</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Order Slip Content */}
        <div className="p-4">
          {/* Printable Slip */}
          <div
            ref={slipRef}
            className="bg-white p-6 border-2 border-dashed border-gray-300 rounded-lg"
            style={{ 
              minWidth: "280px",
              backgroundColor: "#ffffff",
              color: "#000000"
            }}
          >
            {/* Header */}
            <div className="text-center mb-4 border-b-2 border-gray-800 pb-3" style={{ borderColor: "#1f2937", color: "#000000" }}>
              <h1 className="text-2xl font-bold" style={{ color: "#111827" }}>🍽️ FoodFantasy</h1>
              <p className="text-xs mt-1" style={{ color: "#4b5563" }}>Delicious Food, Delivered Fresh</p>
            </div>

            {/* Order Info */}
            <div className="mb-4 space-y-2 text-sm" style={{ color: "#000000" }}>
              <div className="flex justify-between">
                <span style={{ color: "#4b5563" }}>Order ID:</span>
                <span className="font-semibold" style={{ color: "#000000" }}>#{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#4b5563" }}>Date:</span>
                <span className="font-semibold" style={{ color: "#000000" }}>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#4b5563" }}>Customer:</span>
                <span className="font-semibold" style={{ color: "#000000" }}>{userName || "Guest"}</span>
              </div>
              {isInRestaurant ? (
                <div className="flex justify-between">
                  <span style={{ color: "#4b5563" }}>Table:</span>
                  <span className="font-semibold" style={{ color: "#000000" }}>#{tableNumber} ({selectedChairsCount} chair{selectedChairsCount > 1 ? "s" : ""})</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span style={{ color: "#4b5563" }}>Type:</span>
                  <span className="font-semibold" style={{ color: "#2563eb" }}>🚚 Delivery</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="mb-4 border-t border-b py-3" style={{ borderColor: "#d1d5db" }}>
              <h3 className="font-bold text-sm mb-2" style={{ color: "#1f2937" }}>Items:</h3>
              {orders.map((order, index) => (
                <div key={index} className="mb-2 pb-2 border-b last:border-0" style={{ borderColor: "#e5e7eb" }}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: "#111827" }}>
                        {order.foodName || order.name}
                      </p>
                      <p className="text-xs" style={{ color: "#4b5563" }}>
                        {order.type} • {order.category}
                      </p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="font-semibold text-sm" style={{ color: "#000000" }}>₹{Number(order.price || 0).toFixed(2)}</p>
                      <p className="text-xs" style={{ color: "#4b5563" }}>Qty: {order.quantity || 1}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mb-4 space-y-1 text-sm" style={{ color: "#000000" }}>
              <div className="flex justify-between">
                <span style={{ color: "#4b5563" }}>Subtotal:</span>
                <span className="font-semibold" style={{ color: "#000000" }}>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#4b5563" }}>GST (5%):</span>
                <span className="font-semibold" style={{ color: "#000000" }}>₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t-2 pt-2 mt-2" style={{ borderColor: "#1f2937" }}>
                <span style={{ color: "#000000" }}>Total:</span>
                <span style={{ color: "#dc2626" }}>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mb-4 p-2 rounded text-center" style={{ backgroundColor: "#f0fdf4", borderColor: "#bbf7d0", borderWidth: "1px", borderStyle: "solid" }}>
              <div className="flex items-center justify-center gap-2">
                <FaCheckCircle style={{ color: "#16a34a" }} />
                <span className="text-sm font-semibold" style={{ color: "#15803d" }}>Payment Successful</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs border-t pt-3" style={{ color: "#6b7280", borderColor: "#d1d5db" }}>
              <p style={{ color: "#6b7280" }}>Thank you for your order!</p>
              <p className="mt-1" style={{ color: "#6b7280" }}>Visit us again soon 🎉</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              <FaDownload />
              <span>{isGenerating ? "Generating..." : "Download PDF"}</span>
            </button>
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              <FaDownload />
              <span>{isGenerating ? "Generating..." : "Download Image"}</span>
            </button>
            <button
              onClick={handleShare}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              <FaShare />
              <span>Share</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
    </>
  );
};

export default OrderSlip;

