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
          onChange={(e) => (
            setSearchInput(e.target.value), handleOnChange(e.target.value)
          )}
          placeholder="Search Car Plate Number"
          style={{ borderRadius: "5px" }}
          className="search-bar"
        />
        <button
          className="btn-custom-search"
          type="submit"
          style={{ marginTop: "10px", marginLeft: "30px", borderRadius: "5px" }}
        >
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchForm;
