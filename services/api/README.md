# api
# IRL (Indice de Référence des Loyers)

## Endpoints

| Method | Route | Description |
|--------|--------|-------------|
| `GET` | `/api/v2/irl` | Liste complète des IRL |
| `GET` | `/api/v2/irl/latest` | Dernier indice connu |
| `POST` | `/api/v2/irl/sync` | Synchronise les nouvelles valeurs depuis l’INSEE |

## Notes
- Lors du premier appel à `/sync`, toutes les valeurs INSEE sont importées.
- Lors des appels suivants, seules les nouvelles périodes sont ajoutées.
- Les données sont sauvegardées dans MongoDB (`irl` collection).
