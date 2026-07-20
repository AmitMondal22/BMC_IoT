# Remove SubRegions and Adjust Hierarchy, Restrict Access, and Fix Organization Scoping

We will remove the `SubRegion` model/table entirely, link `Route` directly to `Region` (Region -> Route -> Device), restrict region/route/device creation to `super_admin` only, implement organization selection for Users/Regions/Routes in the frontend for Super Admin, and ensure all routes/devices/dashboard telemetry queries are correctly scoped to the user's organization for Org Admins.

## User Review Required

> [!IMPORTANT]
> - **Hierarchy Change**: Removing `SubRegion` shifts the hierarchy to `Organization -> Region -> Route -> Device`.
> - **Database Alterations**: The `sub_regions` table will be removed. The `routes` table will lose `sub_region_id` and gain a `region_id` foreign key referencing the `regions` table.
> - **Role Restriction**: `ROLES.ADMIN` (Org Admin) will no longer be allowed to create, update, or delete Regions, Routes, or Devices. These CRUD features will be restricted to `ROLES.SUPER_ADMIN` only. Org Admins can still view them and perform operations like calibrating devices.

## Open Questions

> [!NOTE]
> - We assume that `sequelize.sync({ alter: true })` configured in development mode will automatically add `region_id` to the `routes` table. We will verify the database updates on startup.
> - For Regular Users, they will remain associated with their organization, and their device view will continue to be filtered by their individual device assignments.

## Proposed Changes

---

### [Database & Models]

#### [MODIFY] [index.js](file:///d:/amitelectric/backend/src/db/models/index.js)
- Remove import of `SubRegion`.
- Remove association between `Region` & `SubRegion`, and `SubRegion` & `Route`.
- Add direct association between `Region` and `Route`:
  - `Region.hasMany(Route, { foreignKey: 'regionId', as: 'routes' })`
  - `Route.belongsTo(Region, { foreignKey: 'regionId', as: 'region' })`

#### [MODIFY] [Route.js](file:///d:/amitelectric/backend/src/db/models/Route.js)
- Replace field `subRegionId` with `regionId` (UUID, allowNull: false).
- Update indexes to reference `region_id` instead of `sub_region_id`.

#### [MODIFY] [Region.js](file:///d:/amitelectric/backend/src/db/models/Region.js)
- Remove references to `SubRegion`.

#### [DELETE] [SubRegion.js](file:///d:/amitelectric/backend/src/db/models/SubRegion.js)
- Delete the file.

---

### [Backend Modules & Routes]

#### [MODIFY] [region.routes.js](file:///d:/amitelectric/backend/src/modules/region/region.routes.js)
- Restrict `POST /regions`, `PUT /regions/:id` to `ROLES.SUPER_ADMIN` only (remove `ROLES.ADMIN`).
- Remove all sub-regions endpoints (`GET /sub-regions`, `GET /sub-regions/:id`, `POST /sub-regions`, `PUT /sub-regions/:id`, `DELETE /sub-regions/:id`).

#### [MODIFY] [region.controller.js](file:///d:/amitelectric/backend/src/modules/region/region.controller.js)
- Remove all sub-region handler functions.

#### [MODIFY] [region.service.js](file:///d:/amitelectric/backend/src/modules/region/region.service.js)
- Remove `SubRegion` import and references.
- Update `listRegions` and `getRegionById` to include `Route` directly instead of nested under `SubRegion`.
- Remove all sub-region methods (`listSubRegions`, `getSubRegionById`, `createSubRegion`, `updateSubRegion`, `deleteSubRegion`).

#### [MODIFY] [region.schema.js](file:///d:/amitelectric/backend/src/modules/region/region.schema.js)
- Remove schemas for creating and updating sub-regions.

#### [MODIFY] [route.routes.js](file:///d:/amitelectric/backend/src/modules/route/route.routes.js)
- Restrict `POST /` and `PUT /:id` to `ROLES.SUPER_ADMIN` only.

#### [MODIFY] [route.schema.js](file:///d:/amitelectric/backend/src/modules/route/route.schema.js)
- In validation schemas, replace `subRegionId` with `regionId` (Joi.string().uuid()).

#### [MODIFY] [route.service.js](file:///d:/amitelectric/backend/src/modules/route/route.service.js)
- Remove `SubRegion` import.
- In `list` and `getById`, include `Region` directly (not nested in `SubRegion`).
- Change filter `query.subRegionId` to `query.regionId`.
- In `list`, update organization filtering for non-super_admin users:
  - Match `Region.organizationId` directly instead of nested.

#### [MODIFY] [device.routes.js](file:///d:/amitelectric/backend/src/modules/device/device.routes.js)
- Restrict `POST /` and `PUT /:id` to `ROLES.SUPER_ADMIN` only.

#### [MODIFY] [device.service.js](file:///d:/amitelectric/backend/src/modules/device/device.service.js)
- Update includes: `Route` -> `Region` directly (remove nested `SubRegion`).
- In `list`, add organization-level scoping for `admin` (Org Admin) role:
  - If `userRole === 'admin'`, verify user's `organizationId` and filter devices by checking `Region.organizationId = user.organizationId` using required INNER JOINs.
- Update `getById` to verify role access constraints.

#### [MODIFY] [dashboard.controller.js](file:///d:/amitelectric/backend/src/modules/dashboard/dashboard.controller.js)
- Pass `req.userId` and `req.userRole` to `dashboardService` methods.

#### [MODIFY] [dashboard.service.js](file:///d:/amitelectric/backend/src/modules/dashboard/dashboard.service.js)
- Restrict summary statistics, device grid, and alerts to the user's organization if the logged-in user is not a Super Admin.
- Join `Route` -> `Region` to filter by `organizationId`.

---

### [Frontend Modifications]

#### [MODIFY] [index.js](file:///d:/amitelectric/frontend/src/api/index.js)
- Remove `subRegionAPI` service object.

#### [MODIFY] [App.jsx](file:///d:/amitelectric/frontend/src/App.jsx)
- Remove `/sub-regions` Route import and registration.

#### [DELETE] [SubRegionListPage.jsx](file:///d:/amitelectric/frontend/src/pages/regions/SubRegionListPage.jsx)
- Delete the sub-regions list view.

#### [MODIFY] [AdminLayout.jsx](file:///d:/amitelectric/frontend/src/layouts/AdminLayout.jsx)
- Remove "Sub Regions" from the sidebar navigation items.

#### [MODIFY] [RegionListPage.jsx](file:///d:/amitelectric/frontend/src/pages/regions/RegionListPage.jsx)
- Remove sub-regions listing block under each region.
- Destructure `isSuperAdmin` from `useAuth()`.
- Only show "Add Region", "Edit", and "Delete" actions if `isSuperAdmin` is true.
- If `isSuperAdmin` is true, display an "Organization" dropdown select field inside the Region modal using `organizationAPI` to fetch organizations.

#### [MODIFY] [RouteListPage.jsx](file:///d:/amitelectric/frontend/src/pages/routes/RouteListPage.jsx)
- Import `regionAPI` instead of `subRegionAPI`.
- Update state and fetch methods to load `regions` instead of `subRegions`.
- Update form field from `subRegionId` to `regionId`.
- Show "Region" select dropdown in the modal form.
- Display `{route.region?.name}` directly on the cards.
- Restructure action controls so only `isSuperAdmin` sees the Add, Edit, and Delete options.

#### [MODIFY] [DeviceListPage.jsx](file:///d:/amitelectric/frontend/src/pages/devices/DeviceListPage.jsx)
- Update routes option label map to use `{r.region?.name}` instead of `{r.subRegion?.name}`.
- Check `isSuperAdmin` to hide/show Add/Edit/Delete Device controls.

#### [MODIFY] [DeviceDetailPage.jsx](file:///d:/amitelectric/frontend/src/pages/devices/DeviceDetailPage.jsx)
- Change display label from "Sub Region" to "Region" and render `{device.route?.region?.name}`.

#### [MODIFY] [UserListPage.jsx](file:///d:/amitelectric/frontend/src/pages/users/UserListPage.jsx)
- Import `organizationAPI`.
- Destructure `isSuperAdmin` from `useAuth()`.
- In the User Form modal, if the current user is `isSuperAdmin`:
  - Fetch all organizations on load.
  - Display a dropdown to select Organization (`organizationId`) for users with role `'admin'` or `'user'`.
  - Include `organizationId` in create/update payloads.

---

## Verification Plan

### Automated Tests
- Run `npm run lint` and verify clean results.
- Run `npm test` if any tests exist.
- Start the server using `npm run dev` in both backend and frontend.

### Manual Verification
- Log in as **Super Admin**:
  - Verify ability to create Organizations, Regions, Routes, and Devices.
  - Verify that the Organization dropdown appears when creating an Org Admin or User.
  - Verify Route lists parent Regions and Device list lists parent Routes/Regions correctly.
- Log in as **Org Admin** (Admin):
  - Verify that the Region, Route, and Device pages display records scoped ONLY to their Organization, and that creation/edition/deletion buttons are hidden.
  - Verify that when creating a Regular User, the organization is auto-assigned to the Org Admin's organization and the UI works correctly.
- Log in as **Regular User**:
  - Verify that they can see only their assigned devices.
