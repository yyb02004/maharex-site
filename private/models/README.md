# Private model viewers

Only the authenticated admin model route serves these files. Do not copy them to
`public/`. Each catalog entry opens the full equipment set, with detail controls
inside its viewer.

## Source snapshot (2026-09-16)

Source paths are relative to the adjacent `3D Model` workspace.

| Profile | Source outputs directory | Latest revision | Parts |
| --- | --- | --- | ---: |
| `tvd-installation` | `TVD-2.0/auxiliary/outputs` | Dryer 11 / installation 7, demo update 2 | 3,476 |
| `nf-1200` | `CMDL-Nutsche/outputs` | 4 | 444 |
| `rs-205` | `RS-205-Reactor/outputs` | 5 | 1,480 |
| `ejm12` | `JetMill-EJM12/outputs` | 3 | 977 |
| `pm12` | `PinMill-PM12/outputs` | 2, standard high hopper | 722 |
| `pm12-low-hopper` | `PinMill-PM12-LowHopper-REV05/outputs` | 5, low hopper | 903 |

PM12 standard and low-hopper are distinct configurations. Low-hopper REV03/REV04
and backup folders are superseded snapshots, not additional equipment sets.
TVD-2.0 and NF-1200 source hashes are unchanged from the previous import.

## Update

Run from the website root:

```powershell
node scripts/build-private-model-viewers.mjs "<source outputs directory>" <profile>
node --test scripts/build-private-model-viewers.test.mjs
node node_modules/next/dist/bin/next build
```

The builder preserves source geometry and viewer controls, splits model data into
Brotli responses below 4 MB, and writes a manifest with the source HTML SHA-256,
revision and part count. It adapts canvas resizing and authenticated loading, and
hides local-only CAD download links. It does not edit the source project.

For a new profile, update the builder, its tests, `lib/admin-model-catalog.ts` and
the private model file tracing entries in `next.config.mjs`. Verify both desktop
and mobile rendering, controls, model/data authentication and deployment tracing.
Generating these files does not deploy the website.
