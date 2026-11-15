const PROPERTY_TYPE_LABELS = {
  estate: 'Estate',
  building: 'Building',
  floor: 'Floor',
  apartment: 'Apartment',
  office: 'Office',
  store: 'Store',
  room: 'Room',
  cellar: 'Cellar',
  garage: 'Garage',
  parking: 'Parking spot',
  letterbox: 'Mailbox'
};

const PROPERTY_TYPE_ORDER = [
  'estate',
  'building',
  'floor',
  'apartment',
  'office',
  'store',
  'room',
  'cellar',
  'garage',
  'parking',
  'letterbox'
];

const types = PROPERTY_TYPE_ORDER.map((id) => ({
  id,
  labelId: PROPERTY_TYPE_LABELS[id]
}));

export default types;
