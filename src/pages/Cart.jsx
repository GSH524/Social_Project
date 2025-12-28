import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeItem, updateQuantity, clearCart } from '../slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaTrash, FaMinus, FaPlus, FaArrowLeft, FaShoppingBag, FaCreditCard } from 'react-icons/fa';

const Cart = () => {
  const cart = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRemove = (id) => {
    dispatch(removeItem(id));
    toast.info("Product removed from cart!");
  };

  const handleUpdateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    dispatch(updateQuantity({ id, quantity }));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
    toast.info("Cart cleared!");
  };

  const handleCheckout = () => alert('Checkout functionality not implemented yet.');

  return (
    <div className="min-h-screen bg-slate-900 text-white py-12 px-4 font-sans selection:bg-blue-500 selection:text-white">
      
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                <FaShoppingBag size={24} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Your Cart</h2>
            <span className="ml-auto text-slate-400 text-sm font-medium bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                {cart.items.length} Items
            </span>
        </div>

        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <FaShoppingBag className="text-slate-600 text-6xl mb-4" />
            <p className="text-xl text-slate-300 font-medium mb-6">Your cart is currently empty.</p>
            <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-600/30"
            >
                <FaArrowLeft size={14} /> Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Cart Grid */}
            <div className="space-y-4">
              {cart.items.map(item => (
                <div 
                    className="flex flex-col md:flex-row items-center gap-6 bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-md transition-all hover:border-blue-500/30 hover:shadow-xl hover:-translate-y-1" 
                    key={item.id}
                >
                  {/* Product Image */}
                  <div className="w-full md:w-32 h-32 flex-shrink-0 bg-white rounded-xl overflow-hidden p-2">
                    <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 w-full text-center md:text-left">
                    <h5 className="text-lg font-bold text-white mb-1">{item.name}</h5>
                    <p className="text-blue-400 font-bold text-xl">₹{item.price.toFixed(2)}</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-700">
                    <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                    >
                        <FaMinus size={10} />
                    </button>
                    <span className="text-white font-mono font-bold w-6 text-center">{item.quantity}</span>
                    <button 
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    >
                        <FaPlus size={10} />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button 
                    className="w-full md:w-auto px-4 py-2 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all duration-300" 
                    onClick={() => handleRemove(item.id)}
                  >
                    <FaTrash size={14} /> <span className="md:hidden">Remove</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="mt-8 bg-slate-800 p-6 md:p-8 rounded-2xl border border-slate-700 shadow-2xl">
              <div className="flex flex-col md:flex-row justify-between items-center border-b border-slate-700 pb-6 mb-6 gap-4">
                 <h4 className="text-slate-400 font-medium">Total Quantity: <span className="text-white font-bold text-lg ml-2">{cart.totalQuantity}</span></h4>
                 <h4 className="text-slate-400 font-medium">Total Price: <span className="text-3xl font-bold text-blue-400 ml-2">₹{cart.totalPrice.toFixed(2)}</span></h4>
              </div>

              <div className="flex flex-col-reverse md:flex-row gap-4 items-center">
                <button 
                    className="px-6 py-3.5 text-slate-400 hover:text-white font-medium hover:underline transition-all" 
                    onClick={handleClearCart}
                >
                    Clear Cart
                </button>
                
                <div className="flex gap-4 w-full md:w-auto">
                    <button 
                        className="flex-1 md:flex-none px-6 py-3.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all border border-slate-600" 
                        onClick={() => navigate('/')}
                    >
                        Continue Shopping
                    </button>
                    <button 
                        className="flex-1 md:flex-none px-8 py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all flex items-center justify-center gap-2" 
                        onClick={handleCheckout}
                    >
                        <FaCreditCard /> Checkout
                    </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;