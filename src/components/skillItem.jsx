import React from "react";

class SkillItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false
    };
  }

  toggleExpand = () => {
    this.setState(prevState => ({ expanded: !prevState.expanded }));
  };

  render() {
    const { skillData, level } = this.props;
    const { expanded } = this.state;

    return (
      <li style={styles.skillItem} onClick={this.toggleExpand}>
        <span style={level === skillData.max? styles.maxSkillHeader:styles.skillHeader}>
          {skillData.n} (Lv.{level})
        </span>
        {expanded && skillData.tl && skillData.tl[level] && (
          <div style={styles.skillDetail}>
            <p>效果: {skillData.tl[level]}</p>
          </div>
        )}
      </li>
    );
  }
}

const styles = {
  skillItem: {
    marginBottom: "8px",
    padding: "6px", // Reduced padding from 8px to 6px
    backgroundColor: "rgba(68, 68, 68, 0.8)", // Semi-transparent dark grey background
    border: "1px solid #555",
    borderRadius: "4px",
    cursor: "pointer"
  },
  skillHeader: {
    display: "block",
    fontWeight: "bold",
    color: "#fff",
    fontSize: "1rem",
    marginBottom: "4px",
  },
  maxSkillHeader: {
    display: "block",
    fontWeight: "bold",
    color: "#F28705",
    fontSize: "1rem",
    marginBottom: "4px",
  },
  skillDetail: {
    marginTop: "4px",
    fontSize: "0.9rem",
    color: "#fff"
  }
};

export default SkillItem;
