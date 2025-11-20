import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../../config/api";
import LogoLoader from "../LogoLoader";
import VegCard from "./VegCard";
import NonVegCard from "./NonVegCard";
import OfferZone from "./OfferZone";
import MenuSlider from "./MenuSlider";
import FloatingCartButton from "./FloatingCartButton";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [foods, setFoods] = useState([]);
  const [vegFoods, setVegFoods] = useState([]);
  const [nonVegFoods, setNonVegFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch foods
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/foods`);
        const allFoods = res.data.filter(f => f.available !== false);
        setFoods(allFoods);

        // Separate veg and non-veg
        const veg = allFoods.filter(f => f.type === "Veg");
        const nonVeg = allFoods.filter(f => f.type === "Non-Veg");
        setVegFoods(veg);
        setNonVegFoods(nonVeg);

        // Get categories with counts and images
        const categoryMap = {};
        allFoods.forEach(f => {
          if (!categoryMap[f.category]) {
            categoryMap[f.category] = {
              count: 0,
              image: f.image, // Use first food's image as category image
              foods: []
            };
          }
          categoryMap[f.category].count += 1;
          categoryMap[f.category].foods.push(f);
        });
        setCategories(Object.entries(categoryMap).map(([name, data]) => ({ 
          name, 
          count: data.count,
          image: data.image,
          foods: data.foods
        })));

        setTimeout(() => setLoading(false), 800);
      } catch (err) {
        console.error("Error fetching foods:", err);
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  // Cart logic
  useEffect(() => {
    const savedCart = localStorage.getItem("cartItems");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (food) => {
    const existing = cart.find((item) => item._id === food._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === food._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...food, quantity: 1 }]);
    }
  };

  // Handle category click (for MenuSlider only, doesn't affect food cards)
  const handleCategoryClick = (categoryName) => {
    if (selectedCategory === categoryName) {
      // If same category clicked, reset filter
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryName);
    }
  };


  if (loading) return <LogoLoader />;

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Refined minimal background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-white to-orange-50/30 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(251,146,60,0.03),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(251,146,60,0.02),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.5)_100%)]"></div>
      </div>
      
      <div className="min-h-screen text-gray-900 pb-30 pt-12 relative">
        <div className="container mx-auto px-4 sm:px-5 lg:px-8 py-5 sm:py-7 lg:py-8">
          {/* Desktop: 2 main columns - Left (Offer Zone, Food cards, Special Offers), Right (Menu slider) */}
          <div className="grid grid-cols-[2fr_1fr] md:grid-cols-[2fr_1fr] gap-4 sm:gap-5 lg:gap-7">
            {/* Left Column - Desktop: Food cards at top, Special Offers below */}
            <div className="col-span-1 md:col-span-1 flex flex-col md:space-y-3 lg:space-y-4 gap-3 md:gap-0">
              {/* Desktop: Food cards side by side at top */}
              <div className="hidden md:grid md:grid-cols-2 gap-3 lg:gap-4 md:shrink-0">
                <VegCard
                  vegFoods={vegFoods}
                  onAddToCart={addToCart}
                  heightClass="h-[calc(119vh-380px)]"
                />
                <NonVegCard
                  nonVegFoods={nonVegFoods}
                  onAddToCart={addToCart}
                  heightClass="h-[calc(119vh-380px)]"
                />
              </div>

              {/* Mobile: Food type 1 - Top Left */}
              <div className="md:hidden">
                <VegCard
                  vegFoods={vegFoods}
                  onAddToCart={addToCart}
                  heightClass="h-[calc((100vh-280px)/2)]"
                />
              </div>

              {/* Mobile: Food type 2 - Bottom Left */}
              <div className="md:hidden">
                <NonVegCard
                  nonVegFoods={nonVegFoods}
                  onAddToCart={addToCart}
                  heightClass="h-[calc((100vh-280px)/2)]"
                />
              </div>

              {/* Special Offers - Desktop: Fixed just below food cards */}
              <div className="hidden md:block md:shrink-0">
                <OfferZone isMobile={false} />
              </div>

              {/* Mobile: Offer Zone - Top Right */}
              <div className="md:hidden">
                <OfferZone isMobile={true} />
              </div>
            </div>

            {/* Right Column - Menu slider aligned with food cards top and special offers bottom */}
            <div className="col-span-1 md:col-span-1 flex flex-col gap-3 md:gap-0 md:justify-start">
              {/* Menu slider - Desktop: Top aligns with food cards, bottom aligns with special offers */}
              <div className="h-full md:flex md:flex-col md:h-[calc(135vh-320px)]">
                <MenuSlider 
                  categories={categories} 
                  selectedCategory={selectedCategory}
                  onCategoryClick={handleCategoryClick}
                  foods={foods}
                  onAddToCart={addToCart}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Cart Button */}
        <FloatingCartButton cartCount={cart.length} />
      </div>
    </div>
  );
};

export default Home;
