---
title: Overview
description: Verve GeoJSON is a source-neutral activity file format based on GeoJSON.
---

**Verve GeoJSON 1.0** describes activity routes, timestamps, sensor readings, and
workout summaries. The specifications define the fields and requirements needed
to implement compatible exporters and importers.

## Purpose

Verve GeoJSON describes activity data in a source-neutral format, without
requiring knowledge of the Verve application code. Activities can include
geographic tracks, time series, summary information, and optional swimming
metadata. Workouts without a geographic track are also supported.

## Relationship to GeoJSON

Verve GeoJSON is an extension and opinionated profile of
[GeoJSON (RFC 7946)](https://www.rfc-editor.org/rfc/rfc7946.html).
Every conforming Verve file must also be valid GeoJSON, while ordinary GeoJSON
files need not conform to Verve.

One GeoJSON `FeatureCollection` describes one activity. Activity information is
stored in a top-level `properties` foreign member. Each feature represents a
segment with timestamps and optional sensor arrays aligned by index.

A file uses one geometry mode throughout: every feature has `LineString`
geometry, or every feature has explicit `geometry: null`. Multiple segments are
supported in either mode. Summary-only workouts use null geometry and an empty
`coordTimes` array.

## Unit conventions

| Quantity | Convention |
| --- | --- |
| Speed summaries | Meters per second. |
| Distance | Meters. |
| Elevation | Meters above or below the WGS 84 ellipsoid. |
| Duration | Seconds. |
| Active energy | Kilocalories under `totalEnergyKcal`. |
| Running cadence | Total steps from both feet per minute. |
| Cycling cadence | Crank revolutions per minute. |

Statistics are optional. Zero is a reported value; missing values are omitted or
represented by `null` where the specification permits it.

## Specifications

- [Core specification 1.0](specification/core-1.0/) defines fields, units,
  timestamps, geometry, segments, sensor alignment, summaries, equipment, and
  conformance requirements. It includes three complete synthetic examples.
- [Swimming metadata 1.0](specification/swimming-1.0/) defines the optional swimming
  envelope, pool lengths, laps, sets, stroke styles, timing, and SWOLF. It includes
  two complete synthetic examples.

## Versions and authoritative sources

The core format is identified by `properties.verveVersion: "1.0"`. Swimming
metadata uses its own `target` and `version` identifiers. The documentation
site's package version is separate from the activity file format version.

The Markdown specifications define the format requirements; the website renders
those same documents. Reference a specific Git tag when citing a fixed revision
of the specification.

[Source repository](https://github.com/verve-active/geojson)
