import React from "react";
import { Link } from "react-router-dom";
import { IoLocationSharp } from "react-icons/io5";
import { CgWebsite } from "react-icons/cg";
import { FaClock } from "react-icons/fa";

const Footer = () => {
  return (
    <>
      <div className="border-gray-200 text-gray-700 bg-gradient-to-t from-gray-50 via-white to-gray-50">
        <div className="container bg-white backdrop-blur-sm rounded-t-4xl shadow-lg transition-all duration-500">
          {/* Heading Section */}
          <h1 className="py-10 text-4xl font-extrabold text-center tracking-wide text-orange-500">
            Visit Us
          </h1>

          {/* Grid Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-14 border-b-2 border-orange-200 pb-6 px-6 md:px-12">
            {/* Address Section */}
            <div className="text-center space-y-4 hover:scale-105 transition-transform duration-300 ease-in-out">
              <div className="flex justify-center">
                <IoLocationSharp className="text-4xl text-orange-500" />
              </div>
              <p className="text-gray-700 leading-relaxed">
                Food Fantasy, 6P9M+JM6, Mahura,
                <br /> Bhubaneswar, Odisha,
                <br /> 752054
              </p>
            </div>

            {/* Website Section */}
            <div className="text-center space-y-4 hover:scale-105 transition-transform duration-300 ease-in-out">
              <div className="flex justify-center">
                <CgWebsite className="text-4xl text-orange-500" />
              </div>
              <Link
                to="https://www.instagram.com/foodfantasybbsr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-600 transition-colors duration-300 underline-offset-4 decoration-orange-300"
              >
                instagram.com/foodfantasybbsr
              </Link>
            </div>

            {/* Timing Section */}
            <div className="text-center space-y-4 hover:scale-105 transition-transform duration-300 ease-in-out">
              <div className="flex justify-center">
                <FaClock className="text-4xl text-orange-500" />
              </div>
              <p className="text-gray-700 leading-relaxed">
                Opens:
                <br />
                Monday–Friday: 9am – 10pm
                <br />
                Saturday–Sunday: 9am – 10pm
              </p>
            </div>
          </div>
          {/* Copyright Section */}
          <div className="flex justify-center p-4 items-center text-gray-600">
            <p>&copy; 2025 Food Fantasy, All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;