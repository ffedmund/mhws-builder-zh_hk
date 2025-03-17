import skillDatas from '../data/cn_skillDatas.json';
import { series, groups } from '../data/data';

export function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Compute the marginal improvement (delta) of adding a deco.
function computeDecoImprovement(deco, currentSkills, targetSkills) {
    const exactBonus = 0.5;
    const exceedFactor = 1;
    const notMeetFactor = 5;
    let delta = 0;
    deco.sks.forEach(skill => {
        if (targetSkills.hasOwnProperty(skill.id)) {
            const t = targetSkills[skill.id];
            const curr = currentSkills[skill.id] || 0;
            const newVal = curr + skill.lv;
            const currContribution = (curr === t)
                ? t * exactBonus
                : (curr > t ? - (curr - t) * exceedFactor : - (t - curr) * notMeetFactor);
            const newContribution = (newVal === t)
                ? t * exactBonus
                : (newVal > t ? - (newVal - t) * exceedFactor : - (t - newVal) * notMeetFactor);
            delta += (newContribution - currContribution);
        }
    });
    return delta;
}

// Greedily assign decos to available slots.
// availableSlots: array of slot sizes (from armors).
// decoOptions: all deco objects available (should be filtered for m === 'a' if needed).
// aggregatedSkills: skills from charm & armor so far.
// targetSkills: the target skills that we want to reach.
function assignDecos(availableSlots, decoOptions, aggregatedSkills, targetSkills) {
    // Work on a copy of aggregatedSkills so we can simulate adding deco effects.
    let currentSkills = { ...aggregatedSkills };
    // For each slot, we store the assigned deco (or null if no beneficial deco found)
    const assignments =[];

    availableSlots.forEach(slotSize => {
        // Get candidate decos that “fit” the slot (assuming the rule: deco.req === slotSize).
        const candidates = decoOptions.filter(deco => deco.req === slotSize);
        let bestDeco = null;
        let bestDelta = 0;
        candidates.forEach(deco => {
            const delta = computeDecoImprovement(deco, currentSkills, targetSkills);
            if (delta > bestDelta) {
                bestDelta = delta;
                bestDeco = deco;
            }
        });
        if (bestDeco && bestDelta > 0) {
            assignments.push(bestDeco);
            // Update currentSkills with the bonus from the chosen deco.
            bestDeco.sks.forEach(skill => {
                if (targetSkills.hasOwnProperty(skill.id)) {
                    currentSkills[skill.id] = (currentSkills[skill.id] || 0) + skill.lv;
                }
            });
        } else {
            assignments.push(null);
        }
    });
    return { assignments, updatedSkills: currentSkills };
}

function assignDecosByArmor(armorSet, decoOptions, aggregatedSkills, targetSkills) {
    // Work on a copy of aggregatedSkills so we can simulate adding deco effects.
    let currentSkills = { ...aggregatedSkills };

    // For each armor piece, assign decos for its slots.
    const groupedAssignments = armorSet.map(piece => {
        let pieceAssignments =[];
        if (piece.s && piece.s.length > 0) {
            piece.s.forEach(slotSize => {
                // Get candidate decos that fit the slot (assuming deco.req === slotSize)
                const candidates = decoOptions.filter(deco => deco.req === slotSize);
                let bestDeco = null;
                let bestDelta = 0;
                candidates.forEach(deco => {
                    const delta = computeDecoImprovement(deco, currentSkills, targetSkills);
                    if (delta > bestDelta) {
                        bestDelta = delta;
                        bestDeco = deco;
                    }
                });
                if (bestDeco && bestDelta > 0) {
                    pieceAssignments.push(bestDeco);
                    // Update currentSkills with the bonus from the chosen deco.
                    bestDeco.sks.forEach(skill => {
                        if (targetSkills.hasOwnProperty(skill.id)) {
                            currentSkills[skill.id] = (currentSkills[skill.id] || 0) + skill.lv;
                        }
                    });
                } else {
                    // No beneficial deco found for this slot.
                    pieceAssignments.push(null);
                }
            });
        } else {
            // If the armor piece has no slots, we return an empty array.
            pieceAssignments =[];
        }
        return pieceAssignments;
    });
    return { assignments: groupedAssignments, updatedSkills: currentSkills };
}

function checkRequirements(setCount, setEffects, aggregatedSkills) {
    if (!setCount || Object.keys(setCount).length === 0) return aggregatedSkills; // Return early if no set counts
    let currentSkills = { ...aggregatedSkills };
    setEffects.forEach(set => {
        const count = setCount[set.id];
        if (count !== undefined && set.s.length > 0) {
            let triggeredSkill = null;
            // Since s is in ascending order, iterate backward to check the highest requirement first.
            for (let i = set.s.length - 1; i >= 0; i--) {
                if (count >= set.s[i].req) {
                    triggeredSkill = set.s[i];
                    break;
                }
            }
            const isValidSet = triggeredSkill !== null;

            // If the set is valid and the triggered skill has associated ids,
            // add these skills into aggregatedSkills.
            if (isValidSet && triggeredSkill.ids) {
                triggeredSkill.ids.forEach(skillId => {
                    currentSkills[skillId] = (currentSkills[skillId] || 0) + (triggeredSkill.bonus || 99); // Assuming a default bonus of 99 if not specified
                });
            }
        }
    });
    return currentSkills;
}

// Memoization cache for calculateFitness
const fitnessCache = new Map();

// Updated fitness function which now considers deco assignment.
export function calculateFitness(armorSet, charm, decoOptions, targetSkills) {
    // Create a unique key for memoization
    const cacheKey = JSON.stringify({
        armorSet: armorSet.map(piece => piece.id), // Use IDs for comparison
        charm: charm ? charm.id : null, // Use ID if charm exists
        targetSkills
    });

    if (fitnessCache.has(cacheKey)) {
        return fitnessCache.get(cacheKey);
    }

    let baseFitness = 0;
    let aggregatedSkills = {};

    // Process charm skills.
    charm?.sks.forEach(skill => {
        if (targetSkills.hasOwnProperty(skill.id)) {
            aggregatedSkills[skill.id] = (aggregatedSkills[skill.id] || 0) + skill.lv;
        }
    });

    // Process each armor piece: accumulate skills and collect available slot sizes.
    const availableSlots =[];
    const ssCount = {};
    const gsCount = {};
    armorSet.forEach(piece => {
        if (piece.sks && piece.sks.length > 0) {
            piece.sks.forEach(skill => {
                if (targetSkills.hasOwnProperty(skill.id)) {
                    aggregatedSkills[skill.id] = (aggregatedSkills[skill.id] || 0) + skill.lv;
                }
            });
        }
        // Collect slots from the armor (each slot represented by its size).
        if (piece.s && piece.s.length > 0) {
            piece.s.forEach(slotSize => {
                availableSlots.push(slotSize);
            });
            const sumS = piece.s.reduce((sum, num) => sum + num, 0);
            baseFitness += sumS * 1.5;
        }
        if (piece.gs) {
            gsCount[piece.gs] = (gsCount[piece.gs] || 0) + 1;
        }

        if (piece.ss) {
            ssCount[piece.ss] = (ssCount[piece.ss] || 0) + 1;
        }
    });

    aggregatedSkills = checkRequirements(ssCount, series, aggregatedSkills);
    aggregatedSkills = checkRequirements(gsCount, groups, aggregatedSkills);

    // Incorporate deco assignments.
    const decoResult = assignDecosByArmor(armorSet, decoOptions, aggregatedSkills, targetSkills);
    // Update aggregated skills with deco contributions.
    aggregatedSkills = decoResult.updatedSkills;

    // If no target skills are present, apply an extreme penalty.
    if (Object.keys(aggregatedSkills).length === 0 && Object.keys(targetSkills).length > 0) {
        const result = { fitness: -1e9, currentSkills: aggregatedSkills, decoAssignment: decoResult.assignments };
        fitnessCache.set(cacheKey, result);
        return result;
    }

    // Evaluate skill penalties/bonuses.
    let skillPenalty = 0;
    let skillBonus = 0;
    const exceedFactor = 1;     // Penalty per extra level if exceeding target.
    const notMeetFactor = 5;   // Penalty per missing level if not meeting target.
    const exactBonus = 0.5;     // Bonus per level if exactly meeting target.

    Object.keys(targetSkills).forEach(skillId => {
        const target = targetSkills[skillId];
        const current = aggregatedSkills[skillId] || 0;
        const skillData = skillDatas.find(skill => skill.id === skillId);
        const maxLevel = skillData?.max || 99; // Default max level if not found
        if (current === target) {
            skillBonus += target * exactBonus;
        } else if (current > maxLevel && target <= maxLevel) {
            skillPenalty += (current - maxLevel) * exceedFactor;
        }
         else if (current > target) {
            skillPenalty += (current - target) * exceedFactor;
        } else { // current < target
            skillPenalty += (target - current) * notMeetFactor;
        }
    });

    // Bonus for matching aid (if multiple pieces share the same aid).
    const aidCounts = {};
    armorSet.forEach(piece => {
        aidCounts[piece.aid] = (aidCounts[piece.aid] || 0) + 1;
    });
    let aidBonus = 0;
    Object.keys(aidCounts).forEach(aid => {
        const count = aidCounts[aid];
        if (count === 2) {
            aidBonus += 5;
        } else if (count === 5) {
            aidBonus += 12;
        }
    });

    const totalFitness = baseFitness + skillBonus - skillPenalty + aidBonus;
    const result = { fitness: totalFitness, currentSkills: aggregatedSkills, decoAssignment: decoResult.assignments };
    fitnessCache.set(cacheKey, result);
    return result;
}

// Updated simulated annealing which now passes decoOptions to calculateFitness.
export function simulatedAnnealing(groupedArmors, targetSkills, initSolution, charm, decoOptions, options = {}) {
    const categories = ['1', '2', '3', '4', '5'];
    let T = options.initialTemp || 1000;
    const T_min = options.finalTemp || 1e-8;
    const alpha = options.coolingFactor || 0.95;
    const iterationsPerTemp = options.iterationsPerTemp || 100;

    let currentSolution = initSolution || categories.map(cat => {
        const group = groupedArmors[cat];
        if (!group || group.length === 0) {
            throw new Error(`No armor available for category ${cat}`);
        }
        return getRandomElement(group);
    });

    let currentResult = calculateFitness(currentSolution, charm, decoOptions, targetSkills);
    let currentFitness = currentResult.fitness;
    let bestSolution = currentSolution.slice();
    let bestFitness = currentFitness;
    let bestCurrentSkills = currentResult.currentSkills;
    let bestDecoAssignment = currentResult.decoAssignment;

    while (T > T_min) {
        for (let i = 0; i < iterationsPerTemp; i++) {
            const newSolution = currentSolution.slice();
            const catIndex = Math.floor(Math.random() * categories.length);
            const cat = categories[catIndex];
            const group = groupedArmors[cat];
            if (!group || group.length === 0) continue;
            const candidate = getRandomElement(group);
            newSolution[catIndex] = candidate;

            const newResult = calculateFitness(newSolution, charm, decoOptions, targetSkills);
            const newFitness = newResult.fitness;
            if (newFitness > currentFitness || Math.exp((newFitness - currentFitness) / T) > Math.random()) {
                currentSolution = newSolution;
                currentFitness = newFitness;
                if (newFitness > bestFitness) {
                    bestSolution = newSolution;
                    bestFitness = newFitness;
                    bestCurrentSkills = newResult.currentSkills;
                    bestDecoAssignment = newResult.decoAssignment;
                }
            }
        }
        T *= alpha;
    }

    return { bestSolution, bestFitness, bestCurrentSkills, bestDecoAssignment };
}

// Updated function for comparing charm combinations.
export function compareAllCharmCombinations(filteredCharms, groupedArmors, targetSkills, initSolution, decoOptions, options = {}) {
    // Function to merge deco assignments (an array of arrays) into the corresponding armor pieces.
    // Each armor piece gets a new key "ds" that holds its deco assignments.
    function mergeDecoAssignments(armorSolution, decoAssignment) {
        return armorSolution.map((armor, index) => ({ ...armor, ds: decoAssignment[index] }));
    }

    // Clear the fitness cache at the beginning of each run
    fitnessCache.clear();

    let bestMergedSolution =[];
    let bestFitness = -Infinity;
    let bestCurrentSkills = {};

    const charmsToProcess = filteredCharms && filteredCharms.length > 0 ? filteredCharms : [null];

    for (const charm of charmsToProcess) {
        const result = simulatedAnnealing(groupedArmors, targetSkills, initSolution, charm, decoOptions, options);
        if (result.bestFitness > bestFitness) {
            bestFitness = result.bestFitness;
            // Merge the deco assignments into the armor pieces.
            const mergedSolution = mergeDecoAssignments(result.bestSolution, result.bestDecoAssignment);
            // Append the charm to the merged armor solution.
            bestMergedSolution = charm ? [...mergedSolution, charm] : mergedSolution;
            bestCurrentSkills = result.bestCurrentSkills;
        }
    }

    return { bestSolution: bestMergedSolution, bestFitness, bestCurrentSkills };
}