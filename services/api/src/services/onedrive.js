import axios from 'axios';
import fs from 'fs-extra';

/**
 * OneDrive Backup Service
 *
 * Handles authentication and file uploads to OneDrive/Office 365
 * using Microsoft Graph API with Client Credentials flow
 */

class OneDriveService {
  constructor(config) {
    this.enabled = config.enabled || false;
    this.tenantId = config.tenantId;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.rootFolder = config.rootFolder || 'ButlerPMS';

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Check if OneDrive backup is enabled and configured
   */
  isEnabled() {
    return this.enabled && this.tenantId && this.clientId && this.clientSecret;
  }

  /**
   * Authenticate with Microsoft Graph using Client Credentials flow
   */
  async authenticate() {
    if (!this.isEnabled()) {
      throw new Error('OneDrive backup is not enabled or not configured');
    }

    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const tokenEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('grant_type', 'client_credentials');

    try {
      const response = await axios.post(tokenEndpoint, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      return this.accessToken;
    } catch (error) {
      throw new Error(
        `OneDrive authentication failed: ${error.response?.data?.error_description || error.message}`
      );
    }
  }

  /**
   * Build the OneDrive path for a file based on its metadata
   */
  buildBackupPath(attachment) {
    const { targetType, targetId, category, filename } = attachment;

    // Build a hierarchical path structure
    const parts = [this.rootFolder];

    switch (targetType) {
      case 'property':
        parts.push('Properties', `Property_${targetId}`);
        if (category === 'property_photo') parts.push('Photos');
        else if (category === 'property_record') parts.push('Records');
        else if (category === 'property_map') parts.push('Maps');
        else parts.push('Other');
        break;
      case 'project':
        parts.push('Projects', `Project_${targetId}`);
        break;
      case 'contractor':
        parts.push('Contractors', `Contractor_${targetId}`);
        break;
      case 'contact':
      case 'tenant':
        parts.push('Contacts', `Contact_${targetId}`);
        break;
      case 'contract':
        parts.push('Contracts', `Contract_${targetId}`);
        break;
      default:
        parts.push('Misc', targetType);
    }

    parts.push(filename);

    return parts.join('/');
  }

  /**
   * Upload a file to OneDrive
   * @param {string} localFilePath - Path to the local file
   * @param {string} oneDrivePath - Destination path in OneDrive (e.g., "ButlerPMS/Properties/Property_123/file.pdf")
   * @returns {Promise<object>} - Upload result with file metadata
   */
  async uploadFile(localFilePath, oneDrivePath) {
    if (!this.isEnabled()) {
      throw new Error('OneDrive backup is not enabled');
    }

    await this.authenticate();

    // Read file
    const fileBuffer = await fs.readFile(localFilePath);
    const fileSize = fileBuffer.length;

    // For files < 4MB, use simple upload
    // For larger files, we'd need to use resumable upload session (not implemented here)
    if (fileSize > 4 * 1024 * 1024) {
      throw new Error(
        'Files larger than 4MB require resumable upload (not yet implemented)'
      );
    }

    // Upload to OneDrive using Microsoft Graph
    // We'll use the app's root drive (typically the service account's OneDrive)
    const encodedPath = encodeURIComponent(oneDrivePath);
    const uploadUrl = `https://graph.microsoft.com/v1.0/drive/root:/${encodedPath}:/content`;

    try {
      const response = await axios.put(uploadUrl, fileBuffer, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      return {
        success: true,
        path: oneDrivePath,
        id: response.data.id,
        webUrl: response.data.webUrl,
        size: response.data.size
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message || error.message;
      throw new Error(`OneDrive upload failed: ${errorMessage}`);
    }
  }

  /**
   * Delete a file from OneDrive
   * @param {string} oneDrivePath - Path to the file in OneDrive
   */
  async deleteFile(oneDrivePath) {
    if (!this.isEnabled()) {
      throw new Error('OneDrive backup is not enabled');
    }

    await this.authenticate();

    const encodedPath = encodeURIComponent(oneDrivePath);
    const deleteUrl = `https://graph.microsoft.com/v1.0/drive/root:/${encodedPath}`;

    try {
      await axios.delete(deleteUrl, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      });

      return { success: true };
    } catch (error) {
      // If file doesn't exist, consider it a success
      if (error.response?.status === 404) {
        return { success: true, notFound: true };
      }

      const errorMessage =
        error.response?.data?.error?.message || error.message;
      throw new Error(`OneDrive delete failed: ${errorMessage}`);
    }
  }
}

// Singleton instance
let oneDriveServiceInstance = null;

/**
 * Initialize the OneDrive service with configuration
 * Should be called at app startup
 */
export function initializeOneDriveService(config) {
  oneDriveServiceInstance = new OneDriveService(config);
  return oneDriveServiceInstance;
}

/**
 * Get the singleton OneDrive service instance
 */
export function getOneDriveService() {
  if (!oneDriveServiceInstance) {
    throw new Error(
      'OneDrive service not initialized. Call initializeOneDriveService first.'
    );
  }
  return oneDriveServiceInstance;
}
