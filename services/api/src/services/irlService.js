import axios from 'axios';
import IRL from '../models/irlModel.js';

const INSEE_SERIE_URL = 'https://api.insee.fr/series/BDM/V1/data/001760607?detail=complete';

/**
 * Télécharge les valeurs IRL depuis l'API INSEE
 * Retourne un tableau [{year, quarter, value}]
 */
export async function fetchIRLFromINSEE() {
  try {
    console.log('[IRL] Fetching data from INSEE...');
    const response = await axios.get(INSEE_SERIE_URL, {
      headers: { Accept: 'application/json' },
    });

    const series = response.data?.Series || [];
    const irlData = [];

    for (const serie of series) {
      const observations = serie?.Obs || [];
      for (const obs of observations) {
        const period = obs['@TIME_PERIOD']; // ex: 2024-T2
        const value = parseFloat(obs['@OBS_VALUE']);
        if (!period || isNaN(value)) continue;

        const [year, quarter] = period.split('-');
        irlData.push({
          year: parseInt(year, 10),
          quarter,
          value,
        });
      }
    }

    console.log(`[IRL] Retrieved ${irlData.length} entries.`);
    return irlData;
  } catch (err) {
    console.error('[IRL] Failed to fetch INSEE data:', err.message);
    throw new Error('Failed to fetch IRL data from INSEE');
  }
}

/**
 * Synchronise les données IRL avec la base Mongo.
 * Ajoute uniquement les nouvelles valeurs.
 */
export async function syncIRL() {
  const data = await fetchIRLFromINSEE();
  let added = 0;
  let skipped = 0;

  for (const item of data) {
    const exists = await IRL.findOne({ year: item.year, quarter: item.quarter });
    if (!exists) {
      await IRL.create(item);
      added++;
    } else {
      skipped++;
    }
  }

  return {
    added,
    skipped,
    total: data.length,
    message:
      added > 0
        ? `Added ${added} new IRL records (${skipped} existing).`
        : 'Database already up to date.',
  };
}

/**
 * Retourne toutes les valeurs IRL triées
 */
export async function getAllIRL() {
  return IRL.find().sort({ year: 1, quarter: 1 });
}

/**
 * Retourne la dernière valeur IRL connue
 */
export async function getLatestIRL() {
  const last = await IRL.find().sort({ year: -1, quarter: -1 }).limit(1);
  return last[0] || null;
}
