import React from "react";

const PaymentQR = ({ price, upiLink, paymentStatus, showQR, setShowQR }) => {
  return (
    <div className="mt-4 border-t pt-3 text-center">
      {paymentStatus === "Paid" ? (
        <p className="text-green-600 font-semibold">✅ Payment Successful</p>
      ) : !showQR ? (
        <button
          onClick={() => setShowQR(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          💳 Pay Now
        </button>
      ) : (
        <>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
              upiLink
            )}`}
            className="w-36 h-36 mx-auto my-3 border rounded-lg"
          />
          <a
            href={upiLink}
            className="block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            💰 Pay ₹{Number(price).toFixed(2)}
          </a>
        </>
      )}
    </div>
  );
};

export default PaymentQR;
