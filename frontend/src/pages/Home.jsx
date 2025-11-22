import React, { useEffect, useState } from "react";
import axios from "axios";
import API_BASE from "../config/api";
import LogoLoader from "../components/ui/LogoLoader";
import VegCard from "../features/home/VegCard";
import NonVegCard from "../features/home/NonVegCard";
import OfferZone from "../features/home/OfferZone";
import MenuSlider from "../features/home/MenuSlider";
import FloatingCartButton from "../features/home/FloatingCartButton";
import VideoSection from "../features/home/VideoSection";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { addToCartAsync } from "../store/slices/cartSlice";
import toast from "react-hot-toast";

const Home = () => {
  const { user } = useAppSelector((state) => state.auth);
  const cart = useAppSelector((state) => state.cart.items);
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const [foods, setFoods] = useState([]);
  const [vegFoods, setVegFoods] = useState([]);
  const [nonVegFoods, setNonVegFoods] = useState([]);
  const [categories, setCategories] = useState([]);
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

  const addToCart = async (food) => {
    if (!user || !user.email) {
      toast.error("Please login to add items to cart!");
      return;
    }

    try {
      await dispatch(
        addToCartAsync({
          userData: user,
          food,
          quantity: 1,
        })
      ).unwrap();
      
      toast.success(`${food.name} added to cart! 🛒`, {
        duration: 2000,
        position: "top-center",
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add item to cart. Please try again.");
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
      {/* Pure white background */}
      <div className="fixed inset-0 bg-white -z-10"></div>
      
      <div className="min-h-screen text-gray-900 pb-30 pt-12 relative">
        <div className="container mx-auto px-3 sm:px-4 md:px-5 lg:px-8 py-5 sm:py-7 lg:py-8 max-w-[1920px]">
          {/* Desktop: 2 main columns - Left (Offer Zone, Food cards, Special Offers), Right (Menu slider) */}
          {/* Mobile: Expand menu slider when category is selected */}
          <div className={`grid gap-3 sm:gap-4 md:gap-5 lg:gap-7 transition-all duration-300 ease-in-out
            ${selectedCategory 
              ? 'grid-cols-[1fr_1.3fr] sm:grid-cols-[1fr_1.4fr] md:grid-cols-[1.8fr_1fr] lg:grid-cols-[2fr_1fr]'
              : 'grid-cols-[1.5fr_1fr] sm:grid-cols-[1.6fr_1fr] md:grid-cols-[1.8fr_1fr] lg:grid-cols-[2fr_1fr]'
            }`}>
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
            <div className="col-span-1 md:col-span-1 flex flex-col gap-2 sm:gap-3 md:gap-0 md:justify-start">
              {/* Menu slider - Mobile: Bottom aligned with offer zone, Desktop: Top aligns with food cards */}
              <div className="md:hidden flex flex-col justify-end">
                <div className="h-[600px] sm:h-[320px]">
                  <MenuSlider 
                    categories={categories} 
                    selectedCategory={selectedCategory}
                    onCategoryClick={handleCategoryClick}
                    foods={foods}
                    onAddToCart={addToCart}
                  />
                </div>
              </div>
              {/* Desktop: Top aligns with food cards, bottom aligns with special offers */}
              <div className="hidden md:flex md:flex-col md:h-[calc(135vh-320px)]">
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
        <VideoSection />

        {/* Floating Cart Button */}
        <FloatingCartButton cartCount={cart.length} />
      </div>
    </div>
  );
};

export default Home;
