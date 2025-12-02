// app/tabs/diary.tsx
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addDiaryEntry,
  CycleStatus,
  DiaryEntry,
  getDiaryEntries,
  SymptomFlags,
} from "../storage/diaryStorage";

const MOOD_LEVELS = [
  { value: 1, label: "Very low", emoji: "😣" },
  { value: 2, label: "Low", emoji: "😕" },
  { value: 3, label: "Ok", emoji: "😐" },
  { value: 4, label: "Good", emoji: "🙂" },
  { value: 5, label: "Great", emoji: "😄" },
];

const DEFAULT_SYMPTOMS: SymptomFlags = {
  hotFlushes: false,
  sleepIssues: false,
  anxiety: false,
  brainFog: false,
  lowEnergy: false,
};

const cycleLabel = (c: CycleStatus): string => {
  switch (c) {
    case "none":
      return "No bleeding";
    case "spotting":
      return "Spotting / light";
    case "bleeding":
      return "Period / bleeding";
    case "unknown":
    default:
      return "Not sure";
  }
};

export default function DiaryScreen() {
  const router = useRouter();

  const [note, setNote] = useState("");
  const [mood, setMood] = useState<number | null>(3);
  const [symptoms, setSymptoms] = useState<SymptomFlags>(DEFAULT_SYMPTOMS);
  const [cycle, setCycle] = useState<CycleStatus>("none");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const happyAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const load = async () => {
      const stored = await getDiaryEntries();
      setEntries(stored);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (mood && mood >= 4) {
      Animated.sequence([
        Animated.timing(happyAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(happyAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [mood]);

  const toggleSymptom = (key: keyof SymptomFlags) => {
    setSymptoms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resetForm = () => {
    setNote("");
    setMood(3);
    setSymptoms(DEFAULT_SYMPTOMS);
    setCycle("none");
  };

  const handleSave = async () => {
    if (!note.trim() && mood === null) {
      Alert.alert(
        "Nothing to save",
        "Please choose a mood or write a short note before saving."
      );
      return;
    }

    const createdAt = new Date().toISOString();
    const newEntry: Omit<DiaryEntry, "id"> = {
      mood,
      note: note.trim(),
      symptoms: { ...symptoms },
      cycle,
      createdAt,
    };

    setEntries((prev) => [{ ...newEntry, id: Date.now().toString() }, ...prev]);

    resetForm();
    await addDiaryEntry(newEntry);
  };

  const currentMoodMeta =
    mood != null ? MOOD_LEVELS.find((m) => m.value === mood) : undefined;

  const latest = entries[0];
  const latestMoodMeta =
    latest && latest.mood != null
      ? MOOD_LEVELS.find((m) => m.value === latest.mood)
      : undefined;

  const latestSymptomsList = latest
    ? Object.entries(latest.symptoms)
        .filter(([_, v]) => v)
        .map(([k]) => {
          switch (k) {
            case "hotFlushes":
              return "Hot flushes";
            case "sleepIssues":
              return "Sleep issues";
            case "anxiety":
              return "Anxiety";
            case "brainFog":
              return "Brain fog";
            case "lowEnergy":
              return "Low energy";
            default:
              return k;
          }
        })
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Today’s check-in</Text>

        {/* Mood row */}
        <View style={styles.section}>
          <View style={styles.moodHeader}>
            <Text style={styles.sectionTitle}>Mood</Text>
            {currentMoodMeta && (
              <View style={styles.moodLabelRow}>
                <Text style={styles.moodEmoji}>{currentMoodMeta.emoji}</Text>
                <Text style={styles.moodLabel}>{currentMoodMeta.label}</Text>
              </View>
            )}
            {mood && mood >= 4 && (
              <Animated.View
                style={[
                  styles.happyBurst,
                  {
                    opacity: happyAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.2, 1],
                    }),
                    transform: [
                      {
                        scale: happyAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.happyText}>Nice day 💛</Text>
              </Animated.View>
            )}
          </View>

          <View style={styles.moodRow}>
            {MOOD_LEVELS.map((m) => {
              const selected = mood === m.value;
              return (
                <TouchableOpacity
                  key={m.value}
                  style={[
                    styles.moodButton,
                    selected && styles.moodButtonSelected,
                  ]}
                  onPress={() => setMood(m.value)}
                >
                  <Text style={styles.moodButtonEmoji}>{m.emoji}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Symptoms row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Symptoms</Text>
          <View style={styles.symptomRow}>
            <SymptomToggle
              label="Hot flushes"
              active={symptoms.hotFlushes}
              onPress={() => toggleSymptom("hotFlushes")}
            />
            <SymptomToggle
              label="Sleep issues"
              active={symptoms.sleepIssues}
              onPress={() => toggleSymptom("sleepIssues")}
            />
          </View>
          <View style={styles.symptomRow}>
            <SymptomToggle
              label="Anxiety"
              active={symptoms.anxiety}
              onPress={() => toggleSymptom("anxiety")}
            />
            <SymptomToggle
              label="Brain fog"
              active={symptoms.brainFog}
              onPress={() => toggleSymptom("brainFog")}
            />
          </View>
          <View style={styles.symptomRow}>
            <SymptomToggle
              label="Low energy"
              active={symptoms.lowEnergy}
              onPress={() => toggleSymptom("lowEnergy")}
            />
          </View>
        </View>

        {/* Menstrual cycle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menstrual cycle</Text>
          <View style={styles.cycleRow}>
            <CycleToggle
              label="No bleeding"
              value="none"
              selected={cycle === "none"}
              onPress={() => setCycle("none")}
            />
            <CycleToggle
              label="Spotting / light"
              value="spotting"
              selected={cycle === "spotting"}
              onPress={() => setCycle("spotting")}
            />
          </View>
          <View style={styles.cycleRow}>
            <CycleToggle
              label="Period / bleeding"
              value="bleeding"
              selected={cycle === "bleeding"}
              onPress={() => setCycle("bleeding")}
            />
            <CycleToggle
              label="Not sure"
              value="unknown"
              selected={cycle === "unknown"}
              onPress={() => setCycle("unknown")}
            />
          </View>
        </View>

        {/* Notes */}
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.input}
          placeholder="Anything else you would like to remember about today?"
          multiline
          value={note}
          onChangeText={setNote}
        />

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Save today’s check-in</Text>
        </TouchableOpacity>

        {/* Tiny summary + link to Insights */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Summary</Text>

          {loading ? (
            <Text style={styles.summaryText}>Loading your check-ins…</Text>
          ) : entries.length === 0 ? (
            <Text style={styles.summaryText}>
              Once you start saving check-ins, a quick summary will appear here.
              Full history and trends will be in Insights.
            </Text>
          ) : (
            <>
              <Text style={styles.summaryText}>
                You have {entries.length} saved check-in
                {entries.length > 1 ? "s" : ""}.
              </Text>
              {latest && (
                <>
                  <Text style={styles.summaryText}>
                    Last saved:{" "}
                    {new Date(latest.createdAt).toLocaleDateString()}
                  </Text>
                  {latestMoodMeta && (
                    <Text style={styles.summaryText}>
                      Last mood: {latestMoodMeta.emoji} {latestMoodMeta.label}
                    </Text>
                  )}
                  {latest && (
                    <Text style={styles.summaryText}>
                      Last cycle: {cycleLabel(latest.cycle)}
                    </Text>
                  )}
                  {latestSymptomsList.length > 0 && (
                    <Text style={styles.summaryText}>
                      Last symptoms: {latestSymptomsList.join(", ")}
                    </Text>
                  )}
                </>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles.summaryButton}
            onPress={() => router.push("/tabs/insights")}
          >
            <Text style={styles.summaryButtonText}>Open Insights</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

type SymptomToggleProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function SymptomToggle({ label, active, onPress }: SymptomToggleProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.symptomToggle, active && styles.symptomToggleActive]}
    >
      <Text
        style={[
          styles.symptomToggleText,
          active && styles.symptomToggleTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

type CycleToggleProps = {
  label: string;
  value: CycleStatus;
  selected: boolean;
  onPress: () => void;
};

function CycleToggle({ label, selected, onPress }: CycleToggleProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.cycleToggle, selected && styles.cycleToggleSelected]}
    >
      <Text
        style={[
          styles.cycleToggleText,
          selected && styles.cycleToggleTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFDF7",
    paddingTop: 32,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  moodHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  moodLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodLabel: {
    fontSize: 14,
  },
  happyBurst: {
    marginLeft: "auto",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFE6D6",
  },
  happyText: {
    fontSize: 12,
    color: "#D6765A",
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  moodButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E3C4B5",
    alignItems: "center",
    justifyContent: "center",
  },
  moodButtonSelected: {
    backgroundColor: "#D6765A",
    borderColor: "#D6765A",
  },
  moodButtonEmoji: {
    fontSize: 22,
    color: "#333",
  },
  symptomRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  symptomToggle: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E3C4B5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  symptomToggleActive: {
    backgroundColor: "#D6765A",
    borderColor: "#D6765A",
  },
  symptomToggleText: {
    fontSize: 12,
    color: "#5A3E36",
    textAlign: "center",
  },
  symptomToggleTextActive: {
    color: "#FFFFFF",
  },
  cycleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  cycleToggle: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E3C4B5",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cycleToggleSelected: {
    backgroundColor: "#D6765A",
    borderColor: "#D6765A",
  },
  cycleToggleText: {
    fontSize: 12,
    color: "#5A3E36",
    textAlign: "center",
  },
  cycleToggleTextSelected: {
    color: "#FFFFFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E3C4B5",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#D6765A",
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  summaryCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0D8CE",
    backgroundColor: "#FFFFFF",
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: "#5A3E36",
    marginBottom: 2,
  },
  summaryButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#D6765A",
  },
  summaryButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
