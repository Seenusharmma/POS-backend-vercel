import React, { useState } from "react";
import PaymentQR from "../Payment/PaymentQR";

const LiveOrderCard = ({ order, upiID, payeeName }) => {
  const [showQR, setShowQR] = useState(false);

  const upiLink = `upi://pay?pa=${upiID}&pn=${payeeName}&am=${Number(
    order.price
  ).toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Order for ${order.foodName}`
  )}`;

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
        <span
          className={`font-semibold ${
            order.status === "Order"
              ? "text-yellow-600"
              : order.status === "Served"
              ? "text-green-600"
              : "text-gray-600"
          }`}
        >
          {order.status}
        </span>
      </p>

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
};

export default LiveOrderCard;