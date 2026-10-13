---
title: Implementation notes
description: Source comparison, draft decisions, and follow-up work for existing Verve implementations.
---

**Informative, not normative.** These notes record the local source comparison
performed on 2026-10-13. They explain decisions in the core draft and identify
application follow-ups. Neither importer tolerance nor an exporter model is a
replacement for the format specification.

## References examined

The comparison used the following existing documents and implementation files:

| Source | Relevant files |
| --- | --- |
| Verve web documentation | `frontend/src/views/HelpView.vue` |
| Verve backend | `verve_backend/schema/verve_file.py`, `schema/exporter.py`, `schema/importer.py`, `schema/meta_data.py`, `api/common/track.py`, `core/date_utils.py`, and `models.py` |
| VerveExporter documentation | `docs/product-specs/verve-geojson-format.md` and `verve-swimming-metadata.md` |
| VerveExporter iOS models and export code | `VerveExporter/GeoJSON.swift`, `WorkoutFeatureBuilder.swift`, `HealthManager.swift`, and `VerveExporterTests/ExportTests.swift` |
| Geo track analyzer | `geo_track_analyzer/utils/geojson.py`, used by the backend track importer |

These are observations of the local source files, not a claim that every deployed
version behaves identically. The specification is intended to be understandable
without any of these implementation repositories.

## Core discrepancies and draft decisions

| Topic | Observed difference | Core draft decision |
| --- | --- | --- |
| Required activity members | The backend defaults `verveVersion` and `generator`; it also supplies default structural type values. | Exported files explicitly include all required members. Parser defaults do not make fields optional on the wire. |
| `stats` | The exporter document calls it required and the iOS model always emits it. The web table marks it optional; the backend supplies an empty default. | Optional object, consistent with the initial design's optional summaries. `{}` is valid, while `null` is not. |
| `coordTimes` | The backend can supply an empty default. The web documentation and iOS model require an array. | Required explicitly in every feature. |
| Missing geometry | Backend models accept omission; the iOS encoder deliberately emits `geometry: null`. | Require the member, including explicit null for non-spatial data, preserving GeoJSON Feature structure. |
| Short LineStrings | Backend and iOS geometry models do not impose a two-position minimum. The exporter document includes a one-position illustration. | Require at least two positions. The earlier illustration is not a valid standalone GeoJSON LineString. |
| Missing sensor readings | The web table abbreviates sensor types as numeric arrays. Backend and iOS models support nullable entries and nullable whole arrays. | Preserve null entries for index alignment; a whole null optional array means unavailable. |
| Speed units | The format documents do not state a speed-summary unit. The backend exports stored activity speeds directly, whose model describes km/h. | `stats.speed` uses km/h, not m/s. |
| Metadata shape | Web documentation and backend support arbitrary objects. The exporter document emphasizes a canonical envelope, and iOS currently models the swimming envelope. | Keep core metadata open; the swimming envelope has its own contract. Do not retrospectively require arbitrary legacy metadata to be a known extension. |
| Offsetless timestamps | Backend fallback logic interprets naive datetimes in a selected timezone. iOS exports offset-qualified timestamps. | By explicit review decision, require offset-qualified timestamps; fallback interpretation is legacy importer tolerance. |
| Summary-only workouts | The backend model allows null geometry and empty arrays. The iOS export boundary rejects workouts with neither route nor heart-rate samples. | Valid with explicit null geometry and an empty `coordTimes` array; non-null sensor arrays must also be empty. Exporter limitations do not narrow the format. |

The backend is the reference implementation for this draft. Its wire models
define the baseline field types and supported capabilities; exporter omissions
do not restrict valid files. Duration and summary consistency are recommendations
because the backend does not enforce numerical bounds or summary relationships.
Sample ordering is also recommended rather than an additional rejection rule.
GeoJSON requirements still apply where the design explicitly requires GeoJSON
conformance. No source app was changed as part of this documentation milestone.

## Elevation reference mismatch

The iOS route builder copies `CLLocation.altitude` into the third coordinate.
Apple defines this as height relative to approximate mean sea level; it exposes
[`ellipsoidalAltitude`](https://developer.apple.com/documentation/corelocation/cllocation/ellipsoidalaltitude)
separately for WGS 84 ellipsoidal height.

[GeoJSON section 4](https://www.rfc-editor.org/rfc/rfc7946#section-4) defines its third
coordinate relative to the WGS 84 ellipsoid. The draft retains the existing
three-number shape and meter units, but leaves the vertical reference unresolved
by explicit review decision. The observed iOS values conflict with GeoJSON's
vertical meaning even when their JSON structure validates. Existing backend
export code copies stored elevations without showing a datum conversion, so the
origin and vertical reference of stored values also need review.

Follow-up: review the backend's intended elevation semantics, verify the datum
of stored/imported values, and resolve how Verve 1.0 should relate to GeoJSON's
vertical reference. No conversion requirement or exporter change is decided here.
Do not treat structural validation as evidence of a known vertical reference; the
issue remains open before finalized semantic conformance can be claimed.

## Current importer and exporter behavior

The backend's format sniffer only checks `properties.verveVersion == "1.0"`.
This selects a parsing path; it does not validate the full format. Pydantic models
also accept Python-style field aliases and some coerced input values that are not
additional JSON encodings defined by the specification.

The backend checks coordinate and sensor array lengths, accepts null geometry,
and looks up activity categories and equipment in its configured database.
It can derive missing summaries, elevation change, and moving duration from track
data. Those derivation algorithms and database lookups are application behavior,
not exporter obligations. An equipment snapshot does not guarantee that the
importer can associate it with a local inventory record.

The backend's `to_json()` uses `exclude_none=True`. That can omit a null feature
geometry during reserialization. Conforming non-spatial file export needs an
explicit geometry member; review this serialization path as a follow-up.

The iOS exporter currently emits one feature, uses route positions when available,
and otherwise emits a heart-rate time series with null geometry. It matches route
points to the nearest heart-rate sample less than 30 seconds away. That matching
window is not a format requirement. Its export boundary rejects workouts with no
route and no heart-rate samples, but does not show an explicit one-position route
guard. Multiple segments require their own export handling.

The iOS timestamp formatter uses the workout timezone when recognized, otherwise
a supplied device timezone fallback. Its root `timezone` field is only emitted
for a recognized recorded identifier; the fallback is not exported as recorded
context. The format does not require an importer to reproduce that fallback.

## Findings for the swimming extension milestone

The swimming contract says counts can come from the source when detail arrays
are absent and should match array lengths when detail arrays are exported. The
format document narrows counts to exported objects. The separate extension draft
should preserve the distinction between summary-only counts and supplied detail
arrays, and state the consistency rule explicitly.

The backend uses integer types for pool length and swim distances; iOS models and
the contract allow numbers. Preserve meter-valued numbers in the source-neutral
extension and record backend handling of fractional distances as a follow-up.

The backend's meaningful-data check tests truthiness, whereas the iOS model tests
presence of scalar fields. A reported zero count can therefore be treated
differently. The extension must distinguish zero from unavailable information.

The earlier swimming placement example has an empty feature collection and lacks
required core activity fields. It is a partial illustration, not a conforming
standalone file. Some web swimming sample SWOLF values also do not equal lap
seconds plus stroke count. Future complete examples must be synthetic and checked
for both core and swimming consistency.

## Follow-up checklist

- Review significant conflicts between the reference implementation and GeoJSON
  or source-neutral timestamp interpretation before finalizing the draft.
- Enforce two-position LineStrings at exporter boundaries.
- Preserve explicit null geometry in backend serialization.
- Resolve the vertical elevation reference mismatch in exporters and stored data.
- Document and test multiple-segment and non-spatial import/export behavior.
- Draft the swimming extension with count, fractional-distance, zero-value, and
  SWOLF consistency rules.
- Add versioned schemas, downloadable examples, and semantic validation in this
  repository before claiming a validated release.
