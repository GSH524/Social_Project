import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeItem, updateQuantity, clearCart } from '../slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaTrash, FaMinus, FaPlus, FaArrowLeft, FaShoppingBag, FaCreditCard } from 'react-icons/fa';

const Cart = () => {
  // 1. Safe State Access: Fallback to empty object if state.cart is undefined
  const { items, totalQuantity, totalPrice } = useSelector((state) => state.cart || { items: [], totalQuantity: 0, totalPrice: 0 });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Helper: Format Currency (INR)
  const formatPrice = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Handlers
  const handleRemove = (id) => {
    dispatch(removeItem(id));
    toast.info("Product removed from cart");
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
      toast.info("Cart cleared successfully");
    }
  };

  const handleCheckout = () => {
    toast.success("Proceeding to checkout...");
    // navigate('/checkout'); // Uncomment when checkout page exists
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-5xl mx-auto">
        
        {/* --- Header --- */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
              <FaShoppingBag size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Shopping Cart</h2>
              <p className="text-slate-400 text-sm">Review your selected items</p>
            </div>
          </div>
          <span className="hidden md:block text-slate-400 text-sm font-medium bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
            {items.length} {items.length === 1 ? 'Item' : 'Items'} in Bag
          </span>
        </div>

        {/* --- Empty State --- */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
            <div className="bg-slate-800 p-6 rounded-full mb-6">
                <FaShoppingBag className="text-slate-500 text-5xl" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Your cart is empty</h3>
            <p className="text-slate-400 mb-8 text-center max-w-md">Looks like you haven't added anything to your cart yet. Go ahead and explore our top categories.</p>
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-600/25 hover:-translate-y-0.5"
            >
              <FaArrowLeft size={14} /> Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
            
            {/* --- Cart Items List --- */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="group flex flex-col sm:flex-row items-center gap-6 bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  {/* Image Container */}
                  <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-white rounded-xl overflow-hidden p-2 relative">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 w-full text-center sm:text-left space-y-2">
                    <h5 className="text-lg font-bold text-white leading-tight">{item.name}</h5>
                    <p className="text-sm text-slate-400 line-clamp-1">{item.description || 'Premium Quality Product'}</p>
                    <p className="text-blue-400 font-bold text-xl">{formatPrice(item.price)}</p>
                  </div>

                  {/* Controls Wrapper */}
                  <div className="flex flex-col items-center sm:items-end gap-4 w-full sm:w-auto">
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                      <button 
                        onClick={() => handleDecrease(item.id, item.quantity)}
                        disabled={item.quantity <= 1}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                          item.quantity <= 1 
                            ? 'text-slate-600 cursor-not-allowed' 
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        <FaMinus size={10} />
                      </button>
                      
                      <span className="text-white font-mono font-bold w-6 text-center">{item.quantity}</span>
                      
                      <button 
                        onClick={() => handleIncrease(item.id, item.quantity)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                      >
                        <FaPlus size={10} />
                      </button>
                    </div>

                    {/* Remove Action */}
                    <button 
                      onClick={() => handleRemove(item.id)}
                      className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1.5 hover:underline decoration-red-400/30 underline-offset-4 transition-all"
                    >
                      <FaTrash size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* --- Order Summary (Sticky) --- */}
            <div className="lg:col-span-1 lg:sticky lg:top-8">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-6 border-b border-slate-800 pb-4">Order Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Items</span>
                    <span className="text-white font-medium">{totalQuantity}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="text-white font-medium">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping</span>
                    <span className="text-green-400 font-medium">Free</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-2xl font-bold text-blue-400">{formatPrice(totalPrice)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-right">Including all taxes</p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleCheckout}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2"
                  >
                    <FaCreditCard /> Checkout
                  </button>
                  
                  <button 
                    onClick={handleClearCart}
                    className="w-full py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl text-sm font-medium transition-colors"
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;