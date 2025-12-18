import React, { useState, useMemo } from "react";
import PaymentQR from "../Payment/PaymentQR";

// Move static mapping outside component (no re-creation)
const STATUS_COLOR = {
  Order: "text-yellow-600",
  Served: "text-green-600",
  Completed: "text-gray-600",
};

const LiveOrderCard = React.memo(({ order, upiID, payeeName }) => {
  const [showQR, setShowQR] = useState(false);

  // Memoize expensive string creation
  const upiLink = useMemo(() => {
    return `upi://pay?pa=${upiID}&pn=${payeeName}&am=${Number(
      order.price
    ).toFixed(2)}&cu=INR&tn=${encodeURIComponent(
      `Order for ${order.foodName}`
    )}`;
  }, [upiID, payeeName, order.price, order.foodName]);

  const statusColor =
    STATUS_COLOR[order.status] || "text-gray-600";

  return (
    <div className="bg-white border rounded-2xl p-5 shadow hover:shadow-md transition">
      <h4 className="font-semibold text-gray-800 text-lg">
        {order.foodName}
        {order.selectedSize && (
          <span className="ml-2 text-sm text-orange-600 font-semibold">
            ({order.selectedSize})
          </span>
        )}
      </h4>

      <p className="text-gray-500 capitalize">
        {order.category} • {order.type}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <p className="font-medium text-red-600">
          ₹{Number(order.price).toFixed(2)}
        </p>
        <p className="text-sm text-gray-600 font-semibold">
          Qty: {order.quantity || 1}
        </p>
      </div>

      <p className="text-sm mt-1">
        Status:{" "}
        <span className={`font-semibold ${statusColor}`}>
          {order.status}
        </span>
      </p>

      {/* Render QR only when needed */}
      {order.status === "Completed" && (
        <PaymentQR
          price={order.price}
          upiLink={upiLink}
          paymentStatus={order.paymentStatus}
          showQR={showQR}
          setShowQR={setShowQR}
        />
      )}
    </div>
  );
});

export default LiveOrderCard;
