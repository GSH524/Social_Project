import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeItem, updateQuantity, clearCart } from '../slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Cart.css';

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
    <div className="cart-container">
      <h2 className="cart-header">Your Cart</h2>
      {cart.items.length === 0 ? (
        <p style={{ textAlign: 'center' }}>Your cart is empty.</p>
      ) : (
        <>
          <div className="cart-grid">
            {cart.items.map(item => (
              <div className="cart-item-card" key={item.id}>
                <img src={item.image} alt={item.name} />
                <div className="cart-item-details">
                  <h5>{item.name}</h5>
                  <p>₹{item.price.toFixed(2)}</p>
                  <div className="quantity-controls">
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>Quantity: {item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <button className="remove-btn" onClick={() => handleRemove(item.id)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h4>Total Quantity: {cart.totalQuantity}</h4>
            <h4>Total Price: ₹{cart.totalPrice.toFixed(2)}</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="clear-btn" onClick={handleClearCart}>Clear Cart</button>
              <button className="checkout-btn" onClick={handleCheckout}>Checkout</button>
            </div>
          </div>
        </>
      )}
      <button className="continue-btn" onClick={() => navigate('/')}>Continue Shopping</button>
    </div>
  );
};

export default Cart;
