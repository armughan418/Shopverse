const api = () => {
  const local = process.env.REACT_APP_BACKEND_URL;

  const list = {
    registerUser: `${local}/api/user/register`,
    loginUser: `${local}/api/user/login`,
    logoutUser: `${local}/api/user/logout`,
    getAcess: `${local}/api/user/get/access`,
    adminStat: `${local}/api/admin/stats`,
    getOrderCharges: `${local}/api/admin/order-charges`,
    updateOrderCharges: `${local}/api/admin/order-charges`,

    getUsers: `${local}/api/user/`,
    updateUser: (id) => `${local}/api/user/${id}`,
    deleteUser: (id) => `${local}/api/user/${id}`,

    addProduct: `${local}/api/products/add`,
    getProducts: `${local}/api/products`,
    getProductsPaged: (page = 1, limit = 12) =>
      `${local}/api/products?page=${page}&limit=${limit}`,
    getHomepageProducts: `${local}/api/products/homepage`,
    getFeaturedProducts: `${local}/api/products/featured`,
    getBestsellers: `${local}/api/products/bestsellers`,
    getNewProducts: `${local}/api/products/new`,
    getProductsByCategory: (categoryName, page = 1, limit = 12) =>
      `${local}/api/products/category/${encodeURIComponent(categoryName)}?page=${page}&limit=${limit}`,
    searchProducts: (q, page = 1, limit = 12, options = {}) => {
      const { sort = "", minRating = 0 } = options || {};
      let url = `${local}/api/products/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`;
      if (sort) url += `&sort=${encodeURIComponent(sort)}`;
      if (minRating > 0) url += `&minRating=${minRating}`;
      return url;
    },
    getSingleProduct: (id) => `${local}/api/products/${id}`,
    updateProduct: (id) => `${local}/api/products/update/${id}`,
    deleteProduct: (id) => `${local}/api/products/delete/${id}`,

    // Cart
    addToCart: `${local}/api/cart/add`,
    getCart: `${local}/api/cart`,
    updateCartItem: `${local}/api/cart/update`,
    removeFromCart: (productId) => `${local}/api/cart/remove/${productId}`,

    getOrders: `${local}/api/orders`,
    getMyOrders: `${local}/api/orders/myorders`,
    createOrder: `${local}/api/orders/create`,
    getOrder: (id) => `${local}/api/orders/${id}`,
    updateOrder: (id) => `${local}/api/orders/${id}`,
    updateOrderStatus: (id) => `${local}/api/orders/${id}/status`,
    deleteOrder: (id) => `${local}/api/orders/${id}`,

    getReviews: (productId) => `${local}/api/reviews/${productId}`,
    addReview: `${local}/api/reviews`,
    deleteReview: (id) => `${local}/api/reviews/${id}`,
    // Carousel
    getCarousel: `${local}/api/carousel`,
    addCarouselImage: `${local}/api/carousel/add`,
    updateCarouselImage: (id) => `${local}/api/carousel/update/${id}`,
    deleteCarouselImage: (id) => `${local}/api/carousel/delete/${id}`,
    getCategories: `${local}/api/categories`,
    addCategory: `${local}/api/categories/add`,
    deleteCategory: (id) => `${local}/api/categories/${id}`,
    getUserProfile: `${local}/api/user/profile`,
    updateUserProfile: `${local}/api/user/profile`,
  };

  return list;
};

export default api;
