// app/tabs/history.tsx
// This screen displays all previously saved diary entries in a scrollable list
// with the most recent entry at the top.
// Each entry can be edited or deleted directly from the list.
// The screen also provides a CSV export feature so the user can share
// their data with a healthcare professional or keep a personal backup.
// The export uses expo-sharing to present the system share sheet,
// which lets the user send the file however they choose.

import Ionicons from "@expo/vector-icons/Ionicons";
import { File, Paths } from "expo-file-system";
import * as SQLite from "expo-sqlite";
import * as Sharing from "expo-sharing";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type SymptomKey =
  | "hotFlushes"
  | "brainFog"
  | "moodSwings"
  | "fatigue"
  | "jointPain"
  | "headache"
  | "anxiety"
  | "heartburn";

const symptomKeys: SymptomKey[] = [
  "hotFlushes",
  "brainFog",
  "moodSwings",
  "fatigue",
  "jointPain",
  "headache",
  "anxiety",
  "heartburn",
];

type FoodTriggerKey = "spicy" | "alcohol" | "caffeine" | "sugar";
const foodTriggerKeys: FoodTriggerKey[] = [
  "spicy",
  "alcohol",
  "caffeine",
  "sugar",
];

interface DiaryEntryStored {
  id: number;
  date: string;
  mood: string;
  sleep: string;
  exercise: string;
  bleeding: number;
  waterIntake: number;
  symptomsJSON: string;
  foodTriggersJSON: string;
  notes: string;
}

export default function HistoryScreen() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [entries, setEntries] = useState<DiaryEntryStored[]>([]);
  const [editingEntry, setEditingEntry] = useState<DiaryEntryStored | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  // Edit form states
  const [mood, setMood] = useState<string>("");
  const [sleep, setSleep] = useState<"good" | "bad" | "restless">("good");
  const [exercise, setExercise] = useState<"none" | "light" | "active">("none");
  const [bleeding, setBleeding] = useState<boolean>(false);
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [symptoms, setSymptoms] = useState<Record<SymptomKey, boolean>>(
    symptomKeys.reduce(
      (acc, key) => {
        acc[key] = false;
        return acc;
      },
      {} as Record<SymptomKey, boolean>
    )
  );
  const [foodTriggers, setFoodTriggers] = useState<
    Record<FoodTriggerKey, boolean>
  >(
    foodTriggerKeys.reduce(
      (acc, key) => {
        acc[key] = false;
        return acc;
      },
      {} as Record<FoodTriggerKey, boolean>
    )
  );
  const [notes, setNotes] = useState<string>("");

  // Open the database and load entries when the screen first mounts.
  // The CREATE TABLE statement runs every time but only creates the table
  // if it does not already exist, so it is safe to include on every launch.
  useEffect(() => {
    (async () => {
      const database = await SQLite.openDatabaseAsync("thechange.db");
      setDb(database);

      await database.runAsync(
        `CREATE TABLE IF NOT EXISTS diary_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT UNIQUE,
          mood TEXT,
          sleep TEXT,
          bleeding INTEGER,
          waterIntake INTEGER DEFAULT 0,
          symptomsJSON TEXT,
          foodTriggersJSON TEXT,
          notes TEXT
        );`
      );

      loadEntries(database);
    })();
  }, []);

  // Fetches all entries ordered by date descending so the newest entry
  // appears at the top of the list.
  const loadEntries = async (database: SQLite.SQLiteDatabase) => {
    const rows = await database.getAllAsync<DiaryEntryStored>(
      `SELECT * FROM diary_entries ORDER BY date DESC;`
    );
    setEntries(rows);
  };

  // Populates the edit modal form with the values from the tapped entry
  // so the user can see their existing data and change only what they need to.
  const openEditModal = (entry: DiaryEntryStored) => {
    setEditingEntry(entry);
    setMood(entry.mood || "");
    setSleep((entry.sleep as "good" | "bad" | "restless") || "good");
    setExercise((entry.exercise as "none" | "light" | "active") || "none");
    setBleeding(entry.bleeding === 1);
    setWaterIntake(entry.waterIntake || 0);

    try {
      const parsedSymptoms = JSON.parse(entry.symptomsJSON || "{}");
      setSymptoms({ ...symptoms, ...parsedSymptoms });
    } catch {
      setSymptoms(
        symptomKeys.reduce(
          (acc, key) => {
            acc[key] = false;
            return acc;
          },
          {} as Record<SymptomKey, boolean>
        )
      );
    }

    try {
      const parsedTriggers = JSON.parse(entry.foodTriggersJSON || "{}");
      setFoodTriggers({ ...foodTriggers, ...parsedTriggers });
    } catch {
      setFoodTriggers(
        foodTriggerKeys.reduce(
          (acc, key) => {
            acc[key] = false;
            return acc;
          },
          {} as Record<FoodTriggerKey, boolean>
        )
      );
    }

    setNotes(entry.notes || "");
    setModalVisible(true);
  };

  // Writes the updated form values back to the database row identified by
  // the entry id, then refreshes the list so the change is immediately visible.
  const saveEdit = async () => {
    if (!db || !editingEntry) return;

    try {
      await db.runAsync(
        `UPDATE diary_entries
         SET mood = ?, sleep = ?, exercise = ?, bleeding = ?, waterIntake = ?,
             symptomsJSON = ?, foodTriggersJSON = ?, notes = ?
         WHERE id = ?;`,
        [
          mood,
          sleep,
          exercise,
          bleeding ? 1 : 0,
          waterIntake,
          JSON.stringify(symptoms),
          JSON.stringify(foodTriggers),
          notes,
          editingEntry.id,
        ]
      );

      setModalVisible(false);
      await loadEntries(db);
      Alert.alert("✅ Updated", "Entry has been updated successfully.");
    } catch (err) {
      console.error(err);
      Alert.alert("❌ Error", "Could not update entry.");
    }
  };

  // Asks the user to confirm before permanently removing an entry.
  // A confirmation step is required here because the action cannot be undone.
  const deleteEntry = async (id: number) => {
    if (!db) return;

    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this entry? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await db.runAsync(`DELETE FROM diary_entries WHERE id = ?;`, [
                id,
              ]);
              Alert.alert("🗑️ Deleted", "Entry has been removed.");
              loadEntries(db);
            } catch (err) {
              console.error(err);
              Alert.alert("❌ Error", "Could not delete entry.");
            }
          },
        },
      ]
    );
  };

  // Builds a CSV string from all diary entries and saves it as a file
  // in the app's documents directory using the expo-file-system File API.
  // It then calls expo-sharing to open the system share sheet so the user
  // can send the file by email, AirDrop, or any other installed app.
  // Notes are wrapped in quotes and internal quotes are escaped to ensure
  // the CSV is valid when opened in spreadsheet software.
  const exportToCSV = async () => {
    if (!db) return;

    try {
      const rows = await db.getAllAsync<DiaryEntryStored>(
        `SELECT * FROM diary_entries ORDER BY date ASC;`
      );

      if (rows.length === 0) {
        Alert.alert("No Data", "There are no diary entries to export.");
        return;
      }

      // CSV Header
      let csv = "Date,Mood,Sleep,Exercise,Bleeding,Water Intake (glasses),";
      csv += "Hot Flushes,Brain Fog,Mood Swings,Fatigue,Joint Pain,Headache,Anxiety,Heartburn,";
      csv += "Spicy Food,Alcohol,Caffeine,Sugar,Notes\n";

      // CSV Rows
      rows.forEach((entry) => {
        const symptomsObj = JSON.parse(entry.symptomsJSON || "{}");
        const triggersObj = JSON.parse(entry.foodTriggersJSON || "{}");

        csv += `${entry.date},`;
        csv += `${entry.mood || ""},`;
        csv += `${entry.sleep || ""},`;
        csv += `${entry.exercise || ""},`;
        csv += `${entry.bleeding === 1 ? "Yes" : "No"},`;
        csv += `${entry.waterIntake || 0},`;

        // Symptoms
        symptomKeys.forEach((key) => {
          csv += `${symptomsObj[key] ? "Yes" : "No"},`;
        });

        // Food triggers
        foodTriggerKeys.forEach((key) => {
          csv += `${triggersObj[key] ? "Yes" : "No"},`;
        });

        // Notes (escape commas and quotes)
        const notesEscaped = (entry.notes || "")
          .replace(/"/g, '""')
          .replace(/\n/g, " ");
        csv += `"${notesEscaped}"\n`;
      });

      // Save to file using new File API
      const file = new File(Paths.document, `diary_export_${Date.now()}.csv`);
      await file.write(csv);

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export Diary Data",
          UTI: "public.comma-separated-values-text",
        });
      } else {
        Alert.alert(
          "Export Complete",
          `File saved to: ${file.uri}\n\nYou can find it in your app's documents folder.`
        );
      }
    } catch (err) {
      console.error("Export error:", err);
      Alert.alert("❌ Error", `Could not export data: ${err}`);
    }
  };

  // Renders a single diary entry card in the FlatList.
  // symptomsJSON and foodTriggersJSON are parsed here at render time
  // rather than stored pre-parsed so that the raw data in the database
  // stays as simple strings and is easier to export.
  const renderEntry = ({ item }: { item: DiaryEntryStored }) => {
    const symptomsObj = JSON.parse(item.symptomsJSON || "{}");
    const triggersObj = JSON.parse(item.foodTriggersJSON || "{}");

    const activeSymptoms = symptomKeys.filter((key) => symptomsObj[key]);
    const activeTriggers = foodTriggerKeys.filter((key) => triggersObj[key]);

    return (
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryDate}>
            {new Date(item.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
          <View style={styles.entryActions}>
            <TouchableOpacity onPress={() => openEditModal(item)}>
              <Ionicons name="create-outline" size={24} color="#D6765A" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteEntry(item.id)}>
              <Ionicons
                name="trash-outline"
                size={24}
                color="#999"
                style={{ marginLeft: 12 }}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.entryRow}>
          <Text style={styles.entryLabel}>Mood:</Text>
          <Text style={styles.entryValue}>{item.mood || "—"}</Text>
        </View>

        <View style={styles.entryRow}>
          <Text style={styles.entryLabel}>Sleep:</Text>
          <Text style={styles.entryValue}>{item.sleep || "—"}</Text>
        </View>

        <View style={styles.entryRow}>
          <Text style={styles.entryLabel}>Exercise:</Text>
          <Text style={styles.entryValue}>{item.exercise || "—"}</Text>
        </View>

        <View style={styles.entryRow}>
          <Text style={styles.entryLabel}>Bleeding:</Text>
          <Text style={styles.entryValue}>
            {item.bleeding === 1 ? "Yes" : "No"}
          </Text>
        </View>

        <View style={styles.entryRow}>
          <Text style={styles.entryLabel}>Water:</Text>
          <Text style={styles.entryValue}>
            {item.waterIntake || 0} glasses 💧
          </Text>
        </View>

        {activeSymptoms.length > 0 && (
          <View style={styles.entryRow}>
            <Text style={styles.entryLabel}>Symptoms:</Text>
            <Text style={styles.entryValue}>
              {activeSymptoms.map(prettySymptom).join(", ")}
            </Text>
          </View>
        )}

        {activeTriggers.length > 0 && (
          <View style={styles.entryRow}>
            <Text style={styles.entryLabel}>Triggers:</Text>
            <Text style={styles.entryValue}>
              {activeTriggers.map(prettyTrigger).join(", ")}
            </Text>
          </View>
        )}

        {item.notes && (
          <View style={styles.entryRow}>
            <Text style={styles.entryLabel}>Notes:</Text>
            <Text style={styles.entryValue}>{item.notes}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>📖 Diary History</Text>
        <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.exportButtonText}>Export CSV</Text>
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No diary entries yet</Text>
          <Text style={styles.emptySubtext}>
            Start logging your daily experiences!
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderEntry}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={28} color="#5C4B51" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Edit Entry - {editingEntry?.date}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Mood */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>😊 Mood</Text>
            <View style={styles.pillRow}>
              {moodOptions.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[
                    styles.moodPill,
                    mood === m.value && styles.moodPillSelected,
                  ]}
                  onPress={() => setMood(m.value)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sleep */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>😴 Sleep</Text>
            <View style={styles.pillRow}>
              {(["good", "bad", "restless"] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pill, sleep === opt && styles.pillSelected]}
                  onPress={() => setSleep(opt)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      sleep === opt && styles.pillTextSelected,
                    ]}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exercise */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🏃‍♀️ Exercise</Text>
            <View style={styles.pillRow}>
              {(["none", "light", "active"] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.pill, exercise === opt && styles.pillSelected]}
                  onPress={() => setExercise(opt)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      exercise === opt && styles.pillTextSelected,
                    ]}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bleeding */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🩸 Period</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Bleeding today?</Text>
              <Switch
                value={bleeding}
                onValueChange={setBleeding}
                trackColor={{ false: "#E0E0E0", true: "#D6765A" }}
                thumbColor={bleeding ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Water Intake */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>💧 Water Intake</Text>
            <View style={styles.waterControls}>
              <TouchableOpacity
                style={styles.waterButton}
                onPress={() => setWaterIntake(Math.max(0, waterIntake - 1))}
              >
                <Text style={styles.waterButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.waterCount}>{waterIntake} glasses</Text>
              <TouchableOpacity
                style={styles.waterButton}
                onPress={() => setWaterIntake(Math.min(20, waterIntake + 1))}
              >
                <Text style={styles.waterButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Symptoms */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🔥 Symptoms</Text>
            {symptomKeys.map((key) => (
              <View key={key} style={styles.row}>
                <Switch
                  value={symptoms[key]}
                  onValueChange={(v) => setSymptoms({ ...symptoms, [key]: v })}
                  trackColor={{ false: "#E0E0E0", true: "#D6765A" }}
                  thumbColor={symptoms[key] ? "#fff" : "#f4f3f4"}
                />
                <Text style={styles.checkboxLabel}>{prettySymptom(key)}</Text>
              </View>
            ))}
          </View>

          {/* Food Triggers */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🍽️ Food Triggers</Text>
            {foodTriggerKeys.map((key) => (
              <View key={key} style={styles.row}>
                <Switch
                  value={foodTriggers[key]}
                  onValueChange={(v) =>
                    setFoodTriggers({ ...foodTriggers, [key]: v })
                  }
                  trackColor={{ false: "#E0E0E0", true: "#D6765A" }}
                  thumbColor={foodTriggers[key] ? "#fff" : "#f4f3f4"}
                />
                <Text style={styles.checkboxLabel}>{prettyTrigger(key)}</Text>
              </View>
            ))}
          </View>

          {/* Notes */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>📝 Notes</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Any extra thoughts?"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
            <Text style={styles.saveText}>💾 Save Changes</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

// These helper functions and the moodOptions array are defined outside the
// component so they are only created once rather than on every render.
const moodOptions = [
  { emoji: "😢", value: "sad" },
  { emoji: "😐", value: "neutral" },
  { emoji: "🙂", value: "calm" },
  { emoji: "😄", value: "happy" },
  { emoji: "😍", value: "joyful" },
];

function prettySymptom(key: SymptomKey): string {
  const mapping: Record<SymptomKey, string> = {
    hotFlushes: "Hot Flushes",
    brainFog: "Brain Fog",
    moodSwings: "Mood Swings",
    fatigue: "Fatigue",
    jointPain: "Joint Pain",
    headache: "Headache",
    anxiety: "Anxiety",
    heartburn: "Heartburn",
  };
  return mapping[key];
}

function prettyTrigger(key: FoodTriggerKey): string {
  const mapping: Record<FoodTriggerKey, string> = {
    spicy: "Spicy Food",
    alcohol: "Alcohol",
    caffeine: "Caffeine",
    sugar: "Sugar",
  };
  return mapping[key];
}

// Styles for the history screen, edit modal, and individual entry cards.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdf6f9",
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    color: "#5C4B51",
    marginBottom: 12,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D6765A",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  exportButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#5C4B51",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
  listContainer: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  entryDate: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5C4B51",
  },
  entryActions: {
    flexDirection: "row",
  },
  entryRow: {
    flexDirection: "row",
    marginVertical: 4,
  },
  entryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5C4B51",
    width: 80,
  },
  entryValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fdf6f9",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5C4B51",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#5C4B51",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  label: {
    fontSize: 16,
    color: "#5C4B51",
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  multiline: {
    height: 100,
    textAlignVertical: "top",
  },
  pillRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#ececec",
  },
  pillSelected: {
    backgroundColor: "#D6765A",
  },
  pillText: {
    fontSize: 14,
    color: "#333",
  },
  pillTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  moodPill: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  moodPillSelected: {
    backgroundColor: "#FFE8E8",
    borderColor: "#D6765A",
  },
  moodEmoji: {
    fontSize: 28,
  },
  waterControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 8,
  },
  waterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D6765A",
    justifyContent: "center",
    alignItems: "center",
  },
  waterButtonText: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "600",
  },
  waterCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5C4B51",
    minWidth: 100,
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: "#D6765A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 40,
    marginTop: 20,
  },
  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
