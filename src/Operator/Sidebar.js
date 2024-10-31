import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import UserContext from '../UserContext';
import { FaUserCircle } from "react-icons/fa";

const Sidebar = () => {
  const { user } = useContext(UserContext);

  return (
    <div className="sidebar">
      <div className="admin-container">
        <img 
          src="customer.jpg"
          alt="Admin"
          className="admin-pic" 
          style={{ width: '30px', marginRight: '5px', marginLeft: '-50px' }} 
        />
        {/* Display the user's email if available */}
        <div className="sidebar-header" style={{ padding: '20px', color: 'white', textAlign: 'center', fontSize: '24px' }}>
          <FaUserCircle size={28} style={{ marginRight: '10px' }} /> Welcome, {user?.firstName || 'No name found'}
        </div>
      </div>
      <div className="wrapper">
        <div className="side">
          <h2>Menu</h2>
          <ul>
            <li>
              <NavLink 
                to="/Home" 
                className={({ isActive }) => (isActive ? 'actives' : '')}
              >
                <i className="fas fa-home"></i>Home
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/ViewSpace" 
                className={({ isActive }) => (isActive ? 'actives' : '')}
              >
                <i className="fas fa-home"></i>Manage Parking
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/Reservation" 
                className={({ isActive }) => (isActive ? 'actives' : '')}
              >
                <i className="fas fa-user"></i>Manage Reservation
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/OperatorDashboard" 
                className={({ isActive }) => (isActive ? 'actives' : '')}
              >
                <i className="fas fa-address-card"></i>Report
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/OperatorProfile" 
                className={({ isActive }) => (isActive ? 'actives' : '')}
              >
                <i className="fas fa-blog"></i>Profile
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/" 
                className="logout"
              >
                <i className="fas fa-sign-out-alt" style={{ color: 'red' }}></i>Logout
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
