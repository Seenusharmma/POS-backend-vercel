import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FaPlus, FaEdit, FaTrash, FaImage, FaTimes, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import API_BASE from "../../../config/api";

const OffersSection = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    active: true,
    validFrom: "",
    validUntil: "",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);

  // Fetch all offers
  const fetchOffers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/offers`);
      setOffers(res.data);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle image upload with compression
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setCompressing(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);
      setImage(compressedFile);
      setPreview(URL.createObjectURL(compressedFile));
      toast.success("Image ready!");
    } catch (error) {
      console.error("Error compressing image:", error);
      toast.error("Failed to process image");
    } finally {
      setCompressing(false);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error("Title and description are required");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("active", formData.active);
    if (formData.validFrom) formDataToSend.append("validFrom", formData.validFrom);
    if (formData.validUntil) formDataToSend.append("validUntil", formData.validUntil);
    if (image) formDataToSend.append("image", image);

    try {
      if (editMode) {
        await axios.put(`${API_BASE}/api/offers/${editId}?admin=true`, formDataToSend, {
          headers: { "x-admin-request": "true" },
        });
        toast.success("Offer updated successfully!");
      } else {
        await axios.post(`${API_BASE}/api/offers?admin=true`, formDataToSend, {
          headers: { "x-admin-request": "true" },
        });
        toast.success("Offer created successfully!");
      }

      fetchOffers();
      resetForm();
    } catch (error) {
      console.error("Error saving offer:", error);
      toast.error("Failed to save offer");
    }
  };

  // Edit offer
  const handleEdit = (offer) => {
    setEditMode(true);
    setEditId(offer._id);
    setFormData({
      title: offer.title,
      description: offer.description,
      active: offer.active,
      validFrom: offer.validFrom ? offer.validFrom.split("T")[0] : "",
      validUntil: offer.validUntil ? offer.validUntil.split("T")[0] : "",
    });
    setPreview(offer.image || null);
    setShowForm(true);
  };

  // Delete offer
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;

    try {
      await axios.delete(`${API_BASE}/api/offers/${id}?admin=true`, {
        headers: { "x-admin-request": "true" },
      });
      toast.success("Offer deleted successfully!");
      fetchOffers();
    } catch (error) {
      console.error("Error deleting offer:", error);
      toast.error("Failed to delete offer");
    }
  };

  // Toggle active status
  const toggleActive = async (offer) => {
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("active", !offer.active);

      await axios.put(`${API_BASE}/api/offers/${offer._id}?admin=true`, formDataToSend, {
        headers: { "x-admin-request": "true" },
      });
      toast.success(`Offer ${!offer.active ? "activated" : "deactivated"}!`);
      fetchOffers();
    } catch (error) {
      console.error("Error toggling offer status:", error);
      toast.error("Failed to update offer status");
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      active: true,
      validFrom: "",
      validUntil: "",
    });
    setImage(null);
    setPreview(null);
    setEditMode(false);
    setEditId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Manage Offers</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          {showForm ? <FaTimes /> : <FaPlus />}
          {showForm ? "Cancel" : "Add Offer"}
        </button>
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="text-xl font-semibold mb-4">
              {editMode ? "Edit Offer" : "Create New Offer"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., 50% Off on All Pizzas"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe your offer..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                {preview ? (
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-w-xs h-40 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FaImage className="mx-auto text-4xl text-gray-400 mb-2" />
                    <label className="cursor-pointer text-orange-500 hover:text-orange-600 font-medium">
                      {compressing ? "Compressing..." : "Click to upload image"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={compressing}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid From
                  </label>
                  <input
                    type="date"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {editMode ? "Update Offer" : "Create Offer"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No offers yet. Create your first offer!
          </div>
        ) : (
          offers.map((offer) => (
            <motion.div
              key={offer._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {offer.image && (
                <img
                  src={offer.image}
                  alt={offer.title}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-gray-800 flex-1">
                    {offer.title}
                  </h3>
                  <button
                    onClick={() => toggleActive(offer)}
                    className={`ml-2 ${
                      offer.active ? "text-green-500" : "text-gray-400"
                    } hover:scale-110 transition-transform`}
                    title={offer.active ? "Active" : "Inactive"}
                  >
                    {offer.active ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                  </button>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {offer.description}
                </p>
                {(offer.validFrom || offer.validUntil) && (
                  <div className="text-xs text-gray-500 mb-3">
                    {offer.validFrom && (
                      <div>From: {new Date(offer.validFrom).toLocaleDateString()}</div>
                    )}
                    {offer.validUntil && (
                      <div>Until: {new Date(offer.validUntil).toLocaleDateString()}</div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(offer)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(offer._id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default OffersSection;
