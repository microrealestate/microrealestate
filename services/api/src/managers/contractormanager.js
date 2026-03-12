import { Collections } from '@microrealestate/common';

function normalizeBusinessType(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function toAuthorName(user) {
  if (!user) {
    return 'Unknown User';
  }

  if (user.firstname) {
    return `${user.firstname} ${user.lastname || ''}`.trim();
  }

  return user.email || 'Unknown User';
}

export async function all(req, res) {
  const realm = req.realm;

  const contractors = await Collections.Contractor.find({
    realmId: realm._id
  })
    .sort({ name: 1 })
    .lean();

  return res.json(contractors);
}

export async function one(req, res) {
  const realm = req.realm;
  const contractorId = req.params.id;

  const contractor = await Collections.Contractor.findOne({
    _id: contractorId,
    realmId: realm._id
  }).lean();

  if (!contractor) {
    return res.status(404).json({ message: 'Contractor not found' });
  }

  return res.json(contractor);
}

export async function add(req, res) {
  const realm = req.realm;
  const contractor = new Collections.Contractor({
    ...req.body,
    businessType: normalizeBusinessType(req.body.businessType),
    realmId: realm._id
  });

  await contractor.save();
  return res.json(contractor);
}

export async function update(req, res) {
  const realm = req.realm;
  const contractor = req.body;

  const dbContractor = await Collections.Contractor.findOneAndUpdate(
    {
      realmId: realm._id,
      _id: contractor._id
    },
    {
      ...contractor,
      businessType: normalizeBusinessType(contractor.businessType),
      updatedDate: new Date()
    },
    { new: true }
  ).lean();

  if (!dbContractor) {
    return res.status(404).json({ message: 'Contractor not found' });
  }

  return res.json(dbContractor);
}

export async function addReview(req, res) {
  const realm = req.realm;
  const contractorId = req.params.id;
  const rating = Number(req.body?.rating);
  const comment =
    typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'rating must be between 1 and 5' });
  }

  const contractor = await Collections.Contractor.findOne({
    _id: contractorId,
    realmId: realm._id
  });

  if (!contractor) {
    return res.status(404).json({ message: 'Contractor not found' });
  }

  const review = {
    rating,
    comment,
    authorId: String(
      req.user?._id || req.user?.email || req.user?.clientId || ''
    ),
    authorName: toAuthorName(req.user),
    createdAt: new Date()
  };

  contractor.reviews = [...(contractor.reviews || []), review];

  const reviewCount = contractor.reviews.length;
  const averageRating =
    contractor.reviews.reduce(
      (sum, currentReview) => sum + Number(currentReview.rating || 0),
      0
    ) / reviewCount;

  contractor.rating = Number(averageRating.toFixed(1));
  contractor.updatedDate = new Date();

  await contractor.save();

  return res.json(contractor.toObject());
}

export async function remove(req, res) {
  const realm = req.realm;
  const ids = req.params.ids.split(',');

  await Collections.Contractor.deleteMany({
    _id: { $in: ids },
    realmId: realm._id
  });

  res.sendStatus(200);
}

// ContractorWork endpoints

export async function getWork(req, res) {
  const realm = req.realm;
  const contractorId = req.params.contractorId;

  const work = await Collections.ContractorWork.find({
    realmId: realm._id,
    contractorId: contractorId
  })
    .sort({ startDate: -1 })
    .lean();

  return res.json(work);
}

export async function getWorkById(req, res) {
  const realm = req.realm;
  const workId = req.params.workId;

  const work = await Collections.ContractorWork.findOne({
    _id: workId,
    realmId: realm._id
  }).lean();

  if (!work) {
    return res.status(404).json({ message: 'Work record not found' });
  }

  return res.json(work);
}

export async function addWork(req, res) {
  const realm = req.realm;
  const contractorId = req.params.contractorId;

  // Verify contractor exists
  const contractor = await Collections.Contractor.findOne({
    _id: contractorId,
    realmId: realm._id
  });

  if (!contractor) {
    return res.status(404).json({ message: 'Contractor not found' });
  }

  const work = new Collections.ContractorWork({
    ...req.body,
    realmId: realm._id,
    contractorId: contractorId
  });

  await work.save();
  return res.status(201).json(work);
}

export async function updateWork(req, res) {
  const realm = req.realm;
  const workId = req.params.workId;

  const dbWork = await Collections.ContractorWork.findOneAndUpdate(
    {
      _id: workId,
      realmId: realm._id
    },
    {
      ...req.body,
      updatedDate: new Date()
    },
    { new: true }
  ).lean();

  if (!dbWork) {
    return res.status(404).json({ message: 'Work record not found' });
  }

  return res.json(dbWork);
}

export async function removeWork(req, res) {
  const realm = req.realm;
  const workId = req.params.workId;

  await Collections.ContractorWork.deleteOne({
    _id: workId,
    realmId: realm._id
  });

  res.sendStatus(204);
}

export async function allWork(req, res) {
  const realm = req.realm;
  const { propertyId, projectId, status } = req.query;

  const filter = {
    realmId: realm._id
  };

  if (propertyId) {
    filter.propertyId = propertyId;
  }

  if (projectId) {
    filter.projectId = projectId;
  }

  if (status) {
    filter.status = status;
  }

  const work = await Collections.ContractorWork.find(filter)
    .sort({ startDate: -1 })
    .lean();

  return res.json(work);
}
