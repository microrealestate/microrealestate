# Azure Maps Quick Start Checklist

Follow these steps to set up and verify Azure Maps integration:

## ✅ Step 1: Get Azure Maps API Key

- [ ] Create Azure Maps resource (see [AZURE_MAPS_SETUP.md](./AZURE_MAPS_SETUP.md) for detailed instructions)
- [ ] Copy API Key from Azure Portal → Azure Maps → Authentication → Primary Key

**Your API Key**: `________________________________`

## ✅ Step 2: Configure Application

### Option A: Development (Recommended for testing)

```bash
# Create .env.local in root directory
NEXT_PUBLIC_AZURE_MAPS_API_KEY=your_api_key_here

# Also create in webapps/landlord/.env.local
NEXT_PUBLIC_AZURE_MAPS_API_KEY=your_api_key_here

# And in webapps/tenant/.env.local
NEXT_PUBLIC_AZURE_MAPS_API_KEY=your_api_key_here
```

### Option B: Docker Environment

```bash
# Update base.env
NEXT_PUBLIC_AZURE_MAPS_API_KEY=your_api_key_here

# Or set as environment variable before running
export NEXT_PUBLIC_AZURE_MAPS_API_KEY=your_api_key_here
docker-compose up
```

## ✅ Step 3: Verify Installation

### Files Created/Updated

```
webapps/landlord/
├── src/
│   ├── utils/
│   │   └── azureMapsConfig.js         ✓ New
│   ├── hooks/
│   │   └── useAzureMaps.js            ✓ New
│   └── components/
│       └── Map.js                      ✓ Updated

webapps/tenant/
├── src/
│   ├── utils/
│   │   └── azureMapsConfig.ts         ✓ New
│   ├── components/
│   │   ├── hooks/
│   │   │   └── useAzureMaps.ts        ✓ New
│   │   └── PropertyMap.tsx            ✓ New

Root:
├── base.env                           ✓ Updated
├── AZURE_MAPS_SETUP.md               ✓ New (detailed guide)
└── AZURE_MAPS_QUICK_START.md         ✓ This file
```

### Test the Maps

1. **Start Development Server**
   ```bash
   yarn dev
   ```

2. **Landlord App**
   - Navigate to: `http://localhost:3000/landlord`
   - Go to Properties section
   - View a property with address
   - Verify map displays and shows location

3. **Tenant App**
   - Navigate to: `http://localhost:3000/tenant`
   - View property details
   - Verify map displays location

### Verify API Key is Working

Check browser console (F12) for errors:

✓ **Success**: Map displays with red pin
✗ **Missing Key**: "Azure Maps API key not configured"
✗ **Invalid Key**: "401 Unauthorized" or "Invalid credentials"

## ✅ Step 4: Features Available

After setup, you can:

### In Landlord App

```javascript
import { useAzureMaps } from '../hooks/useAzureMaps';

function PropertyDetails() {
  const { geocodeAddress, getRoute, loading } = useAzureMaps();
  
  // Geocode addresses
  const location = await geocodeAddress(address);
  
  // Calculate routes
  const route = await getRoute(fromLocation, toLocation);
}
```

### In Tenant App

```typescript
import { PropertyMap } from '@/components/PropertyMap';

function PropertyPage() {
  return (
    <PropertyMap 
      address={propertyAddress}
      className="w-full h-96"
    />
  );
}
```

## ✅ Step 5: Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not showing | 1. Check API key is set in `.env.local` 2. Restart dev server 3. Clear browser cache |
| "API key not configured" | Add `NEXT_PUBLIC_AZURE_MAPS_API_KEY` to `.env.local` files |
| 401 Unauthorized | Verify API key is copied correctly from Azure Portal |
| Address not found | Verify address format or try simpler address (city + country) |
| Maps script fails to load | Check internet connection, might be Azure CDN issue |

## 📚 Additional Resources

- **Detailed Setup Guide**: [AZURE_MAPS_SETUP.md](./AZURE_MAPS_SETUP.md)
- **Azure Portal**: https://portal.azure.com
- **Azure Maps Docs**: https://learn.microsoft.com/en-us/azure/azure-maps/
- **Pricing Info**: https://azure.microsoft.com/en-us/pricing/details/azure-maps/

## 🎯 Next Steps

1. ✓ Set up Azure Maps (this checklist)
2. Build additional features:
   - Multi-property routing
   - Real-time traffic display
   - Driving directions
   - Geographic filters
3. Customize map appearance
4. Add analytics and monitoring

## 📝 Notes

- API Key is publicly accessible (frontend) - this is by design and secure
- Azure Maps includes 50K free map loads/month on S0 tier
- For production, monitor usage in Azure Cost Management
- Consider setting up alerts for quota/cost limits

---

**Setup Date**: ________________
**API Key Set**: ☐ Yes ☐ In Progress
**Maps Tested**: ☐ Landlord App ☐ Tenant App
**Status**: ☐ Working ☐ Issues (describe below)

Issues/Notes:
```
_________________________________________________________________
_________________________________________________________________
```
