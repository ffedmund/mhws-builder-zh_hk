import React from "react";
import skillDatas from "../data/cn_skillDatas.json";
import { groups, series } from "../data/data";

class SkillSelector extends React.Component {
    state = {
        // Controls whether the search panel is expanded
        expanded: false,
        // Which tab is active: "a" (armor) or "w" (weapon) or "s" (set)
        activeTab: "a",
        // Search query for filtering the skill list
        searchQuery: "",
        // A map of skillId -> chosen level (0..max)
        selectedLevels: {},
        // Store precomputed IDs here
        allIds: [],
    };

    componentDidMount() {
        // Precompute allIds from groups and series
        const allIds = [...groups, ...series].flatMap((g) =>
            g.s.flatMap((s) => String(s.ids))
        );
        this.setState({ allIds });
    }

    // Toggle the panel open/close
    toggleExpand = () =>
        this.setState((prev) => ({ expanded: !prev.expanded }));

    // Switch between tabs and clear search
    handleTabChange = (tab) => this.setState({ activeTab: tab, searchQuery: "" });

    // Update the search query
    handleSearchChange = (e) => this.setState({ searchQuery: e.target.value });

    // Reset all selected levels
    handleReset = () => this.setState({ selectedLevels: {} });

    // Confirm selection: pass chosen skills to the parent if provided
    handleConfirm = () => {
        const chosen = Object.entries(this.state.selectedLevels)
            .filter(([, lvl]) => lvl > 0)
            .map(([skillId, lvl]) => ({ skillId, level: lvl }));
        if (this.props.onConfirm) {
            this.props.onConfirm(chosen);
        }
    };

    // Confirm & collapse panel
    handleConfirmAndCollapse = () => {
        this.handleConfirm();
        this.toggleExpand();
    };

    // Update level for a given skill
    handleLevelChange = (skillId, newLevel) => {
        this.setState((prev) => {
            const updated = { ...prev.selectedLevels };
            newLevel === 0 ? delete updated[skillId] : (updated[skillId] = newLevel);
            return { selectedLevels: updated };
        });
    };

    // Toggle set skill selection and handle related skills
    handleSetSkillToggle = (skillId) => {
        const skill = skillDatas.find((skill) => skill.id === skillId);
        if (!skill) {
            console.warn(`Skill with id ${skillId} not found`);
            return;
        }

        const { n: skillName } = skill;
        // console.log("Toggling skill:", skillName);

        // Check if the skill name ends with Unicode "Ⅰ" or "Ⅱ"
        const isCaseII = skillName.endsWith("Ⅱ"); // U+2161
        const isCaseI = !isCaseII && skillName.endsWith("Ⅰ"); // U+2160

        this.setState((prevState) => {
            const updated = { ...prevState.selectedLevels };

            if (updated[skillId]) {
                // Deselect if already selected
                delete updated[skillId];
            } else {
                // Select the skill with 99 as a flag
                updated[skillId] = 99;
                const numericId = parseInt(skillId, 10);
                if (!isNaN(numericId)) {
                    // console.log("Enable skill:", skillId, isCaseI, isCaseII);
                    if (isCaseII && updated[String(numericId - 1)]) {
                        delete updated[String(numericId - 1)];
                        console.log("Disable skill:", String(numericId - 1));
                    } else if (isCaseI && updated[String(numericId + 1)]) {
                        delete updated[String(numericId + 1)];
                        console.log("Disable skill:", String(numericId + 1));
                    }
                } else {
                    console.warn(
                        `Skill id ${skillId} is not numeric, cannot toggle related skills`
                    );
                }
            }
            return { selectedLevels: updated };
        });
    };

    // Render the list of skills based on the active tab and search query
    renderSkillList = () => {
        const { activeTab, searchQuery, selectedLevels, allIds } = this.state;
        let filteredSkills = [];

        if (activeTab === "s") {
            filteredSkills = skillDatas.filter((skill) =>
                allIds.includes(skill.id)
            );
        } else {
            filteredSkills = skillDatas
                .filter(
                    (skill) => skill.m === activeTab && !allIds.includes(skill.id)
                )
                .sort((a, b) => b.max - a.max);
        }

        if (searchQuery.trim()) {
            filteredSkills = filteredSkills.filter((skill) =>
                skill.n.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Render differently for set skills and others
        if (activeTab === "s") {
            return (
                <ul style={styles.skillList}>
                    {filteredSkills.map((skill) => {
                        const isSelected = !!selectedLevels[skill.id];
                        return (
                            <li
                                key={skill.id}
                                onClick={() => this.handleSetSkillToggle(skill.id)}
                                style={{
                                    ...styles.skillRow,
                                    padding: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <div style={styles.skillName}>{skill.n}</div>
                                <div
                                    style={{
                                        ...styles.toggleSwitch,
                                        backgroundColor: isSelected
                                            ? styles.toggleSwitchActiveColor
                                            : styles.toggleSwitchInactiveColor,
                                    }}
                                >
                                    <div
                                        style={{
                                            ...styles.toggleKnob,
                                            left: isSelected ? "20px" : "1px",
                                        }}
                                    ></div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            );
        }

        // For non-set skills: use a dropdown to select levels.
        return (
            <ul style={styles.skillList}>
                {filteredSkills.map((skill) => {
                    const currentLevel = selectedLevels[skill.id] || 0;
                    const levelOptions = Array.from(
                        { length: skill.max + 1 },
                        (_, lvl) => (
                            <option key={lvl} value={lvl}>
                                {lvl}
                            </option>
                        )
                    );
                    return (
                        <li key={skill.id} style={styles.skillRow}>
                            <div style={styles.skillName}>{skill.n}</div>
                            <div style={styles.skillLevel}>
                                <select
                                    style={styles.select}
                                    value={currentLevel}
                                    onChange={(e) =>
                                        this.handleLevelChange(
                                            skill.id,
                                            parseInt(e.target.value, 10)
                                        )
                                    }
                                >
                                    {levelOptions}
                                </select>
                            </div>
                        </li>
                    );
                })}
            </ul>
        );
    };

    render() {
        const { expanded, searchQuery, selectedLevels, allIds, activeTab } =
            this.state;

        // Create a comma-separated list of selected skill texts
        const selectedSkillsText = Object.entries(selectedLevels)
            .filter(([, lvl]) => lvl > 0)
            .map(([id, lvl]) => {
                const skill = skillDatas.find((s) => s.id === id);
                return skill
                    ? `${skill.n}${allIds.includes(id) ? "" : `(Lv.${lvl})`}`
                    : `SkillID ${id}${lvl ? `(Lv.${lvl})` : ""}`;
            });

        return (
            <div style={styles.container}>
                <div style={styles.title}>發動技能</div>

                {/* Collapsed view */}
                {!expanded && (
                    <div style={styles.collapsedDisplay}>
                        <ul style={styles.selectedSkillList}>
                            {selectedSkillsText.length > 0 ? (
                                selectedSkillsText.map((skillText, index) => (
                                    <li key={index} style={styles.selectedSkillListItem}>
                                        {skillText}
                                    </li>
                                ))
                            ) : (
                                <li style={styles.selectedSkillListItem}>
                                    請選擇技能...
                                </li>
                            )}
                        </ul>
                        <div style={styles.collapsedButtons}>
                            <button style={styles.resetButton} onClick={this.handleReset}>
                                重置
                            </button>
                            <div style={styles.plusSign} onClick={this.toggleExpand}>
                                +
                            </div>
                        </div>
                    </div>
                )}

                {/* Expanded panel */}
                {expanded && (
                    <div style={styles.panel}>
                        <div style={styles.instructions}>
                            請選擇要發動的技能或對應套索：
                            <br />
                            配装器將根據選擇的技能与等级，為你生成對應的配装。
                        </div>

                        {/* Tabs */}
                        <div style={styles.tabContainer}>
                            <div
                                style={{
                                    ...styles.tab,
                                    ...(activeTab === "a" ? styles.tabActive : {}),
                                }}
                                onClick={() => this.handleTabChange("a")}
                            >
                                裝備技能
                            </div>
                            {/*
                <div
                  style={{
                    ...styles.tab,
                    ...(activeTab === "w" ? styles.tabActive : {}),
                  }}
                  onClick={() => this.handleTabChange("w")}
                >
                  武器技能
                </div>
                */}
                            <div
                                style={{
                                    ...styles.tab,
                                    ...(activeTab === "s" ? styles.tabActive : {}),
                                }}
                                onClick={() => this.handleTabChange("s")}
                            >
                                套裝技能
                            </div>
                        </div>

                        {/* Search box */}
                        <div style={styles.searchBox}>
                            <input
                                style={styles.searchInput}
                                placeholder="搜索技能..."
                                value={searchQuery}
                                onChange={this.handleSearchChange}
                            />
                        </div>

                        {/* Skill list */}
                        <div style={styles.listContainer}>{this.renderSkillList()}</div>

                        {/* Confirm button */}
                        <div style={styles.confirmButtonContainer}>
                            <button
                                style={styles.button}
                                onClick={this.handleConfirmAndCollapse}
                            >
                                確認
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

// Inline styles (adapt as needed)
const styles = {
    container: {
        width: "100%", // Full width on small screens
        maxWidth: "600px", // Max width on larger screens
        backgroundColor: "#3a3a3a",
        color: "#d8c7a1",
        border: "1px solid #666",
        borderRadius: "6px",
        padding: "16px",
        fontFamily: "sans-serif",
        margin: "16px auto", // Center on larger screens
        boxSizing: "border-box", // Include padding and border in width
    },
    title: {
        fontSize: "1.2rem",
        fontWeight: "bold",
        marginBottom: "8px",
    },
    collapsedDisplay: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: "1px solid #555",
        borderRadius: "4px",
        padding: "8px",
        backgroundColor: "#2c2c2c",
    },
    selectedText: {
        flex: 1,
        marginRight: "8px",
        fontSize: "0.95rem",
        color: "#d8c7a1",
        whiteSpace: "nowrap",      // Prevent text wrapping
        overflow: "hidden",        // Hide overflow
        textOverflow: "ellipsis",  // Show ellipsis for overflow
    },
    selectedSkillList: { // Style for the ul
        listStyleType: 'none', // Remove bullet points
        padding: 0,
        margin: 0,
    },
    selectedSkillListItem: { // Style for each li
        marginBottom: '5px', // Add some spacing between list items
        fontSize: '0.9em', // Adjust font size if needed
    },
    collapsedButtons: {
        display: "flex",
        gap: "8px",
        alignItems: "center",
    },
    resetButton: {
        backgroundColor: "#5c5c5c",
        color: "#fff",
        border: "none",
        padding: "4px 8px",
        borderRadius: "4px",
        cursor: "pointer",
        whiteSpace: "nowrap", // Prevent button text wrapping
    },
    plusSign: {
        fontSize: "1.5rem",
        fontWeight: "bold",
        backgroundColor: "#52452f",
        color: "#fff",
        width: "24px",
        height: "24px",
        borderRadius: "4px",
        textAlign: "center",
        lineHeight: "24px",
        cursor: "pointer",
        border: "none", // Remove default button border
        padding: 0, // Remove default button padding
        display: 'flex', // Use flex to easily center content
        alignItems: 'center',
        justifyContent: 'center',
    },
    panel: {
        backgroundColor: "#2c2c2c",
        border: "1px solid #555",
        borderRadius: "4px",
        padding: "8px",
        marginTop: "8px",
    },
    instructions: {
        fontSize: "0.85rem",
        lineHeight: "1.4",
        backgroundColor: "#3a3a3a",
        padding: "8px",
        borderRadius: "4px",
        marginBottom: "8px",
    },
    tabContainer: {
        display: "flex",
        marginBottom: "8px",
    },
    tab: {
        flex: 1,
        padding: "8px",
        textAlign: "center",
        backgroundColor: "#444",
        marginRight: "4px",
        borderRadius: "4px",
        cursor: "pointer",
        border: "none", // Remove default button styles
        color: "#fff",  // Ensure text is visible
        transition: "background-color 0.2s", // Smooth transition

        '&:hover': {  // Hover effect
            backgroundColor: "#555",
        }
    },
    tabActive: {
        backgroundColor: "#52452f",
        border: "1px solid #aaa", // Keep border for active tab
    },
    searchBox: {
        marginBottom: "8px",
    },
    searchInput: {
        width: "100%",
        padding: "6px",
        border: "1px solid #555",
        borderRadius: "4px",
        backgroundColor: "#2c2c2c",
        color: "#d8c7a1",
        boxSizing: "border-box", // Include padding in width
    },
    listContainer: {
        height: "200px",
        overflowY: "auto",
        border: "1px solid #555",
        borderRadius: "4px",
        padding: "4px",
        backgroundColor: "#2c2c2c",
    },
    skillList: {
        listStyleType: "none",
        padding: 0,
        margin: 0,
    },
    skillRow: {
        display: "flex",
        alignItems: "center",
        padding: "6px",
        borderBottom: "1px solid #444",
    },
    skillName: {
        flex: 1,
        wordBreak: "break-word", // Wrap long skill names
    },
    skillLevel: {
        marginLeft: "8px",
    },
    select: {
        backgroundColor: "#3a3a3a",
        color: "#d8c7a1",
        border: "1px solid #555",
        borderRadius: "4px",
        padding: "2px 4px",
    },
    confirmButtonContainer: {
        marginTop: "8px",
        display: "flex",
        justifyContent: "center",
    },
    button: {
        backgroundColor: "#5c5c5c",
        color: "#fff",
        border: "none",
        padding: "6px 12px",
        borderRadius: "4px",
        cursor: "pointer",
    },
    // New toggle switch styles
    // Toggle switch styles (abstracted to match the dark theme)
    toggleSwitch: {
        width: "40px",
        height: "20px",
        borderRadius: "10px",
        position: "relative",
        cursor: "pointer",
        transition: "background-color 0.2s ease"
    },
    toggleSwitchActiveColor: "#52452f", // Active state color (matches active tab)
    toggleSwitchInactiveColor: "#444",   // Inactive state color (matches inactive tab)
    toggleKnob: {
        width: "18px",
        height: "18px",
        borderRadius: "50%",
        backgroundColor: "#d8c7a1", // Accent text color from your theme
        position: "absolute",
        top: "1px",
        left: "1px",
        transition: "left 0.2s ease"
    }
};

export default SkillSelector;


