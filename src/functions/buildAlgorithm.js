export function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function calculateFitness(armorSet, charm, targetSkills) {
    let baseFitness = 0;
    let aggregatedSkills = {};

    // Process charm skills.
    charm?.sks.forEach(skill => {
        if (targetSkills.hasOwnProperty(skill.id)) {
            aggregatedSkills[skill.id] = (aggregatedSkills[skill.id] || 0) + skill.lv;
        }
    });

    // Process each armor piece: accumulate skills from the sks array and base fitness from s array.
    armorSet.forEach(piece => {
        // Aggregate target skills.
        if (piece.sks && piece.sks.length > 0) {
            piece.sks.forEach(skill => {
                aggregatedSkills[skill.id] = (aggregatedSkills[skill.id] || 0) + skill.lv;
            });
        }

        // Add bonus from s array.
        if (piece.s && piece.s.length > 0) {
            const sumS = piece.s.reduce((sum, num) => sum + num, 0);
            baseFitness += sumS * 1.5;
        }
    });

    // If the set does not contain any target skills, apply an extreme penalty.
    if (Object.keys(aggregatedSkills).length === 0) {
        return { fitness: -1e9, currentSkills: aggregatedSkills };
    }

    // Evaluate skill penalties/bonuses based on how aggregated skills compare to the target.
    let skillPenalty = 0;
    let skillBonus = 0;
    const exceedFactor = 1;    // Penalty per extra level if exceeding target.
    const notMeetFactor = 5;   // Penalty per missing level if not meeting target.
    const exactBonus = 0.5;    // Bonus per level if exactly meeting target.

    Object.keys(targetSkills).forEach(skillId => {
        const target = targetSkills[skillId];
        const current = aggregatedSkills[skillId] || 0;
        if (current === target) {
            skillBonus += target * exactBonus;
        } else if (current > target) {
            skillPenalty += (current - target) * exceedFactor;
        } else { // current < target
            skillPenalty += (target - current) * notMeetFactor;
        }
    });

    // Calculate bonus for matching aid: extra points if multiple pieces share the same aid.
    let aidCounts = {};
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

    // Total fitness calculation.
    const totalFitness = baseFitness + skillBonus - skillPenalty + aidBonus;
    return { fitness: totalFitness, currentSkills: aggregatedSkills };
}


export function simulatedAnnealing(groupedArmors, targetSkills, initSolution, charm, options = {}) {
    // Default parameters for the algorithm
    let T = options.initialTemp || 1000;     // initial temperature
    const T_min = options.finalTemp || 1e-8;   // minimal temperature to stop
    const alpha = options.coolingFactor || 0.95; // cooling factor per temperature step
    const iterationsPerTemp = options.iterationsPerTemp || 100;

    // Define the categories (assuming they are '1' to '5')
    const categories = ['1', '2', '3', '4', '5'];

    // Create an initial solution: for each category, pick one random armor
    let currentSolution = initSolution || categories.map(cat => {
        const group = groupedArmors[cat];
        if (!group || group.length === 0) {
            throw new Error(`No armor available for category ${cat}`);
        }
        return group[Math.floor(Math.random() * group.length)];
    });

    // Evaluate the fitness of the initial solution
    let currentResult = calculateFitness(currentSolution, charm, targetSkills);
    let currentFitness = currentResult.fitness;
    let bestSolution = currentSolution.slice();
    let bestFitness = currentFitness;
    let bestCurrentSkills = currentResult.currentSkills;

    // Main loop of the SA algorithm
    while (T > T_min) {
        for (let i = 0; i < iterationsPerTemp; i++) {
            // Create a neighbor solution by copying the current one
            let newSolution = currentSolution.slice();

            // Randomly pick one category to change
            const catIndex = Math.floor(Math.random() * categories.length);
            const cat = categories[catIndex];
            const group = groupedArmors[cat];
            if (!group || group.length === 0) continue; // should not happen if initial data is complete

            // Replace the current armor in that category with a random alternative
            const candidate = group[Math.floor(Math.random() * group.length)];
            newSolution[catIndex] = candidate;

            // Calculate fitness for the new solution
            const newResult = calculateFitness(newSolution, charm, targetSkills);
            const newFitness = newResult.fitness;

            // Decide whether to accept the new solution
            if (
                newFitness > currentFitness ||
                Math.exp((newFitness - currentFitness) / T) > Math.random()
            ) {
                currentSolution = newSolution;
                currentFitness = newFitness;
                // Update best solution if improved
                if (newFitness > bestFitness) {
                    bestSolution = newSolution;
                    bestFitness = newFitness;
                    bestCurrentSkills = newResult.currentSkills;
                }
            }
        }
        // Cool down the temperature
        T *= alpha;
    }

    return { bestSolution, bestFitness, bestCurrentSkills };
}

export function compareAllCharmCombinations(filteredCharms, groupedArmors, targetSkills, initSolution, options = {}) {
    // If no charm is provided, run simulatedAnnealing with charm = null.
    if (!filteredCharms || filteredCharms.length === 0) {
        return simulatedAnnealing(groupedArmors, targetSkills, initSolution, null, options);
    }

    let bestSolution = [];
    let bestFitness = 0;
    let bestCurrentSkills = {};

    filteredCharms.forEach(charm => {
        const result = simulatedAnnealing(groupedArmors, targetSkills, initSolution, charm, options);
        if (result.bestFitness > bestFitness) {
            bestCurrentSkills = result.bestCurrentSkills;
            bestFitness = result.bestFitness;
            bestSolution = [...result.bestSolution]; // Ensure it's an array copy
            bestSolution.push(charm);
        }
    });

    return { bestSolution, bestFitness, bestCurrentSkills };
}
