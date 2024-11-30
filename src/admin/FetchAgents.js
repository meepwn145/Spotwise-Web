import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './AdminPage.css';
import { getRenderPropValue } from 'antd/es/_util/getRenderPropValue';
import AdminSide from './adminside';

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
      <div className="sidebar">
      <AdminSide />

      </div>

      <div  className="main-content container mt-5">
      <h1 className="pending text-center font-weight-bold">Operator Account</h1>
      <hr className="divider" />
      <div className="project-list mt-5 p-3 bg-light rounded" style={{ overflowY: 'scroll', height: '70vh', border: '2px solid #132B4B', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
        {agents.length > 0 ? (
            <table className="table table-striped table-hover">
            <thead className="thead-dark">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Profile</th>
                <th scope="col">Name</th>
                <th scope="col">Location</th>
                <th scope="col">E-mail</th>
                <th scope="col">Management</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent, index) => (
                <tr key={agent.id}>
                  <th scope="row">{index + 1}</th>
                  <td>
                    <img
                      src={agent.profileImageUrl || '/defaultt.png'}
                      alt={agent.firstName}
                      className="rounded-circle"
                      style={{ width: '50px', height: '50px' }}
                    />
                  </td>
                  <td>{agent.firstName} {agent.lastName}</td>
                  <td>{agent.address}</td>
                  <td>{agent.email}</td>
                  <td>{agent.managementName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center">No operators found.</p>
        )}
      </div>
    </div>
    </div>
  );
};

export default FetchAgents;