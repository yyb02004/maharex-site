# Private model viewers

Only the authenticated admin model route serves these files. Do not copy them to
`public/`. Each catalog entry opens the full equipment set, with detail controls
inside its viewer.

## Source snapshot (2026-09-17)

Source paths are relative to the adjacent `3D Model` workspace.

| Profile | Source outputs directory | Latest revision | Parts |
| --- | --- | --- | ---: |
| `rs-205` | `RS-205-Reactor/outputs` | 6, process demo and bottom shaft support | 1,515 |
| `tvd-installation` | `TVD-2.0/auxiliary/outputs` | Dryer 11 / installation 7, demo update 2 | 3,476 |
| `rvd-1500` | `RVD-1500/outputs` | 4, door hose connections | 838 |
| `rvd-501` | `RVD-501/outputs` | 3.2, sight glasses and detachable door piping | 1,780 |
| `nf-1200` | `CMDL-Nutsche/outputs` | 4 | 444 |
| `pm12` | `PinMill-PM12/outputs` | 2, standard high hopper | 722 |
| `pm12-low-hopper` | `PinMill-PM12-LowHopper-REV05/outputs` | 5, low hopper | 903 |
| `ejm12` | `JetMill-EJM12/outputs` | 3 | 977 |

Catalog order: reactor, tray vacuum dryer, rotary dryers, filter, pin mills, jet mill.

PM12 standard and low-hopper are distinct configurations. Low-hopper REV03/REV04
and backup folders are superseded snapshots, not additional equipment sets.
TVD-2.0, NF-1200, both PM12 configurations and EJM12 source hashes are unchanged
from the previous import. RVD sources use uppercase, hyphenated HTML filenames;
their builder profiles specify these separately from the model data keys.

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
