import React from "react";
import { Link } from "react-router-dom";
import { IoLocationSharp, IoCallOutline, IoMailOutline } from "react-icons/io5";
import { FaClock, FaInstagram, FaFacebook, FaTwitter, FaPhone } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const isOpen = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 9 && hour < 22;
  };

  return (
    <footer className="hidden md:block relative bg-gradient-to-b from-white via-orange-50/30 to-gray-50 border-t border-orange-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
          {/* Brand Section */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              Food Fantasy
            </h2>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
              Serving delicious, fresh food with passion. Experience the best flavors in Bhubaneswar.
            </p>
            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-2">
              <motion.a
                href="https://www.instagram.com/foodfantasybbsr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaInstagram className="text-sm" />
              </motion.a>
              <motion.a
                href="#"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaFacebook className="text-sm" />
              </motion.a>
              <motion.a
                href="#"
                className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTwitter className="text-sm" />
              </motion.a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-lg font-bold text-gray-900">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-600 hover:text-orange-600 transition-colors duration-200 text-sm sm:text-base flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span>Home</span>
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-600 hover:text-orange-600 transition-colors duration-200 text-sm sm:text-base flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span>Menu</span>
                </Link>
              </li>
              <li>
                <Link to="/order" className="text-gray-600 hover:text-orange-600 transition-colors duration-200 text-sm sm:text-base flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span>Order</span>
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-gray-600 hover:text-orange-600 transition-colors duration-200 text-sm sm:text-base flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span>Order History</span>
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-lg font-bold text-gray-900">Contact Us</h3>
            <div className="space-y-3">
              <a 
                href="https://maps.google.com/?q=Food+Fantasy+Mahura+Bhubaneswar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 text-gray-600 hover:text-orange-600 transition-colors duration-200 group"
              >
                <IoLocationSharp className="text-xl text-orange-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <div className="text-sm sm:text-base">
                  <p className="font-medium">Food Fantasy</p>
                  <p className="text-gray-500">6P9M+JM6, Mahura,</p>
                  <p className="text-gray-500">Bhubaneswar, Odisha 752054</p>
                </div>
              </a>
              <a 
                href="tel:+919876543210"
                className="flex items-center gap-3 text-gray-600 hover:text-orange-600 transition-colors duration-200 group"
              >
                <FaPhone className="text-lg text-orange-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-sm sm:text-base">+91 98765 43210</span>
              </a>
              <a 
                href="mailto:info@foodfantasy.com"
                className="flex items-center gap-3 text-gray-600 hover:text-orange-600 transition-colors duration-200 group"
              >
                <HiOutlineMail className="text-xl text-orange-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="text-sm sm:text-base">info@foodfantasy.com</span>
              </a>
            </div>
          </motion.div>

          {/* Opening Hours */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-lg font-bold text-gray-900">Opening Hours</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                  <FaClock className="text-orange-500" />
                  <span className="text-sm sm:text-base text-gray-700 font-medium">Status</span>
                </div>
                <span className={`text-xs sm:text-sm font-semibold px-2 py-1 rounded-full ${
                  isOpen() 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isOpen() ? 'Open Now' : 'Closed'}
                </span>
              </div>
              <div className="space-y-1.5 text-sm sm:text-base">
                <div className="flex justify-between text-gray-600">
                  <span>Mon - Fri</span>
                  <span className="font-medium text-gray-900">9:00 AM - 10:00 PM</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Sat - Sun</span>
                  <span className="font-medium text-gray-900">9:00 AM - 10:00 PM</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Copyright Section */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p>&copy; {currentYear} Food Fantasy. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-orange-600 transition-colors">Privacy Policy</a>
            <span className="text-gray-300">|</span>
            <a href="#" className="hover:text-orange-600 transition-colors">Terms of Service</a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;