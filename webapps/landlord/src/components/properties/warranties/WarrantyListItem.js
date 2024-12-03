import React from 'react';
import WarrantyIcon from './WarrantyIcon';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';

const WarrantyListItem = ({ warranty }) => {
  return (
    <Card className="warranty-item overflow-auto max-h-64">
      <CardHeader>
        <CardTitle>
          <WarrantyIcon type={warranty.type} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="warranty-details">
          <h3>{warranty.name}</h3>
          <p>{warranty.description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WarrantyListItem;