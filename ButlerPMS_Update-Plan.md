Perfect, that’s a clean scope. Let’s lock the requirements and solidify the **project plan** with OneDrive backup baked in.

I’ll **only** update the plan (no code), but I’ll structure it so we can walk through implementation later step-by-step.

---

## 1. Final Feature Set (What the system will do)

When we’re done, your PMS will support:

1. **Real estate hierarchy**

   * Buildings with multiple units/spaces inside (`building → units`).
   * Standalone units/houses too.

2. **Unit rent ranges**

   * For each rentable space: **low / median / high** rent.
   * All stored as **$/sq ft/year** for easy comparison.

3. **Generic notes system (with file attachments)**

   * Notes can be attached to:

     * Properties (buildings/units)
     * Contacts / tenants / contractors
     * Contracts
     * Projects
   * Each note:

     * Has author, timestamps, content.
     * Can have file/photo attachments.
     * Is searchable by text (and filterable by entity).

4. **Work / projects tracking (with file attachments)**

   * Track work done (projects) against:

     * Properties (primarily), and optionally other entities.
   * Each project:

     * Has title, description, status, dates, cost.
     * Has attachments (photos, invoices, drawings, etc.).
     * Has its own notes.

5. **Property-level documents (with secure storage)**

   * Attach files directly to a property (not just via notes/projects):

     * Photos
     * Property records (deeds, inspection reports)
     * County/plat maps, utility maps, etc.
   * Files are stored **securely**, not as public web files.

6. **Remote backup of files to OneDrive / Office 365**

   * All attachments (or at least the important categories) are:

     * Stored in secure primary storage (disk/S3).
     * **Backed up** to a OneDrive folder tree under your O365 account.
   * If local disk dies, you still have everything in OneDrive.
   * The PMS still reads from **primary storage**, OneDrive is a backup / archive layer.

---

## 2. Data Model (unchanged structure, aligned with new requirement)

We’ll keep the clean model we already designed, but add backup metadata.

### 2.1 Property

Extend existing `Property` with:

* `parentPropertyId` → building/unit relationship.
* `rentLowSqftYear`, `rentMedianSqftYear`, `rentHighSqftYear`.

### 2.2 Attachment (now with backup metadata)

Central file metadata, with OneDrive backup info:

```ts
Attachment {
  _id: ObjectId

  targetType: 'property' | 'note' | 'project' | 'contact' | 'tenant' | 'contractor' | 'contract'
  targetId: ObjectId

  storageKey: string        // primary storage key (local path or S3 key)
  filename: string
  mimeType: string
  size: number              // bytes

  category: 'property_photo'
          | 'property_record'
          | 'property_map'
          | 'note_attachment'
          | 'project_attachment'
          | 'other'

  uploadedById: ObjectId
  uploadedByName: string
  createdAt: Date

  // OneDrive backup metadata:
  backupProvider: 'onedrive' | null
  backupPath: string | null       // e.g. "ButlerPMS/Properties/ButlerBuilding/Unit101/file.pdf"
  backupStatus: 'pending' | 'success' | 'failed' | null
  backupLastTriedAt: Date | null
  backupError: string | null      // optional for debugging
}
```

OneDrive doesn’t change your core model, it just hangs off `Attachment` as extra metadata.

### 2.3 Note + Project

No structural change needed; they still just reference attachments by ID.

---

## 3. Storage & Backup Architecture

### 3.1 Primary vs backup

**Primary storage:**

* Local disk (volume mounted in Docker) OR S3 bucket.
* Backend always:

  * Writes uploads here first.
  * Serves downloads from here (or via signed URL).

**Backup (OneDrive):**

* Asynchronous or near-synchronous copy of the file to OneDrive using Microsoft Graph.

Important:
**The app NEVER depends on OneDrive being available for normal operation.** It’s a backup/archive target, not your main file system.

### 3.2 OneDrive folder structure

Pick a deterministic, human-friendly folder structure, e.g.:

* Root: `/ButlerPMS`

  * `/Properties`

    * `/[PropertyName]_[PropertyId]`

      * `/Photos`
      * `/Records`
      * `/Maps`
      * `/Projects`
  * `/Contacts`

    * `/[ContactName]_[ContactId]`
  * `/Tenants`
  * `/Contracts`
  * `/Misc`

The exact naming is detail, but the plan is:

* You can always find a file in OneDrive based on what it is attached to.
* The `backupPath` on `Attachment` stores the actual path/key used.

### 3.3 Backup flow per file

When an attachment is created:

1. User uploads file → `POST /attachments`.
2. Backend:

   * Stores file in primary storage.
   * Creates `Attachment` record with:

     * `backupStatus = 'pending'`.
3. A **backup worker** (could be:

   * A simple in-process job queue, or
   * A cron-like process calling a “sync pending attachments” endpoint) does:
   * Load attachments where `backupStatus = 'pending'`.
   * For each:

     1. Upload file to OneDrive using Graph API.
     2. On success:

        * Update `backupProvider = 'onedrive'`.
        * Set `backupPath` to the OneDrive path.
        * Set `backupStatus = 'success'`, `backupLastTriedAt = now`.
     3. On failure:

        * Set `backupStatus = 'failed'`, `backupLastTriedAt`, and `backupError`.
        * Optionally, retry later.

Frontend doesn’t have to know any of this — it just uploads and maybe shows “Backed up ✓ / Pending backup / Backup error” based on the fields.

---

## 4. Backend Integration Plan for OneDrive

### 4.1 OneDrive / Azure setup

You’ll need to:

1. Register an **Azure AD app** in your O365 tenant.
2. Give it permissions:

   * Likely `Files.ReadWrite.All` and `Sites.ReadWrite.All` via Microsoft Graph.
3. Decide auth method:

   * **Service principal + client credentials** (ideal for a backend daemon).
4. Store secrets (client ID, tenant ID, client secret) via env vars.

We won’t script that here, but it’s a clearly defined step.

### 4.2 Storage abstraction

In the API code, implement a simple storage abstraction like:

```ts
interface PrimaryStorage {
  saveFile(bufferOrStream, options) -> storageKey
  readFile(storageKey) -> stream
  deleteFile(storageKey)
}
```

And a backup service:

```ts
interface BackupStorage {
  backupAttachment(attachment: Attachment) -> { success, backupPath?, error? }
}
```

Implementations:

* `PrimaryStorageLocal` or `PrimaryStorageS3`.
* `BackupStorageOneDrive` using Microsoft Graph.

The Attachment service calls:

* `PrimaryStorage.saveFile` when uploading.
* `BackupStorageOneDrive.backupAttachment` in the worker.

### 4.3 Download route (still secure)

`GET /attachments/:id/download`:

* Loads the Attachment.
* Checks permissions (user can access target entity).
* Reads from primary storage and streams the file.
* (Optionally) uses OneDrive as a fallback if primary storage is missing and backup is present, but that’s a nice-to-have, not required in v1.

---

## 5. Updated Project Plan / Task Breakdown

Here’s the **final project plan**, in the order we’ll implement it when we start coding. This is what you asked for.

### Phase A – Core data and relationships

1. **Locate current Property model** in backend.
2. **Extend Property model**:

   * Add `parentPropertyId`.
   * Add `rentLowSqftYear`, `rentMedianSqftYear`, `rentHighSqftYear`.
3. **Create Attachment model** with:

   * Target linking (`targetType`, `targetId`).
   * File metadata (`storageKey`, `filename`, `mimeType`, `size`, `category`).
   * Backup metadata (`backupProvider`, `backupPath`, `backupStatus`, `backupLastTriedAt`, `backupError`).
4. **Create Note model**:

   * `targetType`, `targetId`, `authorId`, `authorName`, `content`, `attachmentIds`, timestamps.
   * Index for `(targetType, targetId, createdAt)` and text index on `content`.
5. **Create Project model**:

   * `targetType`, `targetId`, `title`, `description`, `status`, `startDate`, `endDate`, `cost`, `costCurrency`, `attachmentIds`, timestamps, `createdById`, `createdByName`.

### Phase B – API for properties, attachments, notes, projects

6. **Update property create/update endpoints**:

   * Accept and validate `parentPropertyId` and rent range fields.
7. **Add units listing endpoint**:

   * `GET /properties/:id/units` or `GET /properties?parentPropertyId=...`.
8. **Implement primary storage abstraction**:

   * Local disk or S3 implementation.
9. **Implement secure attachment endpoints**:

   * `POST /attachments` for upload (stores in primary).
   * `GET /attachments/:id/download` for secure access.
   * `GET /properties/:id/attachments?category=...` (and similar for projects if needed).
10. **Implement Note endpoints**:

    * `POST /<entity>/:id/notes` for properties, contacts, tenants, contractors, contracts, projects.
    * `GET /<entity>/:id/notes` (with optional `?query=`).
    * Optional global `GET /notes?query=...`.
11. **Implement Project endpoints**:

    * `POST /properties/:id/projects`.
    * `GET /properties/:id/projects`.
    * `PATCH /projects/:id`.
    * `POST /projects/:id/notes`, `GET /projects/:id/notes`.

### Phase C – OneDrive backup integration

12. **Azure / OneDrive setup**:

    * Register app, configure Graph permissions, set up client credentials in env vars.
13. **Implement BackupStorageOneDrive service**:

    * Functions to:

      * Ensure root folder (`/ButlerPMS`) and subfolders exist.
      * Upload a file to the correct path based on `targetType`, `targetId`, `category`.
      * Return `backupPath` or error.
14. **Implement backup worker**:

    * Job that finds attachments with `backupStatus = 'pending'` or `'failed'`.
    * Calls `BackupStorageOneDrive.backupAttachment`.
    * Updates `backupStatus`, `backupPath`, timestamps, `backupError` on success/failure.
    * This can be:

      * A simple cron-like endpoint hit by a scheduler, or
      * A small background process/queue in the API container.
15. **(Optional) Admin/health endpoint** to see backup stats:

    * e.g., number of pending/failed backups.

### Phase D – Frontend changes

16. **Property creation/edit form**:

    * Add building selector (`parentPropertyId`).
    * Add rent range fields (`low`, `median`, `high`).
17. **Property detail view**:

    * Display building ↔ unit relationship.
    * Display rent range.
    * Show **Files/Documents** section:

      * Calls `/properties/:id/attachments?category=` to show photos/records/maps.
    * Show **Projects/Work**:

      * List projects, create project, view project details (attachments + notes).
    * Show **Notes**:

      * List notes and allow adding notes (with attachment upload).
18. **Contact / Tenant / Contractor / Contract detail views**:

    * Add **Notes** panels using notes + attachments APIs.
19. **(Nice-to-have) UI indicators for backup**:

    * In attachment list, show:

      * “Backed up ✓” when `backupStatus = 'success'`.
      * “Pending backup…” for `pending`.
      * Warning icon if `failed`.

---

That’s the fully updated **project plan**, including secure storage and OneDrive backup.

When you’re ready to start actually building, the next concrete move is still:

> Step 1: open your backend API in VS Code, find the **Property model** file, and paste the schema portion here.

Then we go into implementation one step at a time and wire all this up.
