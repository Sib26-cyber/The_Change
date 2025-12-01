// app/(tabs)/diary.tsx
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type DiaryEntry = {
  id: string;
  date: string;
  mood: number | null;
  symptoms: string[];
  note: string;
};

const SYMPTOM_OPTIONS = [
  "Hot flushes",
  "Sleep disturbance",
  "Mood changes",
  "Brain fog",
];

export default function DiaryScreen() {
  const [date, setDate] = useState(() => {
    // default to today in YYYY-MM-DD format
    return new Date().toISOString().slice(0, 10);
  });
  const [mood, setMood] = useState<number | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [error, setError] = useState("");

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((s) => s !== symptom)
        : [...current, symptom]
    );
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
    };

    setEntries((prev) => [newEntry, ...prev]);
    setError("");
    // reset note + symptoms, keep date and mood for convenience
    setSelectedSymptoms([]);
    setNote("");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Symptom Diary</Text>
      <Text style={styles.subtitle}>
        This is a private space to record how you feel today.
      </Text>

      {/* Date */}
      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
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

      {/* Notes */}
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={note}
        onChangeText={setNote}
        placeholder="Anything you’d like to remember about today."
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
            You haven’t added any entries yet. Your first entry will appear
            here.
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
    gap: 8,
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
  entryNote: {
    fontSize: 13,
    marginTop: 4,
  },
});
