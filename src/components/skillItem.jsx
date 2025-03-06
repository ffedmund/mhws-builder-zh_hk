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
        <span style={styles.skillHeader}>
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
    padding: "4px",
    backgroundColor: "#372929",
    border: "1px solid #6B5C5C",
    borderRadius: "4px",
    cursor: "pointer"
  },
  skillHeader: {
    display: "block",
    fontWeight: "bold",
    color: "#DC6558"
  },
  skillDetail: {
    marginTop: "4px",
    fontSize: "0.85rem",
    color: "#fff"
  }
};

export default SkillItem;
