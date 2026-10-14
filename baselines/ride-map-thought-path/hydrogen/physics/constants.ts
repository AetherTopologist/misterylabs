/**
 * Pinned CODATA 2022 recommended values (NIST), not refit in this instrument.
 * https://physics.nist.gov/cuu/Constants/Table/allascii.txt
 * Mohr, Newell, Taylor, Tiesinga, Rev. Mod. Phys. 97, 025002 (2025).
 */
export const CODATA_2022 = {
  c: 299_792_458,
  elementaryCharge: 1.602_176_634e-19,
  planck: 6.626_070_15e-34,
  bohrRadius: 5.291_772_105_44e-11,
  electronMass: 9.109_383_713_9e-31,
  protonMass: 1.672_621_925_95e-27,
  electronProtonMassRatio: 5.446_170_214_889e-4,
  inverseFineStructure: 137.035_999_177,
  rydbergPerMeter: 10_973_731.568_157,
  rydbergEnergyEV: 13.605_693_122_99,
  rydbergEnergyJ: 2.179_872_361_103e-18,
  protonRmsChargeRadius: 8.4075e-16,
} as const

export const CODATA_SOURCE =
  "CODATA 2022 recommended values, NIST (Rev. Mod. Phys. 97, 025002, 2025)"
