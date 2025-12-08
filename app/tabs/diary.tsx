// app/tabs/diary.tsx

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

// If you want sliders for severity, you could add:
// import Slider from "@react-native-community/slider";

let db: SQLite.SQLiteDatabase;

interface DiaryEntryStored {
  id: number;
  date: string;
  mood: string;
  sleep: string;
  periodStarted: number; // 0 or 1
  flowIntensity: string; // "light" | "medium" | "heavy" | ""
  cycleDay: number | null;
  symptomsJSON: string; // JSON-encoded object
  foodTriggersJSON: string; // JSON-encoded object
  foodNotes: string;
  drinkNotes: string;
  notes: string;
}

const symptomKeys = [
  "hotFlushes",
  "brainFog",
  "moodSwings",
  "fatigue",
  "jointPain",
] as const;

type SymptomKey = (typeof symptomKeys)[number];

type SymptomMap = { [K in SymptomKey]: number };

const foodTriggerKeys = [
  "alcohol",
  "caffeine",
  "sugar",
  "spicy",
  "gluten",
] as const;

type FoodTriggerKey = (typeof foodTriggerKeys)[number];

type FoodTriggerMap = { [K in FoodTriggerKey]: boolean };

// Default symptom map (0 for all)
const defaultSymptoms: SymptomMap = symptomKeys.reduce((acc, key) => {
  acc[key] = 0;
  return acc;
}, {} as SymptomMap);

// Default food trigger map (all false)
const defaultFoodTriggers: FoodTriggerMap = foodTriggerKeys.reduce(
  (acc, key) => {
    acc[key] = false;
    return acc;
  },
  {} as FoodTriggerMap
);

export default function DiaryScreen() {
  const [mood, setMood] = useState("");
  const [sleep, setSleep] = useState("");
  const [periodStarted, setPeriodStarted] = useState(false);
  const [flowIntensity, setFlowIntensity] = useState<
    "light" | "medium" | "heavy" | ""
  >("");
  const [cycleDay, setCycleDay] = useState<string>(""); // we'll parse to number
  const [symptoms, setSymptoms] = useState<SymptomMap>({ ...defaultSymptoms });
  const [foodTriggers, setFoodTriggers] = useState<FoodTriggerMap>({
    ...defaultFoodTriggers,
  });
  const [foodNotes, setFoodNotes] = useState("");
  const [drinkNotes, setDrinkNotes] = useState("");
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const setup = async () => {
      db = await SQLite.openDatabaseAsync("thechange.db");

      await db.runAsync(
        `CREATE TABLE IF NOT EXISTS diary_entries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT UNIQUE,
          mood TEXT,
          sleep TEXT,
          periodStarted INTEGER,
          flowIntensity TEXT,
          cycleDay INTEGER,
          symptomsJSON TEXT,
          foodTriggersJSON TEXT,
          foodNotes TEXT,
          drinkNotes TEXT,
          notes TEXT
        );`
      );

      const entry = await db.getFirstAsync<DiaryEntryStored>(
        `SELECT * FROM diary_entries WHERE date = ?;`,
        [today]
      );

      if (entry) {
        setMood(entry.mood);
        setSleep(entry.sleep);
        setPeriodStarted(entry.periodStarted === 1);
        setFlowIntensity(
          entry.flowIntensity as "light" | "medium" | "heavy" | ""
        );
        setCycleDay(entry.cycleDay?.toString() ?? "");
        setSymptoms(JSON.parse(entry.symptomsJSON));
        setFoodTriggers(JSON.parse(entry.foodTriggersJSON));
        setFoodNotes(entry.foodNotes);
        setDrinkNotes(entry.drinkNotes);
        setNotes(entry.notes);
      }
    };

    setup();
  }, []);

  const saveEntry = async () => {
    try {
      const periodInt = periodStarted ? 1 : 0;
      const cycleDayNum = cycleDay !== "" ? parseInt(cycleDay, 10) : null;

      await db.runAsync(
        `INSERT OR REPLACE INTO diary_entries 
          (date, mood, sleep, periodStarted, flowIntensity, cycleDay, symptomsJSON, foodTriggersJSON, foodNotes, drinkNotes, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          today,
          mood,
          sleep,
          periodInt,
          flowIntensity,
          cycleDayNum,
          JSON.stringify(symptoms),
          JSON.stringify(foodTriggers),
          foodNotes,
          drinkNotes,
          notes,
        ]
      );

      Alert.alert("✅ Saved", "Your diary entry has been saved locally.");

      // Clear form for new day
      setMood("");
      setSleep("");
      setPeriodStarted(false);
      setFlowIntensity("");
      setCycleDay("");
      setSymptoms({ ...defaultSymptoms });
      setFoodTriggers({ ...defaultFoodTriggers });
      setFoodNotes("");
      setDrinkNotes("");
      setNotes("");
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("❌ Error", "Failed to save your entry.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Animatable.View animation="fadeInDown" duration={600}>
        <Text style={styles.title}>🌸 Daily Diary</Text>
      </Animatable.View>

      {/* Mood selector */}
      <MoodSelector selectedMood={mood} setSelectedMood={setMood} />

      {/* Sleep */}
      <DiaryInput
        label="😴 Sleep (hrs)"
        value={sleep}
        onChangeText={setSleep}
        delay={100}
      />

      {/* Period / Cycle */}
      <Animatable.View animation="fadeInUp" delay={200} style={styles.section}>
        <Text style={styles.label}>🩸 Period today?</Text>
        <Switch value={periodStarted} onValueChange={setPeriodStarted} />
        {periodStarted && (
          <>
            <Text style={styles.label}>Flow intensity</Text>
            <View style={styles.flowButtonsRow}>
              {["light", "medium", "heavy"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.flowButton,
                    flowIntensity === opt && styles.flowButtonSelected,
                  ]}
                  onPress={() =>
                    setFlowIntensity(opt as "light" | "medium" | "heavy")
                  }
                >
                  <Text style={styles.flowButtonText}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Cycle day (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 14"
              keyboardType="numeric"
              value={cycleDay}
              onChangeText={setCycleDay}
            />
          </>
        )}
      </Animatable.View>

      {/* Symptoms */}
      <Animatable.View animation="fadeInUp" delay={300} style={styles.section}>
        <Text style={styles.label}>🔥 Symptoms severity (0–3)</Text>
        {symptomKeys.map((key) => (
          <View key={key} style={styles.symptomRow}>
            <Text style={styles.symptomLabel}>{key}</Text>
            <TextInput
              style={styles.smallInput}
              keyboardType="numeric"
              value={symptoms[key].toString()}
              onChangeText={(t) => {
                const num = parseInt(t, 10);
                if (!isNaN(num) && num >= 0 && num <= 3) {
                  setSymptoms({ ...symptoms, [key]: num });
                } else if (t === "") {
                  setSymptoms({ ...symptoms, [key]: 0 });
                }
              }}
            />
          </View>
        ))}
      </Animatable.View>

      {/* Food triggers */}
      <Animatable.View animation="fadeInUp" delay={400} style={styles.section}>
        <Text style={styles.label}>🍽️ Food & Drink Triggers</Text>
        {foodTriggerKeys.map((key) => (
          <View key={key} style={styles.triggerRow}>
            <Text style={styles.triggerLabel}>{key}</Text>
            <Switch
              value={foodTriggers[key]}
              onValueChange={(v) =>
                setFoodTriggers({ ...foodTriggers, [key]: v })
              }
            />
          </View>
        ))}

        <Text style={styles.label}>Food notes / details</Text>
        <TextInput
          style={styles.input}
          placeholder="What did you eat?"
          value={foodNotes}
          onChangeText={setFoodNotes}
        />

        <Text style={styles.label}>Drink notes</Text>
        <TextInput
          style={styles.input}
          placeholder="Water, wine, coffee, etc."
          value={drinkNotes}
          onChangeText={setDrinkNotes}
        />
      </Animatable.View>

      {/* Free-form Notes */}
      <DiaryInput
        label="📝 Notes"
        value={notes}
        onChangeText={setNotes}
        delay={500}
        multiline
      />

      {/* Save Button */}
      <View style={{ marginTop: 30, marginBottom: 40 }}>
        <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
          <Text style={styles.saveText}>💾 Save Entry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Reuse DiaryInput
interface DiaryInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  delay?: number;
}
function DiaryInput({
  label,
  value,
  onChangeText,
  multiline = false,
  delay = 0,
}: DiaryInputProps) {
  return (
    <Animatable.View animation="fadeInUp" delay={delay}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        placeholder={`Enter ${label.toLowerCase()}...`}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
      />
    </Animatable.View>
  );
}

// Mood selector from before
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
  setSelectedMood: (value: string) => void;
}) {
  const isPositiveMood = ["calm", "happy", "joyful"].includes(selectedMood);

  return (
    <Animatable.View
      animation="fadeInUp"
      delay={100}
      style={styles.moodContainer}
    >
      <Text style={styles.label}>😊 How do you feel today?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {moodOptions.map((m, index) => (
          <Animatable.Text
            key={m.value}
            animation="bounceIn"
            delay={index * 80}
            style={[
              styles.moodEmoji,
              selectedMood === m.value && styles.moodEmojiSelected,
            ]}
            onPress={() => setSelectedMood(m.value)}
          >
            {m.emoji}
          </Animatable.Text>
        ))}
      </ScrollView>

      {isPositiveMood && (
        <Animatable.Text
          animation="fadeInDown"
          duration={800}
          style={styles.goodDayText}
        >
          ✨ It’s a great day!
        </Animatable.Text>
      )}
    </Animatable.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fef6fb",
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  multiline: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#D675A9",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  moodContainer: {
    marginBottom: 24,
  },
  moodEmoji: {
    fontSize: 36,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  moodEmojiSelected: {
    opacity: 1,
    transform: [{ scale: 1.3 }],
  },
  goodDayText: {
    textAlign: "center",
    fontSize: 18,
    color: "#8A2BE2",
    marginTop: 16,
    fontWeight: "500",
  },
  flowButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  flowButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#ececec",
    marginRight: 8,
  },
  flowButtonSelected: {
    backgroundColor: "#D6765A",
  },
  flowButtonText: {
    color: "#333",
    fontSize: 14,
  },
  symptomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  symptomLabel: {
    flex: 1,
    fontSize: 14,
  },
  smallInput: {
    width: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    textAlign: "center",
    backgroundColor: "#fff",
  },
  triggerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  triggerLabel: {
    flex: 1,
    fontSize: 14,
  },
});
