import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeItem, updateQuantity, clearCart } from '../slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaTrash, FaMinus, FaPlus, FaArrowLeft, FaShoppingBag, FaCreditCard, FaLock } from 'react-icons/fa';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 1. Get Cart Data from Redux
  // We use a fallback object {} to prevent crashes if state.cart is undefined
  const { items, totalQuantity, totalPrice } = useSelector((state) => state.cart || { items: [], totalQuantity: 0, totalPrice: 0 });

  // 2. Get User Login Status from Redux
  // We check if 'uid' exists in the profile to confirm they are logged in.
  const { profile } = useSelector((state) => state.user || { profile: {} });
  const isLoggedIn = profile && profile.uid; 

  // --- Helper: Format Currency to INR ---
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // --- Handlers ---
  
  const handleRemove = (id) => {
    dispatch(removeItem(id));
    toast.info("Item removed from cart");
  };

  const handleDecrease = (id, quantity) => {
    if (quantity <= 1) return;
    dispatch(updateQuantity({ id, quantity: quantity - 1 }));
  };

  const handleIncrease = (id, quantity) => {
    dispatch(updateQuantity({ id, quantity: quantity + 1 }));
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to remove all items?")) {
      dispatch(clearCart());
      toast.info("Cart cleared");
    }
  };

  // --- CHECKOUT LOGIC ---
  const handleCheckout = () => {
    // 1. Check if cart is empty
    if (items.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    // 2. Check Login Status
    if (isLoggedIn) {
      // User is logged in -> Navigate to Shipping
      toast.success("Proceeding to checkout...");
      navigate('/shipping');
    } else {
      // User is Guest -> Navigate to Login
      toast.warn("Please login to complete your purchase");
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-6xl mx-auto">
        
        {/* --- Header --- */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold tracking-tight text-white">Shopping Cart</h2>
            <span className="bg-blue-600/10 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-600/20">
              {totalQuantity} Items
            </span>
          </div>
          <button onClick={() => navigate('/')} className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <FaArrowLeft size={14} /> Continue Shopping
          </button>
        </div>

        {/* --- Empty State --- */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed text-center">
            <div className="bg-slate-800 p-6 rounded-full mb-6">
               <FaShoppingBag className="text-slate-600 text-5xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Your cart is empty</h3>
            <p className="text-slate-400 mb-8">Looks like you haven't added anything yet.</p>
            <button 
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* --- Left Column: Cart Items --- */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div 
                  key={item.product_id} // USING PRODUCT_ID
                  className="group flex flex-col sm:flex-row items-center gap-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all"
                >
                  
                  {/* Product Image */}
                  <div className="w-full sm:w-28 h-28 bg-white rounded-xl p-2 flex-shrink-0">
                    <img 
                      src={item.image_url} // USING IMAGE_URL
                      alt={item.product_name} 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 text-center sm:text-left w-full">
                    <h5 className="text-lg font-bold text-white mb-1">{item.product_name}</h5>
                    <p className="text-sm text-slate-400 mb-2 capitalize">{item.product_category}</p>
                    <p className="text-blue-400 font-bold text-lg">
                      {formatPrice(item.selling_unit_price)} {/* USING SELLING_UNIT_PRICE */}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-col items-center sm:items-end gap-4 w-full sm:w-auto">
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-3 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                      <button 
                        onClick={() => handleDecrease(item.product_id, item.quantity)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white transition-colors"
                      >
                        <FaMinus size={10} />
                      </button>
                      <span className="w-8 text-center font-mono font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => handleIncrease(item.product_id, item.quantity)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                      >
                        <FaPlus size={10} />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button 
                      onClick={() => handleRemove(item.product_id)}
                      className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
                    >
                      <FaTrash size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))}

              <button 
                 onClick={handleClearCart}
                 className="text-red-400 text-sm hover:underline mt-4 flex items-center gap-2"
              >
                 <FaTrash /> Clear Cart
              </button>
            </div>

            {/* --- Right Column: Order Summary --- */}
            <div className="lg:col-span-1 lg:sticky lg:top-4">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-white font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping</span>
                    <span className="text-green-400 text-sm font-medium">Calculated at next step</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Tax Estimate (18%)</span>
                    <span className="text-white font-medium">{formatPrice(totalPrice * 0.18)}</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-blue-400">{formatPrice(totalPrice * 1.18)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-right">Including all taxes</p>
                </div>

                <button 
                  onClick={handleCheckout}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3"
                >
                  {isLoggedIn ? <FaCreditCard /> : <FaLock />}
                  {isLoggedIn ? "Checkout Now" : "Login to Checkout"}
                </button>
                
                {!isLoggedIn && (
                   <p className="text-center text-xs text-slate-500 mt-3">
                     You must be logged in to complete this purchase.
                   </p>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;