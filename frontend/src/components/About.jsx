import React from "react";
import { Link } from "react-router-dom";
import AboutBg from "../assets/AboutBg.png";
import Vector from "../assets/vector-wave.png";

const About = () => {
  const bgStyle = {
    backgroundImage: `url(${AboutBg})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "cover",
    width: "100%",
    height: "100%",
    position: "relative",
  };
  return (
    <>
      <div style={bgStyle} className="py-14 shadow-2xl">
        <div className="container min-h-[500px] relative z-10">
          <h1 className="pt-20 tracking-wider text-4xl font-semibold text-black text-center">
            About Us
          </h1>

          {/* Card Section */}
          <div className="bg-linear-to-br from-yellow-50 to-white p-10 my-10 rounded-2xl border border-yellow-200/70 max-w-4xl mx-auto text-gray-800 shadow-2xl">
            <p className="text-lg leading-relaxed text-center">
              At{" "}
              <span className="font-semibold text-yellow-600">
                Food Fantasy
              </span>
              , we believe food is more than just a meal — it’s an experience.
              Our journey began with a simple love for flavors, colors, and
              creativity. We take pride in crafting dishes that not only satisfy
              hunger but spark joy and imagination. Each plate we serve is
              inspired by global cuisines, artistic presentation, and a touch of
              fantasy. Whether you’re here for indulgent desserts, hearty meals,
              or unique culinary creations,
              <span className="font-semibold text-yellow-600">
                {" "}
                Food Fantasy
              </span>{" "}
              promises a dining experience that feels magical, flavorful, and
              unforgettable.
            </p>

            <div className="pt-10 flex justify-center">
              <Link
                to="/login"
                className="bg-orange-500 border border-orange-400 transition-all duration-300 ease-in-out text-white text-lg font-bold px-8 py-2 rounded-lg shadow-md hover:bg-orange-600"
              >
                Explore More!
              </Link>
            </div>
          </div>
        </div>
        {/* Wave Vector */}
        <div>
          <img src={Vector} alt="" className="absolute top-0 right-0 w-full" />
        </div>
      </div>
    </>
  );
};

export default About;