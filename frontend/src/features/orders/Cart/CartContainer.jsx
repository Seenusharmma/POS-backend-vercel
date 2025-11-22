import React from "react";
import CartItem from "./CartItem";

const CartContainer = ({ cart, updateQuantity, removeItem }) => {
  return (
    <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-6">
      {cart.map((item, i) => (
        <CartItem
          key={item._id}
          item={item}
          index={i}
          updateQuantity={updateQuantity}
          removeItem={removeItem}
        />
      ))}
    </div>
  );
};

export default CartContainer;
