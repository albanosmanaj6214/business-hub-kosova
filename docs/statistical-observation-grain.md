# Statistical Observation Grain

The **grain** is the unit of one current observation. Identity is deterministic
and independent of the (mutable) numeric value.

Grain = `(dataset, reference period, measure/variable code, remaining dimension codes)`.

`observationGrainHash(datasetIdentifier, referencePeriod, measureCode, extraDimCodes[])`
produces a stable sha-256 fingerprint. Uniqueness is enforced by
`StatisticalObservation @@unique([datasetId, dimensionHash])`.

Guarantees:
- one current observation per grain;
- an unchanged rerun does not create a duplicate;
- different variables do not collide (measureCode differs);
- different reference periods do not collide;
- different datasets do not collide;
- the numeric value is NOT part of the stable identity — a changed value is a
  revision of the same grain, tracked as a new IngestionRecordVersion.

For ASKdata `tab08.px`: grain = `(tab08.px, year, variableCode)` where variableCode
∈ {0 Export, 1 Import, 2 Trade balance}. 3 years × 3 variables = 9 grains.
