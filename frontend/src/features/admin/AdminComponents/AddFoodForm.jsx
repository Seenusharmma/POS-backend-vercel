import React from "react";
import { motion } from "framer-motion";

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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-lg sm:rounded-xl shadow-md p-4 sm:p-6 md:p-8"
    >
      <h3 className="font-bold text-xl sm:text-2xl mb-6 text-gray-800 text-center">
        {editMode ? "✏️ Edit Food Item" : "➕ Add New Food Item"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Form Fields */}
        <div className="space-y-5">
          {/* Food Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Food Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={foodForm.name}
              onChange={onFormChange}
              placeholder="e.g., Margherita Pizza"
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <input
              name="category"
              value={foodForm.category}
              onChange={onFormChange}
              placeholder="e.g., Pizza, Burger, Pasta"
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={foodForm.type}
              onChange={onFormChange}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">Select Type</option>
              <option value="Veg">🟢 Veg</option>
              <option value="Non-Veg">🔴 Non-Veg</option>
              <option value="Other">⚪ Other</option>
            </select>
          </div>

          {/* Price - Only show if sizes are disabled */}
          {!foodForm.hasSizes && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
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
                  className="w-full border-2 border-gray-300 rounded-lg pl-10 pr-4 py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* Size Options Toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="hasSizes"
                checked={foodForm.hasSizes}
                onChange={onFormChange}
                className="w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 focus:ring-2 cursor-pointer"
              />
              <span className="text-sm font-semibold text-gray-700">
                Enable Size Options
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-8">
              Check this if the food item has different sizes with different prices
            </p>
          </div>

          {/* Size Type Selection - Show when hasSizes is enabled */}
          {foodForm.hasSizes && (
            <div className="mb-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Size Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sizeType"
                    value="standard"
                    checked={foodForm.sizeType === "standard"}
                    onChange={onFormChange}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Small, Medium, Large</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sizeType"
                    value="half-full"
                    checked={foodForm.sizeType === "half-full"}
                    onChange={onFormChange}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500 focus:ring-2 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700">Half, Full</span>
                </label>
              </div>
            </div>
          )}

          {/* Standard Size Prices - Show when hasSizes is enabled and sizeType is standard */}
          {foodForm.hasSizes && foodForm.sizeType === "standard" && (
            <div className="space-y-3 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Size Prices (₹) <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Small Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Small
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">
                      ₹
                    </span>
                    <input
                      name="size_Small"
                      type="number"
                      value={foodForm.sizes?.Small || ""}
                      onChange={onFormChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Medium Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Medium
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">
                      ₹
                    </span>
                    <input
                      name="size_Medium"
                      type="number"
                      value={foodForm.sizes?.Medium || ""}
                      onChange={onFormChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Large Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Large
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">
                      ₹
                    </span>
                    <input
                      name="size_Large"
                      type="number"
                      value={foodForm.sizes?.Large || ""}
                      onChange={onFormChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Half/Full Size Prices - Show when hasSizes is enabled and sizeType is half-full */}
          {foodForm.hasSizes && foodForm.sizeType === "half-full" && (
            <div className="space-y-3 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Size Prices (₹) <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Half Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Half
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">
                      ₹
                    </span>
                    <input
                      name="halfFull_Half"
                      type="number"
                      value={foodForm.halfFull?.Half || ""}
                      onChange={onFormChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Full Size */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Full
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-semibold">
                      ₹
                    </span>
                    <input
                      name="halfFull_Full"
                      type="number"
                      value={foodForm.halfFull?.Full || ""}
                      onChange={onFormChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="w-full border-2 border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Image Upload */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Food Image <span className="text-red-500">*</span>
            </label>

            {/* Drag and Drop Area */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-orange-500 bg-orange-50 scale-105"
                  : "border-gray-300 hover:border-orange-400 hover:bg-gray-50"
              } ${compressing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {preview ? (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="preview"
                      className="w-full max-w-xs h-48 rounded-lg border-2 border-gray-200 object-cover shadow-md mx-auto"
                    />
                    {compressionInfo && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {compressionInfo.compressed} MB
                      </div>
                    )}
                    <button
                      onClick={onRemoveImage}
                      className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-all"
                    >
                      ×
                    </button>
                  </div>
                  {compressionInfo && !compressing && (
                    <div className="text-xs bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-700 font-semibold mb-1">
                        ✅ Compression Complete
                      </p>
                      <p className="text-green-600">
                        {compressionInfo.original} MB → {compressionInfo.compressed} MB
                      </p>
                      <p className="text-green-600 font-bold">
                        Reduced by {compressionInfo.reduction}%
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    Drag & drop another image or click to change
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-orange-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-700 font-semibold mb-1">
                      Drag & drop your image here
                    </p>
                    <p className="text-sm text-gray-500">or</p>
                  </div>
                </div>
              )}

              {compressing && (
                <div className="flex flex-col items-center gap-2 mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <span className="text-sm text-orange-600 font-medium">
                    Compressing image...
                  </span>
                </div>
              )}

              {/* Manual Upload Button */}
              <label className="mt-4 inline-block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  disabled={compressing}
                  className="hidden"
                />
                <span
                  className={`inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg cursor-pointer transition-all shadow-md hover:shadow-lg ${
                    compressing ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  {preview ? "Change Image" : "Browse Files"}
                </span>
              </label>
              <p className="text-xs text-gray-400 mt-2">
                Supported: JPG, PNG, WEBP (Max: 5MB)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end">
        {editMode && (
          <button
            onClick={onReset}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            Cancel
          </button>
        )}
        <button
          onClick={onSave}
          disabled={compressing}
          className={`px-6 py-3 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg ${
            editMode
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-green-600 hover:bg-green-700"
          } ${compressing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {compressing ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

