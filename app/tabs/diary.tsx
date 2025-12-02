// app/tabs/diary.tsx
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addDiaryEntry,
  deleteDiaryEntry,
  DiaryEntry,
  getDiaryEntries,
} from "../storage/diaryStorage";

export default function DiaryScreen() {
  const [entryText, setEntryText] = useState("");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await getDiaryEntries();
      setEntries(stored);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!entryText.trim()) return;

    const text = entryText.trim();
    setEntryText("");

    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      text,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setEntries((prev) => [newEntry, ...prev]);

    // Persist
    await addDiaryEntry(text);
  };

  const handleDelete = async (id: string) => {
    // Optimistic update
    setEntries((prev) => prev.filter((e) => e.id !== id));
    // Persist
    await deleteDiaryEntry(id);
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Delete entry?",
      "This note will be removed permanently from this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(id),
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: DiaryEntry }) => (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryDate}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
        <TouchableOpacity
          style={styles.deletePill}
          onPress={() => confirmDelete(item.id)}
        >
          <Text style={styles.deletePillText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.entryText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today’s note</Text>

      <TextInput
        style={styles.input}
        placeholder="How are you feeling today?"
        multiline
        value={entryText}
        onChangeText={setEntryText}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save to diary</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Previous entries</Text>

      {loading ? (
        <Text style={styles.emptyText}>Loading entries…</Text>
      ) : entries.length === 0 ? (
        <Text style={styles.emptyText}>
          Your diary is empty. Your notes stay on this device.
        </Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#FFFDF7",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
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
    marginBottom: 24,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#A17A70",
  },
  entryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0D8CE",
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  entryDate: {
    fontSize: 11,
    color: "#A17A70",
  },
  entryText: {
    fontSize: 14,
  },
  deletePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C0392B",
  },
  deletePillText: {
    fontSize: 11,
    color: "#C0392B",
  },
});
