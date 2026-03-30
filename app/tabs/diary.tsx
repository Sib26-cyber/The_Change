// app/tabs/diary.tsx
// This screen is the main daily logging interface for the user.
// It allows the user to record their mood, sleep quality, exercise level,
// symptoms, food triggers, water intake, and free-text notes for the current day.
// Data is saved to a local SQLite database using expo-sqlite.
// SQLite was chosen here (rather than AsyncStorage used elsewhere) because
// it allows structured queries which are needed for the analytics screen.

import { useRouter } from "expo-router";
import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Animatable from "react-native-animatable";

// SymptomKey lists the symptom categories tracked in the diary.
// Using a union type here ensures only valid symptom names can be used
// as keys throughout the component.
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

// FoodTriggerKey covers dietary items that are known to worsen menopause symptoms.
type FoodTriggerKey = "spicy" | "alcohol" | "caffeine" | "sugar";
const foodTriggerKeys: FoodTriggerKey[] = [
  "spicy",
  "alcohol",
  "caffeine",
  "sugar",
];

// DiaryEntryStored matches the column layout of the diary_entries table in SQLite.
// symptomsJSON and foodTriggersJSON are stored as JSON strings because SQLite
// does not have a native object or array type.
interface DiaryEntryStored {
  id: number;
  date: string;
  mood: string;
  sleep: string;
  bleeding: number;
  waterIntake: number;
  symptomsJSON: string;
  foodTriggersJSON: string;
  notes: string;
}

export default function DiaryScreen() {
  const router = useRouter();

  // db is stored in state because openDatabaseAsync is asynchronous.
  // Keeping it in state ensures the component does not try to use it before
  // the connection is ready.
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  const [mood, setMood] = useState<string>("");
  const [sleep, setSleep] = useState<"good" | "bad" | "restless">("good");
  const [exercise, setExercise] = useState<"none" | "light" | "active">("none");
  const [bleeding, setBleeding] = useState<boolean>(false);
  const [waterIntake, setWaterIntake] = useState<number>(0);

  // Symptoms and food triggers are stored as records so each key maps to
  // a boolean toggle. This structure makes it straightforward to serialise
  // the entire object to JSON when saving to the database.
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

  // today is used as the primary key for the diary entry so only one
  // entry can exist per calendar day.
  const today = new Date().toISOString().split("T")[0];

  // Open the SQLite database and create the table when the component mounts.
  // ALTER TABLE statements are used to add columns that were introduced
  // after the initial release without wiping existing data.
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
          exercise TEXT,
          bleeding INTEGER,
          waterIntake INTEGER DEFAULT 0,
          symptomsJSON TEXT,
          foodTriggersJSON TEXT,
          notes TEXT
        );`,
      );

      // These ALTER TABLE calls add columns that did not exist in earlier
      // versions of the app. The try/catch handles the case where the
      // column already exists, which SQLite treats as an error.
      try {
        await database.runAsync(
          `ALTER TABLE diary_entries ADD COLUMN waterIntake INTEGER DEFAULT 0;`,
        );
      } catch (e) {
        // waterIntake column already exists, nothing to do.
      }

      try {
        await database.runAsync(
          `ALTER TABLE diary_entries ADD COLUMN exercise TEXT DEFAULT 'sedentary';`,
        );
      } catch (e) {
        // exercise column already exists, nothing to do.
      }

      // Check whether the user has already saved an entry for today.
      // If they have, warn them before they overwrite it.
      const entry = await database.getFirstAsync<DiaryEntryStored>(
        `SELECT * FROM diary_entries WHERE date = ?;`,
        [today],
      );

      if (entry) {
        Alert.alert(
          "Already saved",
          "You've already filled out today's diary. You can overwrite it if you'd like.",
        );
      }
    })();
  }, []);

  // Saves the current form state to the database for today's date.
  // INSERT OR REPLACE is used so that if the user edits their entry
  // on the same day, the existing row is overwritten rather than duplicated.
  const saveEntry = async () => {
    if (!db) {
      Alert.alert("Please wait", "Database is still loading.");
      return;
    }

    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO diary_entries
          (date, mood, sleep, exercise, bleeding, waterIntake, symptomsJSON, foodTriggersJSON, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          today,
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

      Alert.alert("✅ Saved", "Your diary entry has been saved.");

      // Clear all fields
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

      router.push("/tabs/home");
    } catch (err) {
      console.error(err);
      Alert.alert("❌ Error", "Could not save entry.");
    }
  };

  // Render the diary form as a scrollable list of cards, one per category.
  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animatable.View animation="fadeInDown" duration={400}>
        <Text style={styles.pageTitle}>🌸 Daily Diary</Text>
        <Text style={styles.dateText}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </Animatable.View>

      {/* Mood */}
      <Card>
        <MoodSelector selectedMood={mood} setSelectedMood={setMood} />
      </Card>

      {/* Sleep */}
      <Card>
        <SleepPicker sleep={sleep} setSleep={setSleep} />
      </Card>

      {/* Exercise */}
      <Card>
        <ExercisePicker exercise={exercise} setExercise={setExercise} />
      </Card>

      {/* Bleeding */}
      <Card>
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
      </Card>

      {/* Symptoms */}
      <Card>
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
      </Card>

      {/* Wellness */}
      <Card>
        <Text style={styles.sectionTitle}>💧 Wellness</Text>
        <View style={styles.waterContainer}>
          <Text style={styles.label}>Water Intake</Text>
          <View style={styles.waterControls}>
            <TouchableOpacity
              style={styles.waterButton}
              onPress={() => setWaterIntake(Math.max(0, waterIntake - 1))}
            >
              <Text style={styles.waterButtonText}>−</Text>
            </TouchableOpacity>
            <View style={styles.waterDisplay}>
              <Text style={styles.waterCount}>{waterIntake} glasses</Text>
              <Text style={styles.waterGlassesIcons}>
                {Array.from(
                  { length: Math.min(waterIntake, 8) },
                  () => "💧",
                ).join("")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.waterButton}
              onPress={() => setWaterIntake(Math.min(20, waterIntake + 1))}
            >
              <Text style={styles.waterButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Food & Drink */}
      <Card>
        <Text style={styles.sectionTitle}>🍽️ Food & Drink Triggers</Text>
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
      </Card>

      {/* Notes */}
      <Card>
        <Text style={styles.sectionTitle}>📝 Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Any extra thoughts?"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </Card>

      {/* Save */}
      <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
        <Animatable.View animation="fadeInUp" duration={400}>
          <Text style={styles.saveText}>💾 Save Entry</Text>
        </Animatable.View>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// Card wraps each section of the form in a consistent styled container.
function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

// SleepPicker renders three pill buttons for the user to describe their
// sleep quality as good, bad, or restless.
function SleepPicker({
  sleep,
  setSleep,
}: {
  sleep: "good" | "bad" | "restless";
  setSleep: (v: "good" | "bad" | "restless") => void;
}) {
  const options: (typeof sleep)[] = ["good", "bad", "restless"];
  return (
    <View>
      <Text style={styles.sectionTitle}>😴 Sleep</Text>
      <View style={styles.pillRow}>
        {options.map((opt) => (
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
  );
}

// ExercisePicker lets the user log their activity level for the day.
// The three options (none, light, active) were chosen to keep input simple
// while still providing enough detail to spot patterns in the analytics.
function ExercisePicker({
  exercise,
  setExercise,
}: {
  exercise: "none" | "light" | "active";
  setExercise: (v: "none" | "light" | "active") => void;
}) {
  const options: (typeof exercise)[] = ["none", "light", "active"];
  return (
    <View>
      <Text style={styles.sectionTitle}>🏃‍♀️ Exercise</Text>
      <View style={styles.pillRow}>
        {options.map((opt) => (
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
  );
}

const moodOptions = [
  { emoji: "😢", value: "sad" },
  { emoji: "😐", value: "neutral" },
  { emoji: "🙂", value: "calm" },
  { emoji: "😄", value: "happy" },
  { emoji: "😍", value: "joyful" },
];

// MoodSelector displays five emoji-based mood options as tappable circles.
// The animation on the selected item gives the user immediate visual feedback.
// If the user selects a positive mood, an encouraging message is shown below.
function MoodSelector({
  selectedMood,
  setSelectedMood,
}: {
  selectedMood: string;
  setSelectedMood: (v: string) => void;
}) {
  const isPositive = ["calm", "happy", "joyful"].includes(selectedMood);

  return (
    <View>
      <Text style={styles.sectionTitle}>😊 Mood today</Text>
      <View style={styles.pillRow}>
        {moodOptions.map((m) => (
          <Animatable.View
            key={m.value}
            animation={selectedMood === m.value ? "pulse" : undefined}
            duration={400}
          >
            <TouchableOpacity
              style={[
                styles.moodPill,
                selectedMood === m.value && styles.moodPillSelected,
              ]}
              onPress={() => setSelectedMood(m.value)}
            >
              <Text
                style={[
                  styles.moodEmoji,
                  selectedMood === m.value && styles.moodEmojiSelected,
                ]}
              >
                {m.emoji}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        ))}
      </View>

      {isPositive && (
        <Animatable.View animation="fadeIn">
          <Text style={styles.goodDayText}>✨ Feeling good today!</Text>
        </Animatable.View>
      )}
    </View>
  );
}

// prettySymptom converts a camelCase symptom key into a readable label
// for display in the UI, keeping the data model separate from the presentation.
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

// prettyTrigger does the same for food trigger keys.
function prettyTrigger(key: FoodTriggerKey): string {
  const mapping: Record<FoodTriggerKey, string> = {
    spicy: "Spicy Food",
    alcohol: "Alcohol",
    caffeine: "Caffeine",
    sugar: "Sugar",
  };
  return mapping[key];
}

// All styles for this screen are defined in a single StyleSheet object
// to keep them co-located with the component and avoid global style conflicts.
const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    backgroundColor: "#fdf6f9",
    flexGrow: 1,
    paddingBottom: 60,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 4,
    color: "#5C4B51",
  },
  dateText: {
    fontSize: 14,
    textAlign: "center",
    color: "#999",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#5C4B51",
  },
  label: {
    fontSize: 16,
    color: "#5C4B51",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
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
  saveButton: {
    backgroundColor: "#D6765A",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 40,
    marginTop: 10,
  },
  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F5F5F5",
    borderWidth: 3,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  moodPillSelected: {
    backgroundColor: "#FFE8E8",
    borderColor: "#D6765A",
    transform: [{ scale: 1.1 }],
  },
  moodEmoji: {
    fontSize: 32,
  },
  moodEmojiSelected: {
    fontSize: 36,
  },
  goodDayText: {
    textAlign: "center",
    color: "#D6765A",
    fontSize: 14,
    marginTop: 8,
    fontStyle: "italic",
  },
  paterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  waterControlsCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  waterButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D6765A",
    justifyContent: "center",
    alignItems: "center",
  },
  waterButtonTextSmall: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "600",
  },
  waterCountSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5C4B51",
    minWidth: 70,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 12,
  },
  waterContainer: {
    marginTop: 8,
  },
  waterControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 16,
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
  waterDisplay: {
    alignItems: "center",
    minWidth: 120,
  },
  waterCount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#5C4B51",
    marginBottom: 4,
  },
  waterGlassesIcons: {
    fontSize: 16,
    lineHeight: 20,
  },
});
