import React from "react";
import html2canvas from 'html2canvas';
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
      armorRankLimit: 8,
    };
    this.armorListRef = React.createRef(); // Create a ref for armorList
    this.currentSkillsRef = React.createRef(); // Create a ref for currentSkills
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
    const { targetSkills, searchIterations, armorRankLimit } = this.state;
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
              armorRankLimit,
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
      <div style={styles.currentSkillsContainer} ref={this.currentSkillsRef}> {/* Attach ref here */}
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

  calculateCurrentSkills = (armorCombination) => {
    if (!armorCombination || !Array.isArray(armorCombination)) {
      return {};
    }
    const currentSkills = {};
    armorCombination.forEach(piece => {
      if (piece && piece.sks) {
        piece.sks.forEach(skill => {
          const { id: skillId, lv: level } = skill;
          currentSkills[skillId] = (currentSkills[skillId] || 0) + level;
        });
      }
    });
    return currentSkills;
  }


  handleEditArmor = (index, newArmorId) => {
    const { bestArmorCombination } = this.state;
    // Ensure we have a valid armor piece (not editing the charm)
    if (!bestArmorCombination || index < 0 || index >= bestArmorCombination.length - 1) return;

    const updatedArmor = armors.find((a) => a.id === newArmorId);
    if (updatedArmor) {
      const newCombination = [...bestArmorCombination];
      newCombination[index] = updatedArmor;

      // Recalculate current skills based on the new combination
      const updatedCurrentSkills = this.calculateCurrentSkills(newCombination);

      this.setState({
        bestArmorCombination: newCombination,
        bestCurrentSkills: updatedCurrentSkills
      });
    }
  };

  handleRankLimitChange = (event) => {
    this.setState({ armorRankLimit: parseInt(event.target.value, 10) });
  };

  handleSaveImage = async () => {
    if (!this.armorListRef.current || !this.currentSkillsRef.current) {
      return; // Exit if refs are not yet attached
    }

    const armorListElement = this.armorListRef.current;
    const currentSkillsElement = this.currentSkillsRef.current;

    try {
      const armorListCanvas = await html2canvas(armorListElement, { backgroundColor: null }); // Make background transparent
      const currentSkillsCanvas = await html2canvas(currentSkillsElement, { backgroundColor: null }); // Make background transparent

      // Create a single canvas to merge both with black background
      const combinedCanvas = document.createElement('canvas');
      const combinedContext = combinedCanvas.getContext('2d');

      // Padding for black background
      const padding = 20;
      const spacing = 20;

      // Calculate combined canvas dimensions
      const totalHeight = armorListCanvas.height + currentSkillsCanvas.height + spacing + 2 * padding;
      const maxWidth = Math.max(armorListCanvas.width, currentSkillsCanvas.width) + 2 * padding;
      combinedCanvas.width = maxWidth;
      combinedCanvas.height = totalHeight;

      // Fill background with black
      combinedContext.fillStyle = 'black';
      combinedContext.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

      // Draw armorListCanvas and currentSkillsCanvas on top of black background
      combinedContext.drawImage(armorListCanvas, padding, padding);
      combinedContext.drawImage(currentSkillsCanvas, padding, armorListCanvas.height + spacing + padding);


      const dataURL = combinedCanvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = dataURL;
      downloadLink.download = 'armor_skills_setup.png'; // Filename for download
      document.body.appendChild(downloadLink); // Required for Firefox to work correctly
      downloadLink.click();
      document.body.removeChild(downloadLink); // Clean up the appended link
    } catch (error) {
      console.error("Error capturing image:", error);
      alert("Failed to save image. Please check the console for details.");
    }
  };


  render() {
    const {
      bestArmorCombination,
      bestFitness,
      searchIterations,
      isLoading,
      armorRankLimit
    } = this.state;
    const rankOptions = [];
    for (let lvl = 1; lvl <= 8; lvl++) {
      rankOptions.push(
        <option key={lvl} value={lvl}>
          {lvl}
        </option>
      );
    }
    return (
      <div style={styles.appContainer}>
        <h1 style={styles.title}>魔物獵人荒野 - 配裝器</h1>
        <div style={styles.controlsContainer}>
          <SkillSelector onConfirm={this.handleSkillConfirm} />
          <div style={styles.inputGroup}>
            <div style={styles.inputLabel}>搜索次數:</div>
            <div style={styles.sliderContainer}>
              <input
                type="range"
                id="searchIterations"
                min="1"
                max="10"
                value={searchIterations}
                onChange={this.handleSliderChange}
                style={styles.slider}
              />
              <span style={styles.sliderValue}>{searchIterations}</span>
            </div>
          </div>
          <div style={styles.inputGroup}>
            <div style={styles.inputLabel}>裝備最高等級</div>
            <select
              style={styles.select}
              value={armorRankLimit} // Use armorRankLimit from state
              onChange={this.handleRankLimitChange} // Add onChange handler
            >
              {rankOptions}
            </select>
          </div>
          <button
            style={styles.buildButton}
            onClick={this.handleBuild}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Build"}
          </button>
          {bestArmorCombination && ( // Conditionally render Save button
            <button
              style={styles.saveButton}
              onClick={this.handleSaveImage}
              disabled={isLoading}
            >
              Save
            </button>
          )}
        </div>
        {bestArmorCombination && (
          <div style={styles.resultContainer}>
            <h2 style={styles.resultTitle}>
              推薦裝備組合{" "}
              <span style={styles.fitness}>(Fitness: {bestFitness})</span>
            </h2>
            <div style={styles.armorList} ref={this.armorListRef}> {/* Attach ref here */}
              {Array.isArray(bestArmorCombination) ? (
                bestArmorCombination.map((piece, index) => {
                  if (!piece) return null;
                  // Assuming the last piece is a charm which is not editable
                  if (index === bestArmorCombination.length - 1) {
                    return (
                      <div style={styles.card} key={index}>
                        <CharmDetail charmId={piece.id} />
                      </div>
                    );
                  } else {
                    return (
                      <div style={styles.card} key={index}>
                        <ArmorDetail
                          armorId={piece.id}
                          index={index}
                          onEditArmor={this.handleEditArmor}
                        />
                      </div>
                    );
                  }
                })
              ) : (
                <div>Invalid armor combination result.</div>
              )}
            </div>
            {this.renderCurrentSkills()}
          </div>
        )}
      </div>
    );
  }
}

// Define style variables for consistency
const DARK_BACKGROUND = "#2c2c2c";
const MID_BACKGROUND = "#3a3a3a";
const LIGHT_TEXT = "#d8c7a1";
const WHITE_TEXT = '#fff';
const BUTTON_BACKGROUND = "#52452f";
const SAVE_BACKGROUND = "#918877";
const BORDER_COLOR = "#555";
const INPUT_GREY_BACKGROUND = '#3a3a3a';

const styles = {
  appContainer: {
    backgroundColor: DARK_BACKGROUND,
    color: LIGHT_TEXT,
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
    boxSizing: 'border-box',
  },
  inputGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: "10px",
    backgroundColor: INPUT_GREY_BACKGROUND,
    padding: '10px',
    borderRadius: '5px',
    boxSizing: 'border-box',
  },
  inputLabel: {
    marginRight: "10px",
    color: WHITE_TEXT,
  },
  sliderContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  slider: {
    width: "100%",
    cursor: "pointer",
    flex: 1,
  },
  sliderValue: {
    color: WHITE_TEXT,
    marginLeft: '5px',
    minWidth: '25px',
    textAlign: 'center',
  },
  buildButton: {
    backgroundColor: BUTTON_BACKGROUND,
    color: WHITE_TEXT,
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    marginTop: "16px",
    width: "100%",
    maxWidth: "600px",
    transition: "background-color 0.3s ease",
  },
  saveButton: {
    backgroundColor: SAVE_BACKGROUND,
    color: WHITE_TEXT,
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    marginTop: "16px",
    width: "100%",
    maxWidth: "600px",
    transition: "background-color 0.3s ease",
  },
  resultContainer: {
    marginTop: "25px",
    backgroundColor: MID_BACKGROUND,
    border: `1px solid ${BORDER_COLOR}`,
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
    color: WHITE_TEXT,
  },
  armorList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "20px",
  },
  card: {
    backgroundColor: DARK_BACKGROUND,
    border: `1px solid ${BORDER_COLOR}`,
    borderRadius: "6px",
    padding: "8px",
  },
  currentSkillsContainer: {
    backgroundColor: DARK_BACKGROUND,
    border: `1px solid ${BORDER_COLOR}`,
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
  select: {
    width: "150px", // Wider width for select box
    backgroundColor: DARK_BACKGROUND,
    color: LIGHT_TEXT,
    padding: '8px',
    borderRadius: '5px',
    border: `1px solid ${BORDER_COLOR}`, // Optional: Add border for better visibility
  }
};

export default App;