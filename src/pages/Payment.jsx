import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { clearCart } from '../slices/cartSlice'; 
import { db } from '../firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FaLock, FaShieldAlt } from 'react-icons/fa';

// Replace with your Stripe Public Key
const stripePromise = loadStripe('pk_test_51Q6T83RxZdHdwLQK3yWbKZkOILRx57qh8o1QfKSGhwBRKtBPNz5vpD4Ysg5BwUGtyjKGMk4dBYWLBPEPQebL61Ke00Lc7d32SB');

const CheckoutForm = ({ shippingAddress, totalPrice, cartItems, profile }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    // 1. Create Payment Method (Stripe)
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      toast.error(error.message);
      setProcessing(false);
    } else {
      // 2. Payment Successful -> Save to Firebase
      try {
        const orderData = {
          // 🔹 User Details
          email: profile.email, 
          userId: profile.uid,
          
          // 🔹 Shipping Details
          customerName: shippingAddress.fullName,
          mobile: shippingAddress.mobile || '',
          shippingAddress: shippingAddress,
          
          // 🔹 Cart Details
          items: cartItems, 
          
          // 🔹 Amount Details (Stored explicitly as 'amount')
          amount: totalPrice,       // <--- ADDED THIS FIELD
          totalAmount: totalPrice,  // Keeping this for compatibility
          currency: 'inr',
          
          // 🔹 Payment Meta
          paymentId: paymentMethod.id,
          paymentStatus: 'Paid',
          orderStatus: 'Processing',
          createdAt: serverTimestamp(),
        };

        // 🔹 Save to 'OrderItems' collection
        await addDoc(collection(db, "OrderItems"), orderData);

        // 3. Clear Cart & Redirect
        dispatch(clearCart());
        toast.success("Order placed successfully!");
        navigate('/order-success');
        
      } catch (err) {
        console.error("Error saving order:", err);
        toast.error("Payment successful, but failed to save order details.");
      }
      
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 transition-colors focus-within:border-blue-500">
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#ffffff',
              iconColor: '#60a5fa',
              '::placeholder': { color: '#64748b' },
            },
            invalid: { color: '#ef4444' },
          },
        }}/>
      </div>
      
      <button 
        type="submit" 
        disabled={!stripe || processing}
        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold shadow-lg shadow-green-900/20 transition-all flex justify-center items-center gap-2"
      >
        {processing ? (
           <span className="flex items-center gap-2">
             <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             Processing...
           </span>
        ) : (
          <> <FaLock size={14} /> Pay ₹{totalPrice} </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <FaShieldAlt /> TLS Secured Transaction
      </div>
    </form>
  );
};

const Payment = () => {
  const location = useLocation();
  
  // Get Redux Data
  const { items, totalPrice } = useSelector((state) => state.cart || { items: [], totalPrice: 0 });
  const { profile } = useSelector((state) => state.user || { profile: {} });
  
  // Get shipping address from navigation state
  const shippingAddress = location.state?.shippingAddress;

  // Safety check
  if (!shippingAddress) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center text-slate-400 gap-4">
        <p>No shipping information found.</p>
        <button onClick={() => window.history.back()} className="text-blue-400 hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 flex justify-center">
      <div className="w-full max-w-lg">
        <h2 className="text-3xl font-bold mb-8 text-center text-white">Secure Payment</h2>
        
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
          
          {/* Summary Card */}
          <div className="mb-8 p-5 bg-slate-950/50 rounded-2xl border border-slate-800/50">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Order Summary</h3>
            
            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400">Customer</span>
              <div className="text-right">
                <p className="text-white font-medium text-sm">{shippingAddress.fullName}</p>
                <p className="text-slate-500 text-xs">{profile.email}</p>
              </div>
            </div>

            <div className="flex justify-between items-start mb-2">
              <span className="text-slate-400">Ship to</span>
              <p className="text-slate-500 text-xs text-right truncate max-w-[200px]">
                {shippingAddress.address}, {shippingAddress.city}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Total Pay</span>
              <span className="text-2xl font-bold text-blue-400">₹{totalPrice}</span>
            </div>
          </div>
          
          {/* Stripe Element */}
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              shippingAddress={shippingAddress} 
              totalPrice={totalPrice} 
              cartItems={items} 
              profile={profile} 
            />
          </Elements>
          
        </div>
      </div>
    </div>
  );
};

export default Payment;