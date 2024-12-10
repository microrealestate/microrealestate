import React from 'react';
import { FaBolt, FaTint, FaBuilding } from 'react-icons/fa';

const WarrantyIcon = ({ type }) => {
  switch (type) {
    case 'electrical':
      return <FaBolt />;
    case 'plumbing':
      return <FaTint />;
    case 'structural':
      return <FaBuilding />;
    default:
      return null;
  }
};

export default WarrantyIcon;