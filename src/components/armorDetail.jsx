import React, { useState, useEffect } from "react";
import { armors } from "../data/data";
import skillDatas from "../data/cn_skillDatas.json";
import { translationMap } from "../data/translation";

// Helper to get armor type name
const getArmorTypeName = (typeCode) => {
  const typeMap = {
    "1": "頭部",
    "2": "鎧甲",
    "3": "腕甲",
    "4": "腰甲",
    "5": "護腿",
  };
  return typeMap[typeCode] || "未知";
};

// Helper to generate the translated name for an armor piece
const getTranslatedName = (armor) => {
  const baseName = armor.n.replace(/α|β/g, "");
  const suffixMatch = armor.n.match(/α|β/);
  const suffix = suffixMatch ? suffixMatch[0] : "";
  return (translationMap[baseName] || baseName) + suffix;
};

// Helper to find a skill by its id
const findSkillById = (skillId) => {
  return skillDatas.find((skill) => skill.id === skillId);
};

const ArmorDetail = ({
  armorId,
  decos,
  onEditArmor,
  index,
  onEditDeco,
  allDecos,
}) => {
  const [armor, setArmor] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedArmorId, setSelectedArmorId] = useState(armorId);

  // Load armor data when armorId changes
  useEffect(() => {
    const foundArmor = armors.find((item) => item.id === armorId);
    setArmor(foundArmor);
    setSelectedArmorId(armorId);
  }, [armorId]);

  if (!armor) {
    return <div>Armor not found for id: {armorId}</div>;
  }

  const translatedName = getTranslatedName(armor);
  const armorType = getArmorTypeName(armor.t);
  const imageUrl = `https://mhwilds.com/images/armour2/b${armor.t}-${armor.r}.png`;

  // Filter available armors for the same type for the edit dropdown
  const availableArmors = armors.filter((a) => a.t === armor.t);

  // Handler for edit select change (controlled component)
  const handleSelectChange = (event) => {
    const newArmorId = event.target.value;
    setSelectedArmorId(newArmorId);
    if (onEditArmor && typeof index !== "undefined") {
      onEditArmor(index, newArmorId);
    }
    setEditMode(false);
  };

  // Render slot information using available deco names if provided
  const renderEditingSlots = () => {
    const slotSizes = armor.s;
    if (!slotSizes || slotSizes.length === 0) return "槽位: 無";

    return (
      <div style={styles.slotsContainer}>
        槽位:
        {slotSizes.map((slotSize, slotIndex) => {
          const currentDeco = decos?.[slotIndex];
          const availableDecos = allDecos.filter(d => d.req <= slotSize && d.m === "a");

          return (
            <div key={slotIndex} style={styles.slot}>
              <select
                value={currentDeco?.id || ""}
                onChange={(e) =>
                  onEditDeco(index, slotIndex, e.target.value || null)
                }
                style={styles.slotSelect}
              >
                <option value="">【{slotSize}】</option>
                {availableDecos.map(deco => (
                  <option key={deco.id} value={deco.id}>
                    {deco.n}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSlots = (slots) => {
    if (!slots || slots.length === 0) {
      return "裝飾品槽: 無";
    }
    const slotsArray = slots.map((slot, i) =>
      decos && decos[i] != null ? `${decos[i].n}` : `[${slot}]`
    );
    return `裝飾品槽: ${slotsArray.join(", ")}`;
  };

  // Calculate armor skills and deco skills separately
  const armorSkillText =
    armor.sks && armor.sks.length > 0
      ? armor.sks
        .map((sk) => {
          const skillData = findSkillById(sk.id);
          return skillData ? `${skillData.n} (Lv.${sk.lv})` : null;
        })
        .filter(Boolean)
        .join(", ")
      : "無技能";

  const decoSkillText = Object.entries(
    decos && decos.length > 0
      ? decos.reduce((acc, deco) => {
        if (deco) {
          deco.sks.forEach((sk) => {
            const skillData = findSkillById(sk.id);
            if (skillData) {
              acc[skillData.n] = (acc[skillData.n] || 0) + sk.lv;
            }
          });
        }
        return acc;
      }, {})
      : {}
  ).map(([n, lv]) => `${n} (Lv.${lv})`).join(", ");


  return (
    <div style={styles.armorCard}>
      <div style={styles.header}>
        <div style={styles.imageAndName}>
          <img src={imageUrl} alt={translatedName} style={styles.armorImage} />
          {editMode ? (
            <div>
              <select
                value={selectedArmorId}
                onChange={handleSelectChange}
                style={styles.select}
              >
                {availableArmors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {getTranslatedName(a)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <h2 style={styles.armorName}>{translatedName}</h2>
          )}
        </div>
        <button
          style={styles.toggleButton}
          onClick={() => setShowStats(!showStats)}
          aria-expanded={showStats}
        >
          {showStats ? "Hide" : "?"}
        </button>
        {editMode ? (
          <button style={styles.editButton} onClick={() => setEditMode(false)}>
            返回
          </button>
        ) : (
          <button style={styles.editButton} onClick={() => setEditMode(true)}>
            編輯
          </button>
        )}
      </div>
      <p style={styles.slots}>{editMode ? renderEditingSlots(armor.s) : renderSlots(armor.s)}</p>
      {showStats && (
        <div style={styles.stats}>
          <p style={styles.armorType}>類型: {armorType}</p>
          <p>防御力 (DF): {armor.stats.df}</p>
          <p>火耐性 (F): {armor.stats.f}</p>
          <p>水耐性 (W): {armor.stats.w}</p>
          <p>雷耐性 (T): {armor.stats.t}</p>
          <p>冰耐性 (I): {armor.stats.i}</p>
          <p>龙耐性 (D): {armor.stats.d}</p>
        </div>
      )}
      <div style={styles.skills}>
        <strong style={styles.skillTitle}>技能: </strong>
        <span style={styles.skillText}>{armorSkillText}</span>
        {decoSkillText && (
          <span style={styles.decoSkillText}>, {decoSkillText}</span>
        )}
      </div>
    </div>
  );
};

const DARK_BACKGROUND = "#2c2c2c";
const BORDER_COLOR = "#555";
const LIGHT_TEXT = "#fff";

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
    width: "30px",
    height: "30px",
    marginRight: "10px",
    objectFit: "contain",
    flexShrink: 0,
  },
  imageAndName: {
    display: "flex",
    alignItems: "center",
    flexGrow: 1,
  },
  toggleButton: {
    cursor: "pointer",
    fontSize: "1rem",
    backgroundColor: "#52452f",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "4px",
    border: "none",
    marginRight: "8px",
  },
  editButton: {
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
    margin: "4px 0 8px 0",
    color: "#bbb",
    fontSize: "0.9rem",
  },
  skills: {
    fontSize: "0.9rem",
  },
  skillTitle: {
    marginRight: "8px",
  },
  skillText: {
    color: "#fff",
  },
  decoSkillText: {
    color: "#F28705",
  },
  select: {
    backgroundColor: DARK_BACKGROUND,
    padding: "8px",
    color: "#fff",
    borderRadius: "5px",
    border: `1px solid ${BORDER_COLOR}`,
  },
  slotsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    alignItems: 'center',
    margin: '4px 0 8px 0',
  },
  slot: {
    display: 'flex',
    alignItems: 'center',
  },
  slotSelect: {
    backgroundColor: DARK_BACKGROUND,
    color: LIGHT_TEXT,
    border: `1px solid ${BORDER_COLOR}`,
    borderRadius: '4px',
    padding: '4px',
    marginLeft: '4px',
    cursor: 'pointer',
  },
};

export default ArmorDetail;
