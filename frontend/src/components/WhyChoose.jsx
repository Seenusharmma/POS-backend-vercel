
import React from "react";
import { MdDeliveryDining, MdDinnerDining } from "react-icons/md";
import { SiFresh } from "react-icons/si";
import { RiMoneyRupeeCircleFill } from "react-icons/ri";

const WhyChoose = () => {
  return (
    <>
      <div className="py-14 md:py-28 bg-gray-50 shadow-2xl">
        <div className="container">
          {/* Heading Section */}
          <h1 className="pb-16 tracking-wider text-2xl font-semibold text-dark text-center">
            Why Choose Us
          </h1>

          {/* Card Section */}
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-14 sm:gap-4">
              {/* 1st card */}
              <div className="text-center flex justify-center items-center flex-col gap-1 px-2">
                <p className="text-dark/70 font-semibold">
                  Enjoy{" "}
                  <span className="text-[#f9b12b] font-semibold text-xl">
                    free delivery
                  </span>{" "}
                  on all orders within 3 KM — Fast, Fresh, and Free!
                </p>
                <p className="text-5xl rotate-90 text-[#f9b12b] text-center translate-x-5">
                  ....
                </p>
                <MdDeliveryDining className="text-5xl text-[#f9b12b]" />
              </div>
              {/* 2nd card */}
              <div className="text-center flex justify-center items-center flex-col gap-1 px-2">
                <MdDinnerDining className="text-5xl text-[#ef4444]" />
                <p className="text-5xl rotate-90 text-[#ef4444] text-center translate-x-5">
                  ....
                </p>
                <p className="text-dark/70 font-semibold">
                  Whether you dine in or order online, we make sure your
                  experience is{" "}
                  <span className="text-[#ef4444] font-semibold text-xl">
                    smooth, quick,
                  </span>{" "}
                  and satisfying.
                </p>
              </div>
              {/* 3rd card */}
              <div className="text-center flex justify-center items-center flex-col gap-1 px-2">
                <p className="text-dark/70 font-semibold">
                  Every dish is made using{" "}
                  <span className="text-[#22c55e] font-semibold text-xl">
                    farm-fresh
                  </span>{" "}
                  locally sourced ingredients that bring out the best in flavor
                  and nutrition.
                </p>
                <p className="text-5xl rotate-90 text-[#22c55e] text-center translate-x-5">
                  ....
                </p>
                <SiFresh className="text-5xl text-[#22c55e]" />
              </div>
              {/* 4th card */}
              <div className="text-center flex justify-center items-center flex-col gap-1 px-2">
                <RiMoneyRupeeCircleFill className="text-5xl text-[#0ea5e9]" />
                <p className="text-5xl rotate-90 text-[#0ea5e9] text-center translate-x-5">
                  ....
                </p>
                <p className="text-dark/70 font-semibold">
                  Enjoy gourmet flavors at prices that make you smile —{" "}
                  <span className="text-[#0ea5e9] font-semibold text-xl">
                    great taste, fair price.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WhyChoose;
