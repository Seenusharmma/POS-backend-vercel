import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// Configure NProgress
NProgress.configure({ 
  showSpinner: false, 
  speed: 400, 
  minimum: 0.1 
});

const TopProgressBar = () => {
  const location = useLocation();

  useEffect(() => {
    // Start progress bar on route change
    NProgress.start();

    // Finish progress bar after a short delay to simulate loading completion
    // In a real data-fetching scenario, you'd trigger this after data loads
    const timer = setTimeout(() => {
      NProgress.done();
    }, 500); // 500ms minimum display time for smoothness

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [location.pathname]); // Trigger on path change

  return null;
};

export default TopProgressBar;
