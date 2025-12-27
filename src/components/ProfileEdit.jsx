import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaLock, FaCamera } from "react-icons/fa";
import "./ProfileEdit.css"; // Import the new CSS

const ProfileEdit = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    address: '',
    profileImage: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        mobile: initialData.mobile || '',
        address: initialData.address || '',
        profileImage: initialData.profileImage || ''
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 800 * 1024) {
        alert("Image size is too large. Please select an image under 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    
    const dataToSave = {
        fullName: formData.fullName,
        mobile: formData.mobile,
        address: formData.address,
        profileImage: formData.profileImage,
        updatedAt: new Date()
    };

    try {
      await onSave(dataToSave); 
    } catch (error) {
      console.error("Save error", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-form-wrapper">
      <div className="edit-header">
        <h4>Edit Profile Details</h4>
        <p className="text-muted">Update your personal information and address.</p>
      </div>
      
      {/* --- Avatar Upload Section --- */}
      <div className="avatar-section">
        <label htmlFor="file-upload" className="avatar-wrapper">
          {formData.profileImage ? (
            <>
              <img src={formData.profileImage} alt="Profile" className="avatar-image" />
              <div className="avatar-overlay"><FaCamera size={24} /></div>
            </>
          ) : (
            <div className="avatar-placeholder">
              <FaCamera size={24} className="mb-2" />
              <small>Upload</small>
            </div>
          )}
        </label>
        <label htmlFor="file-upload" className="avatar-label-text">Change Profile Photo</label>
        <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
      </div>

      {/* --- Form Grid --- */}
      <div className="form-grid">
        
        {/* Full Name */}
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <div className="input-wrapper">
            <FaUser className="input-icon" />
            <input 
              type="text" 
              className="form-control"
              placeholder="John Doe" 
              name="fullName"
              value={formData.fullName} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        {/* Mobile */}
        <div className="form-group">
          <label className="form-label">Mobile Number</label>
          <div className="input-wrapper">
            <FaPhone className="input-icon" style={{transform: 'scaleX(-1)'}}/>
            <input 
              type="tel" 
              className="form-control"
              placeholder="+91 98765 43210" 
              name="mobile"
              value={formData.mobile} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        {/* Email (Full Width) */}
        <div className="form-group full-width">
          <label className="form-label">Email Address</label>
          <div className="input-wrapper">
            <FaEnvelope className="input-icon" />
            <input 
              type="email" 
              className="form-control"
              value={formData.email} 
              readOnly 
              disabled
            />
          </div>
        </div>

        {/* Address (Full Width) */}
        <div className="form-group full-width">
          <label className="form-label">Billing Address</label>
          <div className="input-wrapper">
            <FaMapMarkerAlt className="input-icon" style={{top: '1rem'}} />
            <textarea
              className="form-control"
              placeholder="Enter your full address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              required
            />
          </div>
        </div>

        {/* --- Security Section Header --- */}
        <div className="full-width mt-3">
            <h6 className="text-dark fw-bold border-bottom pb-2">Security</h6>
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="form-label">New Password</label>
          <div className="input-wrapper">
            <FaLock className="input-icon" />
            <input 
              type={showPassword ? "text" : "password"} 
              className="form-control"
              placeholder="Leave blank to keep current" 
              name="password"
              value={formData.password} 
              onChange={handleChange} 
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <div className="input-wrapper">
            <FaLock className="input-icon" />
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              className="form-control"
              placeholder="Re-enter new password" 
              name="confirmPassword"
              value={formData.confirmPassword} 
              onChange={handleChange} 
            />
            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

      </div>

      {/* --- Actions --- */}
      <div className="form-actions">
        <button
          type="button"
          className="btn-action btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn-action btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default ProfileEdit;