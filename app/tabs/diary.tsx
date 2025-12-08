import * as SQLite from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import * as Animatable from "react-native-animatable";
// Create the animatable text component
const AnimatableText = Animatable.createAnimatableComponent(Text);

let db: SQLite.SQLiteDatabase;

interface DiaryEntry {
  id: number;
  date: string;
  mood: string;
  sleep: string;
  symptoms: string;
  food: string;
  drink: string;
  notes: string;
}

interface DiaryInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  delay?: number;
}

export default function DiaryScreen() {
  const [mood, setMood] = useState("");
  const [sleep, setSleep] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [food, setFood] = useState("");
  const [drink, setDrink] = useState("");
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
          symptoms TEXT,
          food TEXT,
          drink TEXT,
          notes TEXT
        );`
      );

      const entry = await db.getFirstAsync<DiaryEntry>(
        `SELECT * FROM diary_entries WHERE date = ?;`,
        [today]
      );

      if (entry) {
        setMood(entry.mood);
        setSleep(entry.sleep);
        setSymptoms(entry.symptoms);
        setFood(entry.food);
        setDrink(entry.drink);
        setNotes(entry.notes);
      }
    };

    setup();
  }, []);

  const saveEntry = async () => {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO diary_entries 
         (date, mood, sleep, symptoms, food, drink, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [today, mood, sleep, symptoms, food, drink, notes]
      );

      Alert.alert("✅ Saved", "Your diary entry has been saved locally.");
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

      <MoodSelector selectedMood={mood} setSelectedMood={setMood} />

      <DiaryInput
        label="😴 Sleep"
        value={sleep}
        onChangeText={setSleep}
        delay={200}
      />
      <DiaryInput
        label="🔥 Symptoms"
        value={symptoms}
        onChangeText={setSymptoms}
        delay={300}
      />
      <DiaryInput
        label="🍽️ Food"
        value={food}
        onChangeText={setFood}
        delay={400}
      />
      <DiaryInput
        label="💧 Drink"
        value={drink}
        onChangeText={setDrink}
        delay={500}
      />
      <DiaryInput
        label="📝 Notes"
        value={notes}
        onChangeText={setNotes}
        delay={600}
        multiline
      />

      <Animatable.View animation="pulse" delay={800} iterationCount="infinite">
        <TouchableOpacity style={styles.saveButton} onPress={saveEntry}>
          <Text style={styles.saveText}>💾 Save Entry</Text>
        </TouchableOpacity>
      </Animatable.View>
    </ScrollView>
  );
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
        {moodOptions.map((mood, index) => (
          <Animatable.Text
            key={mood.value}
            animation="bounceIn"
            delay={index * 80}
            style={[
              styles.moodEmoji,
              selectedMood === mood.value && styles.moodEmojiSelected,
            ]}
            onPress={() => setSelectedMood(mood.value)}
          >
            {mood.emoji}
          </Animatable.Text>
        ))}
      </ScrollView>

      {isPositiveMood && (
        <Animatable.View animation="fadeInDown" duration={800}>
          <Text style={styles.goodDayText}>✨ It's a great day!</Text>
        </Animatable.View>
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
  label: {
    fontSize: 16,
    marginTop: 16,
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
    marginTop: 30,
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
});
