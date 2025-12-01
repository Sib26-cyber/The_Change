// app/tabs/diary.tsx
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type AlcoholIntake = "none" | "some";
type ExerciseLevel = "none" | "light" | "moderate";
type CycleStatus = "none" | "start" | "during" | "end";

type DiaryEntry = {
  id: string;
  date: string;
  mood: number | null;
  symptoms: string[];
  note: string;

  foodNotes: string;
  alcohol: AlcoholIntake;

  waterGlasses: number;
  exercise: ExerciseLevel;
  cycleStatus: CycleStatus;
};

const SYMPTOM_OPTIONS = [
  "Hot flushes",
  "Sleep disturbance",
  "Mood changes",
  "Brain fog",
];

export default function DiaryScreen() {
  const [date, setDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [mood, setMood] = useState<number | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [foodNotes, setFoodNotes] = useState("");
  const [alcohol, setAlcohol] = useState<AlcoholIntake>("none");
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [exercise, setExercise] = useState<ExerciseLevel>("none");
  const [cycleStatus, setCycleStatus] = useState<CycleStatus>("none");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [error, setError] = useState("");

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((s) => s !== symptom)
        : [...current, symptom]
    );
  };

  const adjustWater = (delta: number) => {
    setWaterGlasses((current) => {
      const next = current + delta;
      if (next < 0) return 0;
      if (next > 20) return 20;
      return next;
    });
  };

  const handleSaveEntry = () => {
    if (!date) {
      setError("Please check the date.");
      return;
    }
    if (mood === null) {
      setError("Please choose how you are feeling today.");
      return;
    }

    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      date,
      mood,
      symptoms: selectedSymptoms,
      note: note.trim(),
      foodNotes: foodNotes.trim(),
      alcohol,
      waterGlasses,
      exercise,
      cycleStatus,
    };

    setEntries((prev) => [newEntry, ...prev]);
    setError("");

    // Reset optional fields, keep date & mood
    setSelectedSymptoms([]);
    setNote("");
    setFoodNotes("");
    setAlcohol("none");
    setWaterGlasses(0);
    setExercise("none");
    setCycleStatus("none");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Journey Diary</Text>
      <Text style={styles.subtitle}>
        A gentle place to record how you feel today. Only fill in what feels
        manageable.
      </Text>

      {/* Date */}
      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={date}
        placeholder="YYYY-MM-DD"
        onChangeText={setDate}
      />

      {/* Mood */}
      <Text style={styles.label}>Mood today</Text>
      <View style={styles.moodRow}>
        {[1, 2, 3, 4, 5].map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.moodButton,
              mood === value && styles.moodButtonSelected,
            ]}
            onPress={() => setMood(value)}
          >
            <Text
              style={[
                styles.moodButtonText,
                mood === value && styles.moodButtonTextSelected,
              ]}
            >
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Symptoms */}
      <Text style={styles.label}>Symptoms (optional)</Text>
      <View style={styles.symptomList}>
        {SYMPTOM_OPTIONS.map((symptom) => {
          const selected = selectedSymptoms.includes(symptom);
          return (
            <TouchableOpacity
              key={symptom}
              style={[
                styles.symptomChip,
                selected && styles.symptomChipSelected,
              ]}
              onPress={() => toggleSymptom(symptom)}
            >
              <Text
                style={[
                  styles.symptomText,
                  selected && styles.symptomTextSelected,
                ]}
              >
                {symptom}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Food & Drink */}
      <Text style={styles.sectionTitle}>Food &amp; Drink (optional)</Text>

      <Text style={styles.label}>What did you eat or drink today?</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Write anything you'd like to remember..."
        value={foodNotes}
        onChangeText={setFoodNotes}
        multiline
      />

      <Text style={styles.label}>Alcohol</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            alcohol === "none" && styles.toggleButtonSelected,
          ]}
          onPress={() => setAlcohol("none")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              alcohol === "none" && styles.toggleButtonTextSelected,
            ]}
          >
            None today
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            alcohol === "some" && styles.toggleButtonSelected,
          ]}
          onPress={() => setAlcohol("some")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              alcohol === "some" && styles.toggleButtonTextSelected,
            ]}
          >
            I had a drink
          </Text>
        </TouchableOpacity>
      </View>

      {/* Water */}
      <Text style={styles.sectionTitle}>Water (optional)</Text>
      <Text style={styles.label}>
        How many glasses of water today (approx)?
      </Text>
      <View style={styles.waterRow}>
        <TouchableOpacity
          style={styles.waterButton}
          onPress={() => adjustWater(-1)}
        >
          <Text style={styles.waterButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.waterValue}>{waterGlasses}</Text>
        <TouchableOpacity
          style={styles.waterButton}
          onPress={() => adjustWater(1)}
        >
          <Text style={styles.waterButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Movement / Exercise */}
      <Text style={styles.sectionTitle}>Movement (optional)</Text>
      <Text style={styles.label}>Did you move much today?</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            exercise === "none" && styles.toggleButtonSelected,
          ]}
          onPress={() => setExercise("none")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              exercise === "none" && styles.toggleButtonTextSelected,
            ]}
          >
            Not really
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            exercise === "light" && styles.toggleButtonSelected,
          ]}
          onPress={() => setExercise("light")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              exercise === "light" && styles.toggleButtonTextSelected,
            ]}
          >
            A little
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            exercise === "moderate" && styles.toggleButtonSelected,
          ]}
          onPress={() => setExercise("moderate")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              exercise === "moderate" && styles.toggleButtonTextSelected,
            ]}
          >
            30+ mins
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cycle / Period */}
      <Text style={styles.sectionTitle}>Cycle &amp; period (optional)</Text>
      <Text style={styles.label}>Period status today</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleButtonSmall,
            cycleStatus === "none" && styles.toggleButtonSelected,
          ]}
          onPress={() => setCycleStatus("none")}
        >
          <Text
            style={[
              styles.toggleButtonTextSmall,
              cycleStatus === "none" && styles.toggleButtonTextSelected,
            ]}
          >
            Not on period
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButtonSmall,
            cycleStatus === "start" && styles.toggleButtonSelected,
          ]}
          onPress={() => setCycleStatus("start")}
        >
          <Text
            style={[
              styles.toggleButtonTextSmall,
              cycleStatus === "start" && styles.toggleButtonTextSelected,
            ]}
          >
            Period started
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleButtonSmall,
            cycleStatus === "during" && styles.toggleButtonSelected,
          ]}
          onPress={() => setCycleStatus("during")}
        >
          <Text
            style={[
              styles.toggleButtonTextSmall,
              cycleStatus === "during" && styles.toggleButtonTextSelected,
            ]}
          >
            On period
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButtonSmall,
            cycleStatus === "end" && styles.toggleButtonSelected,
          ]}
          onPress={() => setCycleStatus("end")}
        >
          <Text
            style={[
              styles.toggleButtonTextSmall,
              cycleStatus === "end" && styles.toggleButtonTextSelected,
            ]}
          >
            Period ending
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notes */}
      <Text style={styles.sectionTitle}>Notes (optional)</Text>
      <Text style={styles.label}>Anything else you want to remember?</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={note}
        onChangeText={setNote}
        placeholder="Symptoms, sleep, mood, life events…"
        multiline
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveEntry}>
        <Text style={styles.saveButtonText}>Save entry</Text>
      </TouchableOpacity>

      {/* Entries list */}
      <View style={styles.entriesSection}>
        {entries.length === 0 ? (
          <Text style={styles.emptyText}>
            When you add an entry, it will appear here so you can look back on
            it later.
          </Text>
        ) : (
          <>
            <Text style={styles.entriesTitle}>Previous entries</Text>
            {entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <Text style={styles.entryDate}>{entry.date}</Text>
                <Text style={styles.entryMood}>Mood: {entry.mood}</Text>
                {entry.symptoms.length > 0 && (
                  <Text style={styles.entrySymptoms}>
                    Symptoms: {entry.symptoms.join(", ")}
                  </Text>
                )}
                {entry.foodNotes ? (
                  <Text style={styles.entryFood}>
                    Food &amp; drink: {entry.foodNotes}
                  </Text>
                ) : null}
                <Text style={styles.entryAlcohol}>
                  Alcohol: {entry.alcohol === "some" ? "Yes" : "No"}
                </Text>
                <Text style={styles.entryWater}>
                  Water: {entry.waterGlasses} glasses
                </Text>
                <Text style={styles.entryExercise}>
                  Movement:{" "}
                  {entry.exercise === "none"
                    ? "Not really"
                    : entry.exercise === "light"
                    ? "A little"
                    : "30+ mins"}
                </Text>
                <Text style={styles.entryCycle}>
                  Period status:{" "}
                  {
                    {
                      none: "Not on period",
                      start: "Period started",
                      during: "On period",
                      end: "Period ending",
                    }[entry.cycleStatus]
                  }
                </Text>
                {entry.note ? (
                  <Text style={styles.entryNote}>{entry.note}</Text>
                ) : null}
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: "#FFFDF7",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E3C4B5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  moodButton: {
    flex: 1,
    marginHorizontal: 2,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E3C4B5",
    alignItems: "center",
  },
  moodButtonSelected: {
    backgroundColor: "#D6765A",
    borderColor: "#D6765A",
  },
  moodButtonText: {
    fontSize: 14,
  },
  moodButtonTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  symptomList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 8,
  },
  symptomChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E3C4B5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  symptomChipSelected: {
    backgroundColor: "#F4C9B5",
    borderColor: "#D6765A",
  },
  symptomText: {
    fontSize: 13,
  },
  symptomTextSelected: {
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  toggleButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E3C4B5",
    borderRadius: 14,
    alignItems: "center",
  },
  toggleButtonSmall: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E3C4B5",
    borderRadius: 14,
    alignItems: "center",
  },
  toggleButtonSelected: {
    backgroundColor: "#D6765A",
    borderColor: "#D6765A",
  },
  toggleButtonText: {
    fontSize: 14,
  },
  toggleButtonTextSmall: {
    fontSize: 12,
  },
  toggleButtonTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  waterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  waterButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E3C4B5",
    alignItems: "center",
    justifyContent: "center",
  },
  waterButtonText: {
    fontSize: 20,
  },
  waterValue: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 16,
  },
  error: {
    color: "#C0392B",
    marginTop: 8,
    marginBottom: 4,
    textAlign: "center",
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: "#D6765A",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  entriesSection: {
    marginTop: 24,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.8,
  },
  entriesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  entryCard: {
    borderWidth: 1,
    borderColor: "#F0D7C8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  entryDate: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  entryMood: {
    fontSize: 13,
    marginBottom: 2,
  },
  entrySymptoms: {
    fontSize: 13,
    marginBottom: 2,
  },
  entryFood: {
    fontSize: 13,
    marginBottom: 2,
  },
  entryAlcohol: {
    fontSize: 13,
    marginBottom: 2,
  },
  entryWater: {
    fontSize: 13,
    marginBottom: 2,
  },
  entryExercise: {
    fontSize: 13,
    marginBottom: 2,
  },
  entryCycle: {
    fontSize: 13,
    marginBottom: 2,
  },
  entryNote: {
    fontSize: 13,
    marginTop: 4,
  },
});
