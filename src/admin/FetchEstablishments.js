import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import './AdminPage.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import AdminSide from './adminside';

const FetchEstablishments = () => {
  const [establishments, setEstablishments] = useState([]);

  useEffect(() => {
    const fetchEstablishments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "establishments"));
        const establishmentsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEstablishments(establishmentsList);
      } catch (error) {
        console.error("Error fetching establishments:", error);
        
      }
    };

    fetchEstablishments();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="sidebar">
      <AdminSide />

      </div>
      
      <div className="main-content container mt-5">
        <h1 className="pending text-center font-weight-bold">Establishments Accounts</h1>
        <hr className="divider" />
        <div className="project-list mt-5 p-3 bg-light rounded" style={{ overflowY: 'scroll', height: '70vh', border: '2px solid #132B4B', boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)' }}>
          {establishments.length > 0 ? (
           <table className="table table-striped table-hover">
           <thead className="thead-dark">
             <tr>
               <th scope="col">#</th>
               <th scope="col">Profile</th>
               <th scope="col">Establishment</th>
               <th scope="col">Parking Location</th>
               <th scope="col">Approval Date</th>
             </tr>
           </thead>
           <tbody>
             {establishments.map((establishment, index) => (
               <tr key={establishment.id}>
                 <th scope="row">{index + 1}</th>
                 <td>
                   <img
                     src={establishment.profileImageUrl || '/defaultt.png'}
                     alt={establishment.managementName}
                     className="rounded-circle"
                     style={{ width: '50px', height: '50px' }}
                   />
                 </td>
                 <td>{establishment.managementName}</td>
                 <td>{establishment.companyAddress}</td>
                 <td>
                   {establishment.createdAt?.seconds
                     ? new Date(establishment.createdAt.seconds * 1000).toLocaleDateString()
                     : 'Date not available'}
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
       ) : (
         <p className="text-center">No establishments found.</p>
       )}
        </div>
      </div>
    </div>
  );
}
export default FetchEstablishments;