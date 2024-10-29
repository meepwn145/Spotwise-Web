import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, storage } from '../config/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import './EmailDetailPage.css';

function EmailDetailPage() {
    const { email } = useParams();
    const [images, setImages] = useState([]);
  
    useEffect(() => {
      const fetchImage = async () => {
        try {
          const docRef = doc(db, "pendingEstablishments", email);
          const docSnap = await getDoc(docRef);
  
          if (docSnap.exists()) {
            const fileURLs = docSnap.data().fileURLs; 
            if (Array.isArray(fileURLs)) {
              setImages(fileURLs);
            }
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching image:", error);
        }
      };
  
      fetchImage();
    }, [email]);
  
    return (
        <div className="email-detail-page">
          <h2>Images associated with the document of {email}</h2> { }
          <div className="email-images-container">
            {images.length > 0 ? (
              images.map((imgUrl, index) => (
                <img 
                  key={index} 
                  src={imgUrl} 
                  alt={`Email Associated ${index}`} 
                  className="email-image"
                />
              ))
            ) : (
              <p>No images found.</p>
            )}
          </div>
          <button>Return</button>
        </div>
      );
    }
  
  export default EmailDetailPage;
