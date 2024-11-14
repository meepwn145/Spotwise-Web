import React, { useState, useEffect } from "react";
import { fetchAllFeedback, fetchFeedbackById } from "./FeedbackAPI.js";
import { MDBCol, MDBContainer, MDBRow, MDBCard, MDBCardText, MDBCardBody, MDBCardImage, MDBListGroup, MDBListGroupItem, MDBBtn, MDBTypography } from "mdb-react-ui-kit";
import { DropdownButton, Dropdown } from "react-bootstrap";
import { FaUserCircle } from "react-icons/fa";
import { useLocation, Link } from "react-router-dom";
import { auth, db } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import Navigation from "./navigation.js";
import EstablishmentReserve from "./establishmentReserve";


const FeedbackPage = () => {
    const [feedbackList, setFeedbackList] = useState([]);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [clickedFeedbackIds, setClickedFeedbackIds] = useState([]);
    const itemsPerPage = 5;
    const [profileImageUrl, setProfileImageUrl] = useState('');
    const [managementName, setManagementName] = useState(null);
    const userDocRef = auth.currentUser ? doc(db, "establishments", auth.currentUser.uid) : null;
    useEffect(() => {
      if (userDocRef) {
          const fetchImageUrl = async () => {
              const docSnap = await getDoc(userDocRef);
              if (docSnap.exists()) {
                  const userData = docSnap.data();
                  setProfileImageUrl(userData.profileImageUrl);
              } else {
                  console.log("No such document!");
              }
          };

          fetchImageUrl().catch(console.error);
      }
  }, [userDocRef]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const uid = user.uid;
                const userDocRef = doc(db, "establishments", uid);
                getDoc(userDocRef).then((docSnapshot) => {
                    if (docSnapshot.exists()) {
                        setManagementName(docSnapshot.data().managementName);
                    } else {
                        console.log("No such document!");
                    }
                });
            } else {
                setManagementName(null);
            }
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (managementName) {
            fetchAllFeedback()
                .then((data) => {
                    const relevantFeedback = data.filter((feedback) => feedback.managementName === managementName);
                    setFeedbackList(relevantFeedback);
                })
                .catch((error) => {
                    console.error("Error fetching feedback:", error);
                });
        }
    }, [managementName]);

    const handleFeedbackClick = (id) => {
        console.log(`Feedback ID clicked: ${id}`);
        fetchFeedbackById(id)
            .then((data) => {
                setSelectedFeedback(data);
            })
            .catch((error) => {
                console.error("Error fetching feedback:", error);
            });
    };

    const handleDeleteFeedback = async (id) => {
        const confirmed = window.confirm("Are you sure you want to delete this feedback?");
        if (confirmed) {
            try {
                const docRef = doc(db, "feedback", id);
                await deleteDoc(docRef);

                const updatedFeedbackList = feedbackList.filter((feedback) => feedback.id !== id);
                setFeedbackList(updatedFeedbackList);

                const updatedClickedIds = clickedFeedbackIds.filter((clickedId) => clickedId !== id);
                localStorage.setItem("clickedFeedbackIds", JSON.stringify(updatedClickedIds));
                setClickedFeedbackIds(updatedClickedIds);

                if (selectedFeedback && selectedFeedback.id === id) {
                    setSelectedFeedback(null);
                }
            } catch (error) {
                console.error("Error deleting document: ", error);
            }
        }
    };

    useEffect(() => {
        const clickedIds = JSON.parse(localStorage.getItem("clickedFeedbackIds")) || [];
        setClickedFeedbackIds(clickedIds);
    }, []);

    const totalPages = Math.ceil(feedbackList.length / itemsPerPage);
    const pageFeedbackList = feedbackList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const feedbackListItemStyle = {
        cursor: "pointer",
        padding: "5px 0",
        borderBottom: "1px solid #ccc",
        fontFamily: "Georgina",
        marginTop: "10px",
    };

    const navbarStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px",
        backgroundColor: "rgba(4, 55,55, 0.7)",
        color: "white",
        width: "100%",
    };

    const logoStyle = {
        fontSize: "18px",
        fontFamily: "Georgina",
        marginLeft: "50px",
    };

    const styles = {
        mainContainer: {
            marginTop: "45px",
            maxWidth: "800px",
            maxLength: "800px",
            margin: "0 auto",
            padding: "20px",
            backgroundColor: "white",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",

        },
        welcomeMessage: {
            position: "absolute",
            top: "10px",
            right: "10px",
            margin: "0",
            color: "#fff",
            fontFamily: "Rockwell, sans-serif",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
        },
        icon: {
            marginRight: "5px",
        },
        feedbackContainer: {
            padding: "30px",
            backgroundColor: "#f9f9f9",
            borderRadius: "20px",
            border: "1px solid #ccc",
            marginTop: "30px",
            
        },
    };

    const para = {
        fontFamily: "Georgina",
        marginTop: "10px",
    };

    return (
         
        <section>

 <div className="admin-dashboard"> {/* Adjusted marginTop to account for navbar */}
        <div className="sidebar">
            <div className="admin-container">
            </div>
            <div class="wrapper">
                <div class="side">
                    <div>
                   <EstablishmentReserve/>
                    
                </div>
                
            </div>
            </div>
</div>
<MDBContainer>
      <MDBRow className="mt-5">
        <MDBCol lg="4"></MDBCol>
        <MDBCol lg="8">
          <MDBCard style={{ maxWidth: "800px", marginLeft: '-20vh', marginTop: '20vh'}}>
            <MDBCardBody>
              <h1 className="text-center mb-5">Customer Feedback</h1>
              <div className="d-flex">
                <div className="flex-fill" style={{ width: '60%' }}>
                <div
                    style={{
                        backgroundColor: '#003851',
                        color: 'white',
                        padding: '1rem',
                        marginBottom: '1rem',
                        borderRadius: '8px' // Adjust the value as needed for the desired curve
                    }}
                >
                    FEEDBACK LIST
                </div>

                  <ul className="list-group mb-3">
                    {pageFeedbackList.map((feedback) => {
                      const isClicked = clickedFeedbackIds.includes(feedback.id);
                      const listItemStyle = {
                        backgroundColor: isClicked ? "#f0f0f0" : "transparent",
                        cursor: 'pointer'
                      };

                      return (
                        <li key={feedback.id} onClick={() => handleFeedbackClick(feedback.id)} className="list-group-item" style={listItemStyle}>
                          {feedback.email}
                        </li>
                      );
                    })}
                  </ul>
                  <div className="d-flex justify-content-center">
                    <button className="btn btn-secondary me-2" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                       Prev 
                    </button>
                    <span className="mt-2">{`Page ${currentPage}`}</span>
                    <button className="btn btn-success ms-2" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                      Next
                    </button>
                  </div>
                </div>
                <div className="flex-fill ms-3">
                  {selectedFeedback ? (
                    <div>
                      <div className="bg-primary text-white p-3 mb-3">FEEDBACK DETAILS</div>
                      <div>
                        <p>Company Address: {selectedFeedback.companyAddress}</p>
                        <p>Email: {selectedFeedback.email}</p>
                        <p>Created at: {new Date(selectedFeedback.createdAt.seconds * 1000).toLocaleDateString()}</p>
                        <p>Message: {selectedFeedback.message}</p>
                        <button className="btn btn-danger" onClick={() => handleDeleteFeedback(selectedFeedback.id)}>Delete Feedback</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center">Select a feedback entry to view details.</p>
                  )}
                </div>
              </div>
            </MDBCardBody>
          </MDBCard>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
            </div>


        </section>
    );
};

export default FeedbackPage;