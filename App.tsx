import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Screen = 'today' | 'tracking';
type ItemState = Record<string, boolean>;
type Metrics = {
  weight: string;
  waist: string;
  steps: string;
  water: string;
  protein: string;
  sleep: string;
};
type DayRecord = {
  meals: ItemState;
  exercises: ItemState;
  metrics: Metrics;
  notes: string;
};
type AppData = Record<string, DayRecord>;

type Meal = { id: string; title: string; detail: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string };
type Exercise = { id: string; title: string; detail: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; accent?: boolean };

const COLORS = {
  bg: '#05090D',
  card: '#11171D',
  card2: '#151C23',
  border: '#2A333C',
  text: '#F7F8FA',
  muted: '#A7B0BA',
  gold: '#D9B25F',
  gold2: '#F0C66A',
  orange: '#FF6A24',
  green: '#63C65A',
  blue: '#49A9F8',
  purple: '#A56AE8',
};
const STORAGE_KEY = 'objectif85-native-v1';
const emptyMetrics: Metrics = { weight: '', waist: '', steps: '', water: '', protein: '', sleep: '' };

const meals: Meal[] = [
  { id: 'breakfast', title: 'PETIT-DÉJEUNER', detail: "3 œufs\nFlocons d’avoine\nBanane\nThé", icon: 'weather-sunset-up', color: '#FFC122' },
  { id: 'lunch', title: 'DÉJEUNER', detail: 'Poulet grillé\nRiz complet\nLégumes', icon: 'bowl-mix', color: COLORS.green },
  { id: 'snack', title: 'COLLATION', detail: 'Fromage blanc\nSkyr\nAmandes', icon: 'cup', color: COLORS.blue },
  { id: 'dinner', title: 'DÎNER', detail: 'Saumon\nLégumes', icon: 'food-turkey', color: COLORS.purple },
];

const trainingByWeekday: Record<number, Exercise[]> = {
  1: [
    { id: 'walk', title: 'MARCHE', detail: 'Objectif : 10 000 pas', icon: 'shoe-sneaker', accent: true },
    { id: 'bench', title: 'DÉVELOPPÉ COUCHÉ', detail: '4 × 10 à 10 kg', icon: 'weight-lifter' },
    { id: 'row', title: 'ROWING HALTÈRES', detail: '4 × 10 à 10 kg', icon: 'rowing' },
    { id: 'shoulder', title: 'DÉVELOPPÉ ÉPAULES', detail: '3 × 12 à 8 kg', icon: 'weight-lifter' },
    { id: 'curl', title: 'CURL BICEPS', detail: '3 × 12 à 6 kg', icon: 'arm-flex' },
    { id: 'triceps', title: 'EXTENSION TRICEPS', detail: '3 × 12 à 6 kg', icon: 'arm-flex' },
    { id: 'plank', title: 'GAINAGE', detail: '3 × 1 min', icon: 'human-handsdown' },
  ],
  2: [
    { id: 'walk', title: 'MARCHE', detail: 'Objectif : 10 000 pas', icon: 'shoe-sneaker', accent: true },
    { id: 'squat', title: 'SQUATS HALTÈRES', detail: '4 × 12', icon: 'weight-lifter' },
    { id: 'lunges', title: 'FENTES', detail: '3 × 10 par jambe', icon: 'run' },
    { id: 'deadlift', title: 'SOULEVÉ DE TERRE', detail: '4 × 10', icon: 'weight-lifter' },
    { id: 'calves', title: 'MOLLETS', detail: '4 × 20', icon: 'shoe-print' },
    { id: 'abs', title: 'ABDOMINAUX', detail: '3 tours', icon: 'human-handsdown' },
  ],
  4: [
    { id: 'walk', title: 'MARCHE', detail: 'Objectif : 10 000 pas', icon: 'shoe-sneaker', accent: true },
    { id: 'pushups', title: 'POMPES SERRÉES', detail: '4 séries', icon: 'human-handsdown' },
    { id: 'onearm', title: 'ROWING UN BRAS', detail: '4 × 10', icon: 'rowing' },
    { id: 'military', title: 'DÉVELOPPÉ MILITAIRE', detail: '3 × 12', icon: 'weight-lifter' },
    { id: 'lateral', title: 'ÉLÉVATIONS LATÉRALES', detail: '3 × 15', icon: 'arm-flex' },
    { id: 'hammer', title: 'CURL MARTEAU', detail: '3 × 12', icon: 'arm-flex' },
    { id: 'dips', title: 'DIPS', detail: '3 séries', icon: 'human-handsdown' },
  ],
  5: [
    { id: 'walk', title: 'MARCHE', detail: 'Objectif : 10 000 pas', icon: 'shoe-sneaker', accent: true },
    { id: 'circuit', title: 'CIRCUIT COMPLET', detail: '5 tours', icon: 'timer-outline' },
    { id: 'squat', title: 'SQUATS', detail: '15 répétitions', icon: 'weight-lifter' },
    { id: 'pushups', title: 'POMPES', detail: '15 répétitions', icon: 'human-handsdown' },
    { id: 'row', title: 'ROWING', detail: '15 répétitions', icon: 'rowing' },
    { id: 'lunges', title: 'FENTES', detail: '20 répétitions', icon: 'run' },
    { id: 'plank', title: 'GAINAGE', detail: '1 min', icon: 'human-handsdown' },
  ],
};
const recovery: Exercise[] = [
  { id: 'walk', title: 'MARCHE', detail: 'Objectif : 10 000 pas', icon: 'shoe-sneaker', accent: true },
  { id: 'mobility', title: 'MOBILITÉ', detail: '10 à 15 min', icon: 'yoga' },
];

function keyFor(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function defaultDay(): DayRecord {
  return { meals: {}, exercises: {}, metrics: { ...emptyMetrics }, notes: '' };
}
function mondayOf(date: Date) {
  const d = new Date(date);
  const shift = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - shift);
  d.setHours(12, 0, 0, 0);
  return d;
}

function CheckCircle({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={[styles.check, checked && styles.checkDone]}>
      {checked ? <Ionicons name="checkmark" size={18} color="#071006" /> : null}
    </Pressable>
  );
}

function App() {
  const [screen, setScreen] = useState<Screen>('today');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<AppData>({});
  const [loaded, setLoaded] = useState(false);

  const selectedKey = keyFor(selectedDate);
  const record = data[selectedKey] ?? defaultDay();
  const exercises = trainingByWeekday[selectedDate.getDay()] ?? recovery;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setData(JSON.parse(raw) as AppData))
      .catch(() => Alert.alert('Information', 'Les anciennes données n’ont pas pu être chargées.'))
      .finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => undefined);
  }, [data, loaded]);

  const updateDay = (patch: Partial<DayRecord>) => {
    setData((prev) => ({ ...prev, [selectedKey]: { ...record, ...patch } }));
  };
  const toggleMeal = (id: string) => updateDay({ meals: { ...record.meals, [id]: !record.meals[id] } });
  const toggleExercise = (id: string) => updateDay({ exercises: { ...record.exercises, [id]: !record.exercises[id] } });

  const week = useMemo(() => {
    const monday = mondayOf(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  const latest = useMemo(() => {
    const rows = Object.entries(data)
      .filter(([, d]) => d.metrics.weight || d.metrics.waist)
      .sort(([a], [b]) => b.localeCompare(a));
    return rows[0]?.[1]?.metrics ?? emptyMetrics;
  }, [data]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      {screen === 'today' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Header selectedDate={selectedDate} />
          <WeekStrip dates={week} selectedDate={selectedDate} onSelect={setSelectedDate} data={data} />

          <Section title="REPAS DU JOUR" icon="silverware-fork-knife" iconColor={COLORS.gold}>
            <View style={styles.mealsGrid}>
              {meals.map((meal) => (
                <View key={meal.id} style={styles.mealCard}>
                  <MaterialCommunityIcons name={meal.icon} size={38} color={meal.color} />
                  <Text style={[styles.mealTitle, { color: meal.color }]}>{meal.title}</Text>
                  <Text style={styles.mealDetail}>{meal.detail}</Text>
                  <CheckCircle checked={!!record.meals[meal.id]} onPress={() => toggleMeal(meal.id)} />
                </View>
              ))}
            </View>
          </Section>

          <Section title="SPORT / ACTIVITÉ DU JOUR" icon="dumbbell" iconColor={COLORS.orange}>
            {exercises.map((exercise) => (
              <ExerciseRow
                key={exercise.id}
                item={exercise}
                checked={!!record.exercises[exercise.id]}
                steps={record.metrics.steps}
                onToggle={() => toggleExercise(exercise.id)}
              />
            ))}
          </Section>

          <QuickMetrics metrics={record.metrics} />
          <View style={styles.notesCard}>
            <MaterialCommunityIcons name="note-edit-outline" size={25} color={COLORS.muted} />
            <TextInput
              value={record.notes}
              onChangeText={(notes) => updateDay({ notes })}
              placeholder="Notes du jour..."
              placeholderTextColor={COLORS.muted}
              style={styles.notesInput}
            />
          </View>

          <Pressable style={styles.followButton} onPress={() => setScreen('tracking')}>
            <MaterialCommunityIcons name="chart-bar" size={30} color="#101216" />
            <Text style={styles.followButtonText}>SUIVI</Text>
            <Ionicons name="chevron-forward" size={25} color="#101216" />
          </Pressable>
        </ScrollView>
      ) : (
        <TrackingScreen
          data={data}
          selectedDate={selectedDate}
          record={record}
          latest={latest}
          onBack={() => setScreen('today')}
          onChangeMetrics={(metrics) => updateDay({ metrics })}
        />
      )}
    </SafeAreaView>
  );
}

function Header({ selectedDate }: { selectedDate: Date }) {
  return (
    <View style={styles.header}>
      <Ionicons name="menu" size={31} color={COLORS.muted} />
      <View style={styles.headerCenter}>
        <Text style={styles.headerDay}>{selectedDate.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase()}</Text>
        <Text style={styles.headerDate}>{selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }).toUpperCase()}</Text>
      </View>
      <Ionicons name="notifications-outline" size={30} color={COLORS.muted} />
    </View>
  );
}

function WeekStrip({ dates, selectedDate, onSelect, data }: { dates: Date[]; selectedDate: Date; onSelect: (date: Date) => void; data: AppData }) {
  return (
    <View style={styles.weekRow}>
      {dates.map((date) => {
        const active = keyFor(date) === keyFor(selectedDate);
        const rec = data[keyFor(date)];
        const totalDone = rec ? Object.values(rec.meals).filter(Boolean).length + Object.values(rec.exercises).filter(Boolean).length : 0;
        return (
          <Pressable key={keyFor(date)} onPress={() => onSelect(date)} style={[styles.dayTile, active && styles.dayTileActive]}>
            <Text style={[styles.dayName, active && styles.dayTextActive]}>{date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3).toUpperCase()}</Text>
            <Text style={[styles.dayNumber, active && styles.dayTextActive]}>{date.getDate()}</Text>
            <View style={[styles.statusDot, totalDone > 0 && { backgroundColor: totalDone >= 6 ? COLORS.green : COLORS.orange }, active && { backgroundColor: '#0C1014' }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

function Section({ title, icon, iconColor, children }: { title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; iconColor: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name={icon} size={25} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ExerciseRow({ item, checked, steps, onToggle }: { item: Exercise; checked: boolean; steps: string; onToggle: () => void }) {
  const stepValue = Number(steps || 0);
  return (
    <View style={[styles.exerciseRow, item.accent && styles.exerciseAccent]}>
      <MaterialCommunityIcons name={item.icon} size={33} color={item.accent ? COLORS.orange : '#D6DADF'} />
      <View style={styles.exerciseText}>
        <Text style={[styles.exerciseTitle, item.accent && { color: COLORS.orange }]}>{item.title}</Text>
        <Text style={styles.exerciseDetail}>{item.detail}</Text>
        {item.id === 'walk' ? (
          <View style={styles.stepTrack}>
            <View style={[styles.stepFill, { width: `${Math.min(100, (stepValue / 10000) * 100)}%` }]} />
          </View>
        ) : null}
      </View>
      {item.id === 'walk' ? <Text style={styles.stepValue}>{stepValue.toLocaleString('fr-FR')} / 10 000</Text> : null}
      <CheckCircle checked={checked} onPress={onToggle} />
    </View>
  );
}

function QuickMetrics({ metrics }: { metrics: Metrics }) {
  const rows = [
    ['weight-scale', 'POIDS', metrics.weight ? `${metrics.weight} kg` : '—', '#E84B4B'],
    ['tape-measure', 'TOUR DE TAILLE', metrics.waist ? `${metrics.waist} cm` : '—', '#FFB21B'],
    ['water-outline', 'EAU', metrics.water ? `${metrics.water} / 2 L` : '—', COLORS.blue],
    ['cup-outline', 'PROTÉINES', metrics.protein ? `${metrics.protein} / 150 g` : '—', COLORS.orange],
    ['moon-waning-crescent', 'SOMMEIL', metrics.sleep ? `${metrics.sleep} h` : '—', COLORS.purple],
  ] as const;
  return (
    <View style={styles.metricsRow}>
      {rows.map(([icon, label, value, color]) => (
        <View key={label} style={styles.metricCell}>
          <MaterialCommunityIcons name={icon} size={25} color={color} />
          <Text style={styles.metricLabel}>{label}</Text>
          <Text style={styles.metricValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function TrackingScreen({ data, selectedDate, record, latest, onBack, onChangeMetrics }: {
  data: AppData;
  selectedDate: Date;
  record: DayRecord;
  latest: Metrics;
  onBack: () => void;
  onChangeMetrics: (metrics: Metrics) => void;
}) {
  const [draft, setDraft] = useState(record.metrics);
  useEffect(() => setDraft(record.metrics), [record.metrics]);
  const chartData = useMemo(() => {
    return Object.entries(data)
      .filter(([, r]) => r.metrics.weight || r.metrics.waist)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);
  }, [data]);
  const update = (key: keyof Metrics, value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const save = () => {
    onChangeMetrics(draft);
    Alert.alert('Suivi enregistré', 'Les données du jour ont été sauvegardées.');
  };
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.trackingHeader}>
          <Pressable onPress={onBack}><Ionicons name="chevron-back" size={32} color={COLORS.text} /></Pressable>
          <Text style={styles.trackingTitle}>SUIVI</Text>
          <Ionicons name="calendar-outline" size={28} color={COLORS.text} />
        </View>
        <Text style={styles.trackingDate}>{selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        <Text style={styles.subheading}>ENREGISTRER MES DONNÉES</Text>
        <View style={styles.formCard}>
          <MetricInput icon="weight-scale" label="Poids (kg)" value={draft.weight} onChange={(v) => update('weight', v)} color={COLORS.green} />
          <MetricInput icon="tape-measure" label="Tour de taille (cm)" value={draft.waist} onChange={(v) => update('waist', v)} color="#FFB21B" />
          <MetricInput icon="shoe-sneaker" label="Pas du jour" value={draft.steps} onChange={(v) => update('steps', v)} color={COLORS.blue} />
          <MetricInput icon="water" label="Eau bue (L)" value={draft.water} onChange={(v) => update('water', v)} color={COLORS.blue} />
          <MetricInput icon="cup" label="Protéines (g)" value={draft.protein} onChange={(v) => update('protein', v)} color={COLORS.orange} />
          <MetricInput icon="moon-waning-crescent" label="Sommeil (h)" value={draft.sleep} onChange={(v) => update('sleep', v)} color={COLORS.purple} />
          <Pressable style={styles.saveButton} onPress={save}><Text style={styles.saveButtonText}>ENREGISTRER</Text></Pressable>
        </View>
        <Text style={styles.subheading}>MES DONNÉES DE SUIVI</Text>
        <View style={styles.rangeRow}>{['7J', '30J', '3M', '1A', 'TOUT'].map((x) => <View key={x} style={[styles.rangePill, x === '30J' && styles.rangeActive]}><Text style={[styles.rangeText, x === '30J' && { color: '#0B0D0F' }]}>{x}</Text></View>)}</View>
        <ChartCard title="ÉVOLUTION DU POIDS (KG)" delta={latest.weight ? `${latest.weight} kg` : 'Aucune donnée'} data={chartData.map(([date, r]) => ({ label: date.slice(5), value: Number(r.metrics.weight || 0) })).filter((x) => x.value)} color={COLORS.green} />
        <ChartCard title="TOUR DE TAILLE (CM)" delta={latest.waist ? `${latest.waist} cm` : 'Aucune donnée'} data={chartData.map(([date, r]) => ({ label: date.slice(5), value: Number(r.metrics.waist || 0) })).filter((x) => x.value)} color={COLORS.orange} />
        <View style={styles.encourage}><MaterialCommunityIcons name="trophy" size={34} color={COLORS.gold2} /><View><Text style={styles.encourageTitle}>BRAVO !</Text><Text style={styles.encourageText}>Tu es sur la bonne voie. Continue comme ça !</Text></View></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MetricInput({ icon, label, value, onChange, color }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string; value: string; onChange: (value: string) => void; color: string }) {
  return (
    <View style={styles.inputRow}>
      <MaterialCommunityIcons name={icon} size={25} color={color} />
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" placeholder="—" placeholderTextColor={COLORS.muted} style={styles.input} />
    </View>
  );
}

function ChartCard({ title, delta, data, color }: { title: string; delta: string; data: { label: string; value: number }[]; color: string }) {
  const width = Dimensions.get('window').width - 56;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = Math.max(max - min, 1);
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHead}><Text style={styles.chartTitle}>{title}</Text><Text style={[styles.chartDelta, { color }]}>{delta}</Text></View>
      {data.length < 2 ? <Text style={styles.emptyChart}>Ajoute au moins deux mesures pour afficher la tendance.</Text> : (
        <View style={[styles.chartArea, { width }]}>
          {data.map((point, index) => {
            const h = 20 + ((point.value - min) / range) * 90;
            return <View key={`${point.label}-${index}`} style={styles.barWrap}><View style={[styles.bar, { height: h, backgroundColor: color }]} /><Text style={styles.barLabel}>{point.label}</Text></View>;
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: COLORS.bg }, content: { padding: 16, paddingBottom: 38 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 20 },
  headerCenter: { alignItems: 'center' }, headerDay: { color: COLORS.text, fontSize: 28, fontWeight: '900', letterSpacing: .5 }, headerDate: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  weekRow: { flexDirection: 'row', gap: 7, marginBottom: 20 }, dayTile: { flex: 1, minHeight: 103, borderRadius: 17, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  dayTileActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold2 }, dayName: { color: COLORS.muted, fontSize: 12, fontWeight: '700' }, dayNumber: { color: COLORS.text, fontSize: 25, fontWeight: '800', marginVertical: 7 }, dayTextActive: { color: '#14171A' }, statusDot: { width: 9, height: 9, borderRadius: 9, backgroundColor: '#77818B' },
  section: { borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, borderRadius: 22, padding: 15, marginBottom: 20 }, sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 }, sectionTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  mealsGrid: { flexDirection: 'row', gap: 8 }, mealCard: { flex: 1, minHeight: 250, alignItems: 'center', backgroundColor: COLORS.card2, borderRadius: 15, paddingHorizontal: 6, paddingVertical: 16 }, mealTitle: { fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 12 }, mealDetail: { color: '#D2D7DD', fontSize: 12, textAlign: 'center', lineHeight: 18, marginVertical: 14, minHeight: 77 },
  check: { width: 34, height: 34, borderRadius: 18, borderWidth: 1.5, borderColor: '#9DA6AF', alignItems: 'center', justifyContent: 'center' }, checkDone: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  exerciseRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border }, exerciseAccent: { backgroundColor: '#332019', borderRadius: 14, paddingHorizontal: 12, borderBottomWidth: 0, marginBottom: 8 }, exerciseText: { flex: 1 }, exerciseTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' }, exerciseDetail: { color: COLORS.muted, marginTop: 3, fontSize: 14 }, stepValue: { color: COLORS.orange, fontSize: 13, fontWeight: '800' }, stepTrack: { height: 7, backgroundColor: '#4A302A', borderRadius: 8, overflow: 'hidden', marginTop: 10 }, stepFill: { height: '100%', backgroundColor: COLORS.orange, borderRadius: 8 },
  metricsRow: { flexDirection: 'row', borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, backgroundColor: COLORS.card, paddingVertical: 14, marginBottom: 17 }, metricCell: { flex: 1, alignItems: 'center', paddingHorizontal: 3, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: COLORS.border }, metricLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '800', marginTop: 6, textAlign: 'center' }, metricValue: { color: COLORS.text, fontSize: 12, fontWeight: '800', marginTop: 5, textAlign: 'center' },
  notesCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, borderRadius: 18, paddingHorizontal: 16, marginBottom: 18 }, notesInput: { flex: 1, minHeight: 60, color: COLORS.text, fontSize: 16 },
  followButton: { height: 70, borderRadius: 18, backgroundColor: COLORS.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28 }, followButtonText: { color: '#101216', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }, trackingTitle: { color: COLORS.text, fontSize: 25, fontWeight: '900' }, trackingDate: { color: COLORS.gold2, textAlign: 'center', textTransform: 'capitalize', marginBottom: 22 }, subheading: { color: COLORS.text, fontSize: 16, fontWeight: '900', marginVertical: 14 },
  formCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, padding: 12 }, inputRow: { flexDirection: 'row', alignItems: 'center', minHeight: 58, paddingHorizontal: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border }, inputLabel: { flex: 1, color: COLORS.text, marginLeft: 12, fontSize: 15, fontWeight: '600' }, input: { width: 90, color: COLORS.green, textAlign: 'right', fontSize: 18, fontWeight: '900' }, saveButton: { backgroundColor: COLORS.gold, borderRadius: 14, padding: 15, marginTop: 14 }, saveButtonText: { color: '#0D1013', textAlign: 'center', fontWeight: '900', fontSize: 16 },
  rangeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 }, rangePill: { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingVertical: 10, alignItems: 'center' }, rangeActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold }, rangeText: { color: COLORS.muted, fontSize: 12, fontWeight: '800' },
  chartCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 19, padding: 14, marginBottom: 14 }, chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, chartTitle: { color: COLORS.text, fontWeight: '800', fontSize: 14 }, chartDelta: { fontWeight: '900' }, chartArea: { height: 145, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', marginTop: 18 }, barWrap: { alignItems: 'center', justifyContent: 'flex-end', flex: 1 }, bar: { width: 14, borderRadius: 8 }, barLabel: { color: COLORS.muted, fontSize: 9, marginTop: 6 }, emptyChart: { color: COLORS.muted, paddingVertical: 30, textAlign: 'center' },
  encourage: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: '#17251A', borderWidth: 1, borderColor: '#28442E', borderRadius: 18, padding: 16 }, encourageTitle: { color: COLORS.green, fontWeight: '900', fontSize: 18 }, encourageText: { color: COLORS.muted, marginTop: 3 },
});

export default App;
