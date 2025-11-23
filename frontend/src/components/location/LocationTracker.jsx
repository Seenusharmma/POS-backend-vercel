import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaMapMarkerAlt, FaCrosshairs, FaLocationArrow, FaEdit } from "react-icons/fa";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

/**
 * LocationTracker Component
 * Real-time location tracking with auto-fill (Swiggy/Zomato style)
 */
const LocationTracker = ({ onLocationSelect, initialLocation = null }) => {
  const [location, setLocation] = useState(initialLocation || null);
  const [isTracking, setIsTracking] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("prompt"); // "prompt", "granted", "denied"
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const watchIdRef = useRef(null);

  // Check permission status
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((result) => {
          setPermissionStatus(result.state);
          result.onchange = () => {
            setPermissionStatus(result.state);
          };
        })
        .catch(() => {
          // Fallback if permissions API not supported
          setPermissionStatus("prompt");
        });
    } else {
      setPermissionStatus("prompt");
    }
  }, []);

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "FoodFantasyApp/1.0",
          },
        }
      );
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Handle location update
  const handleLocationUpdate = useCallback(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      const addressText = await reverseGeocode(lat, lng);

      const locationData = {
        latitude: lat,
        longitude: lng,
        address: addressText,
        accuracy: accuracy,
      };

      setLocation(locationData);
      setAddress(addressText);
      onLocationSelect(locationData);
    },
    [reverseGeocode, onLocationSelect]
  );

  // Request location permission and start tracking
  const requestLocationPermission = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    setPermissionStatus("prompt");

    // First, get current position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await handleLocationUpdate(position);
        setIsLoading(false);
        setPermissionStatus("granted");

        // Start watching position for real-time updates
        watchIdRef.current = navigator.geolocation.watchPosition(
          handleLocationUpdate,
          (error) => {
            console.error("Location watch error:", error);
            if (error.code === error.PERMISSION_DENIED) {
              setPermissionStatus("denied");
              setIsTracking(false);
              toast.error("Location permission denied. Please enable in browser settings.");
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );

        setIsTracking(true);
        toast.success("📍 Location tracking started!");
      },
      (error) => {
        setIsLoading(false);
        let errorMessage = "Failed to get location. ";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setPermissionStatus("denied");
            errorMessage += "Please allow location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again.";
            break;
          default:
            errorMessage += "Please try again.";
            break;
        }

        toast.error(errorMessage, { duration: 5000 });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [handleLocationUpdate]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
        toast("Location tracking stopped");
  }, []);

  // Auto-request on mount if permission is granted
  useEffect(() => {
    if (permissionStatus === "granted" && !location && !isLoading) {
      requestLocationPermission();
    }
  }, [permissionStatus, location, isLoading, requestLocationPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Handle manual address save
  const handleSaveManualAddress = useCallback(() => {
    if (!manualAddress.trim()) {
      toast.error("Please enter an address");
      return;
    }

    const locationData = {
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
      address: manualAddress.trim(),
    };

    setLocation(locationData);
    setAddress(manualAddress.trim());
    setIsEditingAddress(false);
    onLocationSelect(locationData);
    toast.success("Address saved!");
  }, [manualAddress, location, onLocationSelect]);

  // Permission request UI (Swiggy/Zomato style)
  if (permissionStatus === "prompt" && !location) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <FaLocationArrow className="text-white text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Allow Location Access
          </h3>
          <p className="text-gray-600 text-sm mb-1">
            We need your location to deliver your order accurately
          </p>
          <p className="text-gray-500 text-xs">
            Your location will be used to find nearby delivery addresses
          </p>
        </div>

        <div className="space-y-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={requestLocationPermission}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Getting location...</span>
              </>
            ) : (
              <>
                <FaCrosshairs />
                <span>Allow & Get Location</span>
              </>
            )}
          </motion.button>

          <button
            onClick={() => setIsEditingAddress(true)}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium border border-gray-300 transition-colors"
          >
            Enter Address Manually
          </button>
        </div>

        {isEditingAddress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4"
          >
            <textarea
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Enter your complete address (House/Building, Street, Area, City, PIN)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveManualAddress}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
              >
                Save Address
              </button>
              <button
                onClick={() => {
                  setIsEditingAddress(false);
                  setManualAddress("");
                }}
                className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Permission denied UI
  if (permissionStatus === "denied" && !location) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border-2 border-red-200"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-4">
            <FaMapMarkerAlt className="text-white text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Location Access Denied
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Please enable location permissions in your browser settings to use automatic location detection.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              setPermissionStatus("prompt");
              requestLocationPermission();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <FaCrosshairs />
            Try Again
          </button>

          <button
            onClick={() => setIsEditingAddress(true)}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-medium border border-gray-300"
          >
            Enter Address Manually
          </button>
        </div>

        {isEditingAddress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4"
          >
            <textarea
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              placeholder="Enter your complete address (House/Building, Street, Area, City, PIN)"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveManualAddress}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
              >
                Save Address
              </button>
              <button
                onClick={() => {
                  setIsEditingAddress(false);
                  setManualAddress("");
                }}
                className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // Location tracking active UI
  return (
    <div className="space-y-4">
      {/* Location Display Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-200"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <FaMapMarkerAlt className="text-white text-xl" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-800 text-sm">Delivery Location</h4>
              {isTracking && (
                <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Live
                </span>
              )}
            </div>
            <p className="text-sm text-gray-700 break-words">{address}</p>
            {location?.latitude && (
              <p className="text-xs text-gray-500 mt-1">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsEditingAddress(true)}
            className="flex-shrink-0 p-2 hover:bg-green-200 rounded-lg transition-colors"
            title="Edit address"
          >
            <FaEdit className="text-gray-600" />
          </button>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {isTracking ? (
          <button
            onClick={stopTracking}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            <FaCrosshairs />
            Stop Tracking
          </button>
        ) : (
          <button
            onClick={requestLocationPermission}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <FaLocationArrow />
                <span>Update Location</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Edit Address Modal */}
      {isEditingAddress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-white rounded-xl border-2 border-gray-200 shadow-lg"
        >
          <h4 className="font-semibold text-gray-800 mb-3">Edit Delivery Address</h4>
          <textarea
            value={manualAddress || address}
            onChange={(e) => setManualAddress(e.target.value)}
            placeholder="Enter your complete address (House/Building, Street, Area, City, PIN)"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSaveManualAddress}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium"
            >
              Save Address
            </button>
            <button
              onClick={() => {
                setIsEditingAddress(false);
                setManualAddress("");
              }}
              className="px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default LocationTracker;

