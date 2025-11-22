import React from "react";
import LiveOrderCard from "./LiveOrderCard";

const LiveOrdersSection = ({ orders, upiID, payeeName }) => {
  if (!orders.length) return null;

  return (
    <div className="mt-16 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-5 text-gray-800">📦 Your Live Orders</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((o) => (
          <LiveOrderCard
            key={o._id}
            order={o}
            upiID={upiID}
            payeeName={payeeName}
          />
        ))}
      </div>
    </div>
  );
};

export default LiveOrdersSection;
