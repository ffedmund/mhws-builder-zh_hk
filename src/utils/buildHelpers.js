// src/utils/buildHelpers.js

import { getRandomElement, compareAllCharmCombinations } from "../functions/buildAlgorithm";

// Group armors by category ('t')
export function groupArmors(armors) {
  return armors.reduce((acc, piece) => {
    const category = piece.t;
    if (!acc[category]) acc[category] = [];
    acc[category].push(piece);
    return acc;
  }, {});
}

// Filter each armor group: keep armors that either have no skills or at least one target skill.
export function filterArmorsBySkills(groupedArmors, targetSkills) {
  const filtered = {};
  Object.keys(groupedArmors).forEach(category => {
    filtered[category] = groupedArmors[category].filter(piece => {
      if (!piece.sks || piece.sks.length === 0) return true;
      return piece.sks.some(skill => targetSkills.hasOwnProperty(skill.id));
    });
  });
  return filtered;
}

// Create an initial random set of armors, one per category.
export function createRandomSet(filteredGroupedArmors, groupedArmors) {
  const categories = ["1", "2", "3", "4", "5"];
  const randomSet = [];
  categories.forEach(category => {
    const filteredGroup = filteredGroupedArmors[category] || [];
    const originalGroup = groupedArmors[category] || [];
    if (filteredGroup.length > 0) {
      randomSet.push(getRandomElement(filteredGroup));
    } else if (originalGroup.length > 0) {
      randomSet.push(getRandomElement(originalGroup));
    } else {
      randomSet.push(null);
    }
  });
  return randomSet;
}

// Filter charms based on target skills and required skill level.
export function filterCharmsBySkills(charms, targetSkills) {
  return charms.filter(charm => {
    return charm.sks.some(
      (skill) => targetSkills.hasOwnProperty(skill.id) && skill.lv > 1
    );
  });
}

// Wrap all helper functions and run the charm-combination algorithm.
export function buildArmorSet(armors, charms, targetSkills, algorithmOptions) {
  const groupedArmors = groupArmors(armors);
  const filteredGroupedArmors = filterArmorsBySkills(groupedArmors, targetSkills);
  const randomSet = createRandomSet(filteredGroupedArmors, groupedArmors);
  const filteredCharms = filterCharmsBySkills(charms, targetSkills);

  return compareAllCharmCombinations(
    filteredCharms,
    groupedArmors,
    targetSkills,
    randomSet,
    algorithmOptions
  );
}
