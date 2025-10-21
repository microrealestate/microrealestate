import * as irlService from '../services/irlService.js';

export async function list(req, res) {
  try {
    const data = await irlService.getAllIRL();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error listing IRL:', err);
    return res.status(500).json({ message: 'Failed to retrieve IRL list' });
  }
}

export async function latest(req, res) {
  try {
    const data = await irlService.getLatestIRL();
    if (!data) {
      return res.status(404).json({ message: 'No IRL data found' });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error fetching latest IRL:', err);
    return res.status(500).json({ message: 'Failed to retrieve latest IRL' });
  }
}

export async function sync(req, res) {
  try {
    const result = await irlService.syncIRL();
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error syncing IRL:', err);
    return res.status(500).json({ message: 'Failed to sync IRL data' });
  }
}
