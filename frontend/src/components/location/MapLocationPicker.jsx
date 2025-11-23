import React, { useState, useCallback, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaMapMarkerAlt, FaSearch, FaCrosshairs } from "react-icons/fa";
import toast from "react-hot-toast";

// Fix for default marker icon in react-leaflet
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const defaultCenter = [28.6139, 77.2090]; // Default to Delhi, India [lat, lng]

// Custom marker icon (red)
const createCustomIcon = () => {
  return new Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      // Reverse geocode using Nominatim (free, no API key)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "User-Agent": "FoodFantasyApp/1.0", // Required by Nominatim
            },
          }
        );
        const data = await response.json();
        
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        const location = {
          latitude: lat,
          longitude: lng,
          address: address,
        };
        
        onLocationSelect(location);
        toast.success("📍 Location selected!");
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        const location = {
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        };
        onLocationSelect(location);
        toast.success("📍 Location selected!");
      }
    },
  });
  return null;
}

/**
 * MapLocationPicker Component
 * Allows users to select their location on an OpenStreetMap (free, no API key required)
 */
const MapLocationPicker = ({ onLocationSelect, initialLocation = null }) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || null);
  const [mapCenter, setMapCenter] = useState(
    initialLocation
      ? [initialLocation.latitude, initialLocation.longitude]
      : defaultCenter
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapKey, setMapKey] = useState(0); // Key to force map re-render
  const [isAutoLocating, setIsAutoLocating] = useState(false);
  const [hasAutoLocated, setHasAutoLocated] = useState(false);

  // Handle location selection (defined first so it can be used in useEffect)
  const handleLocationSelect = useCallback(
    (location) => {
      setSelectedLocation(location);
      setMapCenter([location.latitude, location.longitude]);
      onLocationSelect(location);
    },
    [onLocationSelect]
  );

  // Update map center when initial location changes
  useEffect(() => {
    if (initialLocation) {
      setMapCenter([initialLocation.latitude, initialLocation.longitude]);
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  // Automatically fetch user's location on component mount
  useEffect(() => {
    // Only auto-fetch if no initial location is provided
    if (initialLocation || hasAutoLocated) return;

    if (!navigator.geolocation) {
      // Geolocation not supported, silently fail
      return;
    }

    setIsAutoLocating(true);
    const loadingToast = toast.loading("📍 Getting your location...", { duration: 3000 });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Reverse geocode using Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                "User-Agent": "FoodFantasyApp/1.0",
              },
            }
          );
          const data = await response.json();

          const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

          const location = {
            latitude: lat,
            longitude: lng,
            address: address,
          };

          // Center map on user's location
          setMapCenter([lat, lng]);
          setMapKey((prev) => prev + 1); // Force map to re-center
          
          // Auto-select the location
          handleLocationSelect(location);
          setHasAutoLocated(true);
          
          toast.success("📍 Your location detected!", { id: loadingToast });
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          // Still center map on coordinates even if geocoding fails
          const location = {
            latitude: lat,
            longitude: lng,
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          };
          setMapCenter([lat, lng]);
          setMapKey((prev) => prev + 1);
          handleLocationSelect(location);
          setHasAutoLocated(true);
          toast.success("📍 Your location detected!", { id: loadingToast });
        } finally {
          setIsAutoLocating(false);
        }
      },
      (error) => {
        // Silently handle errors - don't show error toast for auto-location
        // User can still manually select location
        setIsAutoLocating(false);
        setHasAutoLocated(true); // Mark as attempted so we don't try again
        toast.dismiss(loadingToast);
        
        // Only log to console for debugging
        console.log("Auto-location failed (user may have denied permission):", error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000, // Shorter timeout for auto-location
        maximumAge: 60000, // Accept cached location up to 1 minute old
      }
    );
  }, [initialLocation, hasAutoLocated, handleLocationSelect]);

  // Handle current location button
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const loadingToast = toast.loading("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Reverse geocode using Nominatim
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
              headers: {
                "User-Agent": "FoodFantasyApp/1.0",
              },
            }
          );
          const data = await response.json();

          const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

          const location = {
            latitude: lat,
            longitude: lng,
            address: address,
          };

          handleLocationSelect(location);
          toast.success("📍 Current location selected!", { id: loadingToast });
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          const location = {
            latitude: lat,
            longitude: lng,
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          };
          handleLocationSelect(location);
          toast.success("📍 Current location selected!", { id: loadingToast });
        }
      },
      (error) => {
        toast.error("Failed to get your location. Please select on the map.", {
          id: loadingToast,
        });
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [handleLocationSelect]);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a location to search");
      return;
    }

    setIsSearching(true);
    const loadingToast = toast.loading("Searching location...");

    try {
      // Geocode using Nominatim (free, no API key)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=1&addressdetails=1`,
        {
          headers: {
            "User-Agent": "FoodFantasyApp/1.0",
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const address = result.display_name || searchQuery;

        const location = {
          latitude: lat,
          longitude: lng,
          address: address,
        };

        handleLocationSelect(location);
        setMapKey((prev) => prev + 1); // Force map to re-center
        toast.success("📍 Location found!", { id: loadingToast });
      } else {
        toast.error("Location not found. Please try a different search term.", {
          id: loadingToast,
        });
      }
    } catch (error) {
      console.error("Error searching location:", error);
      toast.error("Failed to search location. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, handleLocationSelect]);

  // Handle search on Enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            placeholder="Search for a location or address..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSearching ? "..." : "Search"}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <FaCrosshairs />
          Use Current Location
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedLocation(null);
            setSearchQuery("");
            onLocationSelect(null);
            toast("Location cleared");
          }}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          disabled={!selectedLocation}
        >
          Clear
        </button>
      </div>

      {/* Map */}
      <div className="relative">
        {/* Auto-location loading indicator */}
        {isAutoLocating && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-[1000] bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span className="text-sm font-medium">Getting your location...</span>
          </div>
        )}
        <MapContainer
          key={mapKey}
          center={mapCenter}
          zoom={selectedLocation ? 16 : 12}
          style={{ height: "400px", width: "100%", borderRadius: "8px", zIndex: 0 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          {selectedLocation && (
            <Marker
              position={[selectedLocation.latitude, selectedLocation.longitude]}
              icon={createCustomIcon()}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-semibold text-sm mb-1">
                    <FaMapMarkerAlt className="inline text-red-500 mr-1" />
                    Selected Location
                  </p>
                  <p className="text-xs text-gray-600">{selectedLocation.address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Selected Location Info */}
      {selectedLocation && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-800 mb-1">✅ Location Selected</p>
          <p className="text-xs text-green-700">{selectedLocation.address}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800 mb-1">
          <strong>💡 How to use:</strong>
        </p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Click anywhere on the map to select your location</li>
          <li>Search for an address using the search bar</li>
          <li>Click "Use Current Location" to get your GPS location</li>
          <li>Drag the map to explore different areas</li>
        </ul>
      </div>
    </div>
  );
};

export default MapLocationPicker;
