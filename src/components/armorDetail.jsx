import React from "react";
import { armors } from "../data/data";
import skillDatas from "../data/cn_skillDatas.json";
import SkillItem from "./skillItem";
import { translationMap } from "../data/translation";

class ArmorDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      armor: null,
      showStats: false,
    };
  }

  componentDidMount() {
    this.loadArmor();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.armorId !== this.props.armorId) {
      this.loadArmor();
    }
  }

  loadArmor() {
    const armorId = this.props.armorId;
    const armor = armors.find((item) => item.id === armorId);
    this.setState({ armor });
  }

  getArmorTypeName(typeCode) {
    const typeMap = {
      "1": "頭部",
      "2": "鎧甲",
      "3": "腕甲",
      "4": "腰甲",
      "5": "護腿",
    };
    return typeMap[typeCode] || "未知";
  }

  findSkillById(skillId) {
    return skillDatas.find((skill) => skill.id === skillId);
  }

  toggleStats = () => {
    this.setState((prevState) => ({ showStats: !prevState.showStats }));
  };

  // Function to format the slots
  renderSlots(slots) {
    if (!slots || slots.length === 0) {
      return "槽位: 無";
    }
    const slotString = slots.join("， ");
    return `槽位: (${slotString})`;
  }

  render() {
    const { armor, showStats } = this.state;
    if (!armor) {
      return <div>Armor not found for id: {this.props.armorId}</div>;
    }

    const armorType = this.getArmorTypeName(armor.t);
    const baseName = armor.n.replace(/α|β/g, "");
    const suffix = armor.n.match(/α|β/) ? armor.n.match(/α|β/)[0] : "";
    const translatedName = (translationMap[baseName] || baseName) + suffix;
    const imageUrl = `https://mhwilds.com/images/armour2/b${armor.t}-${armor.r}.png`;

    return (
      <div style={styles.armorCard}>
        <div style={styles.header}>
          <div style={styles.imageAndName}>
            <img src={imageUrl} alt={translatedName} style={styles.armorImage} />
            <h2 style={styles.armorName}>{translatedName}</h2>
          </div>
          <button style={styles.toggleButton} onClick={this.toggleStats} aria-expanded={showStats}>
            {showStats ? "Hide" : "?"}
          </button>
        </div>
        <p style={styles.armorType}>類型: {armorType}</p>
        <p style={styles.slots}>{this.renderSlots(armor.s)}</p>
        {showStats && (
          <div style={styles.stats}>
            <p>防御力 (DF): {armor.stats.df}</p>
            <p>火耐性 (F): {armor.stats.f}</p>
            <p>水耐性 (W): {armor.stats.w}</p>
            <p>雷耐性 (T): {armor.stats.t}</p>
            <p>冰耐性 (I): {armor.stats.i}</p>
            <p>龙耐性 (D): {armor.stats.d}</p>
          </div>
        )}
        <div style={styles.skills}>
          <strong style={styles.skillTitle}>技能:</strong> {/* Added skillTitle style */}
          {armor.sks && armor.sks.length > 0 ? (
            <ul style={styles.skillList}>
              {armor.sks.map((sk) => {
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
            <p style={styles.noSkillText}>無技能</p> // Added noSkillText Style
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
  armorImage: {
    width: "30px",       // Adjust as needed
    height: "30px",      // Adjust as needed
    marginRight: "10px", // Add some space between the image and the name
    objectFit: "contain",  // Prevent image distortion
    flexShrink: 0,     // Prevent the image from shrinking
  },
  imageAndName: {
    display: "flex",     // Use flexbox
    alignItems: "center", // Vertically center items
    flexGrow: 1,          // Allow this container to grow
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
  slots: {
    margin: "4px 0 8px 0", // Add some margin for spacing
    color: "#bbb",       // Use a slightly lighter text color
    fontSize: '0.9rem'
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

export default ArmorDetail;