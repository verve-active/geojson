---
title: Implementation notes
description: Current implementation behavior and conformance requirements for Verve applications.
---

**Informative implementation notes.** These notes compare application behavior
with the Verve GeoJSON 1.0 requirements and identify implementation work. The
observations refer to local source files inspected on 2026-10-13. Use the core
specification as the format contract when implementing an exporter or importer.

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

## Implementation compatibility

| Topic | Observed implementation behavior | Format requirement |
| --- | --- | --- |
| Required activity members | The backend defaults `verveVersion` and `generator`; it also supplies default structural type values. | Exported files explicitly include all required members. Parser defaults do not make fields optional on the wire. |
| `stats` | The exporter document calls it required and the iOS model always emits it. The web table marks it optional; the backend supplies an empty default. | Optional object. `{}` is valid, while `null` is not. |
| `coordTimes` | The backend can supply an empty default. The web documentation and iOS model require an array. | Required explicitly in every feature. |
| Missing geometry | Backend models accept omission; the iOS encoder deliberately emits `geometry: null`. | Require the member, including explicit null for non-spatial data, preserving GeoJSON Feature structure. |
| Short LineStrings | Backend and iOS geometry models do not impose a two-position minimum. The exporter document includes a one-position illustration. | Require at least two positions. A one-position illustration is not a valid standalone GeoJSON LineString. |
| Missing sensor readings | The web table abbreviates sensor types as numeric arrays. Backend and iOS models support nullable entries and nullable whole arrays. | Preserve null entries for index alignment; a whole null optional array means unavailable. |
| Speed units | The format documents do not state a speed-summary unit. The backend exports stored activity speeds directly, whose model describes km/h. | `stats.speed` uses m/s. Convert stored km/h at backend import/export boundaries. |
| Cadence convention | Web documentation labels cadence RPM; backend track-point documentation says per minute without defining the counted event for running. | Running uses total steps from both feet per minute; cycling uses crank revolutions per minute. Audit source conventions before normalization. |
| Metadata shape | Web documentation and backend support arbitrary objects. The exporter document emphasizes a canonical envelope, and iOS currently models the swimming envelope. | Core metadata accepts arbitrary objects; the swimming envelope has its own contract. A metadata object need not represent a recognized extension. |
| Offsetless timestamps | Backend fallback logic interprets naive datetimes in a selected timezone. iOS exports offset-qualified timestamps. | Require offset-qualified timestamps. Fallback interpretation is application-specific input handling. |
| Summary-only workouts | The backend model allows null geometry and empty arrays. The iOS export boundary rejects workouts with neither route nor heart-rate samples. | Valid with explicit null geometry and an empty `coordTimes` array; non-null sensor arrays must also be empty. Exporter limitations do not narrow the format. |

The backend is the reference implementation. Exporter capabilities do not narrow
the format: a valid file may contain information a particular exporter does not
produce. Duration and summary consistency and sample ordering are recommendations;
an application may enforce stricter consistency checks on supplied values.

## Elevation reference mismatch

The iOS route builder copies `CLLocation.altitude` into the third coordinate.
Apple defines this as height relative to approximate mean sea level; it exposes
[`ellipsoidalAltitude`](https://developer.apple.com/documentation/corelocation/cllocation/ellipsoidalaltitude)
separately for WGS 84 ellipsoidal height.

[GeoJSON section 4](https://www.rfc-editor.org/rfc/rfc7946#section-4) defines its third
coordinate relative to the WGS 84 ellipsoid. Verve uses that same reference
with three-number positions and meter units. The observed iOS values conflict
with this requirement even when their JSON structure validates. Backend export
code copies stored elevations without showing a datum conversion, so the origin
and vertical reference of stored values also need review.

Follow-up: use ellipsoidal altitude in the iOS exporter, audit the datum of
stored/imported values in the backend, and convert known sea-level heights using
an appropriate geoid model when needed. Values with an unknown reference require
provenance review before they can be exported as ellipsoidal heights. Structural
validation is not evidence that a value has the correct reference.

## Metric units and optional statistics

The format uses fixed units: m/s for speed, meters for distance and
elevation, seconds for duration, watts for power, degrees Celsius for temperature,
and kcal for active energy. Heart rate remains bpm; running cadence counts total
steps from both feet per minute, and cycling cadence counts crank revolutions per
minute. For other sports, cadence remains counts per minute with the counted
motion documented by the exporter.
`totalEnergyKcal` retains its current name and meaning; no joule conversion is
required.

Backend activity speed storage is currently km/h, and the exporter copies those
values directly. The export boundary must divide available speed
summaries by 3.6; import must multiply them by 3.6 for existing storage. The
track-point API already describes speed in m/s. Display units and storage units
need not equal the file format's units.

`stats` is optional in the format. The backend may enforce min/avg/max consistency
on supplied numerical values as application policy, but this does not require
missing summaries or fields to be filled in. The format retains those consistency
rules as recommendations, not mandatory bounds.

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

The swimming placement example in the source documentation has an empty feature collection and lacks
required core activity fields. It is a partial illustration, not a conforming
standalone file. Some web swimming sample SWOLF values also do not equal lap
seconds plus stroke count. Future complete examples must be synthetic and checked
for both core and swimming consistency.

## Follow-up checklist

- Implement the format requirements and document application-specific input
  handling separately.
- Enforce two-position LineStrings at exporter boundaries.
- Preserve explicit null geometry in backend serialization.
- Implement ellipsoidal elevation export and audit the reference of stored data.
- Convert speed summaries at backend boundaries and review cadence source conventions.
- Document and test multiple-segment and non-spatial import/export behavior.
- Draft the swimming extension with count, fractional-distance, zero-value, and
  SWOLF consistency rules.
- Add versioned schemas, downloadable examples, and semantic validation in this
  repository before claiming a validated release.
