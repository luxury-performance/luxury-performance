import type { OuterTubeEdits } from './valvetronic-exhaust-editing';
import type { RearTubeEdits, RearTubeId } from './valvetronic-exhaust-rear-editing';

// A shallow overlap between the mirrored turns; each bank moves as one assembly.
export const EXHAUST_BANK_OFFSET = .14;

export const FINISHED_FRONT_EDITS: OuterTubeEdits = {
  "01": {
    "length": 60,
    "bend": 0,
    "rotation": 0
  },
  "02A": {
    "length": 120,
    "bend": 30,
    "rotation": 29
  },
  "02B": {
    "length": 100,
    "bend": 100,
    "rotation": 0
  },
  "02C": {
    "length": 80,
    "bend": 100,
    "rotation": 39
  },
  "02D": {
    "length": 100,
    "bend": 75,
    "rotation": 0
  }
};

export const FINISHED_REAR_EDITS: RearTubeEdits = {
  "11": {
    "length": 75,
    "bend": 0,
    "rotation": 0
  },
  "13": {
    "length": 75,
    "bend": 0,
    "rotation": 0
  },
  "14": {
    "length": 160,
    "bend": 75,
    "rotation": 0
  },
  "16": {
    "length": 79,
    "bend": 90,
    "rotation": 0
  },
  "09-10": {
    "length": 130,
    "bend": 40,
    "rotation": 0
  },
  "15A": {
    "length": 75,
    "bend": 90,
    "rotation": 14
  },
  "15B": {
    "length": 75,
    "bend": 90,
    "rotation": 0
  }
};

export const FINISHED_REAR_DRIVER: RearTubeId = '14';
