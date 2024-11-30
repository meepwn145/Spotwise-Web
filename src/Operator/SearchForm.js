import React, { useState } from "react";
import { Modal, ModalFooter } from "react-bootstrap";
import "./space.css";

const SearchForm = ({
  onSearch,
  onSelectSlot,
  onExitSlot,
  selectedSlot,
  userDetails,
  onClose,
  handleOnChange,
  placeholder = "Enter Car Plate Number" 
}) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleAssignSlot = () => {
    if (userDetails) {
      onSelectSlot(userDetails.carPlateNumber, selectedSlot);
    } else {
      onSelectSlot(searchInput, selectedSlot);
    }
  };

  const handleExit = () => {
    onExitSlot(selectedSlot);
  };

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showExitModal, setExitModal] = useState(false);

  const closeModal = () => {
    setExitModal(false);
  };

  const closeModalSearch = () => {
    setShowSearchModal(false);
  };

  const closeModalAssign = () => {
    setShowAssignModal(false);
  };

  return (
    <div>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value);
            if (handleOnChange) {
              handleOnChange(e.target.value);
            }
          }}
          placeholder={placeholder}
          style={{ borderRadius: "5px" }}
          className="search-bar"
        />
      </form>
    </div>
  );
};

export default SearchForm;
