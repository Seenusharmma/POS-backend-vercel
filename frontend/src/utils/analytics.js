// Google Analytics Helper Functions
// Makes it easy to track custom events throughout the app

/**
 * Track a custom event in Google Analytics
 * @param {string} eventName - Name of the event (e.g., 'order_placed', 'food_added_to_cart')
 * @param {object} eventParams - Additional parameters for the event
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

/**
 * Track page views manually (useful for SPAs)
 * @param {string} pageTitle - Title of the page
 * @param {string} pagePath - Path of the page
 */
export const trackPageView = (pageTitle, pagePath) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', {
      page_title: pageTitle,
      page_path: pagePath,
    });
  }
};

/**
 * Track user actions
 */
export const analytics = {
  // E-commerce events
  addToCart: (item) => {
    trackEvent('add_to_cart', {
      currency: 'INR',
      value: item.price,
      items: [{
        item_id: item.id || item._id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity || 1
      }]
    });
  },

  removeFromCart: (item) => {
    trackEvent('remove_from_cart', {
      currency: 'INR',
      value: item.price,
      items: [{
        item_id: item.id || item._id,
        item_name: item.name,
        price: item.price,
      }]
    });
  },

  viewItem: (item) => {
    trackEvent('view_item', {
      currency: 'INR',
      value: item.price,
      items: [{
        item_id: item.id || item._id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
      }]
    });
  },

  beginCheckout: (cartValue, items) => {
    trackEvent('begin_checkout', {
      currency: 'INR',
      value: cartValue,
      items: items.map(item => ({
        item_id: item.id || item._id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity || 1
      }))
    });
  },

  purchase: (orderId, totalValue, items) => {
    trackEvent('purchase', {
      transaction_id: orderId,
      currency: 'INR',
      value: totalValue,
      items: items.map(item => ({
        item_id: item.id || item._id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity || 1
      }))
    });
  },

  // User engagement
  selectTable: (tableNumber, chairs) => {
    trackEvent('select_table', {
      table_number: tableNumber,
      chairs_selected: chairs
    });
  },

  login: (method) => {
    trackEvent('login', {
      method: method // e.g., 'google', 'email'
    });
  },

  signUp: (method) => {
    trackEvent('sign_up', {
      method: method
    });
  },

  search: (searchTerm) => {
    trackEvent('search', {
      search_term: searchTerm
    });
  },

  // Custom app events
  viewMenu: (category) => {
    trackEvent('view_menu', {
      category: category || 'all'
    });
  },

  orderPlaced: (orderDetails) => {
    trackEvent('order_placed', {
      order_id: orderDetails.orderId,
      table_number: orderDetails.tableNumber,
      total_amount: orderDetails.totalAmount,
      payment_method: orderDetails.paymentMethod
    });
  },

  filterFood: (filterType, filterValue) => {
    trackEvent('filter_food', {
      filter_type: filterType, // e.g., 'category', 'type'
      filter_value: filterValue
    });
  }
};

export default analytics;
