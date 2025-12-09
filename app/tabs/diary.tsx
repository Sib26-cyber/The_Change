// app/tabs/diary.tsx
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

// ----------------------
// TYPES
// ----------------------

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
  bleeding: number;
  symptomsJSON: string;
  foodTriggersJSON: string;
  notes: string;
}

// ----------------------
// MAIN COMPONENT
// ----------------------

export default function DiaryScreen() {
  // DB must be inside the component
  const router = useRouter();
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

  const [mood, setMood] = useState<string>("");
  const [sleep, setSleep] = useState<"good" | "bad" | "restless">("good");
  const [bleeding, setBleeding] = useState<boolean>(false);

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

  const today = new Date().toISOString().split("T")[0];

  // ----------------------
  // OPEN DATABASE
  // ----------------------

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
          symptomsJSON TEXT,
          foodTriggersJSON TEXT,
          notes TEXT
        );`
      );

      const entry = await database.getFirstAsync<DiaryEntryStored>(
        `SELECT * FROM diary_entries WHERE date = ?;`,
        [today]
      );

      if (entry) {
        Alert.alert(
          "Already saved",
          "You've already filled out today's diary. You can overwrite it if you'd like."
        );
      }
    })();
  }, []);

  // ----------------------
  // SAVE ENTRY
  // ----------------------

  const saveEntry = async () => {
    if (!db) {
      Alert.alert("⏳ Please wait", "Database is still loading.");
      return;
    }

    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO diary_entries
          (date, mood, sleep, bleeding, symptomsJSON, foodTriggersJSON, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          today,
          mood,
          sleep,
          bleeding ? 1 : 0,
          JSON.stringify(symptoms),
          JSON.stringify(foodTriggers),
          notes,
        ]
      );

      Alert.alert("✅ Saved", "Your diary entry has been saved.");

      // Clear all fields
      setMood("");
      setSleep("good");
      setBleeding(false);
      setSymptoms(
        symptomKeys.reduce(
          (acc, key) => {
            acc[key] = false;
            return acc;
          },
          {} as Record<SymptomKey, boolean>
        )
      );
      setFoodTriggers(
        foodTriggerKeys.reduce(
          (acc, key) => {
            acc[key] = false;
            return acc;
          },
          {} as Record<FoodTriggerKey, boolean>
        )
      );
      setNotes("");

      router.push("/tabs/home");
    } catch (err) {
      console.error(err);
      Alert.alert("❌ Error", "Could not save entry.");
    }
  };

  // ----------------------
  // RETURN UI
  // ----------------------

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animatable.View animation="fadeInDown" duration={400}>
        <Text style={styles.pageTitle}>🌸 Daily Diary</Text>
      </Animatable.View>

      {/* Mood + Sleep */}
      <Card>
        <MoodSelector selectedMood={mood} setSelectedMood={setMood} />
        <SleepPicker sleep={sleep} setSleep={setSleep} />
      </Card>

      {/* Bleeding */}
      <Card>
        <Text style={styles.sectionTitle}>🩸 Period</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Bleeding today?</Text>
          <Switch value={bleeding} onValueChange={setBleeding} />
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
            />
            <Text style={styles.checkboxLabel}>{prettySymptom(key)}</Text>
          </View>
        ))}
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
        <Animatable.Text
          animation="fadeInUp"
          duration={400}
          style={styles.saveText}
        >
          💾 Save Entry
        </Animatable.Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ----------------------
// SUB-COMPONENTS
// ----------------------

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

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
      <Text style={[styles.label, { marginBottom: 6 }]}>😴 Sleep</Text>
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

const moodOptions = [
  { emoji: "😢", value: "sad" },
  { emoji: "😐", value: "neutral" },
  { emoji: "🙂", value: "calm" },
  { emoji: "😄", value: "happy" },
  { emoji: "😍", value: "joyful" },
];

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
      <Text style={[styles.label, { marginBottom: 6 }]}>😊 Mood today</Text>
      <View style={styles.pillRow}>
        {moodOptions.map((m) => (
          <TouchableOpacity
            key={m.value}
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
        ))}
      </View>

      {isPositive && (
        <Animatable.Text animation="fadeIn" style={styles.goodDayText}>
          ✨ Feeling good today!
        </Animatable.Text>
      )}
    </View>
  );
}

// ----------------------
// HELPERS
// ----------------------

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

// ----------------------
// STYLES
// ----------------------

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
    marginVertical: 16,
    color: "#5C4B51",
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
  },
  moodPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#ececec",
  },
  moodPillSelected: {
    backgroundColor: "#D6765A",
  },
  moodEmoji: {
    fontSize: 28,
    opacity: 0.6,
  },
  moodEmojiSelected: {
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  goodDayText: {
    textAlign: "center",
    marginTop: 8,
    fontSize: 16,
    color: "#6A4B9D",
    fontWeight: "500",
  },
});
