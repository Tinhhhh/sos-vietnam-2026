# Citizen SOS Sphere Centering & Size Verification Report

- **Timestamp**: `2026-10-12T00:38:47.816Z`
- **Base URL**: `http://localhost:3000`
- **Passed**: **12 / 12**
- **Failed**: **0**

## Viewport Measurements

| Viewport | Orb Size (px) | Wrapper Size (px) | Orb Center Y (px / ratio) | Legal Banner Top (px) | Screenshot |
|---|---|---|---|---|---|
| `desktop-1920x912` (1920x912) | `224x224` | `276x276` | `422.8px` (`46.4%`) | `792px` | `sos-orb-desktop-1920x912.png` |
| `laptop-1440x900` (1440x900) | `194.4x194.4` | `238x238` | `400px` (`44.5%`) | `780px` | `sos-orb-laptop-1440x900.png` |
| `mobile-390x844` (390x844) | `167.7x167.7` | `202.8x202.8` | `367.5px` (`43.5%`) | `736px` | `sos-orb-mobile-390x844.png` |

## Assertions

- **[PASS]** [desktop-1920x912] Red SOS sphere diameter >= 185px — `{"actualWidth":224,"actualHeight":224,"minExpected":185}`
- **[PASS]** [desktop-1920x912] Red SOS sphere horizontally centered in viewport — `{"centerXRatio":0.5}`
- **[PASS]** [desktop-1920x912] Red SOS sphere vertically centered inside radiating hand circles (0.43-0.54) — `{"centerYRatio":0.4636,"centerY":422.8,"viewportHeight":912}`
- **[PASS]** [desktop-1920x912] Red SOS sphere does not overlap bottom legal warning bar — `{"orbBottom":534.8,"legalTop":792}`
- **[PASS]** [laptop-1440x900] Red SOS sphere diameter >= 180px — `{"actualWidth":194.4,"actualHeight":194.4,"minExpected":180}`
- **[PASS]** [laptop-1440x900] Red SOS sphere horizontally centered in viewport — `{"centerXRatio":0.5}`
- **[PASS]** [laptop-1440x900] Red SOS sphere vertically centered inside radiating hand circles (0.43-0.54) — `{"centerYRatio":0.4445,"centerY":400,"viewportHeight":900}`
- **[PASS]** [laptop-1440x900] Red SOS sphere does not overlap bottom legal warning bar — `{"orbBottom":497.2,"legalTop":780}`
- **[PASS]** [mobile-390x844] Red SOS sphere diameter >= 150px — `{"actualWidth":167.7,"actualHeight":167.7,"minExpected":150}`
- **[PASS]** [mobile-390x844] Red SOS sphere horizontally centered in viewport — `{"centerXRatio":0.5}`
- **[PASS]** [mobile-390x844] Red SOS sphere vertically centered inside radiating hand circles (0.4-0.56) — `{"centerYRatio":0.4355,"centerY":367.5,"viewportHeight":844}`
- **[PASS]** [mobile-390x844] Red SOS sphere does not overlap bottom legal warning bar — `{"orbBottom":451.4,"legalTop":736}`