---
title: Overview
description: Verve GeoJSON is a source-neutral activity file format based on GeoJSON.
---

**Draft documentation — format version 1.0.** The detailed specification,
validation schemas, and complete examples are still being prepared. This
overview introduces the format; it is not a complete conformance specification.

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

This documentation targets the existing format identified by
`verveVersion: "1.0"` in the root activity properties. The documentation site's
package version is separate from the activity file format version.

## Documentation in preparation

The upcoming documentation will cover the core 1.0 specification, the swimming
metadata extension, conformance requirements, complete synthetic examples, and
implementation notes.

The Markdown specification will define the format requirements. JSON Schemas will
validate structure, while the specification will also describe semantic rules
that portable JSON Schema cannot fully express.
