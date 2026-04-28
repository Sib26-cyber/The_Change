// app/tabs/insights.tsx
// This screen shows a monthly calendar with diary entries marked on it.
// Days that had bleeding recorded are marked with a red dot; all other logged
// days are marked with a pink dot. Tapping a date shows a summary of that
// day's entry, or offers to create a new entry if none exists.
// The screen also calculates and displays how many days have passed since
// the user's most recently recorded period day.

import Ionicons from "@expo/vector-icons/Ionicons";
import * as SQLite from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";

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

type StoredEntry = {
  date: string;
  mood: string;
  sleep: string;
  exercise: string;
  bleeding: number;
  symptomsJSON: string;
  foodTriggersJSON: string;
  notes: string;
};

export default function InsightsScreen() {
  const [entries, setEntries] = useState<Record<string, StoredEntry>>({});
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
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
      {} as Record<SymptomKey, boolean>,
    ),
  );
  const [foodTriggers, setFoodTriggers] = useState<
    Record<FoodTriggerKey, boolean>
  >(
    foodTriggerKeys.reduce(
      (acc, key) => {
        acc[key] = false;
        return acc;
      },
      {} as Record<FoodTriggerKey, boolean>,
    ),
  );
  const [notes, setNotes] = useState<string>("");

  // Load all entries when the screen mounts and build two data structures:
  // a map from date string to entry object for quick lookup when a day is tapped,
  // and a markedDates object that the Calendar component uses to style each date.
  useEffect(() => {
    (async () => {
      const database = await SQLite.openDatabaseAsync("thechange.db");
      setDb(database);
      const result = await database
        .getAllAsync<StoredEntry>(
          `SELECT * FROM diary_entries ORDER BY date ASC;`,
        )
        .catch((err) => {
          console.error("DB read error:", err);
          return [];
        });

      const map: Record<string, StoredEntry> = {};
      const marks: any = {};

      result.forEach((e) => {
        map[e.date] = e;
        // Bleeding days get a distinct red marker so the user can
        // see their cycle at a glance on the calendar.
        if (e.bleeding === 1) {
          marks[e.date] = {
            selected: true,
            selectedColor: "#FFE5E5",
            selectedTextColor: "#E74C3C",
            marked: true,
            dotColor: "#E74C3C",
          };
        } else {
          marks[e.date] = {
            marked: true,
            dotColor: "#D6765A",
          };
        }
      });

      setEntries(map);
      setMarkedDates(marks);
      setLoading(false);
    })();
  }, []);

  const loadEntries = async () => {
    if (!db) return;

    const result = await db
      .getAllAsync<StoredEntry>(
        `SELECT * FROM diary_entries ORDER BY date ASC;`,
      )
      .catch((err) => {
        console.error("DB read error:", err);
        return [];
      });

    const map: Record<string, StoredEntry> = {};
    const marks: any = {};

    result.forEach((e) => {
      map[e.date] = e;
      if (e.bleeding === 1) {
        marks[e.date] = {
          selected: true,
          selectedColor: "#FFE5E5",
          selectedTextColor: "#E74C3C",
          marked: true,
          dotColor: "#E74C3C",
        };
      } else {
        marks[e.date] = {
          marked: true,
          dotColor: "#D6765A",
        };
      }
    });

    setEntries(map);
    setMarkedDates(marks);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }

  // When a calendar day is tapped, store it as the selected date.
  // If no entry exists for that date, prompt the user to create one.
  // This allows back-filling entries for days the user forgot to log.
  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);

    // If no entry exists for this date, offer to create one
    if (!entries[day.dateString]) {
      Alert.alert(
        "No Entry Found",
        `Would you like to add an entry for ${day.dateString}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Entry",
            onPress: () => {
              // Reset form
              setMood("");
              setSleep("good");
              setExercise("none");
              setBleeding(false);
              setWaterIntake(0);
              setSymptoms(
                symptomKeys.reduce(
                  (acc, key) => {
                    acc[key] = false;
                    return acc;
                  },
                  {} as Record<SymptomKey, boolean>,
                ),
              );
              setFoodTriggers(
                foodTriggerKeys.reduce(
                  (acc, key) => {
                    acc[key] = false;
                    return acc;
                  },
                  {} as Record<FoodTriggerKey, boolean>,
                ),
              );
              setNotes("");
              setModalVisible(true);
            },
          },
        ],
      );
    }
  };

  // Saves a new diary entry for the selected calendar date.
  // This uses a plain INSERT rather than INSERT OR REPLACE because
  // this code path is only reached when no entry exists for that date.
  const saveNewEntry = async () => {
    if (!db || !selectedDate) return;

    try {
      await db.runAsync(
        `INSERT INTO diary_entries
          (date, mood, sleep, exercise, bleeding, waterIntake, symptomsJSON, foodTriggersJSON, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          selectedDate,
          mood,
          sleep,
          exercise,
          bleeding ? 1 : 0,
          waterIntake,
          JSON.stringify(symptoms),
          JSON.stringify(foodTriggers),
          notes,
        ],
      );

      Alert.alert("✅ Saved", "Entry has been added successfully.");
      setModalVisible(false);
      await loadEntries();
    } catch (err) {
      console.error(err);
      Alert.alert("❌ Error", "Could not save entry.");
    }
  };

  const entry = entries[selectedDate] ?? null;
  const today = new Date().toISOString().split("T")[0];

  // Calculates how many days have passed since the most recent bleeding day
  // by filtering all entries, sorting them by date, and subtracting from today.
  // Returns null if no period days have been recorded yet so the card
  // can be hidden rather than showing a misleading zero.
  const getDaysSinceLastPeriod = () => {
    const periodDates = Object.entries(entries)
      .filter(([_, entry]) => entry.bleeding === 1)
      .map(([date, _]) => date)
      .sort()
      .reverse();

    if (periodDates.length === 0) return null;

    const lastPeriodDate = new Date(periodDates[0]);
    const todayDate = new Date(today);
    const diffTime = todayDate.getTime() - lastPeriodDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const daysSinceLastPeriod = getDaysSinceLastPeriod();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          ...markedDates,
          [today]: {
            ...markedDates[today],
            today: true,
            todayTextColor: "#D6765A",
          },
          [selectedDate]: {
            ...markedDates[selectedDate],
            selected: true,
            selectedColor: "#D6765A",
          },
        }}
        theme={{
          selectedDayBackgroundColor: "#D6765A",
          todayTextColor: "#D6765A",
          dotColor: "#D6765A",
        }}
      />

      {daysSinceLastPeriod !== null && (
        <View style={styles.periodTrackerCard}>
          <Text style={styles.periodTrackerLabel}>Days since last period</Text>
          <Text style={styles.periodTrackerCount}>{daysSinceLastPeriod}</Text>
          <Text style={styles.periodTrackerSubtext}>
            {daysSinceLastPeriod === 0
              ? "Today"
              : daysSinceLastPeriod === 1
                ? "Yesterday"
                : `${daysSinceLastPeriod} days ago`}
          </Text>
        </View>
      )}

      {selectedDate === "" && (
        <Text style={styles.infoText}>Tap a date to view your entry.</Text>
      )}

      {selectedDate !== "" && !entry && (
        <Text style={styles.infoText}>No entry for {selectedDate}</Text>
      )}

      {entry && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Entry: {selectedDate.split("-").reverse().join("-")}
          </Text>
          <Text style={styles.line}>Mood: {entry.mood || "Not selected"}</Text>
          <Text style={styles.line}>Sleep: {entry.sleep}</Text>
          {entry.bleeding === 1 && (
            <Text style={styles.line}>🩸 Period day</Text>
          )}

          <Text style={styles.sectionTitle}>Symptoms:</Text>
          {Object.entries(JSON.parse(entry.symptomsJSON)).map(([k, v]) =>
            v ? (
              <Text key={k} style={styles.line}>
                – {k}
              </Text>
            ) : null,
          )}

          <Text style={styles.sectionTitle}>Food / Drink Triggers:</Text>
          {Object.entries(JSON.parse(entry.foodTriggersJSON)).map(([k, v]) =>
            v ? (
              <Text key={k} style={styles.line}>
                – {k}
              </Text>
            ) : null,
          )}

          <Text style={styles.sectionTitle}>Notes:</Text>
          <Text style={styles.line}>{entry.notes || "None"}</Text>
        </View>
      )}

      {/* Add Entry Modal */}
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
            <Text style={styles.modalTitle}>New Entry - {selectedDate}</Text>
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
          <TouchableOpacity style={styles.saveButton} onPress={saveNewEntry}>
            <Text style={styles.saveText}>💾 Save Entry</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

// Helper functions
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

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    paddingHorizontal: 8,
    paddingBottom: 16,
    backgroundColor: "#fdf6f9",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  periodTrackerCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 3,
    borderLeftColor: "#E74C3C",
  },
  periodTrackerLabel: {
    fontSize: 11,
    color: "#777",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  periodTrackerCount: {
    fontSize: 38,
    fontWeight: "700",
    color: "#E74C3C",
    marginBottom: 3,
  },
  periodTrackerSubtext: {
    fontSize: 13,
    color: "#999",
  },
  infoText: {
    marginTop: 12,
    textAlign: "center",
    color: "#555",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 12,
    fontWeight: "500",
  },
  line: {
    fontSize: 14,
    marginVertical: 2,
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
