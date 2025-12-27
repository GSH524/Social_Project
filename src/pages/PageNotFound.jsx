import React from 'react';
// Make sure to import Bootstrap CSS in your main entry file (e.g., index.js or App.js)
// import 'bootstrap/dist/css/bootstrap.min.css';

const PageNotFound = () => {
  // Custom styles for Glassmorphism
  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    color: 'white',
    padding: '2rem',
    maxWidth: '400px',
    width: '60%',
    boxShadow: "10px 20px 30px rgba(255, 255, 255, 0.5)"
  };

  // Background style to make the glass effect visible
  const backgroundContainerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg,  #444 20%, black 5%)', // Purple/Blue gradient
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  };

  return (
    <div style={backgroundContainerStyle}>
      <div className="text-center" style={glassStyle}>
        {/* Bootstrap Icon or Header */}
        <h1 className="display-1 fw-bold">404</h1>
        <h2 className="mb-3">Page Not Found</h2>
        
        <p className="lead mb-4">
          Oops! The page you are looking for does not exist. It might have been moved or deleted.
        </p>
        
        {/* Buttons using Bootstrap classes */}
        <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
          <button 
            className="btn btn-light btn-lg px-4 gap-3"
            onClick={() => window.location.href = '/'} // Or use useNavigate() if using React Router
          >
            Go Home
          </button>
          <button 
            className="btn btn-outline-light btn-lg px-4"
            onClick={() => window.history.back()} 
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;