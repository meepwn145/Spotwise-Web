import {
    collection,
    query,
    where,
    onSnapshot,
    getDocs,
  } from "firebase/firestore";
  import { db } from "../config/firebase";
  
  /**
   * Fetch real-time data from Firestore.
   * @param {Object} params - Parameters for the query.
   * @param {string} params.collectionName - Name of the Firestore collection.
   * @param {Array} params.conditions - Array of conditions for the query (e.g., [["field", "==", value]]).
   * @param {Function} callback - Function to handle the data or errors (called with { data, error }).
   * @returns {Function} Unsubscribe function to stop listening.
   */
  
  export const timeOptions = {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  };
  
  export const fetchData = ({ collectionName, conditions }, callback) => {
    const collectionRef = collection(db, collectionName);
  
    const queryConditions = conditions.map(([field, operator, value]) =>
      where(field, operator, value)
    );
    const q = query(collectionRef, ...queryConditions);
  
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (querySnapshot.empty) {
          // callback({ data: null, error: "No data found." });
          return;
        }
  
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback({ data, error: null });
      },
      (error) => {
        callback({ data: null, error });
      }
    );
  
    return unsubscribe;
  };
  
  /**
   * Fetch data once (non-real-time) from Firestore.
   * @param {Object} params - Parameters for the query.
   * @param {string} params.collectionName - Name of the Firestore collection.
   * @param {Array} params.conditions - Array of conditions for the query (e.g., [["field", "==", value]]).
   * @returns {Promise} Resolves with { data, error }.
   */
  export const fetchReservation = ({ collectionName, conditions }, callback) => {
    const collectionRef = collection(db, collectionName);
  
    const queryConditions = conditions.map(([field, operator, value]) =>
      where(field, operator, value)
    );
    const q = query(collectionRef, ...queryConditions);
  
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        if (querySnapshot.empty) {
          // callback({ data: null, error: "No data found." });
          return;
        }
  
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback({ data, error: null });
      },
      (error) => {
        callback({ data: null, error });
      }
    );
  
    return unsubscribe;
  };
  
  // Fetch multiple reservation
  export const fetchMultipleReservations = (queries, callback) => {
    const unsubscribes = [];
  
    queries.forEach(({ collectionName, conditions }) => {
      const collectionRef = collection(db, collectionName);
  
      const queryConditions = conditions.map(([field, operator, value]) =>
        where(field, operator, value)
      );
      const q = query(collectionRef, ...queryConditions);
  
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          if (querySnapshot.empty) {
            // Call callback with null data for this query
            callback({ collectionName, data: null, error: "No data found." });
            return;
          }
  
          const data = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          callback({ collectionName, data, error: null });
        },
        (error) => {
          callback({ collectionName, data: null, error });
        }
      );
  
      unsubscribes.push(unsubscribe);
    });
  
    // Return a cleanup function to unsubscribe all listeners
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  };