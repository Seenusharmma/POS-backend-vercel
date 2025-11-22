import React from "react";

const categories = [
  {
    name: "Vegetarian",
    desc: "At Food Fantacy, we celebrate nature’s finest produce — from fresh vegetables and fruits to grains, pulses, dairy, and flavorful herbs — crafted into delicious, healthy, and satisfying meals that nourish both body and soul.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSOTWnFdAlWmtDL8ZcsxOytzhsMMTPnpoWZow&s",
  },
  {
    name: "Non-Vegetarian",
    desc: "At Food Fantacy, we bring you premium, responsibly sourced ingredients prepared with authentic recipes to create hearty, satisfying meals for every food lover.",
    image:
      "https://images.onlymyhealth.com/imported/images/2022/December/28_Dec_2022/main_Nonvegvsvegdiet.jpg",
  },
  {
    name: "Beverages",
    desc: "Beverages at Food Fantacy are all about refreshment and flavor in every sip. From energizing coffees and teas to fresh juices, smoothies, and cool drinks — we offer a delightful range of thirst-quenchers crafted to complement every meal and mood.",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS96Q0iwcSEeRQkT-nrA2p4PvU3ldB6W1i-Mw&s",
  },
];

const Category = () => {
  return (
    <div className="px-[8%] lg:px-[12%] py-20 bg-linear-to-b from-yellow-50 via-white to-gray-50">
       {/* Heading Section */}
          <h1 className="pb-16 tracking-wider text-3xl font-semibold text-dark text-center">
            What We Provide?
          </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((cat, index) => (
          <div
            key={index}
            className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-center relative overflow-hidden border border-gray-100 hover:border-yellow-400 hover:-translate-y-2"
          >
            {/* Decorative background glow */}
            <div className="absolute inset-0 bg-linear-to-br from-yellow-100/20 via-transparent to-gray-100/10 opacity-0 group-hover:opacity-100 transition-all duration-300 blur-xl"></div>

            {/* Image */}
            <div className="flex justify-center mb-6 relative z-10">
              <img
                src={cat.image}
                alt={cat.name}
                className="h-52 w-52 object-cover rounded-2xl shadow-md transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            {/* Text Content */}
            <h3 className="text-2xl font-bold text-gray-800 mb-3 relative z-10 group-hover:text-yellow-500 transition-colors">
              {cat.name}
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed relative z-10 px-2">
              {cat.desc}
            </p>

            {/* Decorative Line */}
            <div className="mt-6 h-1 w-0 bg-yellow-400 mx-auto rounded-full transition-all duration-500 group-hover:w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Category;