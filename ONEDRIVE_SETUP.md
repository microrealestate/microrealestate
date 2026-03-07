# OneDrive Backup Configuration Guide

This guide walks you through setting up OneDrive backup integration for file attachments in your PMS system.

## Overview

The system will automatically back up all uploaded attachments (property photos, documents, project files, etc.) to your OneDrive / Office 365 account using Microsoft Graph API.

**Important:** OneDrive is used as a **backup/archive layer only**. The application reads and serves files from primary storage (local disk), not from OneDrive.

---

## Prerequisites

- An Office 365 / Microsoft 365 account with OneDrive access
- Admin access to Azure AD (Azure Active Directory) for your tenant
- Access to the application's environment configuration

---

## Step 1: Register an Azure AD Application

1. **Navigate to Azure Portal**
   - Go to [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your Office 365 admin account

2. **Open Azure Active Directory**
   - In the left sidebar, click **Azure Active Directory**
   - Or search for "Azure Active Directory" in the top search bar

3. **Register a New Application**
   - In the left menu, click **App registrations**
   - Click **+ New registration**

4. **Fill in Application Details**
   - **Name**: `ButlerPMS File Backup` (or any descriptive name)
   - **Supported account types**: Select **Accounts in this organizational directory only (Single tenant)**
   - **Redirect URI**: Leave blank (not needed for backend service)
   - Click **Register**

5. **Save Your Application (Client) ID**
   - After registration, you'll see the application's **Overview** page
   - Copy and save the **Application (client) ID** — you'll need this later
   - Copy and save the **Directory (tenant) ID** — you'll need this too

---

## Step 2: Create a Client Secret

1. **Navigate to Certificates & Secrets**
   - In your registered app, click **Certificates & secrets** in the left menu

2. **Create a New Client Secret**
   - Under **Client secrets**, click **+ New client secret**
   - **Description**: `ButlerPMS Backend Secret`
   - **Expires**: Choose **24 months** (or your organization's policy)
   - Click **Add**

3. **Save Your Client Secret**
   - **IMPORTANT**: Copy the **Value** immediately — it will only be shown once
   - Store it securely (e.g., in a password manager)
   - You'll need this as your `ONEDRIVE_CLIENT_SECRET`

---

## Step 3: Configure API Permissions

1. **Navigate to API Permissions**
   - In your registered app, click **API permissions** in the left menu

2. **Add Microsoft Graph Permissions**
   - Click **+ Add a permission**
   - Select **Microsoft Graph**
   - Select **Application permissions** (not Delegated permissions)

3. **Add the Following Permissions**
   - Search for and add these permissions:
     - `Files.ReadWrite.All` — Read and write files in all site collections
     - `Sites.ReadWrite.All` — Read and write items in all site collections (optional, for SharePoint)

4. **Grant Admin Consent**
   - After adding permissions, click **Grant admin consent for [Your Organization]**
   - Confirm by clicking **Yes**
   - Wait for the status to show green checkmarks

---

## Step 4: Configure Environment Variables

Add the following environment variables to your application configuration:

### For Development (`.env` or `docker-compose` files):

```env
# OneDrive Backup Configuration
ONEDRIVE_ENABLED=true
ONEDRIVE_TENANT_ID=your-tenant-id-from-step-1
ONEDRIVE_CLIENT_ID=your-client-id-from-step-1
ONEDRIVE_CLIENT_SECRET=your-client-secret-from-step-2
ONEDRIVE_ROOT_FOLDER=ButlerPMS
```

### For Production:

Set these as environment variables in your hosting environment (Docker, Kubernetes, etc.).

### Configuration Details:

| Variable | Description | Example |
|----------|-------------|---------|
| `ONEDRIVE_ENABLED` | Enable/disable OneDrive backup | `true` or `false` |
| `ONEDRIVE_TENANT_ID` | Your Azure AD tenant ID | `12345678-1234-1234-1234-123456789abc` |
| `ONEDRIVE_CLIENT_ID` | Your app's client ID | `87654321-4321-4321-4321-abcdef123456` |
| `ONEDRIVE_CLIENT_SECRET` | Your app's client secret | `abc123xyz...` (long string) |
| `ONEDRIVE_ROOT_FOLDER` | Root folder name in OneDrive | `ButlerPMS` |

---

## Step 5: Verify Configuration

### Test Authentication

Once configured, the backup worker will authenticate using the [Client Credentials Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow).

**The authentication endpoint is:**
```
https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
```

**The Microsoft Graph API endpoint is:**
```
https://graph.microsoft.com/v1.0/me/drive/root:/...
```

### Check Backup Status

Once the backup worker is implemented, you can:
1. Upload a test file through the application
2. Check the attachment's `backupStatus` field in the database:
   - `pending` — Waiting to be backed up
   - `success` — Successfully backed up to OneDrive
   - `failed` — Backup failed (check `backupError` field)

---

## OneDrive Folder Structure

Files will be organized in OneDrive under:

```
/ButlerPMS/
├── Properties/
│   ├── PropertyName_PropertyId/
│   │   ├── Photos/
│   │   ├── Records/
│   │   ├── Maps/
│   │   └── Projects/
├── Contacts/
│   └── ContactName_ContactId/
├── Contractors/
├── Contracts/
└── Misc/
```

The exact path for each file is stored in the `backupPath` field of the `Attachment` record.

---

## Troubleshooting

### "Access Denied" or "Insufficient Permissions"

**Solution:**
- Verify admin consent was granted in Azure AD (Step 3.4)
- Ensure you selected **Application permissions**, not Delegated permissions
- Wait 5-10 minutes for permissions to propagate

### "Invalid Client Secret"

**Solution:**
- Verify the client secret was copied correctly (no extra spaces)
- Check if the secret has expired in Azure AD
- Generate a new secret if needed

### "Tenant ID or Client ID Not Found"

**Solution:**
- Double-check the IDs from the app registration overview page
- Ensure you're using the correct Azure AD tenant
- Verify the app registration still exists

### Files Not Being Backed Up

**Solution:**
- Check if `ONEDRIVE_ENABLED=true` is set
- Verify the backup worker is running (check application logs)
- Look at the `backupStatus` and `backupError` fields in the database
- Ensure the service has internet connectivity

---

## Security Best Practices

1. **Never commit secrets to version control**
   - Add `.env` to `.gitignore`
   - Use environment variables or secret management tools

2. **Rotate client secrets regularly**
   - Set expiration dates on secrets
   - Update the environment variable when rotating

3. **Use the principle of least privilege**
   - Only grant the minimum required permissions
   - Review permissions periodically

4. **Monitor API usage**
   - Check Azure AD sign-in logs
   - Monitor Microsoft Graph API throttling limits

---

## API Rate Limits

Microsoft Graph has rate limits:
- **Per-app limit**: ~2000 requests per second
- **Per-user limit**: Varies by resource

For large batch operations, implement throttling and retry logic with exponential backoff.

---

## Additional Resources

- [Microsoft Graph API Documentation](https://learn.microsoft.com/en-us/graph/)
- [Microsoft Graph Files API](https://learn.microsoft.com/en-us/graph/api/resources/onedrive)
- [Azure AD App Registration](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Client Credentials Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow)

---

## Next Steps

After configuration:
1. Implement the backup worker service (see `ButlerPMS_Update-Plan.md` Phase C)
2. Test with a small file upload
3. Monitor backup status in production
4. Set up alerts for failed backups

