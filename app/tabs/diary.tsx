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
  waterIntake: number;
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
          waterIntake INTEGER DEFAULT 0,
          symptomsJSON TEXT,
          foodTriggersJSON TEXT,
          notes TEXT
        );`
      );

      // Add waterIntake column if it doesn't exist (migration for existing databases)
      try {
        await database.runAsync(
          `ALTER TABLE diary_entries ADD COLUMN waterIntake INTEGER DEFAULT 0;`
        );
      } catch (e) {
        // Column already exists, ignore error
      }

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
          (date, mood, sleep, bleeding, waterIntake, symptomsJSON, foodTriggersJSON, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          today,
          mood,
          sleep,
          bleeding ? 1 : 0,
          waterIntake,
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
      setWaterIntake(0);
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
        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
      </Animatable.View>

      {/* Mood */}
      <Card>
        <MoodSelector selectedMood={mood} setSelectedMood={setMood} />
      </Card>

      {/* Sleep */}
      <Card>
        <SleepPicker sleep={sleep} setSleep={setSleep} />
      </Card>

      {/* Bleeding */}
      <Card>
        <Text style={styles.sectionTitle}>🩸 Period</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Bleeding today?</Text>
          <Switch 
            value={bleeding} 
            onValueChange={setBleeding}
            trackColor={{ false: '#E0E0E0', true: '#D6765A' }}
            thumbColor={bleeding ? '#fff' : '#f4f3f4'}
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
              trackColor={{ false: '#E0E0E0', true: '#D6765A' }}
              thumbColor={symptoms[key] ? '#fff' : '#f4f3f4'}
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
                {Array.from({ length: Math.min(waterIntake, 8) }, () => '💧').join('')}
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
              trackColor={{ false: '#E0E0E0', true: '#D6765A' }}
              thumbColor={foodTriggers[key] ? '#fff' : '#f4f3f4'}
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
