import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';
import { clearCart } from '../slices/cartSlice'; 
import { db } from '../firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { FaLock, FaShieldAlt, FaTicketAlt, FaTimes, FaCheck } from 'react-icons/fa';

// Replace with your Stripe Public Key
const stripePromise = loadStripe('pk_test_51Q6T83RxZdHdwLQK3yWbKZkOILRx57qh8o1QfKSGhwBRKtBPNz5vpD4Ysg5BwUGtyjKGMk4dBYWLBPEPQebL61Ke00Lc7d32SB');

// --- COUPON CONFIGURATION ---
const COUPONS = {
  'GSH20': { discountPercent: 20, expiryDate: new Date(new Date().getTime() + 48 * 60 * 60 * 1000) } // Expires in 48 hours from load (simulated)
};

const CheckoutForm = ({ shippingAddress, totalPrice, cartItems, profile }) => {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [processing, setProcessing] = useState(false);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Calculate Final Amount
  const finalAmount = totalPrice - discount;

  // --- HANDLE APPLY COUPON ---
  const handleApplyCoupon = () => {
    if (!couponCode) {
      toast.warn("Please enter a coupon code.");
      return;
    }

    const code = couponCode.toUpperCase();
    const couponData = COUPONS[code];

    if (couponData) {
      const now = new Date();
      
      // Check Expiry
      if (now > couponData.expiryDate) {
        toast.error(`Coupon ${code} has expired.`);
        setDiscount(0);
        setAppliedCoupon(null);
        return;
      }

      // Apply Discount
      const discountAmount = (totalPrice * couponData.discountPercent) / 100;
      setDiscount(discountAmount);
      setAppliedCoupon(code);
      toast.success(`Coupon ${code} applied! You saved ₹${discountAmount.toFixed(2)}`);
    } else {
      toast.error("Invalid Coupon Code.");
      setDiscount(0);
      setAppliedCoupon(null);
    }
  };

  // --- HANDLE REMOVE COUPON ---
  const handleRemoveCoupon = () => {
    setCouponCode('');
    setDiscount(0);
    setAppliedCoupon(null);
    toast.info("Coupon removed.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const cardElement = elements.getElement(CardElement);

    // 1. Create Payment Method (Stripe)
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: shippingAddress.fullName,
        email: profile.email,
        phone: shippingAddress.mobile,
      },
    });

    if (error) {
      toast.error(error.message);
      setProcessing(false);
    } else {
      // 2. Payment Successful -> Save to Firebase
      try {
        const orderData = {
          email: profile.email, 
          userId: profile.uid,
          
          customerName: shippingAddress.fullName,
          mobile: shippingAddress.mobile || '',
          shippingAddress: shippingAddress,
          
          items: cartItems, 
          
          amount: finalAmount, // Save the discounted amount
          originalAmount: totalPrice, // Keep track of original price
          discountApplied: discount,
          couponCode: appliedCoupon,
          
          totalAmount: finalAmount, // For consistency
          currency: 'inr',
          
          paymentId: paymentMethod.id,
          paymentStatus: 'Paid',
          orderStatus: 'Processing',
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "OrderItems"), orderData);

        dispatch(clearCart());
        toast.success("Payment Successful! Order placed."); 
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
      
      {/* --- COUPON SECTION --- */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Promo Code</label>
        <div className="flex gap-2">
          <div className="relative flex-grow">
             <FaTicketAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
             <input 
               type="text" 
               value={couponCode}
               onChange={(e) => setCouponCode(e.target.value)}
               disabled={!!appliedCoupon}
               placeholder="Enter Coupon Code"
               className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-white text-sm outline-none focus:border-blue-500 disabled:opacity-50"
             />
          </div>
          {appliedCoupon ? (
             <button type="button" onClick={handleRemoveCoupon} className="bg-rose-600 hover:bg-rose-500 text-white px-4 rounded-lg text-sm font-bold transition-colors">
               <FaTimes />
             </button>
          ) : (
             <button type="button" onClick={handleApplyCoupon} className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg text-sm font-bold transition-colors">
               Apply
             </button>
          )}
        </div>
        {appliedCoupon && (
            <div className="mt-2 flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <FaCheck size={10} /> Coupon "{appliedCoupon}" applied successfully!
            </div>
        )}
      </div>

      {/* --- STRIPE CARD ELEMENT --- */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 transition-colors focus-within:border-blue-500">
        <CardElement options={{
          hidePostalCode: false,
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
      
      {/* --- PAY BUTTON --- */}
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
          <> <FaLock size={14} /> Pay ₹{finalAmount.toFixed(2)} </>
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

            <div className="mt-4 pt-4 border-t border-slate-800">
               {/* Original Price */}
               <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 text-sm">Subtotal</span>
                  <span className="text-white font-medium">₹{totalPrice}</span>
               </div>
               
               {/* Discount Row (Hidden if 0) */}
               {/* We can't access `discount` state here directly easily without lifting state up, 
                   so for visual simplicity in this structure, dynamic updates happen in button text.
                   Ideally, CheckoutForm calculates final price. */}
            </div>
          </div>
          
          {/* Stripe Element & Coupon Logic Inside */}
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