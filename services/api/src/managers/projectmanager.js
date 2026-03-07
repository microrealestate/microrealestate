import { Collections } from '@microrealestate/common';

/**
 * Validate that the user has access to the target entity
 */
async function _validateTargetAccess(targetType, targetId, realmId) {
  let targetExists = false;

  switch (targetType) {
    case 'property':
      targetExists = await Collections.Property.exists({
        _id: targetId,
        realmId
      });
      break;
    case 'contact':
    case 'tenant':
      targetExists = await Collections.Tenant.exists({
        _id: targetId,
        realmId
      });
      break;
    case 'contractor':
      targetExists = await Collections.Contractor.exists({
        _id: targetId,
        realmId
      });
      break;
    default:
      return false;
  }

  return targetExists;
}

/**
 * GET /projects?targetType=<type>&targetId=<id>&status=<status>
 * List projects with optional filters
 */
export async function all(req, res) {
  const realm = req.realm;
  const { targetType, targetId, status, contractorId } = req.query;

  const query = {
    realmId: realm._id
  };

  if (targetType) {
    query.targetType = targetType;
  }

  if (targetId) {
    // Verify access to target
    const hasAccess = await _validateTargetAccess(
      targetType,
      targetId,
      realm._id
    );

    if (!hasAccess) {
      return res.status(404).json({
        message: `${targetType} not found or access denied`
      });
    }

    query.targetId = targetId;
  }

  if (status) {
    query.status = status;
  }

  if (contractorId) {
    query.contractorId = contractorId;
  }

  const projects = await Collections.Project.find(query)
    .sort({ createdAt: -1 })
    .lean();

  return res.json(projects);
}

/**
 * GET /projects/:id
 * Get a single project by ID
 */
export async function one(req, res) {
  const realm = req.realm;
  const projectId = req.params.id;

  const project = await Collections.Project.findOne({
    _id: projectId,
    realmId: realm._id
  }).lean();

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Verify access to target entity
  const hasAccess = await _validateTargetAccess(
    project.targetType,
    project.targetId,
    realm._id
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: 'Access denied to project target entity'
    });
  }

  return res.json(project);
}

/**
 * POST /projects
 * Create a new project
 */
export async function add(req, res) {
  const realm = req.realm;
  const { targetType, targetId } = req.body;

  if (!targetType || !targetId) {
    return res.status(400).json({
      message: 'targetType and targetId are required'
    });
  }

  // Verify access to target entity
  const hasAccess = await _validateTargetAccess(
    targetType,
    targetId,
    realm._id
  );

  if (!hasAccess) {
    return res.status(404).json({
      message: `${targetType} not found or access denied`
    });
  }

  // Determine who created
  const createdById =
    req.user?._id || req.user?.email || req.user?.clientId || 'unknown';
  const createdByName = req.user?.firstname
    ? `${req.user.firstname} ${req.user.lastname || ''}`.trim()
    : req.user?.email || 'Unknown User';

  const project = new Collections.Project({
    ...req.body,
    realmId: realm._id,
    createdById,
    createdByName
  });

  await project.save();

  return res.status(201).json(project);
}

/**
 * PATCH /projects/:id
 * Update a project
 */
export async function update(req, res) {
  const realm = req.realm;
  const projectId = req.params.id;

  const existingProject = await Collections.Project.findOne({
    _id: projectId,
    realmId: realm._id
  }).lean();

  if (!existingProject) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Verify access to target entity
  const hasAccess = await _validateTargetAccess(
    existingProject.targetType,
    existingProject.targetId,
    realm._id
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: 'Access denied to project target entity'
    });
  }

  // Don't allow changing targetType or targetId after creation
  const updates = { ...req.body };
  delete updates._id;
  delete updates.realmId;
  delete updates.targetType;
  delete updates.targetId;
  delete updates.createdById;
  delete updates.createdByName;
  delete updates.createdAt;

  const updatedProject = await Collections.Project.findOneAndUpdate(
    {
      _id: projectId,
      realmId: realm._id
    },
    updates,
    { new: true }
  ).lean();

  return res.json(updatedProject);
}

/**
 * DELETE /projects/:id
 * Delete a project
 */
export async function remove(req, res) {
  const realm = req.realm;
  const projectId = req.params.id;

  const project = await Collections.Project.findOne({
    _id: projectId,
    realmId: realm._id
  }).lean();

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Verify access to target entity
  const hasAccess = await _validateTargetAccess(
    project.targetType,
    project.targetId,
    realm._id
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: 'Access denied to project target entity'
    });
  }

  await Collections.Project.deleteOne({
    _id: projectId,
    realmId: realm._id
  });

  // TODO: Optionally delete associated attachments and notes
  // For now, we'll leave them orphaned (they can be cleaned up later)

  return res.sendStatus(204);
}
