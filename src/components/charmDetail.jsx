import React from "react";
import { charms } from "../data/data";
import skillDatas from "../data/cn_skillDatas.json";
import SkillItem from "./skillItem";

class CharmDetail extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            charm: null
        };
    }

    componentDidMount() {
        this.loadCharm();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.charmId !== this.props.charmId) {
            this.loadCharm();
        }
    }

    loadCharm() {
        const charmId = this.props.charmId;
        const charm = charms.find(item => item.id === charmId);
        this.setState({ charm });
    }

    findSkillById(skillId) {
        return skillDatas.find(skill => skill.id === skillId);
    }

    render() {
        const { charm } = this.state;
        if (!charm) {
            return (
                <div style={styles.armorCard}>
                    <div style={styles.header}>
                        <h2 style={styles.armorName}>空護石</h2>
                    </div>
                </div>
            );
        }

        return (
            <div style={styles.armorCard}>
                <div style={styles.header}>
                    <h2 style={styles.armorName}>{charm.n}</h2>
                </div>
                <p style={styles.armorType}>護石</p>
                <div style={styles.skills}>
                    <strong>技能:</strong>
                    {charm.sks && charm.sks.length > 0 ? (
                        <ul style={styles.skillList}>
                            {charm.sks.map(sk => {
                                const skillData = this.findSkillById(sk.id);
                                if (!skillData) return null;
                                return (
                                    <SkillItem
                                        key={sk.id}
                                        skillData={skillData}
                                        level={sk.lv}
                                    />
                                );
                            })}
                        </ul>
                    ) : (
                        <p>無技能</p>
                    )}
                </div>
            </div>
        );
    }
}

const styles = {
    armorCard: {
        border: "1px solid #555",
        borderRadius: "8px",
        padding: "16px",
        margin: "0",
        backgroundColor: "#3a3a3a",
        color: "#d8c7a1",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        position: "relative",
        width: "100%",
        boxSizing: "border-box",
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    armorName: {
        margin: "0",
        fontSize: "1.3rem",
        color: "#fff",
    },
    toggleButton: {
        cursor: "pointer",
        fontSize: "1rem",
        backgroundColor: "#52452f",
        color: "#fff",
        padding: "2px 6px",
        borderRadius: "4px",
        border: "none",
    },
    armorType: {
        margin: "8px 0",
        color: "#d8c7a1",
        fontWeight: "bold",
    },
    stats: {
        fontSize: "0.9rem",
        lineHeight: "1.4",
        marginBottom: "12px",
        border: "1px dashed #555",
        padding: "8px",
        borderRadius: "4px",
        backgroundColor: "#444",
        color: "#d8c7a1",
    },
    skills: {
        fontSize: "0.9rem",
    },
    skillTitle: { // Style for the "技能:" text
        color: "#fff", // White color
        marginRight: "8px", // Add some spacing
    },
    noSkillText: { // Style for "無技能"
        color: "#bbb", // Light gray
    },
    skillList: {
        listStyleType: "none",
        padding: 0,
        margin: "8px 0 0 0",
    },
};

export default CharmDetail;
