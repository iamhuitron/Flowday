import { useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Animated, Alert, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStore } from '../src/store/index';
import { JournalEntry } from '../src/types/index';
import { uid } from '../src/utils/index';

const MONO  = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
const MOODS = ['😴', '😐', '🙂', '😊', '🔥'];
const MOOD_LABELS = ['Agotado', 'Neutral', 'Bien', 'Muy bien', 'En llamas'];
const MOOD_COLORS = ['#60a5fa', '#94a3b8', '#4ade80', '#4ade80', '#fbbf24'];

const QUICK_TAGS = ['📚 estudio', '💪 ejercicio', '💻 código', '🧘 bienestar', '🎯 productivo', '🌧 difícil'];

function dKey(d: Date) { return d.toISOString().slice(0, 10); }
function today()       { return dKey(new Date()); }

function formatEntryDate(dateStr: string) {
  return format(new Date(dateStr + 'T12:00:00'), "EEE d 'de' MMMM", { locale: es });
}

// ─── 14-day Mood Strip ────────────────────────────────────────────────────────
function MoodStrip({ journal }: { journal: JournalEntry[] }) {
  const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));
  const td   = today();

  return (
    <View style={s.moodStrip}>
      <Text style={s.moodStripTitle}>ESTADO DE ÁNIMO · ÚLTIMAS 2 SEMANAS</Text>
      <View style={s.moodStripRow}>
        {days.map((d) => {
          const dk    = dKey(d);
          const entry = journal.find((e) => e.date === dk && e.tags?.includes('mood'));
          const mood  = entry?.mood;
          const isToday = dk === td;
          return (
            <View key={dk} style={s.moodDay}>
              <Text style={[s.moodDayNum, isToday && { color: '#7c6aff' }]}>
                {d.getDate()}
              </Text>
              <View style={[
                s.moodDayCircle,
                isToday && s.moodDayCircleToday,
                mood && { backgroundColor: MOOD_COLORS[mood - 1] + '22', borderColor: MOOD_COLORS[mood - 1] + '66' },
              ]}>
                <Text style={{ fontSize: mood ? 14 : 10, color: mood ? undefined : '#26262f' }}>
                  {mood ? MOODS[mood - 1] : '·'}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Entry Card ───────────────────────────────────────────────────────────────
function EntryCard({
  entry, onEdit, onDelete,
}: { entry: JournalEntry; onEdit: () => void; onDelete: () => void }) {
  const mood  = entry.mood ? MOODS[entry.mood - 1]  : null;
  const color = entry.mood ? MOOD_COLORS[entry.mood - 1] : '#55556a';
  const tags  = entry.tags?.filter((t) => t !== 'mood') ?? [];

  return (
    <TouchableOpacity onPress={onEdit} onLongPress={onDelete} delayLongPress={400} activeOpacity={0.8}>
      <View style={s.entryCard}>
        <View style={s.entryLeft}>
          {mood
            ? <View style={[s.entryMoodBubble, { backgroundColor: color + '18', borderColor: color + '44' }]}>
                <Text style={{ fontSize: 18 }}>{mood}</Text>
              </View>
            : <View style={[s.entryMoodBubble, { backgroundColor: '#141418' }]}>
                <Text style={{ fontSize: 16, color: '#55556a' }}>📝</Text>
              </View>}
        </View>
        <View style={s.entryBody}>
          <Text style={s.entryDate}>{formatEntryDate(entry.date).toUpperCase()}</Text>
          {entry.text
            ? <Text style={s.entryText} numberOfLines={3}>{entry.text}</Text>
            : <Text style={s.entryEmpty}>Sin texto</Text>}
          {tags.length > 0 && (
            <View style={s.entryTags}>
              {tags.map((t) => (
                <View key={t} style={s.entryTag}>
                  <Text style={s.entryTagTxt}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Text style={s.entryChevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Entry Editor (bottom sheet) ─────────────────────────────────────────────
function EntryEditor({
  entry, visible, onClose, onSave,
}: {
  entry: Partial<JournalEntry> | null;
  visible: boolean;
  onClose: () => void;
  onSave: (data: Partial<JournalEntry>) => void;
}) {
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const [text,     setText]     = useState(entry?.text ?? '');
  const [mood,     setMood]     = useState<number | undefined>(entry?.mood);
  const [selTags,  setSelTags]  = useState<string[]>(entry?.tags?.filter((t) => t !== 'mood') ?? []);

  // Sync fields when entry changes
  useCallback(() => {
    setText(entry?.text ?? '');
    setMood(entry?.mood);
    setSelTags(entry?.tags?.filter((t) => t !== 'mood') ?? []);
  }, [entry]);

  if (visible) {
    Animated.spring(slideAnim, { toValue: 0,   useNativeDriver: true, tension: 70, friction: 12 }).start();
    Animated.timing(fadeAnim,  { toValue: 1,   duration: 200, useNativeDriver: true }).start();
  } else {
    Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
    Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }).start();
  }

  const toggleTag = (tag: string) =>
    setSelTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleSave = () => {
    const tags = [...selTags, ...(mood ? ['mood'] : [])];
    onSave({ text: text.trim(), mood, tags });
  };

  if (!visible && !entry) return null;

  return (
    <>
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]} pointerEvents={visible ? 'auto' : 'none'}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[s.editorSheet, { transform: [{ translateY: slideAnim }] }]} pointerEvents={visible ? 'auto' : 'none'}>
        <View style={s.drawerHandle} />
        <View style={s.editorHeader}>
          <Text style={s.editorTitle}>
            {entry?.id ? 'Editar entrada' : 'Nueva entrada'}
          </Text>
          <TouchableOpacity onPress={handleSave} style={s.saveBtn}>
            <Text style={s.saveBtnTxt}>Guardar</Text>
          </TouchableOpacity>
        </View>

        {/* Mood */}
        <Text style={s.editorLabel}>ESTADO DE ÁNIMO</Text>
        <View style={s.editorMoodRow}>
          {MOODS.map((m, i) => {
            const selected = mood === i + 1;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setMood(selected ? undefined : i + 1)}
                style={[s.editorMoodBtn, selected && { borderColor: MOOD_COLORS[i], backgroundColor: MOOD_COLORS[i] + '18' }]}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 22 }}>{m}</Text>
                {selected && <Text style={[s.moodLabel, { color: MOOD_COLORS[i] }]}>{MOOD_LABELS[i]}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tags */}
        <Text style={s.editorLabel}>ETIQUETAS</Text>
        <View style={s.editorTagsRow}>
          {QUICK_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => toggleTag(tag)}
              style={[s.tagChip, selTags.includes(tag) && s.tagChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[s.tagChipTxt, selTags.includes(tag) && s.tagChipTxtActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Text */}
        <Text style={s.editorLabel}>NOTA DEL DÍA</Text>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="¿Qué pasó hoy? ¿Qué aprendiste? ¿Cómo te sientes?"
            placeholderTextColor="#55556a"
            multiline
            style={s.editorInput}
            textAlignVertical="top"
          />
        </KeyboardAvoidingView>
      </Animated.View>
    </>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function JournalScreen() {
  const router = useRouter();
  const { journal, addJournalEntry, deleteJournalEntry } = useStore();

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingEntry,  setEditingEntry]  = useState<Partial<JournalEntry> | null>(null);

  // Entries that are actual journal entries (not just mood-only)
  const realEntries = journal
    .filter((e) => e.text.trim().length > 0 || (e.tags && !e.tags.every((t) => t === 'mood')))
    .sort((a, b) => b.date.localeCompare(a.date));

  // Group by month
  const grouped = realEntries.reduce<Record<string, JournalEntry[]>>((acc, e) => {
    const key = e.date.slice(0, 7); // "YYYY-MM"
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const monthKeys = Object.keys(grouped).sort().reverse();

  function formatMonthKey(k: string) {
    const [year, month] = k.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    return format(d, "MMMM yyyy", { locale: es }).toUpperCase();
  }

  const openNew = useCallback(() => {
    setEditingEntry({ date: today(), text: '', tags: [] });
    setEditorVisible(true);
  }, []);

  const openEdit = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditorVisible(true);
  }, []);

  const handleSave = useCallback((data: Partial<JournalEntry>) => {
    if (!editingEntry) return;

    // If editing existing entry, delete it first then re-add
    if (editingEntry.id) {
      deleteJournalEntry(editingEntry.id);
    }

    // Also check for existing mood entry on this date to merge mood
    const date = editingEntry.date ?? today();
    const existingMoodEntry = journal.find((e) => e.date === date && e.tags?.includes('mood') && e.id !== editingEntry.id);
    const moodFromExisting  = existingMoodEntry?.mood;

    const tags = [
      ...(data.tags ?? []).filter((t) => t !== 'mood'),
      ...(data.mood || moodFromExisting ? ['mood'] : []),
    ];

    addJournalEntry({
      id:   editingEntry.id ?? `j-${uid()}`,
      date,
      text: data.text ?? '',
      mood: data.mood ?? moodFromExisting,
      tags,
    });

    // Remove standalone mood entry if we merged it
    if (data.mood && existingMoodEntry) {
      deleteJournalEntry(existingMoodEntry.id);
    }

    setEditorVisible(false);
    setEditingEntry(null);
  }, [editingEntry, journal, addJournalEntry, deleteJournalEntry]);

  const handleDelete = useCallback((entry: JournalEntry) => {
    Alert.alert(
      'Eliminar entrada',
      `¿Eliminar la entrada del ${formatEntryDate(entry.date)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: () => deleteJournalEntry(entry.id),
        },
      ],
    );
  }, [deleteJournalEntry]);

  const todayEntry   = realEntries.find((e) => e.date === today());
  const totalEntries = realEntries.length;
  const moodDays     = journal.filter((e) => e.tags?.includes('mood') && e.mood).length;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backTxt}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Diario</Text>
          <Text style={s.headerSub}>{totalEntries} ENTRADAS · {moodDays} DÍAS CON ESTADO</Text>
        </View>
        <TouchableOpacity onPress={openNew} style={s.newBtn}>
          <Text style={s.newBtnTxt}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Mood strip */}
        <MoodStrip journal={journal} />

        {/* Quick stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statVal}>{totalEntries}</Text>
            <Text style={s.statLbl}>ENTRADAS</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statVal, { color: '#fbbf24' }]}>{moodDays}</Text>
            <Text style={s.statLbl}>DÍAS CON MOOD</Text>
          </View>
          <View style={s.statCard}>
            <Text style={[s.statVal, { color: todayEntry ? '#4ade80' : '#55556a' }]}>
              {todayEntry ? '✓' : '—'}
            </Text>
            <Text style={s.statLbl}>HOY</Text>
          </View>
        </View>

        {/* Today CTA if no entry */}
        {!todayEntry && (
          <TouchableOpacity onPress={openNew} style={s.todayCta} activeOpacity={0.8}>
            <Text style={s.todayCtaEmoji}>✍️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.todayCtaTitle}>Escribe sobre hoy</Text>
              <Text style={s.todayCtaSub}>Todavía no tienes entrada del día</Text>
            </View>
            <Text style={s.todayCtaArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Entries grouped by month */}
        {monthKeys.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>📖</Text>
            <Text style={s.emptyTitle}>Sin entradas aún</Text>
            <Text style={s.emptySub}>Toca + para escribir tu primera entrada</Text>
          </View>
        ) : (
          monthKeys.map((mk) => (
            <View key={mk}>
              <Text style={s.monthHeader}>{formatMonthKey(mk)}</Text>
              <View style={s.monthGroup}>
                {grouped[mk].map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={() => openEdit(entry)}
                    onDelete={() => handleDelete(entry)}
                  />
                ))}
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* Entry Editor */}
      <EntryEditor
        entry={editingEntry}
        visible={editorVisible}
        onClose={() => { setEditorVisible(false); setEditingEntry(null); }}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: '#0c0c0f' },
  header:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#26262f', gap: 10 },
  backBtn:           { width: 38, height: 38, borderRadius: 10, backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', alignItems: 'center', justifyContent: 'center' },
  backTxt:           { color: '#e8e8f0', fontSize: 20 },
  headerCenter:      { flex: 1 },
  headerTitle:       { fontSize: 17, fontWeight: '600', color: '#eeeef5' },
  headerSub:         { fontFamily: MONO, fontSize: 9, color: '#55556a', marginTop: 1 },
  newBtn:            { width: 38, height: 38, borderRadius: 10, backgroundColor: '#7c6aff', alignItems: 'center', justifyContent: 'center' },
  newBtnTxt:         { color: '#fff', fontSize: 24, lineHeight: 28, fontWeight: '300' },
  scroll:            { flex: 1 },
  scrollContent:     { paddingBottom: 100 },
  // Mood strip
  moodStrip:         { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  moodStripTitle:    { fontFamily: MONO, fontSize: 9, color: '#55556a', marginBottom: 10 },
  moodStripRow:      { flexDirection: 'row', justifyContent: 'space-between' },
  moodDay:           { alignItems: 'center', gap: 4 },
  moodDayNum:        { fontFamily: MONO, fontSize: 9, color: '#55556a' },
  moodDayCircle:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', alignItems: 'center', justifyContent: 'center' },
  moodDayCircleToday:{ borderColor: '#7c6aff' },
  // Stats
  statsRow:          { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#26262f' },
  statCard:          { flex: 1, backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 12, padding: 12, alignItems: 'center' },
  statVal:           { fontFamily: MONO, fontSize: 20, fontWeight: '700', color: '#eeeef5' },
  statLbl:           { fontFamily: MONO, fontSize: 8, color: '#55556a', marginTop: 4 },
  // Today CTA
  todayCta:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 14, marginBottom: 4, backgroundColor: 'rgba(124,106,255,.08)', borderWidth: 1, borderColor: 'rgba(124,106,255,.2)', borderRadius: 14, padding: 14 },
  todayCtaEmoji:     { fontSize: 24 },
  todayCtaTitle:     { fontSize: 14, fontWeight: '500', color: '#eeeef5' },
  todayCtaSub:       { fontFamily: MONO, fontSize: 10, color: '#55556a', marginTop: 2 },
  todayCtaArrow:     { fontSize: 20, color: '#7c6aff' },
  // Month groups
  monthHeader:       { fontFamily: MONO, fontSize: 9, color: '#55556a', marginTop: 20, marginBottom: 8, marginHorizontal: 16 },
  monthGroup:        { backgroundColor: '#141418', borderWidth: 1, borderColor: '#26262f', borderRadius: 14, marginHorizontal: 16, overflow: 'hidden' },
  // Entry card
  entryCard:         { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#1c1c22' },
  entryLeft:         { flexShrink: 0 },
  entryMoodBubble:   { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: '#26262f', alignItems: 'center', justifyContent: 'center' },
  entryBody:         { flex: 1, minWidth: 0 },
  entryDate:         { fontFamily: MONO, fontSize: 9, color: '#55556a', marginBottom: 4 },
  entryText:         { fontSize: 13, color: '#eeeef5', lineHeight: 20 },
  entryEmpty:        { fontSize: 12, color: '#55556a', fontStyle: 'italic' },
  entryTags:         { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  entryTag:          { backgroundColor: '#1c1c22', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  entryTagTxt:       { fontFamily: MONO, fontSize: 9, color: '#55556a' },
  entryChevron:      { fontSize: 18, color: '#55556a', alignSelf: 'center' },
  // Empty state
  empty:             { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:        { fontSize: 48, marginBottom: 12 },
  emptyTitle:        { fontSize: 16, fontWeight: '600', color: '#eeeef5', marginBottom: 6 },
  emptySub:          { fontSize: 13, color: '#55556a' },
  // Editor bottom sheet
  overlay:           { ...StyleSheet.absoluteFillObject, backgroundColor: '#000', zIndex: 10 },
  editorSheet:       { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#141418', borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopWidth: 1, borderTopColor: '#26262f', padding: 20, paddingBottom: 40, zIndex: 20, maxHeight: '90%' },
  drawerHandle:      { width: 36, height: 3, backgroundColor: '#26262f', borderRadius: 99, alignSelf: 'center', marginBottom: 16 },
  editorHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  editorTitle:       { fontSize: 16, fontWeight: '600', color: '#eeeef5' },
  saveBtn:           { backgroundColor: '#7c6aff', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 9 },
  saveBtnTxt:        { color: '#fff', fontSize: 13, fontWeight: '600' },
  editorLabel:       { fontFamily: MONO, fontSize: 9, color: '#55556a', marginBottom: 10, marginTop: 4 },
  editorMoodRow:     { flexDirection: 'row', gap: 6, marginBottom: 16 },
  editorMoodBtn:     { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#26262f', backgroundColor: '#1a1a1f', alignItems: 'center', gap: 4 },
  moodLabel:         { fontFamily: MONO, fontSize: 7, textAlign: 'center' },
  editorTagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tagChip:           { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1, borderColor: '#26262f', backgroundColor: '#1a1a1f' },
  tagChipActive:     { borderColor: '#7c6aff', backgroundColor: 'rgba(124,106,255,.12)' },
  tagChipTxt:        { fontSize: 12, color: '#55556a' },
  tagChipTxtActive:  { color: '#7c6aff' },
  editorInput:       { backgroundColor: '#1a1a1f', borderWidth: 1, borderColor: '#26262f', borderRadius: 12, padding: 14, color: '#eeeef5', fontSize: 14, lineHeight: 22, minHeight: 120 },
});
