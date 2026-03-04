Below is a **clean project status document** you can drop into your repo (for example `NOTES_SYSTEM_IMPLEMENTATION.md`) so you can resume later without remembering everything.

---

# MicroRealEstate — Notes System Implementation Status

## Overview

This document tracks the implementation of a **generic Notes system** for MicroRealEstate.

Goals of the feature:

* Add notes to multiple entity types:

  * Properties
  * Contacts / Tenants
  * Contracts
  * Projects
* Support:

  * Search
  * Filtering
  * Context linking
  * Author tracking
  * File attachments
* Provide both:

  * **Contextual notes tabs**
  * **Global notes view**

---

# Current Implementation Status

## Backend

### Notes Collection

Implemented in:

```
services/common/src/collections/notes.ts
```

Fields currently include:

```
realmId
entityType
entityId
authorId
authorName
content
tags
pinned
createdDate
updatedDate
deletedDate
```

Purpose:

* Store notes tied to any entity type
* Soft deletion supported
* Tagging supported

---

### API Endpoints

Implemented in:

```
services/api/src/routes.js
services/api/src/managers/notesmanager.js
```

Endpoints:

| Method | Route               | Purpose           |
| ------ | ------------------- | ----------------- |
| GET    | `/api/v2/notes`     | List/search notes |
| POST   | `/api/v2/notes`     | Create note       |
| PATCH  | `/api/v2/notes/:id` | Update note       |
| DELETE | `/api/v2/notes/:id` | Soft delete note  |

Filters supported:

```
entityType
entityId
search query
tags
```

Authentication uses:

```
Middlewares.needAccessToken()
```

Author identification uses:

```
req.user.email
req.user.clientId
req.user.serviceId
```

---

# Frontend

Frontend implemented in:

```
webapps/landlord
```

---

## NotesPanel Component

Location:

```
webapps/landlord/src/components/NotesPanel.js
```

Capabilities:

* Display notes
* Search notes
* Create notes
* Display author
* Display timestamp

UI shows:

```
Author • Date
Note Content
```

---

## Property Notes Tab

Integrated into:

```
webapps/landlord/src/pages/[organization]/properties/[id].js
```

Added:

```
<TabsContent value="notes">
  <NotesPanel
    entityType="property"
    entityId={store.property.selected?._id}
  />
</TabsContent>
```

This allows notes directly on property pages.

---

## Global Notes Page

Page location:

```
webapps/landlord/src/pages/[organization]/notes.js
```

Purpose:

* View all notes
* Search across notes
* See context of each note
* Navigate back to entity

Currently displays:

```
Author
Date
Content
EntityType
EntityId
```

Future improvement: show friendly labels (property address/name).

---

## Left Navigation Menu

Modified:

```
webapps/landlord/src/components/AppMenu.js
```

Added menu item:

```
{
  key: 'notes',
  labelId: 'Notes',
  pathname: '/notes',
  Icon: LuStickyNote,
  dataCy: 'notesNav'
}
```

Also added icon import:

```
LuStickyNote
```

This creates a **Notes section in the sidebar**.

---

# Remaining Work

## 1. Access Control (Important)

Ensure notes respect entity permissions.

Currently missing validation that:

```
user has access to entityId
```

Should verify before returning or creating notes.

Example checks:

```
property ownership
tenant relationship
organization membership
```

---

## 2. File Attachments

Original feature requirement included attachments.

Needs implementation.

### Backend

Add endpoints:

```
POST /api/v2/notes/:id/attachments
GET  /api/v2/notes/:id/attachments
DELETE /api/v2/notes/:id/attachments/:fileId
```

Storage options:

```
local filesystem
S3 / MinIO
```

Note document will include:

```
attachments[]
```

Fields:

```
filename
contentType
size
url
uploadedDate
```

---

### Frontend

Enhance `NotesPanel` to support:

```
Upload file
Display attachment list
Download attachments
Preview images
```

---

## 3. Context Labels

Global notes page currently shows:

```
entityType
entityId
```

Future improvement:

Display friendly names:

```
Property address
Tenant name
Contract name
Project name
```

Options:

Option A (simple):

```
store entityLabel in note
```

Option B (better):

```
lookup entity during API query
```

---

## 4. Notes on Other Entities

Currently implemented:

```
Properties
```

Still needed:

```
Contacts
Contracts
Projects
```

Implementation:

Add NotesPanel to those entity pages:

Example:

```
<NotesPanel
  entityType="contact"
  entityId={contactId}
/>
```

---

## 5. UI Enhancements

Optional improvements:

### Edit Notes

Add UI for:

```
PATCH /notes/:id
```

---

### Delete Notes

Add UI for:

```
DELETE /notes/:id
```

---

### Pin Notes

Use existing field:

```
pinned
```

---

### Tags UI

Expose tag management.

---

### Pagination

If notes grow large:

```
Load more
limit / offset
```

---

### Filters

Global notes page could support:

```
entityType dropdown
tag filters
date range
```

---

# Suggested Next Step

Recommended next implementation:

## File Attachments

Reason:

* Largest missing feature
* High user value
* Enables photos, invoices, documents

After attachments:

```
Entity labels
Permissions
Additional entity integrations
```

---

# Quick Restart Checklist

When returning to work:

1. Start services

```
docker compose up
```

2. Start frontend dev

```
yarn dev
```

3. Navigate to

```
/organization/notes
```

4. Verify

* Create note
* Search notes
* Property notes tab

---

If you'd like, I can also generate a **visual architecture diagram of the Notes system** (API ↔ DB ↔ UI ↔ entities). That makes it much easier to extend later.
