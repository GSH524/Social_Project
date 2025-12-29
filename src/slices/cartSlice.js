import { createSlice } from '@reduxjs/toolkit';

// --- 1. Helper to Load Data from Local Storage ---
const loadCartState = () => {
  try {
    const serializedState = localStorage.getItem('cartState');
    if (serializedState === null) {
      return { items: [], totalQuantity: 0, totalPrice: 0 };
    }
    return JSON.parse(serializedState);
  } catch (err) {
    return { items: [], totalQuantity: 0, totalPrice: 0 };
  }
};

// --- 2. Initialize State with Loaded Data ---
const initialState = loadCartState();

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action) => {
      const newItem = action.payload;
      // Using 'product_id' as the unique identifier based on your data structure
      const existingItem = state.items.find((item) => item.product_id === newItem.product_id);
      
      if (!existingItem) {
        state.items.push({
          product_id: newItem.product_id,
          product_name: newItem.product_name,
          image_url: newItem.image_url,
          selling_unit_price: Number(newItem.selling_unit_price), // Ensure number
          quantity: 1,
        });
        state.totalQuantity++;
      } else {
        existingItem.quantity++;
        state.totalQuantity++;
      }

      // Recalculate Total Price
      state.totalPrice = state.items.reduce(
        (total, item) => total + Number(item.selling_unit_price) * item.quantity, 0
      );

      // --- 3. Save to Local Storage ---
      localStorage.setItem('cartState', JSON.stringify(state));
    },

    removeItem: (state, action) => {
      const id = action.payload;
      const existingItem = state.items.find((item) => item.product_id === id);

      if (existingItem) {
        state.totalQuantity -= existingItem.quantity;
        state.items = state.items.filter((item) => item.product_id !== id);
      }

      // Recalculate Total Price
      state.totalPrice = state.items.reduce(
        (total, item) => total + Number(item.selling_unit_price) * item.quantity, 0
      );

      // --- Save to Local Storage ---
      localStorage.setItem('cartState', JSON.stringify(state));
    },

    updateQuantity: (state, action) => {
        const { id, quantity } = action.payload;
        const item = state.items.find(item => item.product_id === id);
        
        if(item){
            // Calculate difference to update totalQuantity correctly
            const diff = quantity - item.quantity;
            item.quantity = quantity;
            state.totalQuantity += diff;
        }

        state.totalPrice = state.items.reduce(
            (total, item) => total + Number(item.selling_unit_price) * item.quantity, 0
        );

        // --- Save to Local Storage ---
        localStorage.setItem('cartState', JSON.stringify(state));
    },

    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalPrice = 0;
      // --- Clear from Local Storage ---
      localStorage.removeItem('cartState');
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;