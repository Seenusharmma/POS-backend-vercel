import React from "react";
import {motion } from "framer-motion";
import { FaInfoCircle, FaDollarSign, FaImage, FaRuler } from "react-icons/fa";

/**
 * Add/Edit Food Form Component
 * Handles adding and editing food items with image upload
 */
const AddFoodForm = ({
  foodForm,
  editMode,
  preview,
  compressing,
  compressionInfo,
  isDragging,
  onFormChange,
  onImageChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveImage,
  onSave,
  onReset,
}) => {
  return (
    <motion.div
      key="addFood"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg p-6 sm:p-8 text-center">
        <h2 className="font-bold text-2xl sm:text-3xl text-white mb-2">
          {editMode ? "✏️ Edit Food Item" : "➕ Add New Food Item"}
        </h2>
        <p className="text-orange-50 text-sm sm:text-base">
          Fill in the details below to {editMode ? "update" : "add"} your menu item
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Basic Info & Pricing */}
        <div className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <FaInfoCircle className="text-blue-500 text-lg" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Basic Information</h3>
            </div>

            <div className="space-y-4">
              {/* Food Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Food Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={foodForm.name}
                  onChange={onFormChange}
                  placeholder="e.g., Margherita Pizza"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all hover:border-gray-300"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  name="category"
                  value={foodForm.category}
                  onChange={onFormChange}
                  placeholder="e.g., Pizza, Burger, Pasta"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all hover:border-gray-300"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={foodForm.type}
                  onChange={onFormChange}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all bg-white hover:border-gray-300"
                >
                  <option value="">Select Type</option>
                  <option value="Veg">🟢 Veg</option>
                  <option value="Non-Veg">🔴 Non-Veg</option>
                  <option value="Other">⚪ Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <FaDollarSign className="text-green-500 text-lg" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Pricing</h3>
            </div>

            {/* Size Options Toggle */}
            <div className="mb-5 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="hasSizes"
                  checked={foodForm.hasSizes}
                  onChange={onFormChange}
                  className="w-5 h-5 mt-0.5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-bold text-gray-800 block">
                    Enable Multiple Sizes
                  </span>
                  <p className="text-xs text-gray-600 mt-1">
                    Check this if the item has different sizes with different prices
                  </p>
                </div>
              </label>
            </div>

            {/* Simple Price - Only show if sizes are disabled */}
            {!foodForm.hasSizes && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold text-lg">
                    ₹
                  </span>
                  <input
                    name="price"
                    type="number"
                    value={foodForm.price}
                    onChange={onFormChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full border-2 border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all hover:border-gray-300"
                  />
                </div>
              </div>
            )}

            {/* Size Options */}
            {foodForm.hasSizes && (
              <div className="space-y-4">
                {/* Size Type Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    <FaRuler className="inline mr-2 text-orange-500" />
                    Size Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      foodForm.sizeType === "standard" 
                        ? "border-orange-500 bg-orange-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input
                        type="radio"
                        name="sizeType"
                        value="standard"
                        checked={foodForm.sizeType === "standard"}
                        onChange={onFormChange}
                        className="w-4 h-4 text-orange-500"
                      />
                      <span className="text-sm font-semibold text-gray-700">S / M / L</span>
                    </label>
                    <label className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      foodForm.sizeType === "half-full" 
                        ? "border-orange-500 bg-orange-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                      <input
                        type="radio"
                        name="sizeType"
                        value="half-full"
                        checked={foodForm.sizeType === "half-full"}
                        onChange={onFormChange}
                        className="w-4 h-4 text-orange-500"
                      />
                      <span className="text-sm font-semibold text-gray-700">Half / Full</span>
                    </label>
                  </div>
                </div>

                {/* Standard Size Prices */}
                {foodForm.sizeType === "standard" && (
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Size Prices (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["Small", "Medium", "Large"].map((size) => (
                        <div key={size}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            {size}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-bold">
                              ₹
                            </span>
                            <input
                              name={`size_${size}`}
                              type="number"
                              value={foodForm.sizes?.[size] || ""}
                              onChange={onFormChange}
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="w-full border-2 border-orange-200 rounded-lg pl-7 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Half/Full Size Prices */}
                {foodForm.sizeType === "half-full" && (
                  <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-100">
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Size Prices (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Half", "Full"].map((size) => (
                        <div key={size}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            {size}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-bold">
                              ₹
                            </span>
                            <input
                              name={`halfFull_${size}`}
                              type="number"
                              value={foodForm.halfFull?.[size] || ""}
                              onChange={onFormChange}
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="w-full border-2 border-orange-200 rounded-lg pl-7 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Image Upload */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <FaImage className="text-purple-500 text-lg" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Food Image</h3>
            </div>

            {/* Drag and Drop Area */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`relative border-3 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-orange-500 bg-orange-50 scale-[1.02]"
                  : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/30"
              } ${compressing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {preview ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full max-w-sm h-64 rounded-xl border-2 border-gray-200 object-cover shadow-lg mx-auto"
                    />
                    {compressionInfo && (
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-bold">
                        {compressionInfo.compressed} MB
                      </div>
                    )}
                    <button
                      onClick={onRemoveImage}
                      className="absolute -top-2 -left-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold shadow-lg transition-all hover:scale-110"
                    >
                      ×
                    </button>
                  </div>
                  {compressionInfo && !compressing && (
                    <div className="text-xs bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <p className="text-green-700 font-bold mb-1">
                        ✅ Compression Complete
                      </p>
                      <p className="text-green-600">
                        {compressionInfo.original} MB → {compressionInfo.compressed} MB
                      </p>
                      <p className="text-green-700 font-bold mt-1">
                        🎉 Reduced by {compressionInfo.reduction}%
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 font-medium">
                    Drag & drop another image or click to change
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                      <FaImage className="text-3xl text-orange-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-700 font-bold text-lg mb-1">
                      Drag & drop your image here
                    </p>
                    <p className="text-sm text-gray-500">or</p>
                  </div>
                </div>
              )}

              {compressing && (
                <div className="flex flex-col items-center gap-3 mt-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-500"></div>
                  <span className="text-sm text-orange-600 font-bold">
                    Compressing image...
                  </span>
                </div>
              )}

              {/* Manual Upload Button */}
              <label className="mt-6 inline-block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  disabled={compressing}
                  className="hidden"
                />
                <span
                  className={`inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    compressing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <FaImage className="text-lg" />
                  {preview ? "Change Image" : "Browse Files"}
                </span>
              </label>
              <p className="text-xs text-gray-400 mt-3 font-medium">
                Supported: JPG, PNG, WEBP (Max: 5MB)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end bg-white rounded-2xl shadow-md border border-gray-100 p-6">
        {editMode && (
          <button
            onClick={onReset}
            className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            Cancel
          </button>
        )}
        <button
          onClick={onSave}
          disabled={compressing}
          className={`px-8 py-3 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
            editMode
              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          } ${compressing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {compressing ? (
            <span className="flex items-center gap-2 justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Processing...
            </span>
          ) : editMode ? (
            "✏️ Update Food"
          ) : (
            "➕ Add Food"
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default AddFoodForm;
