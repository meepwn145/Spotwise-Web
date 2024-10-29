import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './AdminPage.css';
import { getRenderPropValue } from 'antd/es/_util/getRenderPropValue';

const FetchAgents = () => {
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'agents'));
        const agentsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAgents(agentsList);
      } catch (error) {
        console.error('Error fetching agents:', error);

      }
    };

    fetchAgents();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="sidebar"  >
        <div className="admin-container">
          <img
            src="customer.jpg"
            alt="Admin"
            className="admin-pic"
            style={{ width: '50px', marginRight: '10px' }}
          />
          <span className="admin-text">Admin</span>
        </div>
        
        <div class="wrapper">
    <div class="side">
        <h2>Menu</h2>
        <ul>
            <li><a href="AdminPage"><i class="fas fa-home"></i>Home</a></li>
            <li><a href='FetchEstablishments'><i class="fas fa-user"></i>Establishment Account</a></li>
            <li><a href='FetchParkingUsers'><i class="fas fa-address-card"></i>Parking Seeker List</a></li>
            <li><a href='FetchAgents'><i class="fas fa-project-diagram"></i>Operator List</a></li>
            <li><a href="/"><i className="fas fa-sign-out-alt" style={{ color: 'red' }}></i>Logout</a></li>
        </ul> 
    </div>
    </div>
    
      </div>
      <div className="main-content container mt-5">
      <h1 className="pending text-center font-weight-bold">Operator Account</h1>
      <hr className="divider" />
      <div className="project-list mt-5 p-3 bg-light rounded" style={{ overflowY: 'scroll', height: '70vh', border: '2px solid #132B4B', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
        {agents.length > 0 ? (
          <ul className="list-group" style={{ backgroundColor: 'rgba(19, 43, 75, 0.5)', padding: 10, borderRadius: 20 }}>
            {agents.map((agent, index) => (
              <React.Fragment key={agent.id}>
                <li className="list-group-item d-flex align-items-center mb-3" style={{ border: '2px solid #132B4B', borderRadius: 20 }}>
                  <img
                    src={agent.profileImageUrl || '/defaultt.png'}
                    alt={agent.profileImageUrl}
                    className="w3-bar-item w3-circle mr-3"
                    style={{ width: '85px' }}
                  />
                  <div className="w3-bar-item">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0">Name:</h5>
                      <span>{agent.firstName} {agent.lastName}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0">Location:</h5>
                      <span>{agent.address}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0">E-mail:</h5>
                      <span>{agent.email}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Management:</h5>
                      <span>{agent.managementName}</span>
                    </div>
                  </div>
                </li>
              </React.Fragment>
            ))}
          </ul>
        ) : (
          <p>No Operator found.</p>
        )}
      </div>
    </div>
    </div>
  );
};

export default FetchAgents;