import React from "react";
import SkillSelector from "./components/skillSelectorModal";
import ArmorDetail from "./components/armorDetail";
import CharmDetail from "./components/charmDetail";
import { armors, charms } from "./data/data";
import skillDatas from "./data/cn_skillDatas.json";
import { buildArmorSet } from "./utils/buildHelpers";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      targetSkills: {},
      bestArmorCombination: null,
      bestFitness: null,
      bestCurrentSkills: null,
      searchIterations: 1,
      isLoading: false, // Add isLoading state
    };
  }

  handleSkillConfirm = (selectedSkillsArray) => {
    const targetSkills = {};
    selectedSkillsArray.forEach(({ skillId, level }) => {
      targetSkills[skillId] = level;
    });
    this.setState({ targetSkills });
  };

  handleBuild = async () => {
    // Use async/await
    const { targetSkills, searchIterations } = this.state;
    if (Object.keys(targetSkills).length === 0) {
      alert("請先選擇目標技能");
      return;
    }

    // Set isLoading to true before starting the search
    this.setState({ isLoading: true });

    const algorithmOptions = {
      initialTemp: 1000,
      finalTemp: 1e-8,
      coolingFactor: 0.95,
      iterationsPerTemp: 200,
    };

    let overallBestSet = { bestFitness: -1 };

    // Use a Promise to simulate the asynchronous nature of the search
    try {
      await new Promise((resolve) => {
        // Wrap the loop in a setTimeout to allow the UI to update
        setTimeout(() => {
          for (let i = 0; i < searchIterations; i++) {
            const currentBestSet = buildArmorSet(
              armors,
              charms,
              targetSkills,
              algorithmOptions
            );

            if (currentBestSet.bestFitness > overallBestSet.bestFitness) {
              overallBestSet = currentBestSet;
            }
          }
          resolve(); // Resolve the promise when the loop is done
        }, 0);
      });

      this.setState({
        bestArmorCombination: overallBestSet.bestSolution,
        bestFitness: overallBestSet.bestFitness,
        bestCurrentSkills: overallBestSet.bestCurrentSkills,
      });
    } catch (error) {
      console.error("Error during build:", error);
      // Handle errors, e.g., show an error message to the user
      alert("An error occurred during the build process.");
    } finally {
      // Set isLoading back to false after the search is complete (or fails)
      this.setState({ isLoading: false });
    }
  };

  handleSliderChange = (event) => {
    this.setState({ searchIterations: parseInt(event.target.value, 10) });
  };

  renderCurrentSkills() {
    const { bestCurrentSkills } = this.state;
    if (!bestCurrentSkills) return null;

    const skillEntries = Object.entries(bestCurrentSkills);
    if (skillEntries.length === 0) return null;

    return (
      <div style={styles.currentSkillsContainer}>
        <h3 style={styles.currentSkillsTitle}>當前技能</h3>
        <ul style={styles.currentSkillsList}>
          {skillEntries.map(([skillId, level]) => {
            const skill = skillDatas.find((s) => s.id === skillId);
            const skillName = skill ? skill.n : `SkillID: ${skillId}`;
            return (
              <li key={skillId} style={styles.currentSkillItem}>
                {skillName} (Lv.{level})
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  render() {
    const {
      bestArmorCombination,
      bestFitness,
      searchIterations,
      isLoading,
    } = this.state; // Get isLoading from state
    return (
      <div style={styles.appContainer}>
        <h1 style={styles.title}>魔物獵人荒野 - 配裝器</h1>
        <div style={styles.controlsContainer}>
          <SkillSelector onConfirm={this.handleSkillConfirm} />

          <div style={styles.sliderContainer}>
            <label htmlFor="searchIterations" style={styles.sliderLabel}>
              搜索次數: {searchIterations}
            </label>
            <input
              type="range"
              id="searchIterations"
              min="1"
              max="10"
              value={searchIterations}
              onChange={this.handleSliderChange}
              style={styles.slider}
            />
          </div>

          {/* Disable the button while loading */}
          <button
            style={styles.buildButton}
            onClick={this.handleBuild}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Build"} {/* Change button text */}
          </button>
        </div>
        {bestArmorCombination && (
          <div style={styles.resultContainer}>
            <h2 style={styles.resultTitle}>
              推薦裝備組合{" "}
              <span style={styles.fitness}>(Fitness: {bestFitness})</span>
            </h2>
            <div style={styles.armorList}>
              {bestArmorCombination && Array.isArray(bestArmorCombination) ? (
                <div style={styles.armorList}>
                  {bestArmorCombination.map((piece, index) => {
                    if (!piece) return null;
                    if (index === bestArmorCombination.length - 1) {
                      return (
                        <div style={styles.card} key={index}>
                          <CharmDetail charmId={piece.id} />
                        </div>
                      );
                    } else {
                      return (
                        <div style={styles.card} key={index}>
                          <ArmorDetail armorId={piece.id} />
                        </div>
                      );
                    }
                  })}
                </div>
              ) : bestArmorCombination ? (
                <div>Invalid armor combination result.</div>
              ) : null}
            </div>
            {this.renderCurrentSkills()}
          </div>
        )}
      </div>
    );
  }
}

const styles = {
  appContainer: {
    backgroundColor: "#2c2c2c",
    color: "#d8c7a1",
    minHeight: "100vh",
    padding: "20px",
    fontFamily: "sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  title: {
    fontSize: "1.8rem",
    marginBottom: "20px",
    textAlign: "center",
    width: "100%",
    maxWidth: "600px",
  },
  controlsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: "600px",
    marginBottom: "20px",
  },
  sliderContainer: {
    width: "100%",
    marginBottom: "10px",
  },
  sliderLabel: {
    display: "block",
    marginBottom: "5px",
    textAlign: "center",
    color: "#fff",
  },
  slider: {
    width: "100%",
    cursor: "pointer",
  },
  buildButton: {
    backgroundColor: "#52452f",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    marginTop: "16px",
    width: "100%",
    maxWidth: "600px",
    transition: "background-color 0.3s ease", // Smooth transition for hover
  },
  resultContainer: {
    marginTop: "30px",
    backgroundColor: "#3a3a3a",
    border: "1px solid #444",
    borderRadius: "8px",
    padding: "16px",
    width: "100%",
    maxWidth: "600px",
  },
  resultTitle: {
    fontSize: "1.4rem",
    marginBottom: "16px",
  },
  fitness: {
    fontSize: "1rem",
    color: "#fff",
  },
  armorList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "20px",
  },
  card: {
    backgroundColor: "#2c2c2c",
    border: "1px solid #555",
    borderRadius: "6px",
    padding: "8px",
  },
  currentSkillsContainer: {
    backgroundColor: "#2c2c2c",
    border: "1px solid #555",
    borderRadius: "6px",
    padding: "10px",
  },
  currentSkillsTitle: {
    fontSize: "1rem",
    marginBottom: "8px",
  },
  currentSkillsList: {
    listStyleType: "none",
    margin: 0,
    padding: 0,
  },
  currentSkillItem: {
    marginBottom: "4px",
  },
};

export default App;