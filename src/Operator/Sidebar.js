import { useState, useEffect, useContext } from 'react';
import { auth, db } from "../config/firebase";
import { updateDoc, doc, getDoc } from "firebase/firestore";

import { NavLink } from 'react-router-dom';
import UserContext from '../UserContext';
import { FaUserCircle } from "react-icons/fa";

const Sidebar = () => {
  const { user } = useContext(UserContext);
  const [profileImageUrl, setProfileImageUrl] = useState("");

  // Fetch user profile image
  useEffect(() => {
    const fetchProfileImage = async () => {
        if (auth.currentUser) {
            const userDocRef = doc(db, "agents", auth.currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                setProfileImageUrl(userData.profileImageUrl);
                console.log("Fetched Profile Image URL:", userData.profileImageUrl);
            } else {
                console.log("No such document!");
            }
        }
    };

    fetchProfileImage().catch(console.error);
}, []);

  return (
    <div className="sidebar">
      <div className="admin-container">
      <img
        src={profileImageUrl || "default_placeholder.jpg"}
        alt="Operator"
        className="admin-pic"
        style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          marginBottom: '15px' 
        }}
      />

        <div className="sidebar-header" style={{ padding: '20px', color: 'white', textAlign: 'center', fontSize: '24px' }}>
          Welcome, {user?.firstName || 'No name found'}
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
