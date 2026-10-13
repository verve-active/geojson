---
title: Core specification 1.0
slug: specification/core-1.0
description: Draft requirements for the Verve GeoJSON 1.0 activity file format.
---

**Status: draft for review.** This document defines the proposed conformance
requirements for the existing `verveVersion: "1.0"` format. It is not a tagged
release. Implementation notes describe current app behavior and discrepancies
separately. The backend wire models are the reference implementation; exporter
limitations do not narrow valid format capabilities. Explicit GeoJSON requirements
and the offset-qualified timestamp requirement still apply. The elevation
reference remains unresolved, so this draft does not establish finalized GeoJSON
semantic conformance.

## Requirements language

Uppercase **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** have the
meanings defined by [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and
[RFC 8174](https://www.rfc-editor.org/rfc/rfc8174). MUST describes a conformance
requirement; SHOULD describes a recommendation; MAY describes an option.

Names and string literals in this specification are case-sensitive. Files MUST
use the JSON member names shown here, including camelCase. Internal model names
and implementation-specific aliases do not define alternative file spellings.

## Relationship to GeoJSON

A Verve file MUST be valid [GeoJSON (RFC 7946)](https://www.rfc-editor.org/rfc/rfc7946).
Verve constrains activity structure and adds activity information without changing
GeoJSON member meanings. Generic GeoJSON need not conform to Verve.

The root `properties` member is a GeoJSON foreign member, not the `properties`
member of a Feature. Each feature has its own separate `properties` object for
sample data. A generic GeoJSON consumer may ignore Verve activity information.

## Root structure

The root MUST be a JSON object containing these members:

| Member | Required value |
| --- | --- |
| `type` | The string `"FeatureCollection"`. |
| `properties` | An activity properties object as defined below. |
| `features` | An array containing at least one Verve Feature. |

A standalone Feature, a collection of Point features, and a MultiLineString
geometry are not Verve 1.0 track representations. Other GeoJSON representations
accepted by an application belong to that application's import documentation.

Additional members MAY be present, subject to GeoJSON's rules for foreign
members. They MUST NOT replace or redefine the members defined here. GeoJSON
members such as `bbox` and Feature `id`, when included, retain their GeoJSON
meaning. Unrecognized information MUST NOT be interpreted as a defined Verve
field merely because it resembles an internal model name.

## Activity properties

Required members MUST be present and MUST NOT be `null`. Optional members MAY be
omitted. An optional member MAY be `null` only where its type explicitly permits
it. Numeric values MUST be finite JSON numbers, not numeric strings.

| Member | Required | Type | Meaning and units |
| --- | --- | --- | --- |
| `verveVersion` | Yes | String literal | Exactly `"1.0"`. |
| `generator` | Yes | String | Name of the application that generated the file. No particular application name is required. |
| `name` | Yes | String | Activity display name. |
| `description` | No | String or null | Activity description or notes. |
| `activityType` | Yes | String | Main activity category, for example `Cycling`, `Foot Sports`, or `Swimming`. |
| `activitySubType` | No | String or null | Subcategory, for example `Run`, `Road`, or `Open Water`. |
| `startTime` | Yes | Timestamp string | Activity start instant. |
| `durationSeconds` | Yes | Number | Total workout duration, in seconds. |
| `movingDurationSeconds` | No | Number or null | Moving duration, in seconds. |
| `totalDistanceMeters` | No | Number or null | Total activity distance, in meters. |
| `totalEnergyKcal` | No | Number or null | Active energy, in kilocalories. |
| `elevationGain` | No | Number or null | Total ascent, in meters. |
| `elevationLoss` | No | Number or null | Total descent, in meters, expressed as a nonnegative magnitude. |
| `stats` | No | Object | Optional grouped metric summaries. An empty object is allowed. |
| `equipment` | No | Array or null | Equipment snapshots as defined below. An empty array is allowed. |
| `metadata` | No | Object | Additional activity metadata, including separately versioned extensions. |
| `timezone` | No | String or null | Recorded IANA timezone identifier, including `UTC`, when known. |

Duration, distance, active energy, ascent, and descent values SHOULD be nonnegative.
When supplied, `movingDurationSeconds` SHOULD NOT exceed `durationSeconds`.
These are semantic recommendations, not extra bounds enforced by the backend
reference model.
Zero is a reported value; omission or permitted `null` means unavailable.

An activity summary describes the workout and need not be calculated solely from
exported samples: samples may be sparse or cover only part of the workout. This
format does not mandate a pause-detection algorithm, averaging algorithm, or
reconstruction of duration from the first and last sample timestamps.

`activityType` and `activitySubType` are strings, not a closed enumeration in the
core format. An importer may support only a configured set of categories. That
application restriction does not make another category structurally invalid.

`verveVersion` identifies the activity file format, independently of website
package versions, repository tags, and metadata extension versions. A version
marker alone is not sufficient to prove that the remainder of a file conforms.

## Timestamps and timezone

`startTime` and every `coordTimes` entry MUST be a
[RFC 3339 timestamp](https://www.rfc-editor.org/rfc/rfc3339#section-5.6) with an
explicit UTC relationship: `Z` or a numeric offset such as `+02:00`. Fractional
seconds MAY be included. Offsetless local timestamps, dates alone, Unix epoch
numbers, and `null` entries do not conform. Exporters SHOULD use uppercase `T`
and `Z` for interoperability.

An importer MUST use the timestamp's offset when determining its instant.
`timezone` records named timezone context; it MUST NOT be used to reinterpret an
already offset-qualified timestamp. Timestamps MAY use UTC even when `timezone`
is a different recorded IANA identifier. A named timezone is not required to
parse an offset-qualified timestamp.

Exporters SHOULD omit `timezone` when the recorded timezone is unavailable. A
fixed-offset label such as `GMT+0200` is not a recorded IANA identifier for this
field. A timestamp formatting fallback MUST NOT be presented as the recorded
timezone. If timestamps are expressed in a named timezone's local time, their
individual offsets must reflect daylight saving changes at the relevant instants.

## Features and segments

Each feature MUST be an object with:

| Member | Required value |
| --- | --- |
| `type` | The string `"Feature"`. |
| `geometry` | A Verve LineString geometry object or explicit `null`. |
| `properties` | A sample properties object containing `coordTimes`. |

A spatial feature represents one continuous track segment. Multiple segments are
represented by multiple features, with independent coordinate and sample arrays.
Consumers MUST NOT invent a connecting track edge between separate features.
Exporters SHOULD place features in chronological order and samples within each
feature in nondecreasing timestamp order. Duplicate timestamps are not prohibited.
Array order defines the sample association, including when timestamps repeat.

For a workout without a geographic track, `geometry` MUST be explicitly `null`.
The feature's timestamps and sensor arrays then describe a time series; no
placeholder coordinates are needed. A missing `geometry` member is not equivalent
to explicit `null` in a conforming file.

A non-spatial feature MAY contain an empty `coordTimes` array. This represents
a summary-only activity with no exported samples. The root still MUST contain
at least one feature. Any supplied non-null sensor arrays then MUST also be
empty. Exporter inability to produce such an activity does not make it invalid.

## Geometry and coordinates

A spatial geometry MUST contain `type: "LineString"` and a `coordinates` array
with at least two positions. Each position MUST contain exactly three numbers:
`[longitude, latitude, elevation]`. The coordinate and timestamp arrays MUST have
the same number of entries.

Longitude and latitude use WGS 84 decimal degrees. Elevation is in meters,
and negative values are allowed. The third element MUST NOT be a timestamp,
`null`, or an additional sensor value. Exporters SHOULD NOT substitute a fabricated
zero for unknown elevation. Two-number and four-number positions do not conform
to this three-number profile.

**Unresolved: elevation reference.**
[GeoJSON section 4](https://www.rfc-editor.org/rfc/rfc7946#section-4) defines height
relative to the WGS 84 ellipsoid, while the iOS exporter currently uses height
relative to sea level and the backend copies stored elevations without recording
their reference. This draft does not select a Verve elevation reference or require
conversion of existing values. Review of the backend and source data is needed
before finalizing that decision and claiming full GeoJSON semantic conformance.

## Sample properties and alignment

Let `n` be the number of entries in a feature's `coordTimes` array. The sample at
index `i` comprises `coordTimes[i]`, `geometry.coordinates[i]` when geometry is
present, and entry `i` in each available sensor array.

| Member | Required | Type | Units |
| --- | --- | --- | --- |
| `coordTimes` | Yes | Array of timestamp strings | Sample instants. |
| `heartRates` | No | Array of integers or null entries, or null | Beats per minute. |
| `cadences` | No | Array of integers or null entries, or null | Revolutions per minute (RPM). |
| `powers` | No | Array of numbers or null entries, or null | Watts. |
| `temperatures` | No | Array of numbers or null entries, or null | Degrees Celsius. |

Every non-null sensor array MUST have length `n`. This rule applies even when all
its entries are `null`. `coordTimes` itself MUST NOT be `null`, and timestamps
MUST NOT be missing inside it.

Omitting a sensor array, or setting the whole optional array to `null`, means the
sensor series is unavailable. A `null` entry means that sensor value is unavailable
for that particular sample. Exporters MUST preserve its position rather than
remove it and shift subsequent values. Exporters SHOULD omit wholly unavailable
sensor series. A zero sensor reading is distinct from a missing reading.

A spatial feature does not require any sensor series. A non-spatial feature also
does not require a particular sensor; its timestamp array defines its samples.
Sensor synchronization and interpolation algorithms are exporter choices, not
core conformance rules.

## Metric summaries

When present, `stats` MUST be an object. Each supported metric is optional and MAY
be a MetricSummary object or `null`:

| Metric | Units |
| --- | --- |
| `speed` | Kilometers per hour (km/h), preserving the existing exported unit. |
| `heartRate` | Beats per minute. |
| `power` | Watts. |
| `cadence` | Revolutions per minute (RPM). |

A MetricSummary object MAY contain `avg`, `max`, and `min`. Each is an optional
number or `null`; all use the metric's unit. An empty summary object is allowed.
Omitted or null values are unavailable, not zero. When both numerical `min` and
`max` are supplied, `min` SHOULD NOT exceed `max`; a supplied numerical `avg`
SHOULD lie within supplied numerical bounds. The backend reference model does
not enforce these relationships, so they are consistency recommendations.

A summary MAY come from source-level workout statistics rather than the exported
sample array. In particular, the core format does not require its average to equal
the arithmetic mean of the available samples.

## Equipment

Every entry in a non-null `equipment` array MUST be an object containing `name`
and `type` as strings. `brand` and `model` are optional strings or `null`.
An equipment snapshot describes the equipment associated with the exported
activity; the format does not require a database identifier or a matching record
in an importer's equipment inventory.

## Metadata and extensions

`metadata`, when present, MUST be a JSON object. Unstructured additional metadata
is allowed; the core format does not require every metadata object to be a known
extension. An empty object conveys no additional information and SHOULD be
omitted.

Structured extensions SHOULD use an envelope containing string `target`, string
`version`, and object `data`. Consumers use the target and version together to
select an extension contract; an unknown target or unsupported version MUST NOT
be interpreted as a known extension version.

Swimming metadata uses `target: "SwimmingMetaData"` and `version: "1.0"` in this
envelope. Its pool, lap, set, stroke, and SWOLF requirements belong to the separate
swimming extension specification, which is still being prepared. Core conformance
alone does not establish swimming extension conformance.

## Complete synthetic examples

These are complete standalone files for illustrating the core draft, not extracts
from real workouts. Route elevations are synthetic meter values; their vertical
reference is subject to the unresolved decision above. Additional downloadable
examples and JSON Schemas are still in preparation.

### Minimal route

This activity has one two-position segment and no sensor arrays or summaries.

```json
{
  "type": "FeatureCollection",
  "properties": {
    "verveVersion": "1.0",
    "generator": "ExampleExporter",
    "name": "Synthetic route",
    "activityType": "Foot Sports",
    "activitySubType": "Run",
    "startTime": "2026-10-13T08:00:00Z",
    "durationSeconds": 60
  },
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[11.582, 48.135, 520], [11.583, 48.136, 521]]
      },
      "properties": {
        "coordTimes": ["2026-10-13T08:00:00Z", "2026-10-13T08:01:00Z"]
      }
    }
  ]
}
```

### Non-spatial workout with a missing sensor reading

The second timestamp has no heart-rate reading. Keeping its `null` entry preserves
sample alignment. The recorded timezone is separate from the UTC sample times.

```json
{
  "type": "FeatureCollection",
  "properties": {
    "verveVersion": "1.0",
    "generator": "ExampleExporter",
    "name": "Synthetic indoor ride",
    "activityType": "Cycling",
    "activitySubType": "Indoor",
    "startTime": "2026-10-13T08:00:00Z",
    "durationSeconds": 60,
    "timezone": "Europe/Berlin",
    "stats": {
      "heartRate": { "avg": 130, "min": 130, "max": 130 }
    }
  },
  "features": [
    {
      "type": "Feature",
      "geometry": null,
      "properties": {
        "coordTimes": ["2026-10-13T08:00:00Z", "2026-10-13T08:01:00Z"],
        "heartRates": [130, null]
      }
    }
  ]
}
```

### Summary-only workout

This activity has summary information but no route or sensor samples. The empty
sample array does not require fabricated coordinates or timestamps.

```json
{
  "type": "FeatureCollection",
  "properties": {
    "verveVersion": "1.0",
    "generator": "ExampleExporter",
    "name": "Synthetic summary-only workout",
    "activityType": "Cycling",
    "activitySubType": "Indoor",
    "startTime": "2026-10-13T08:00:00Z",
    "durationSeconds": 1800,
    "totalDistanceMeters": 12000,
    "totalEnergyKcal": 250,
    "stats": {
      "heartRate": { "avg": 135, "max": 160 }
    }
  },
  "features": [
    {
      "type": "Feature",
      "geometry": null,
      "properties": { "coordTimes": [] }
    }
  ]
}
```

## Conformance and validation limits

Structural conformance requires the root, feature, member types, geometry shape,
and sample-array alignment described above. The explicit timestamp-offset rule
is also required. Full semantic conformance remains a draft goal because the
elevation reference is unresolved. A validator SHOULD report structural and
semantic failures separately so an exporter can locate the offending feature or
field. An importer MAY offer a tolerant mode, but accepting a nonconforming file
in that mode does not change the specification.

Planned JSON Schemas will use Draft 2020-12 to check structure and supported
representations. Portable JSON Schema alone cannot fully check equality of
independently sized sample arrays, moving duration against total duration, or
relationships among summary values. Array-length equality is a conformance
requirement; duration and summary bounds are recommendations. Checking these
relationships requires semantic validation.
Timestamp format checking also depends on the validator's format-assertion
configuration. Valid IANA identifiers require timezone data. A numeric elevation
cannot prove that the exporter used the correct vertical reference.

Conformance checks SHOULD include rejection of missing required members,
unsupported geometry, one-position LineStrings, wrong position dimensions,
offsetless timestamps, misaligned arrays, and invalid null placement. Extension
validation is additional to core validation when an extension is claimed.
