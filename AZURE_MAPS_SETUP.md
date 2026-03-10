# Azure Maps Setup Guide

This guide explains how to set up Azure Maps for the MicroRealEstate application. Azure Maps provides geolocation, search, and routing services for displaying property locations on interactive maps.

## Overview

The application uses Azure Maps in the following ways:

- **Landlord Webapp**: Display property locations with address geocoding and routing
- **Tenant Webapp**: Show property details with location maps

## Prerequisites

1. An Azure account (free tier available)
2. Azure Maps API Key

## Step 1: Create Azure Maps Resource

### Option A: Using Azure Portal (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Click **"Create a resource"**
3. Search for **"Azure Maps"** and click create
4. Fill in the details:
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or select existing
   - **Name**: `microrealestate-maps` (or your preferred name)
   - **Pricing Tier**: `Standard S0` (free tier includes 50K map loads/month)
   - Click **Create**

### Option B: Using Azure CLI

```bash
# Create resource group (if not exists)
az group create --name myResourceGroup --location eastus

# Create Azure Maps account
az maps account create \
  --resource-group myResourceGroup \
  --account-name microrealestate-maps \
  --sku S0
```

## Step 2: Get Your API Key

### Via Azure Portal

1. Go to **Azure Portal** → **Azure Maps**
2. Select your Maps resource
3. Go to **Authentication** tab
4. Copy the **Primary Key** under "Shared Key authentication"

### Via Azure CLI

```bash
az maps account keys list \
  --resource-group myResourceGroup \
  --account-name microrealestate-maps
```

## Step 3: Configure the Application

### For Development

1. Create or edit `.env.local` in the root directory:

```env
NEXT_PUBLIC_AZURE_MAPS_API_KEY=your_api_key_here
```

2. Also update `webapps/landlord/.env.local` and `webapps/tenant/.env.local`:

```env
NEXT_PUBLIC_AZURE_MAPS_API_KEY=your_api_key_here
```

### For Docker (Production)

1. Update `docker-compose.microservices.prod.yml`:

```yaml
services:
  landlord-frontend:
    environment:
      - NEXT_PUBLIC_AZURE_MAPS_API_KEY=${NEXT_PUBLIC_AZURE_MAPS_API_KEY}

  tenant-frontend:
    environment:
      - NEXT_PUBLIC_AZURE_MAPS_API_KEY=${NEXT_PUBLIC_AZURE_MAPS_API_KEY}
```

2. Set the environment variable before starting containers:

```bash
export NEXT_PUBLIC_AZURE_MAPS_API_KEY=your_api_key_here
docker-compose -f docker-compose.microservices.prod.yml up -d
```

## Step 4: Verify the Setup

1. Start the development server:

```bash
yarn dev
```

2. Navigate to the landlord or tenant application
3. Go to property details/listings page
4. Verify that maps load and display property locations

If maps don't display:
- Check browser console for errors
- Verify API key is set correctly
- Ensure API key has necessary permissions (Maps, Search, Route services)

## Features Enabled

### Geolocation
Properties are automatically geocoded using their address information:
- Street address
- City
- Zip code
- State
- Country

### Routing (Landlord App)
The `useAzureMaps` hook includes routing capabilities to calculate distances and directions between properties.

### Services

The configuration supports:
- **Search Service**: Geocoding addresses to coordinates
- **Route Service**: Getting directions between locations
- **Maps Service**: Displaying interactive maps

## Configuration Files

### Files Created

1. **Landlord App**
   - `webapps/landlord/src/utils/azureMapsConfig.js` - Configuration
   - `webapps/landlord/src/hooks/useAzureMaps.js` - Geolocation/routing hook
   - `webapps/landlord/src/components/Map.js` - Map component (updated)

2. **Tenant App**
   - `webapps/tenant/src/utils/azureMapsConfig.ts` - Configuration
   - `webapps/tenant/src/components/hooks/useAzureMaps.ts` - Geolocation/routing hook
   - `webapps/tenant/src/components/PropertyMap.tsx` - Map component

### Environment Variables

Add to `.env` or `.env.local`:

```env
# Azure Maps API Key (required for maps to work)
NEXT_PUBLIC_AZURE_MAPS_API_KEY=your_api_key_here

# Optional: Customize routing behavior
# AZURE_MAPS_ROUTE_TYPE=fastest  # Options: fastest, shortest, eco
```

## Usage Examples

### In Landlord App (JavaScript)

```javascript
import { useAzureMaps } from '../hooks/useAzureMaps';

export function PropertyDetails() {
  const { geocodeAddress, getRoute, loading, error } = useAzureMaps();

  // Geocode an address
  const location = await geocodeAddress({
    street1: '123 Main St',
    city: 'San Francisco',
    zipCode: '94102',
    country: 'USA'
  });

  // Get route between two properties
  const route = await getRoute(
    { lat: 37.7749, lon: -122.4194 },
    { lat: 37.8044, lon: -122.2712 }
  );

  return (
    // Component with map
  );
}
```

### In Tenant App (TypeScript)

```typescript
import { PropertyMap } from '@/components/PropertyMap';

export function PropertyDetailsPage() {
  const address = {
    street1: '123 Main St',
    city: 'San Francisco',
    zipCode: '94102',
    country: 'USA'
  };

  return (
    <PropertyMap 
      address={address}
      className="w-full h-96"
    />
  );
}
```

## Troubleshooting

### Maps Not Displaying

1. **Missing API Key**
   ```
   Error: Azure Maps API key not configured
   ```
   Solution: Check that `NEXT_PUBLIC_AZURE_MAPS_API_KEY` is set in `.env.local`

2. **Invalid API Key**
   ```
   Error: 401 Unauthorized
   ```
   Solution: Verify API key from Azure Portal is correct

3. **Quota Exceeded**
   ```
   Error: 429 Too Many Requests
   ```
   Solution: Check your Azure Maps pricing tier and limits

4. **CORS Issues**
   Azure Maps should work cross-origin. If you encounter CORS errors:
   - Ensure your domain is added to Azure Maps allowed origins
   - Go to Azure Portal → Azure Maps → CORS settings

### Address Not Found

- Verify address format is correct
- Try with less specific address (e.g., just city and country)
- Some addresses may not be recognized by Azure service

## Cost Management

Azure Maps pricing (as of 2024):
- **Free Tier (S0)**: 50,000 map tiles/month, 1,000 geocoding requests/month
- **Standard (S1)**: Pay-as-you-go, starting ~$0.50 per 1,000 transactions
- **Premium (S2)**: For high-volume applications

Monitor costs in Azure Portal → Cost Management → Current Month

## Security Best Practices

1. **Never commit API keys to git**
   - Use `.env.local` (excluded from git)
   - Use environment variables in production

2. **Rotate keys periodically**
   - Generate secondary key in Azure Portal
   - Update applications
   - Delete old key

3. **Use subscription-based authentication**
   - API key is sufficient for development
   - Consider Azure AD for enterprise deployments

4. **Monitor API usage**
   - Check Azure Portal for usage statistics
   - Set up alerts for quota exhaustion

## Resources

- [Azure Maps Documentation](https://learn.microsoft.com/en-us/azure/azure-maps/)
- [Azure Maps Web Control](https://learn.microsoft.com/en-us/azure/azure-maps/how-to-use-map-control)
- [Azure Maps Services](https://learn.microsoft.com/en-us/azure/azure-maps/services/)
- [Azure Maps Pricing](https://azure.microsoft.com/en-us/pricing/details/azure-maps/)
- [Azure Free Account](https://azure.microsoft.com/en-us/free/)

## Support

For issues or questions:
1. Check Azure Maps documentation
2. Review browser console for error messages
3. Check application logs
4. Contact Azure support if issues persist
