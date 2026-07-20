# Implement Premium White Theme UI & Bottom Tab Navigation for Mobile App

We will redesign the React Native application to match the visual style shown in the screenshot:
- **Clean White Theme**: Off-white background (`#f8f9fa`) with rounded white cards (`#ffffff`) having subtle drop shadows and circular icon indicators.
- **Top Header Layout**: Title (e.g. `Milk BMC`) with a notification bell and a user avatar.
- **Bottom Tab Navigation**: Persistent custom bottom navigation bar displaying icons for **Dashboard**, **Devices**, **Alerts**, and **Profile**.
- **Metrics Grid**: The dashboard home screen will show a grid of KPI metric cards (Total Devices, Active Alerts, Average Temp, Total Volume) with centered circular icons and labels.

## User Review Required

> [!IMPORTANT]
> - **Navigation Restructuring**: We will transition the app navigation from stack header buttons to a premium bottom tab bar navigation.
> - **Design Polish**: We will update colors and spacings across all screens (`DashboardScreen.js`, `DeviceListScreen.js`, `AlertsScreen.js`, `DeviceDetailScreen.js`) to ensure a unified and elegant white theme design.

## Proposed Changes

---

### [Native Screens & Layouts]

#### [MODIFY] [App.tsx](file:///d:/amitelectric/native_app/App.tsx)
- Restructure navigation: Render `MainTabScreen` as the primary post-auth screen, containing bottom tabs.
- Retain `DeviceDetail` as a Stack screen pushed from the main layout.

#### [NEW] [MainTabScreen.js](file:///d:/amitelectric/native_app/src/screens/MainTabScreen.js)
- Create a container screen hosting state-based bottom tabs.
- Layout:
  - Top header block: "Milk BMC" title, notification bell, profile icon.
  - Inner screens based on active tab: `DashboardTab`, `DeviceListTab`, `AlertsTab`.
  - Bottom Tab bar: Custom styled footer containing tab actions (Dashboard, Devices, Alerts, Profile/Logout).

#### [MODIFY] [DashboardScreen.js](file:///d:/amitelectric/native_app/src/screens/DashboardScreen.js)
- Redesign metric cards to match the screenshot style: white cards, circular icons centered, followed by labels and values.
- Add "Connected Devices" header and a preview list of devices underneath.

#### [MODIFY] [DeviceListScreen.js](file:///d:/amitelectric/native_app/src/screens/DeviceListScreen.js)
- Style filters, searchbar, and card components to align with the premium white theme.

#### [MODIFY] [AlertsScreen.js](file:///d:/amitelectric/native_app/src/screens/AlertsScreen.js)
- Style card layouts to match the white theme.
