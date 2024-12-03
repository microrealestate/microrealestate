import React from 'react';
import WarrantyIcon from './WarrantyIcon';

const WarrantyListItem = ({ warranty }) => {
  return (
    <div className="warranty-item">
      <WarrantyIcon type={warranty.type} />
      <div className="warranty-details">
        <h3>{warranty.name}</h3>
        <p>{warranty.description}</p>
      </div>
    </div>
  );
};

export default WarrantyListItem;