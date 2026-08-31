import { PROPERTY_KINDS } from '@microrealestate/shared';

const PROPERTY_TYPE_LABELS = {
  store: 'Store',
  building: 'Building',
  apartment: 'Apartment',
  room: 'Room',
  office: 'Office',
  garage: 'Garage',
  parking: 'Parking spot',
  letterbox: 'Mailbox'
};

const types = PROPERTY_KINDS.map((id) => ({
  id,
  labelId: PROPERTY_TYPE_LABELS[id]
}));

export default types;
