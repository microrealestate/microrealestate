import { Collections } from '@microrealestate/common';

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
export async function add(req, res) {
  const prop = req.prop;
  const warranty = new Collections.Warranty({
    ...req.body,
    propertyId: prop._id,
  });
  await warranty.save();
  return res.json(warranty);
}

export async function update(req, res) {
  const warranty = req.body;

  const dbWarranty = await Collections.Warranty.findOneAndUpdate(
    {
      _id: warranty._id
    },
    warranty,
    { new: true }
  ).lean();

  if (!dbWarranty) {
      return res.status(404).json({ error: 'Warranty not found' });
}
  return res.json(dbWarranty);
}

export async function remove(req, res) {
  const ids = req.params.ids.split(',');

  await Collections.Warranty.deleteMany({
    _id: { $in: ids }
  });

  res.sendStatus(200); // better to return 204
}

export async function all(req, res) {
    const prop = req.prop;

  const dbWarranties = await Collections.Warranty.find({
    propertyId: prop._id
  })
    .sort({
      name: 1
    })
    .lean();

  return res.json(dbWarranties);
}


export async function one(req, res) {
  const warrantyId = req.params.id;

  const dbWarranty = await Collections.Warranty.findOne({
    _id: warrantyId
  }).lean();

    if (!dbWarranty) {
        return res.status(404).json({ error: 'Warranty not found' });
    }
  return res.json(dbWarranty);
}
