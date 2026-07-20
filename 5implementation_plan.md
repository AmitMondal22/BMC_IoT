# Implement User Region/Route Assignment & Direct Device Region Association

We will adjust the model mappings and relationship flow to support the following hierarchy and assignments:
- **`origination -> USER`**: Users belong to Organizations.
- **`routes -> USER` / `region -> USER`**: Users (operators) are assigned to Regions and Routes directly.
- **`region -> device`**: Devices are linked directly to Regions (`regionId` in the `devices` table).
- **`routes -> (REGIONdevice)`**: Routes belong to Regions, and Devices belong to Routes.
- **Scoping**:
  - Super Admin can see and assign everything.
  - Org Admin can see and manage users/devices/routes within their organization.
  - Regular Users see devices scoped to their assigned Route (highest priority) or Region.

## User Review Required

> [!IMPORTANT]
> - **Schema Updates**:
>   - The `users` table will gain `region_id` and `route_id` nullable columns referencing `regions` and `routes`.
>   - The `devices` table will gain a `region_id` nullable column referencing `regions`.
> - **Deprecations**: The manual user-device assignments table (`user_devices`) and its UI list will be deprecated since users are now assigned to entire Routes or Regions, granting them access to all devices under those routes/regions.

## Proposed Changes

---

### [Models & Database]

#### [MODIFY] [User.js](file:///d:/amitelectric/backend/src/db/models/User.js)
- Add `regionId` (UUID, allowNull: true).
- Add `routeId` (UUID, allowNull: true).
- Add indexes for `region_id` and `route_id`.

#### [MODIFY] [Device.js](file:///d:/amitelectric/backend/src/db/models/Device.js)
- Add `regionId` (UUID, allowNull: true).
- Add index for `region_id`.

#### [MODIFY] [index.js](file:///d:/amitelectric/backend/src/db/models/index.js)
- Define new associations:
  - `db.Region.hasMany(db.Device, { foreignKey: 'regionId', as: 'devices' });`
  - `db.Device.belongsTo(db.Region, { foreignKey: 'regionId', as: 'region' });`
  - `db.Region.hasMany(db.User, { foreignKey: 'regionId', as: 'users' });`
  - `db.User.belongsTo(db.Region, { foreignKey: 'regionId', as: 'region' });`
  - `db.Route.hasMany(db.User, { foreignKey: 'routeId', as: 'users' });`
  - `db.User.belongsTo(db.Route, { foreignKey: 'routeId', as: 'route' });`

---

### [Backend APIs & Scoping]

#### [MODIFY] [user.schema.js](file:///d:/amitelectric/backend/src/modules/user/user.schema.js)
- Update `createUserSchema` and `updateUserSchema` to accept optional `regionId` and `routeId` (Joi.string().uuid().allow('', null)).

#### [MODIFY] [user.service.js](file:///d:/amitelectric/backend/src/modules/user/user.service.js)
- Include `Region` and `Route` in User listings and detail fetches so that the frontend knows user assignments.
- Update `create` and `update` to store `regionId` and `routeId`.

#### [MODIFY] [device.service.js](file:///d:/amitelectric/backend/src/modules/device/device.service.js)
- Update `list` scoping for Regular Users (`role === 'user'`):
  - Fetch the user's `routeId` and `regionId`.
  - Filter devices by `where.routeId = user.routeId` if route is assigned.
  - If no route is assigned but a `regionId` is set, filter by `where.regionId = user.regionId`.
  - If neither is assigned, restrict access by default (return empty array).
- In `create` / `update` device, when a device is created under a Route, automatically copy the Route's `regionId` to the Device's `regionId` if not explicitly supplied.

---

### [Frontend Forms & Views]

#### [MODIFY] [UserListPage.jsx](file:///d:/amitelectric/frontend/src/pages/users/UserListPage.jsx)
- Fetch the list of Regions and Routes on mount/modal load.
- In the User Form modal:
  - If the role is `'user'`, show **Region** and **Route** dropdown selectors.
  - Filter Routes in the dropdown to show only those belonging to the selected Region.
- In the Users table view:
  - Under the User's name, display their assigned Region/Route (e.g., `Ahmedabad → Route A`).

#### [MODIFY] [DeviceListPage.jsx](file:///d:/amitelectric/frontend/src/pages/devices/DeviceListPage.jsx)
- In the register device form, if creating/editing a device, automatically handle Route assignment. The Region will be inherited directly or can be selected if needed.
