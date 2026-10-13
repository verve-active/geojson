---
title: Overview
description: Verve GeoJSON is a source-neutral activity file format based on GeoJSON.
---

**Verve GeoJSON 1.0.** The core specification and implementation notes are
available. The swimming extension, validation schemas, and downloadable examples
are still being prepared. Use the core specification to implement the format.

Speed summaries use m/s, active energy uses kcal, and elevation uses WGS 84
ellipsoidal height. Statistics are optional. Running cadence counts total steps
per minute; cycling cadence counts crank revolutions per minute.

## Purpose

Verve GeoJSON describes activity data in a source-neutral format. The documentation
is intended to help people and agents implement compatible exporters and importers
without needing to read the Verve application code.

Activities can include geographic tracks, timestamps, sensor readings, and
activity information. Workouts without a geographic track are also supported.

## Relationship to GeoJSON

Verve GeoJSON is an extension and opinionated profile of
[GeoJSON (RFC 7946)](https://www.rfc-editor.org/rfc/rfc7946.html).
Every conforming Verve file must also be valid GeoJSON, while ordinary GeoJSON
files need not conform to Verve.

The format uses a GeoJSON `FeatureCollection` for an activity, with features
representing track segments. Activity information is stored in a top-level
`properties` foreign member. Features can carry timestamps and sensor arrays
alongside their geometry. Time-series-only workouts use explicit `null` geometry.

## Format version

This documentation describes the format identified by
`verveVersion: "1.0"` in the root activity properties. The documentation site's
package version is separate from the activity file format version.

## Documentation

The core specification 1.0 defines fields, units, timestamps, nullability,
segments, sensor alignment, equipment, and conformance requirements. It includes
three complete synthetic examples. Implementation notes record the source comparison,
discrepancies, and application follow-ups separately. Both pages are in the sidebar.

The swimming metadata extension, versioned JSON Schemas, downloadable examples,
and automated semantic validation are still in preparation.

The Markdown specification will define the format requirements. JSON Schemas will
validate structure, while the specification will also describe semantic rules
that portable JSON Schema cannot fully express.
